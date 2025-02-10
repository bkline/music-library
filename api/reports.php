<?php

namespace MusicLibrary\Reports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class Report {
  public $columns;
  public $format;
  public $id;
  public $item_ids;
  public $parameters;
  public $rows;
  public $title;

  public function __construct($session) {
    $this->session = $session;
  }

  // Run the queued report and return the results.
  public function get() {
    $this->id = $this->session->record_id;
    $this->parameters = $this->load_parameters();
    $this->title = $this->parameters['report-title'];
    $this->format = $this->parameters['report-format'] ?? 'html';
    $this->columns = $this->parameters['report-columns'];
    $this->item_ids = $this->apply_filters();
    $this->rows = $this->assemble_values();
    $elapsed = (microtime(true) - $this->session->start);
    $sql = 'UPDATE report_request SET elapsed = ? WHERE request_id = ?';
    $stmt = $this->session->db->prepare($sql);
    $stmt->execute([$elapsed, $this->id]);
    if ($this->format === 'excel') {
      $this->session->debug_log('writing excel workbook');
      $this->write_excel();
    }
    else {
      return [
        'status' => 'success',
        'title' => $this->title,
        'columns' => $this->columns,
        'rows' => $this->rows,
        'elapsed' => $elapsed,
      ];
    }
  }

  // Queue a report for future generation.
  public function post() {
    $parms = $this->session->request_data['parms'];
    $values = [$this->session->user->name, json_encode($parms)];
    $stmt = $this->session->db->prepare('
      INSERT INTO report_request (account, requested, parameters)
           VALUES (?, NOW(6), ?)
    ');
    $stmt->execute($values);
    $request_id = $this->session->db->lastInsertId();
    http_response_code(201);
    return ['request_id' => $request_id, 'status' => 'success'];
  }

  private static function column_row($column, $row) {
    $dividend = $column;
    $letter = '';
    while ($dividend > 0) {
        $modulo = ($dividend - 1) % 26;
        $letter = chr(65 + $modulo) . $letter;
        $dividend = intval(($dividend - $modulo) / 26);
    }
    return "$letter$row";
  }

  private function filter_by_arrangement(&$sets) {
    if (!empty($this->parameters['arrangement'])) {
      $values = $this->parameters['arrangement'];
      $op = $this->parameters['arrangement-logic'] === 'ni' ? 'NOT IN' : 'IN';
      $ph = implode(',', array_fill(0, count($values), '?'));
      $query = "SELECT ItemID FROM LibraryItem WHERE ArrangementID $op ($ph)";
      $sets[] = $this->session->select($query, $values, 'column');
    }
  }

  private function filter_by_cataloger(&$sets) {
    if (!empty($this->parameters['user'])) {
      $value = $this->parameters['user'];
      $op = $this->parameters['user-logic'] === 'ne' ? '<>' : '=';
      $query = "SELECT ItemID FROM LibraryItem WHERE AddedBy $op ?";
      $sets[] = $this->session->select($query, [$value], 'column');
    }
  }

  private function filter_by_collection(&$sets) {
    $collection = trim($this->parameters['collection'] ?? '');
    if (!empty($collection)) {
      $op = $this->parameters['collection-logic'] === 'nl' ? 'NOT LIKE' : 'LIKE';
      $query = "
        SELECT i.ItemID FROM LibraryItem i
          JOIN LibraryItem c ON c.ItemID = i.CollectionID
         WHERE c.ItemTitle $op ?
      ";
      $value = '%' . str_replace('%', '%%', $collection) . '%';
      $sets[] = $this->session->select($query, [$value], 'column');
    }
  }

  private function filter_by_creator(&$sets) {
    $creator = trim($this->parameters['creator'] ?? '');
    if (!empty($creator)) {
      $op = $this->parameters['creator-logic'] === 'nl' ? 'NOT LIKE' : 'LIKE';
      $query = "
        SELECT DISTINCT i.ItemID FROM LibraryItem i
              LEFT JOIN LibraryPerson c ON c.PersonID = i.ComposerID
               AND c.SearchKey $op ?
              LEFT JOIN LibraryPerson l ON l.PersonID = i.LyricistID
               AND l.SearchKey $op ?
              LEFT JOIN LibraryPerson a ON a.PersonID = i.ArrangerID
               AND a.SearchKey $op ?
             WHERE c.PersonID IS NOT NULL
                OR l.PersonID IS NOT NULL
                OR a.PersonID IS NOT NULL
      ";
      $val = '%' . str_replace('%', '%%', $creator) . '%';
      $sets[] = $this->session->select($query, [$val, $val, $val], 'column');
    }
  }

  private function filter_by_date_added(&$sets) {
    if (!empty($this->parameters['added'])) {
      $value = $this->parameters['added'];
      $op = $this->parameters['added-logic'] === 'le' ? '<=' : '>=';
      $query = "SELECT ItemID FROM LibraryItem WHERE DateAdded $op ?";
      $sets[] = $this->session->select($query, [$value], 'column');
    }
  }

  private function filter_by_keywords(&$sets) {
    if (!empty($this->parameters['keyword'])) {
      $values = $this->parameters['keyword'];
      $op = $this->parameters['keyword-logic'] === 'ni' ? 'NOT IN' : 'IN';
      $ph = implode(',', array_fill(0, count($values), '?'));
      $query = "
        SELECT DISTINCT LibraryItem FROM LibraryItemKeyword
                  WHERE LibraryKeyword $op ($ph)
      ";
      $sets[] = $this->session->select($query, $values, 'column');
    }
  }

  private function filter_by_loans(&$sets) {
    if (!empty($this->parameters['on-loan'])) {
      $query = '
        SELECT DIStINCT LibraryItem FROM LibraryLoan
         WHERE LoanReturned IS NULL
      ';
      if ($this->parameters['on-loan'] === 'no') {
        $query = "SELECT ItemID FROM LibraryItem WHERE ItemID NOT IN ($query)";
      }
      $sets[] = $this->session->select($query, null, 'column');
    }
  }

  private function filter_by_number_of_copies(&$sets) {
    if (!empty($this->parameters['copies'])) {
      $value = $this->parameters['copies'];
      $op = $this->parameters['copies-logic'] === 'lt' ? '<' : '>=';
      $this->session->db->query('CREATE TEMPORARY TABLE t1 (i INT, s CHAR(26))');
      $this->session->db->query('CREATE TEMPORARY TABLE t2 (i INT, k INT)');
      $this->session->db->query("
        INSERT INTO t1
        SELECT LibraryItem,
               CONCAT(IFNULL(InStockDate, '0000-00-00'), ':',
                      LPAD(CAST(InventoryID AS CHAR), 15, '0'))
          FROM LibraryInventory
      ");
      $this->session->db->query('
        INSERT INTO t2
        SELECT i, RIGHT(m, 15)
          FROM (SELECT i, MAX(s) AS m FROM t1 GROUP BY i) AS t
      ');
      $query = "
        SELECT LibraryItem FROM LibraryInventory i
          JOIN t2 ON t2.k = i.InventoryID
         WHERE i.InStock $op ?
      ";
      $sets[] = $this->session->select($query, [$value], 'column');
    }
  }

  private function filter_by_owner(&$sets) {
    if (!empty($this->parameters['owner'])) {
      $values = $this->parameters['owner'];
      $op = $this->parameters['owner-logic'] === 'ni' ? 'NOT IN' : 'IN';
      $ph = implode(',', array_fill(0, count($values), '?'));
      $query = "SELECT ItemID FROM LibraryItem WHERE OwnerID $op ($ph)";
      $sets[] = $this->session->select($query, $values, 'column');
    }
  }

  private function filter_by_performances(&$sets) {
    if (!empty($this->parameters['performance'])) {
      $value = $this->parameters['performance'];
      $op = $this->parameters['performance-logic'] === 'le' ? '<=' : '>=';
      $query = "
        SELECT LibraryItem, MAX(PerformanceDate) FROM LibraryPerformance
      GROUP BY LibraryItem
        HAVING MAX(PerformanceDate) $op ?
      ";
      $sets[] = $this->session->select($query, [$value], 'column');
    }
  }

  private function filter_by_season(&$sets) {
    if (!empty($this->parameters['season'])) {
      $values = $this->parameters['season'];
      $op = $this->parameters['season-logic'] === 'ni' ? 'NOT IN' : 'IN';
      $ph = implode(',', array_fill(0, count($values), '?'));
      $query = "SELECT ItemID FROM LibraryItem WHERE SeasonID $op ($ph)";
      $sets[] = $this->session->select($query, $values, 'column');
    }
  }

  private function filter_by_tags(&$sets) {
    if (!empty($this->parameters['tag'])) {
      $values = $this->parameters['tag'];
      $op = $this->parameters['tag-logic'] === 'ni' ? 'NOT IN' : 'IN';
      $ph = implode(',', array_fill(0, count($values), '?'));
      $query = "
        SELECT DISTINCT LibraryItem FROM LibraryItemTag
                  WHERE LibraryTag $op ($ph)
      ";
      $sets[] = $this->session->select($query, $values, 'column');
    }
  }

  private function filter_by_title(&$sets) {
    $title = trim($this->parameters['title'] ?? '');
    if (!empty($title)) {
      $op = $this->parameters['title-logic'] === 'nl' ? 'NOT LIKE' : 'LIKE';
      $query = "
        SELECT ItemID FROM LibraryItem
         WHERE ItemTitle $op ? OR OtherTitle $op ?
      ";
      $value = '%' . str_replace('%', '%%', $title) . '%';
      $sets[] = $this->session->select($query, [$value, $value], 'column');
    }
  }

  // Figure out which items match the filtering criteria.
  private function apply_filters() {
    $query = 'SELECT ItemID FROM LibraryItem';
    $sets = [$this->session->select($query, null, 'column')];
    $this->filter_by_arrangement($sets);
    $this->filter_by_cataloger($sets);
    $this->filter_by_collection($sets);
    $this->filter_by_creator($sets);
    $this->filter_by_date_added($sets);
    $this->filter_by_keywords($sets);
    $this->filter_by_loans($sets);
    $this->filter_by_number_of_copies($sets);
    $this->filter_by_owner($sets);
    $this->filter_by_performances($sets);
    $this->filter_by_season($sets);
    $this->filter_by_tags($sets);
    $this->filter_by_title($sets);
    $this->session->debug_log('sets: ' . json_encode(array_slice($sets, 1)));
    $item_keys = array_intersect(...$sets);
    sort($item_keys);
    $this->session->debug_log('selected item keys: ' . json_encode($item_keys));
    return $item_keys;
  }

  // Fetch the choices the user made for this report.
  private function load_parameters() {
    $query = 'SELECT parameters FROM report_request WHERE request_id = ?';
    $parameters = $this->session->select($query, [$this->id], 'value');
    $this->session->debug_log("report parameters: $parameters");
    return json_decode($parameters, true);
  }

  private function assemble_values() {
    // Now get the values for each of the columns in the report.
    $this->session->db->query('CREATE TEMPORARY TABLE ReportKeys (k INTEGER)');
    $stmt = $this->session->db->prepare('INSERT INTO ReportKeys (k) VALUES (?)');
    foreach ($this->item_ids as $id) {
      $stmt->execute([$id]);
    }
    $rows = array_fill(0, count($this->item_ids), []);
    $report_column_config = $this->session->config['report_columns'];
    foreach ($this->columns as $column) {
      $config = json_decode(json_encode($report_column_config[$column]));
      switch ($config->type) {

      case 'key':
        $values = array_map(function($id) use ($config) {
          return sprintf($config->format, $id);
        }, $this->item_ids);
        sort($values);
        break;

      case 'direct':
        $query = "
          SELECT i.{$config->value_column} FROM ReportKeys r
            JOIN LibraryItem i ON i.ItemID = r.k
        ORDER BY i.ItemID
        ";
        $values = $this->session->select($query, null, 'column');
        if (!empty($config->format)) {
          $values = array_map(function($value) use ($config) {
            return $value ? sprintf($config->format, $value) : '';
          }, $values);
        }
        break;

      case 'person':
        $stmt = $this->session->db->query("
          SELECT p.LastName, p.FirstName, p.Dates FROM ReportKeys r
            JOIN LibraryItem i ON i.ItemID = r.k
       LEFT JOIN LibraryPerson p ON p.PersonID = i.{$config->join_key}
        ORDER BY i.ItemID
        ");
        $values = [];
        while ($row = $stmt->fetch(\PDO::FETCH_NUM)) {
          $value = trim($row[0]);
          $forename = trim($row[1]);
          $dates = trim($row[2]);
          if ($forename) {
            $value .= ", $forename";
          }
          if ($dates) {
            $value .= " ($dates)";
          }
          $values[] = $value;
        }
        break;

      case 'multiple':
        $query = "SELECT DISTINCT r.k, v.{$config->value_column}";
        $query .= " FROM {$config->value_table} v";
        if (!empty($config->join_table)) {
          $query .= " JOIN {$config->join_table} j";
          $query .= " ON j.{$config->join_key} = v.{$config->value_key}";
          $query .= ' JOIN ReportKeys r ON r.k = j.LibraryItem';
        } else {
          $query .= ' JOIN ReportKeys r ON r.k = v.LibraryItem';
        }
        if (!empty($config->condition)) {
          $query .= " {$config->condition}";
        }
        $query .= " ORDER BY v.{$config->value_column}";
        $stmt = $this->session->db->query($query);
        $map = [];
        while ($row = $stmt->fetch(\PDO::FETCH_NUM)) {
          list($id, $value) = $row;
          if ($value) {
            if (!array_key_exists($id, $map)) {
              $map[$id] = [];
            }
            $map[$id][] = $value;
          }
        }
        $values = [];
        foreach ($this->item_ids as $key) {
          if (array_key_exists($key, $map)) {
            $values[] = implode('; ', $map[$key]);
          } else {
            $values[] = '';
          }
        }
        break;

      case 'lookup':
        $query = "
          SELECT v.{$config->value_column} FROM ReportKeys r
            JOIN LibraryItem i ON i.ItemID = r.k
       LEFT JOIN {$config->value_table} v
              ON v.{$config->value_key} = i.{$config->join_key}
        ORDER BY r.k
        ";
        $values = $this->session->select($query, null, 'column');
        break;

      case 'inventory':
        $query = "
          SELECT (SELECT {$config->value_column}
                    FROM LibraryInventory
                   WHERE LibraryItem = r.k
                ORDER BY CONCAT(IFNULL(InStockDate, '0000-00-00'), ':',
                                LPAD(CAST(InventoryID AS CHAR), 15, '0')) DESC
                   LIMIT 1) AS N,
                 r.k
            FROM ReportKeys r
        ORDER BY r.k
        ";
        $values = $this->session->select($query, null, 'column');
        break;

      case 'last-performance':
        $query = '
          SELECT MAX(p.PerformanceDate), r.k FROM ReportKeys r
       LEFT JOIN LibraryPerformance p ON p.LibraryItem = r.k
        GROUP BY r.k
        ORDER BY r.k
        ';
        $values = $this->session->select($query, null, 'column');
        break;
      }

      for ($i = 0; $i < count($rows); ++$i) {
        $rows[$i][] = $values[$i];
      }
    }
    usort($rows, function($a, $b) {
      $a = iconv('UTF-8', 'ASCII//TRANSLIT', join("\t", $a));
      $b = iconv('UTF-8', 'ASCII//TRANSLIT', join("\t", $b));
      return strcasecmp($a, $b);
    });
    if ($this->parameters['report-sorting'] === 'reversed') {
      $rows = array_reverse($rows);
    }

    return $rows;
  }

  // Render the report as an Excel workbook and return it to the browser.
  private function write_excel() {
    $stamp = date('Ymd');
    $filename = "{$this->title} {$stamp}-{$this->id}.xlsx";
    $this->session->debug_log("report filename: $filename");
    $workbook = new Spreadsheet();
    while ($workbook->getSheetCount() > 0) {
      $workbook->removeSheetByIndex(0);
    }
    $worksheet = $workbook->createSheet();
    $worksheet->setTitle('Report');
    $config = $this->session->config['report_columns'];
    for ($i = 1; $i <= count($this->columns); ++$i) {
      $width = $config[$this->columns[$i - 1]]['width'];
      $worksheet->getColumnDimensionByColumn($i)->setWidth($width);
    }
    $title_style = [
      'font' => [
        'bold' => true,
        'size' => 12,
        'color' => ['argb' => 'FF008000'],
      ],
      'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
    ];
    $header_style = [
      'font' => [
        'bold' => true,
        'color' => ['argb' => Color::COLOR_WHITE],
      ],
      'alignment' => [
        'horizontal' => Alignment::HORIZONTAL_CENTER,
        'vertical' => Alignment::VERTICAL_CENTER,
      ],
      'fill' => [
        'fillType' => Fill::FILL_SOLID,
        'startColor' => ['argb' => 'FF008000'],
      ],
    ];
    $worksheet->setCellValue([1, 1], $this->title);
    $worksheet->getStyle([1, 1])->applyFromArray($title_style);
    $last_cell = self::column_row(count($this->columns), 1);
    $worksheet->mergeCells("A1:{$last_cell}");
    $c = 1;
    foreach ($this->columns as $name) {
      $worksheet->setCellValue([$c, 3], $name);
      $worksheet->getStyle([$c++, 3])->applyFromArray($header_style);
    }
    $worksheet->freezePane('A4');
    $r = 4;
    foreach ($this->rows as $row) {
      $c = 1;
      foreach ($row as $val) {
        if (is_numeric($val)) {
          if ((string)(int)$val === $val)
            $val = (int)$val;
          else
            $val = (float)$val;
        }
        elseif (is_string($val))
          $val = trim($val);
        $worksheet->setCellValue([$c++, $r], $val);
      }
      $r++;
    }
    header('Content-Type: application/' .
           'vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="' . $filename . '"');
    header('Content-transfer-encoding: binary');
    header('Cache-Control: max-age=0');
    header('X-Filename: ' . $filename);
    $writer = new Xlsx($workbook);
    $writer->save('php://output');
    $elapsed = microtime(true) - $this->session->start;
    $this->session->debug_log("sent Excel report in $elapsed seconds");
    exit();
  }

}

<?php

namespace MusicLibrary\Items;

class Item {

  const MULTIPLES = ['Performance', 'Inventory', 'Part', 'Loan'];

  public $session;

  public function __construct($session) {
    $this->session = $session;
  }

  // Delete an item record.
  public function delete() {
    $this->session->verify_not_readonly();
    $record_id = $this->session->record_id;
    if (empty($record_id)) {
      error_log('Attempt to delete record with no record ID');
      http_response_code(400);
      return ['status' => 'failure', 'message' => 'missing record ID'];
    }
    $this->session->db->beginTransaction();
    try {
      foreach (['multiple-links', 'multiple-subrecords'] as $group) {
        foreach ($this->session->config[$group] as $field) {
          $table = $field['table'];
          $sql = "DELETE FROM $table WHERE LibraryItem = ?";
          $stmt = $this->session->db->prepare($sql);
          $stmt->execute([$record_id]);
        }
      }
      $query = "DELETE FROM LibraryItem WHERE ItemID = ?";
      $stmt = $this->session->db->prepare($query);
      $stmt->execute([$record_id]);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'DELETE', 'LibraryItem', ?)
      ");
      $stmt->execute([$this->session->user->name, $this->session->localtime, $record_id]);
      $this->session->db->commit();
      return ['status' => 'success'];
    } catch (Exception $e) {
      $this->session->db->rollback();
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Get a single record.
  public function get() {
    if (empty($this->session->record_id))
      return $this->list();
    $id = $this->session->record_id;
    $sql = "SELECT * FROM LibraryItem WHERE ItemID = ?";
    $record = $this->session->select($sql, [$id], 'row');
    $sql = 'SELECT LibraryKeyword FROM LibraryItemKeyword WHERE LibraryItem = ?';
    $record['Keywords'] = $this->session->select($sql, [$id], 'column');
    $sql = 'SELECT LibraryTag FROM LibraryItemTag WHERE LibraryItem = ?';
    $record['Tags'] = $this->session->select($sql, [$id], 'column');
    foreach (self::MULTIPLES as $name) {
      $plural = $name === 'Inventory' ? 'Inventories' : "{$name}s";
      $sql = "
          SELECT *
            FROM Library{$name}
           WHERE LibraryItem = ?
        ORDER BY 1
        ";
      $record[$plural] = $this->session->select($sql, [$id]);
    }
    $sql = 'SELECT COUNT(*) FROM LibraryItem WHERE CollectionID = ?';
    $record['used_by'] = $this->session->select($sql, [$id], 'value');
    return $record;
  }

  // Create a new record.
  public function post() {
    $this->session->verify_not_readonly();
    $data = $this->session->request_data;
    $columns = [
      'SortKey',
      'ComposerSortKey',
      'ArrangerSortKey',
      'DateAdded',
      'AddedBy',
    ];
    $placeholders = ['?', '?', '?', '?', '?'];
    $values = ['', '', '', $this->session->localtime, $this->session->user->name];
    foreach ($this->session->config['columns'] as $column) {
      $name = $column['name'];
      $default = $column['default'] ?? null;
      $value = $data[$name] ?? $default;
      if (isset($value)) {
        $placeholders[] = '?';
        $columns[] = $name;
        $values[] = $value;
      }
    }
    $placeholders = implode(', ', $placeholders);
    $columns = implode(', ', $columns);
    $sql = "INSERT INTO LibraryItem ($columns) VALUES ($placeholders)";
    $this->session->debug_log($sql);
    $this->session->debug_log(json_encode($values));
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare($sql);
      $stmt->execute($values);
      $item_id = $this->session->db->lastInsertId();
      $this->finish_item_save($data, $item_id);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'INSERT', 'LibraryItem', ?)
      ");
      $stmt->execute([$this->session->user->name, $this->session->localtime, $item_id]);
      $this->session->db->commit();
      http_response_code(201);
      return ['status' => 'success', 'ItemID' => $item_id];
    } catch (Exception $e) {
      $message = $e->getMessage();
      error_log($message);
      $this->session->db->rollback();
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Update an existing record.
  public function put() {
    $this->session->verify_not_readonly();
    $record_id = $this->session->record_id;
    $record_id || die('Missing record ID');
    $data = $this->session->request_data;
    $this->session->debug_log(json_encode($data, JSON_PRETTY_PRINT));
    $assignments = ['DateModified = ?', 'ModifiedBy = ?'];
    $values = [$this->session->localtime, $this->session->user->name];
    foreach ($this->session->config['columns'] as $column) {
      $name = $column['name'];
      $default = $column['default'] ?? null;
      $values[] = $data[$name] ?? $default;
      $assignments[] = "$name = ?";
    }
    $values[] = $record_id;
    $assignments = implode(', ', $assignments);
    $sql = "UPDATE LibraryItem SET $assignments WHERE ItemID = ?";
    $this->session->debug_log($sql);
    $this->session->debug_log(json_encode($values));
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare($sql);
      $stmt->execute($values);

      // Start with a clean slate on related values.
      foreach (['multiple-links', 'multiple-subrecords'] as $key) {
        foreach ($this->session->config[$key] as $values) {
          $table = $values['table'];
          $sql = "DELETE FROM $table WHERE LibraryItem = ?";
          $stmt = $this->session->db->prepare($sql);
          $stmt->execute([$record_id]);
        }
      }
      $this->finish_item_save($data, $record_id);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'UPDATE', 'LibraryItem', ?)
      ");
      $stmt->execute([$this->session->user->name, $this->session->localtime, $record_id]);
      $this->session->db->commit();
      return ['status' => 'success'];
    } catch (Exception $e) {
      $this->session->db->rollback();
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Common code for saving new and modified catalog item records.
  private function finish_item_save($data, $item_id) {
    $this->session->debug_log('finish_item_save() $item_id is ' . $item_id);
    $values = $this->make_item_sort_keys($data, $item_id);
    array_push($values, $item_id);
    $sql = '
      UPDATE LibraryItem
         SET SortKey = ?,
             ComposerSortKey = ?,
             ArrangerSortKey = ?
       WHERE ItemID = ?
    ';
    $this->session->debug_log($sql);
    $this->session->debug_log(json_encode($values));
    $stmt = $this->session->db->prepare($sql);
    $stmt->execute($values);
    foreach ($this->session->config['multiple-links'] as $field) {
      $name = $field['name'];
      $ids = $data[$name] ?? [];
      if (count($ids) > 0) {
        $link_id = $field['link_id'];
        $table_name = $field['table'];
        $sql = "
          INSERT INTO $table_name (LibraryItem, $link_id)
               VALUES (?, ?)
        ";
        $this->session->debug_log($sql);
        $stmt = $this->session->db->prepare($sql);
        foreach ($ids as $id) {
          $values = [$item_id, $id];
          $this->session->debug_log(json_encode($values));
          $stmt->execute($values);
        }
      }
    }
    foreach ($this->session->config['multiple-subrecords'] as $field) {
      $name = $field['name'];
      $records = $data[$name] ?? [];
      if (count($records) > 0) {
        $table_name = $field['table'];
        $column_names = [];
        $placeholders = ['?'];
        foreach ($field['columns'] as $column) {
          $column_names[] = $column['name'];
          $placeholders[] = '?';
        }
        $columns = 'LibraryItem, ' . implode(', ', $column_names);
        $placeholders = implode(', ', $placeholders);
        $sql = "INSERT INTO $table_name ($columns) VALUES ($placeholders)";
        $this->session->debug_log($sql);
        $stmt = $this->session->db->prepare($sql);
        foreach ($records as $record) {
          $values = [$item_id];
          foreach ($column_names as $column_name) {
            $values[] = $record[$column_name] ?? null;
          }
          $this->session->debug_log(json_encode($values));
          $stmt->execute($values);
        }
      }
    }
  }

  // Assemble a list of display information for a list of items (with IDs).
  private function list() {
    $values = [];
    $conditions = [];
    $joins = [
      'LEFT JOIN LibraryPerson c ON c.PersonID = i.ComposerID',
      'LEFT JOIN LibraryPerson a ON a.PersonID = i.ArrangerID',
    ];
    $search_term = trim($_GET['title'] ?? '');
    if ($search_term === '0' || $search_term) {
      $search_term = "%{$search_term}%";
      $conditions[] = '(i.ItemTitle LIKE ? OR i.OtherTitle LIKE ?)';
      $values = [$search_term, $search_term];
    }
    $search_term = trim($_GET['composer_arranger'] ?? '');
    if ($search_term === '0' || $search_term) {
      $search_term = "%{$search_term}%";
      $conditions[] = '(c.SearchKey LIKE ? OR a.SearchKey LIKE ?)';
      array_push($values, $search_term, $search_term);
    }
    $where = '';
    if (count($conditions) > 0) {
      $where = 'WHERE ' . implode(' AND ', $conditions);
    }
    $joins = implode(' ', $joins);
    $sql = "SELECT COUNT(DISTINCT ItemID) FROM LibraryItem i $joins $where";
    $total = $this->session->select($sql, $values, 'value');
    $fields = [
      'i.ItemID AS id',
      'i.ItemTitle',
      'i.OtherTitle',
      'i.IsCollection',
      'c.LastName AS ComposerLastName',
      'c.FirstName AS ComposerFirstName',
      'c.Dates AS ComposerDates',
      'a.LastName AS ArrangerLastName',
      'a.FirstName AS ArrangerFirstName',
      'a.Dates AS ArrangerDates',
      '(SELECT COUNT(*) FROM LibraryItem WHERE CollectionID = i.ItemID)' .
      ' AS used_by',
    ];
    $fields = implode(', ', $fields);
    $sql = "
        SELECT DISTINCT $fields
         FROM LibraryItem i $joins $where ORDER BY 2
      ";
    $limit = (int) ($_GET['limit'] ?? '0');
    if ($limit) {
      $sql .= " LIMIT $limit";
    }
    $offset = (int) ($_GET['offset'] ?? '0');
    if ($offset) {
      $sql .= " OFFSET $offset";
    }
    $this->session->debug_log($sql);
    $results = $this->session->select($sql, $values);
    return ['total' => $total, 'results' => $results];
  }

  // Create the sort keys for the LibraryItem records.
  private function make_item_sort_keys($rec, $row_id) {
    $sort_keys = [];
    $composer_id = $rec['ComposerID'] ?? null;
    $arranger_id = $rec['ArrangerID'] ?? null;
    $title = $rec['ItemTitle'];
    if ($composer_id) {
      $query = '
        SELECT LastName, FirstName, SearchKey
          FROM LibraryPerson
         WHERE PersonID = ?
      ';
      $row = $this->session->select($query, [$composer_id], 'row');
      $last_name = $row['LastName'];
      $first_name = $row['FirstName'];
      $search_key = $row['SearchKey'];
    }
    else
      $first_name = $last_name = $search_key = '';
    $key = sprintf("%s\t%s\t%s\t%06d", $title, $last_name, $first_name, $row_id);
    $sort_keys[] = mb_convert_encoding($key, 'ASCII', 'UTF-8');
    $key = sprintf("%s\t%s\t%06d", $search_key, $title, $row_id);
    $sort_keys[] = mb_convert_encoding($key, 'ASCII', 'UTF-8');
    if ($arranger_id) {
      $query = 'SELECT SearchKey FROM LibraryPerson WHERE PersonID = ?';
      $search_key = $this->session->select($query, [$arranger_id], 'value');
    }
    else
      $search_key = '';
    $key = sprintf("%s\t%s\t%06d", $search_key, $title, $row_id);
    $sort_keys[] = mb_convert_encoding($key, 'ASCII', 'UTF-8');
    return $sort_keys;
  }

}

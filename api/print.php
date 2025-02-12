<?php

namespace MusicLibrary\Print;

class Job {

  const CLIENT_CONFIG_PATH = __DIR__ . '/../config.json';

  public $blocks = [];
  public $client_config;
  public $id;
  public $item;
  public $lookup_tables;

  public function __construct($session) {
    $this->session = $session;
    $this->client_config = self::load_client_config();
    $this->id = $session->record_id;
    $this->item = $this->load_item();
    $this->lookup_tables = $session->config['lookup_tables'];
    $this->load_blocks();
  }

  public function get() {
    return [
      'status' => 'success',
      'title' => trim($this->item['ItemTitle']),
      'id' => $this->id,
      'blocks' => $this->blocks,
    ];
  }

  private function load_item() {
    $query = 'SELECT * FROM LibraryItem WHERE ItemID = ?';
    $item = $this->session->select($query, [$this->id], 'row');
    $this->session->debug_log('item values: ' . json_encode($item));
    return $item;
  }

  private static function load_client_config() {
    $json = file_get_contents(self::CLIENT_CONFIG_PATH);
    return json_decode($json, true);
  }

  private function load_records($fieldset) {
    $table = $fieldset['table'];
    $query = "SELECT * FROM $table WHERE LibraryItem = ? ORDER BY 1";
    return $this->session->select($query, [$this->id]);
  }

  private function load_multiple_values($picklist) {
    list($table, $columns, $pk) = $this->lookup_tables[$picklist];
    $base_name = str_replace('Library', '', $table);
    $query = "
      SELECT {$columns[0]} FROM $table v
        JOIN LibraryItem$base_name j ON j.Library$base_name = $pk
       WHERE j.LibraryItem = ?
    ORDER BY 1
    ";
    $values = $this->session->select($query, [$this->id], 'column');
    return implode('; ', $values);
  }

  private function load_single_value($value, $picklist) {
    if (empty($value) || empty($picklist))
      return $value;
    list($table, $cols, $pk) = $this->lookup_tables[$picklist];
    $columns = implode(',', $cols);
    $query = "SELECT $columns FROM $table WHERE $pk = ?";
    if (count($cols) === 1)
      return $this->session->select($query, [$value], 'value');
    $person_name = $this->session->select($query, [$value], 'num');
    $value = trim($person_name[0]);
    $forename = trim($person_name[1]);
    $dates = trim($person_name[2]);
    if (!empty($forename))
      $value .= ", $forename";
    if (!empty($dates))
      $value .= " ($dates)";
    return $value;
  }

  private function load_blocks() {
    foreach ($this->client_config['fieldsets'] as $fieldset) {
      if (!empty($fieldset['multiple'])) {
        $block_title = $fieldset['singular'];
        $records = $this->load_records($fieldset);
      } else {
        $block_title = $fieldset['name'];
        $records = [$this->item];
      }
      foreach ($records as $record) {
        $values = [];
        foreach ($fieldset['rows'] as $row) {
          foreach ($row as $field) {
            $picklist = $field['picklist'] ?? null;
            $name = $field['name'];
            if (!empty($field['multiple']))
              $val = $this->load_multiple_values($picklist);
            else
              $val = $this->load_single_value($record[$name] ?? '', $picklist);
            if (!empty($val) || $val === 0 || $val === '0' || $val === 0.0) {
              if ($name === 'IsCollection')
                $val = $val === 'Y' ? 'Yes' : 'No';
              if ($name === 'LatestPrice' && is_float($val)) {
                $val = number_format($val, 2);
              }
              $values[] = ['label' => $field['label'], 'display' => $val];
            }
          }
        }
        if (count($values) > 0)
          $this->blocks[] = ['label' => $block_title, 'values' => $values];
      }
    }
  }

}

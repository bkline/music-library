<?php

namespace MusicLibrary\Lookup;

class Tables {

  public $session;

  public function __construct($session) {
    $this->session = $session;
  }

  // Delete a record in a lookup table.
  public function delete() {
    $this->session->verify_not_readonly();
    $record_type = $this->session->record_type;
    if (empty($record_type)) {
      error_log('DELETE with no record type');
      http_response_code(400);
      return ['error' => 'missing record type'];
    }
    $record_id = $this->session->record_id;
    if (empty($record_id)) {
      error_log("Attempt to DELETE FROM $record_type with no record ID");
      http_response_code(400);
      return ['status' => 'failure', 'error' => 'missing record ID'];
    }
    $config = $this->session->config;
    $primary_key = $config['tables'][$record_type]['primary_key'];
    $query = "DELETE FROM $record_type WHERE $primary_key = ?";
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare($query);
      $stmt->execute([$record_id]);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'DELETE', ?, ?)
      ");
      $stmt->execute([
        $this->session->user->name,
        $this->session->localtime,
        $record_type,
        $record_id,
      ]);
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

  // Fetch a single record from a lookup table for editing.
  public function get() {
    if (empty($this->session->record_id))
      return $this->list();
    $record_id = $this->session->record_id;
    $record_type = $this->session->record_type;
    $record_type || die("unsupported entity type $this->session->endpoint");
    $table_config = $this->session->config['tables'][$record_type];
    $primary_key = $table_config['primary_key'];
    $this->session->debug_log("Fetching $record_type $record_id");
    $query = "SELECT * FROM $record_type WHERE $primary_key = ?";
    $this->session->debug_log($query);
    $record = $this->session->select($query, [$record_id], 'row');
    if ($record) {
      $this->session->debug_log('Record found: ' . json_encode($record));
      $used_by = $table_config['used_by'] ?? null;
      if ($used_by) {
        $linking_table = $used_by['table'];
        $where = [];
        $values = [];
        foreach ($used_by['columns'] as $column) {
          $where[] = "$column = ?";
          $values[] = $record_id;
        }
        $where = implode(' OR ', $where);
        $sql = "SELECT COUNT(*) FROM $linking_table WHERE $where";
        $this->session->debug_log("used_by sql: $sql");
        $record['used_by'] = $this->session->select($sql, $values, 'value');
      }
      else {
        $record['used_by'] = 0;
      }
      $this->session->debug_log('$record: ' . json_encode($record));
    } else {
      http_response_code(404);
      $error = "$record_type $record_id not found";
      error_log($error);
      return ['error' =>  $error];
    }
    return $record;
  }

  // Save a new record.
  public function post() {
    $this->session->verify_not_readonly();
    $record_type = $this->session->record_type;
    $record_type || die("Record type {$this->session->endpoint} not recognized");
    $table = $this->session->config['tables'][$record_type] ?? null;
    $table || die("configuration missing for $record_type records");
    $data = $this->session->request_data;
    $this->session->debug_log("POST:\n" . json_encode($data, JSON_PRETTY_PRINT));
    $columns = [];
    $placeholders = [];
    $values = [];
    foreach ($table['columns'] as $name) {
      $value = $data[$name] ?? null;
      if ($value === "0" || $value) {
        $placeholders[] = '?';;
        $values[] = $value;
        $columns[] = $name;
      }
    }
    if ($record_type === 'LibraryPerson') {
      $key = $this->make_person_search_key($data);
      $placeholders[] = '?';
      $values[] = $key;
      $columns[] = 'SearchKey';
    }
    else {
      $key = trim($data[$table['display']]);
      $this->session->debug_log("value is $key");
    }
    $placeholders = implode(', ', $placeholders);
    $columns = implode(', ', $columns);
    $sql = "INSERT INTO $record_type ($columns) VALUES ($placeholders)";
    $this->session->debug_log($sql);
    $this->session->debug_log(json_encode($values));
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare($sql);
      $stmt->execute($values);
      $id = $this->session->db->lastInsertId();
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'INSERT', ?, ?)
      ");
      $stmt->execute([$this->session->user->name, $this->session->localtime, $record_type, $id]);
      $this->session->db->commit();
      http_response_code(201);
      $response = ['status' => 'success', 'id' => $id, 'display' => $key];
      $this->session->debug_log('response: ' . json_encode($response));
      return $response;
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
    $record_type = $this->session->record_type;
    $record_type || die("Record type {$this->session->endpoint} not recognized");
    $record_id = $this->session->record_id;
    $record_id || die('Missing record ID');
    $table = $this->session->config['tables'][$record_type] ?? null;
    $table || die("configuration missing for $record_type records");
    $data = $this->session->request_data;
    $primary_key = $table['primary_key'];
    $assignments = [];
    $values = [];
    if ($record_type === 'LibraryPerson') {
      $display = $this->make_person_search_key($data);
      $assignments[] = 'SearchKey = ?';
      $values[] = $display;
    }
    else {
      $display = trim($data[$table['display']]);
    }
    foreach ($table['columns'] as $name) {
      $values[] = $data[$name] ?? null;
      $assignments[] = "$name = ?";
    }
    $values[] = $record_id;
    $assignments = implode(', ', $assignments);
    $sql = "UPDATE $record_type SET $assignments WHERE $primary_key = ?";
    $this->session->debug_log($sql);
    $this->session->debug_log(json_encode($values));
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare($sql);
      $stmt->execute($values);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'UPDATE', ?, ?)
      ");
      $stmt->execute([
        $this->session->user->name,
        $this->session->localtime,
        $record_type,
        $record_id,
      ]);
      $this->session->db->commit();
      return ['status' => 'success', 'display' => $display];
    } catch (Exception $e) {
      $this->session->db->rollback();
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Assemble the ID and display values for a picklist.
  private function list() {
    $record_type = $this->session->record_type;
    switch ($record_type) {
    case 'LibraryCollection':
      $query = "
        SELECT ItemID AS id, ItemTitle AS display
          FROM LibraryItem
         WHERE IsCollection = 'Y'
      ORDER BY ItemTitle
      ";
      return $this->session->select($query);
    case 'LibraryAccompaniment':
    case 'LibraryArrangement':
    case 'LibraryFormat':
    case 'LibraryHandbellEnsemble':
    case 'LibraryKey':
    case 'LibraryKeyword':
    case 'LibraryOwner':
    case 'LibrarySeason':
    case 'LibrarySkill':
      $sort = $record_type === 'LibraryKeyword' ? '' : 'SortPosition, ';
      $sort .= 'LookupValue';
      $query = 'SELECT LookupID AS id, LookupValue AS display, ';
      if ($record_type !== 'LibraryKeyword')
        $query .= 'SortPosition AS sort, ';
      $query .= "Comments as comments FROM $record_type ORDER BY $sort";
      $this->session->debug_log($query);
      return $this->session->select($query);
    case 'LibraryTag':
      $query = '
        SELECT t.TagID, g.TagGroupName, t.TagName, t.Comments
          FROM LibraryTag t
          JOIN LibraryTagGroup g
            ON g.TagGroupID = t.TagGroup
      ORDER BY g.TagGroupName, t.TagName
      ';
      $rows = $this->session->select($query, null, 'obj');
      $payload = [];
      foreach ($rows as $row) {
        $group = trim($row->TagGroupName);
        $tag = trim($row->TagName);
        $values = [
          'id' => $row->TagID,
          'display' => "$group: $tag",
          'comments' => $row->Comments,
        ];
        $payload[] = $values;
      }
      return $payload;
    case 'LibraryPerson':
      $query = '
        SELECT PersonID, LastName, FirstName, Dates
          FROM LibraryPerson
      ORDER BY SearchKey
      ';
      $rows = $this->session->select($query, null, 'obj');
      $payload = [];
      foreach ($rows as $row) {
        $name = $row->LastName;
        if ($row->FirstName) {
          $name .= ", {$row->FirstName}";
        }
        if ($row->Dates) {
          $name .= " ({$row->Dates})";
        }
        $payload[] = ['id' => $row->PersonID, 'display' => $name];
      }
      return $payload;
    case 'LibraryCompany':
      $query = '
        SELECT CompanyID AS id, CompanyName AS display
          FROM LibraryCompany
      ORDER BY CompanyName
      ';
      return $this->session->select($query);
    case 'LibraryTagGroup':
      $query = '
        SELECT TagGroupID AS id, TagGroupName AS display
          FROM LibraryTagGroup
      ORDER BY TagGroupName
      ';
      return $this->session->select($query);
    case 'login_account':
      $query = '
        SELECT DISTINCT a.account_name AS id, a.account_fullname AS display
                   FROM login_account a
                   JOIN LibraryItem i
                     ON i.AddedBy = a.account_name
               ORDER BY a.account_fullname
      ';
      return $this->session->select($query);
    default:
      http_response_code(400);
      $message = "$record_type records not supported";
      error_log($message);
      return ['status' => 'failure', 'error' => $message];
    }
  }

  private function make_person_search_key($data) {
    $key = trim($data['LastName'] ?? '');
    $first_name = trim($data['FirstName'] ?? '');
    $dates = trim($data['Dates'] ?? '');
    if ($first_name) {
      if ($key) {
        $key .= ', ';
      }
      $key .= $first_name;
    }
    if ($dates) {
      if ($key) {
        $key .= ' ';
      }
      $key .= " ($dates)";
    }
    return $key;
  }

}

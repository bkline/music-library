<?php

namespace MusicLibrary\Users;

class User {
  public $session;
  public function __construct($session) {
    $this->session = $session;
  }

  // Used for testing (don't expose in the front end).
  public function delete() {
    $this->session->verify_is_admin();
    $record_id = $this->session->record_id;
    $record_id || die('Missing record ID');
    $sql = 'DELETE FROM login_account WHERE account_id = ?';
    try {
      $stmt = $this->session->db->prepare($sql);
      $stmt->execute([$record_id]);
      return ['status' => 'success'];
    } catch (\Exception $e) {
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Fetch a user's account data.
  public function get() {
    $this->session->verify_is_admin();
    if (empty($this->session->record_id))
      return $this->list();
    $query = 'SELECT * FROM login_account WHERE account_id = ?';
    return $this->session->select($query, [$this->session->record_id], 'row');
  }

  // Return the information about the existing user login accounts.
  private function list() {
    $query = 'SELECT * FROM login_account ORDER BY account_name';
    return $this->session->select($query);
  }

  // Save a new user login account record.
  public function post() {
    $this->session->verify_is_admin();
    $password = $this->session->request_data['account_password'] ?? null;
    $values = [
      $this->session->request_data['account_name'] ?? null,
      $this->session->request_data['account_fullname'] ?? null,
      $this->session->request_data['account_password'] ?? null,
      $this->session->request_data['account_comment'] ?? null,
      $this->session->request_data['account_admin'] === true ? 1 : 0,
      $this->session->request_data['account_readonly'] === false ? 0 : 1,
      $this->session->request_data['account_status'] ?? null,
      $password ? password_hash($password, PASSWORD_DEFAULT) : null,
    ];
    $placeholders = implode(',', array_fill(0, count($values), '?'));
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare("
        INSERT INTO login_account (account_name, account_fullname,
                                   account_password, account_comment,
                                   account_admin, account_readonly,
                                   account_status, account_hash)
             VALUES ($placeholders)
      ");
      $stmt->execute($values);
      $account_id = $this->session->db->lastInsertId();
      $user = $this->session->user->name;
      $message = "$user saving new account: " . json_encode($values);
      $this->session->debug_log($message);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'INSERT', 'login_account', ?)
      ");
      $stmt->execute([$user, $this->session->localtime, $account_id]);
      $this->session->db->commit();
      http_response_code(201);
      return ['status' => 'success', 'account_id' => $account_id];
    } catch (\Exception $e) {
      $this->session->db->rollback();
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

  // Update an existing login account record.
  public function put() {
    $this->session->verify_is_admin();
    $record_id = $this->session->record_id;
    $record_id || die('Missing record ID');
    $values = [
      $this->session->request_data['account_name'] ?? null,
      $this->session->request_data['account_fullname'] ?? null,
      $this->session->request_data['account_password'] ?? null,
      $this->session->request_data['account_comment'] ?? null,
      $this->session->request_data['account_admin'] ? 1 : 0,
      $this->session->request_data['account_readonly'] ? 1 : 0,
      $this->session->request_data['account_status'] ?? null,
      $record_id,
    ];
    $this->session->db->beginTransaction();
    try {
      $stmt = $this->session->db->prepare('
        UPDATE login_account
           SET account_name = ?,
               account_fullname = ?,
               account_password = ?,
               account_comment = ?,
               account_admin = ?,
               account_readonly = ?,
               account_status = ?
         WHERE account_id = ?
      ');
      $stmt->execute($values);
      $stmt = $this->session->db->prepare("
        INSERT INTO LibraryAudit (AuditWho, AuditWhen, AuditAction,
                                  AuditTable, AuditKey)
             VALUES (?, ?, 'UPDATE', 'login_account', ?)
      ");
      $user = $this->session->user->name;
      $message = "$user updating account: " . json_encode($values);
      $this->session->debug_log($message);
      $stmt->execute([$user, $this->session->localtime, $record_id]);
      $this->session->db->commit();
      return ['status' => 'success', 'account_id' => $record_id];
    } catch (\Exception $e) {
      $this->session->db->rollback();
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      return ['status' => 'failure', 'message' => $message];
    }
  }

}

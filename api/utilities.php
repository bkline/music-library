<?php

/**
 * Common tools for managing the current session.
 */

namespace MusicLibrary\Utilities;

require '../vendor/autoload.php';

use Ramsey\Uuid\Uuid;

class Session {

  const API_PATH = '/library/api';
  const CONFIG = __DIR__ . '/config.json';
  const ID = 'MLSESSID';
  const SECRETS = __DIR__ . '/secrets.json';
  const PROD_URL = __DIR__ . '/prod.url';

  public $config;
  public $db;
  public $debugging;
  public $endpoint;
  public $id;
  public $localtime;
  public $method;
  public $now;
  public $path_segments;
  public $record_id;
  public $record_type;
  public $request_data;
  public $request_uri;
  public $start;
  public $user;
  public $initialized;

  // Assemble the values for the current session.
  public function __construct() {
    $this->now = time();
    $this->start = microtime(true);
    $this->debugging = isset($_REQUEST['debug']);
    $this->db = self::connect_to_database();
    $this->initialized = $this->has_accounts();
    $this->id = $_COOKIE[self::ID] ?? null;
    $this->method = $_SERVER['REQUEST_METHOD'];
    $this->config = self::load_config();
    $this->request_uri = self::get_request_uri();
    $this->localtime = self::get_localtime();
    $this->request_data = self::load_request_data();
    $this->path_segments = $this->load_path_segments();
    $this->endpoint = $this->path_segments[2];
    $this->record_id = $this->path_segments[3] ?? null;
    $this->record_type = $this->config['record_types'][$this->endpoint] ?? null;
    $this->user = new User($this);
  }

  // See if we're in maintenance mode.
  public function check_maintenance_mode() {
    return ['maintenance_mode' => file_exists('../maintenance-mode')];
  }

  // Conditional logging for debug purposes.
  public function debug_log($what) {
    if ($this->debugging) {
      error_log($what);
    }
  }

  // Mark the session as expired and remove its cookie.
  public function delete() {
    if (empty($this->id)) {
      return ['status' => 'warning', 'message' => 'Not logged in'];
    }
    $stmt = $this->db->prepare('
      UPDATE login_session
         SET sess_closed = ?
       WHERE sess_id = ?
    ');
    $stmt->execute([$this->localtime, $this->id]);
    setcookie(self::ID, '', $this->now - 3600);
    unset($_COOKIE[self::ID]);
    error_log("closed session {$this->id} at {$this->localtime}");
    return ['status' => 'success', 'message' => 'Logout successful'];
  }

  // Provide information about the currently logged-in user.
  public function get() {
    $prod = file_exists(self::PROD_URL) ? file_get_contents(self::PROD_URL) : '';
    return $this->user->active ? $this->user : ['prod' => trim($prod)];
  }

  // Load the information which informs our processing of the app's values.
  private function load_config() {
    // $this->debug_log('config path=' . self::CONFIG);
    $this->debug_log("config path={self::CONFIG}");
    $json = file_get_contents(self::CONFIG);
    $config = json_decode($json, true);
    $this->debug_log('loaded config ' . json_encode($config));
    return $config;
  }

  // Do our own session management (PHP's isn't reliable).
  public function post() {
    $data = $this->request_data;
    $username = isset($data['username']) ? $data['username'] : '';
    $password = isset($data['password']) ? $data['password'] : '';
    error_log("session->post($username, $password)");
    $query = 'SELECT * FROM login_account WHERE account_name = ?';
    $row = $this->select($query, [$username], 'row');
    if (empty($row) || !password_verify($password, $row['account_hash'])) {
      $this->debug_log('$row: ' . json_encode($row));
      http_response_code(401);
      $message = 'Invalid credentials';
      $this->reply(['status' => 'failure', 'message' => $message]);
    }
    if ($row['account_status'] !== 'Active') {
      http_response_code(401);
      $this->reply(['status' => 'failure', 'message' => 'Account retired']);
    }
    $stmt = $this->db->prepare('
      INSERT INTO login_session (sess_id, sess_user, sess_start, sess_last)
           VALUES (?, ?, ?, ?)
    ');
    $uuid = Uuid::uuid4()->toString();
    $stmt->execute([$uuid, $username, $this->localtime, $this->now]);
    $expire = $this->now + 60 * 60 * 24 * 365;  // cookie will live for a year
    $this->debug_log('setting cookie expiry to ' . date('Y-m-d H:i:s', $expire));
    setcookie(self::ID, $uuid, $expire);
    error_log("created session $uuid");
    return [
      'status' => 'success',
      'account' => [
        'id' => $row['account_id'],
        'name' => $row['account_name'],
        'fullname' => $row['account_fullname'],
        'readonly' => !!$row['account_readonly'],
        'admin' => !!$row['account_admin'],
      ],
    ];
  }

  // Send a response to the client.
  public function reply($payload) {
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit();
  }

  // Submit a SELECT query to the database the retrieve the results.
  public function select($sql, $values = null, $fetch = 'all') {
    try {
      if (empty($values)) {
        $stmt = $this->db->query($sql);
      } else {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
      }
      switch ($fetch) {
      case 'value':
        return $stmt->fetchColumn();
      case 'column':
        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
      case 'row':
        return $stmt->fetch(\PDO::FETCH_ASSOC);
      case 'num':
        return $stmt->fetch(\PDO::FETCH_NUM);
      case 'obj':
        return $stmt->fetchAll(\PDO::FETCH_OBJ);
      case 'all':
      default:
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
      }
    } catch (\Exception $e) {
      $message = $e->getMessage();
      error_log($message);
      http_response_code(500);
      $this->reply(['status' => 'failure', 'message' => $message]);
    }
  }

  // Make sure the user is authorized to perform administrative tasks.
  public function verify_is_admin() {
    if (!$this->user->admin) {
      header('HTTP/1.1 403 Forbidden');
      $this->reply(['status' => 'failure', 'message' => 'Action forbidden']);
    }
  }

  // Make sure the user is authorized to make changes to the catalog.
  public function verify_not_readonly() {
    if (empty($this->user->name)) {
      error_log('user not logged in');
      header('HTTP/1.1 401 Unauthorized');
      $this->reply(['status' => 'failure', 'message' => 'Not logged in']);
    }
    if (!$this->user->active) {
      error_log("account {$this->user->name} has been retired");
      header('HTTP/1.1 403 Forbidden');
      $this->reply(['status' => 'failure', 'message' => 'Account closed']);
    }
    if ($this->user->readonly) {
      error_log("account {$this->user->name} is read-only");
      header('HTTP/1.1 403 Forbidden');
      $this->reply(['status' => 'failure', 'message' => 'Action forbidden']);
    }
  }

  // Use the credentials on the disk to establish a database connection.
  private static function connect_to_database() {
    $secrets = json_decode(file_get_contents(self::SECRETS));
    $args = [$secrets->database->uri];
    if (isset($secrets->database->account)) {
      $args[] = $secrets->database->account;
      if (isset($secrets->database->password)) {
        $args[] = $secrets->database->password;
      }
    }
    $db = new \PDO(...$args);
    if (str_starts_with($secrets->database->uri, 'mysql:')) {
      $db->exec("SET NAMES 'utf8'");
    }
    return $db;
  }

  // Construct the standard ISO-formatted string for the current time.
  private static function get_localtime() {
    $tz = new \DateTimeZone('America/New_York');
    $datetime = new \DateTime('now', $tz);
    return $datetime->format('Y-m-d H:i:s.u');
  }

  // Find out what wa were asked to do, and verify that it's supported.
  private static function get_request_uri() {
    $request_uri = $_SERVER['REQUEST_URI'];
    if (!str_starts_with($request_uri, self::API_PATH)) {
      die('unsupported URI');
    }
    return $request_uri;
  }

  // See if we have any user accounts.
  private function has_accounts() {
    $stmt = $this->db->query('SELECT COUNT(*) FROM login_account');
    if ($stmt->fetchColumn() > 0) {
      return true;
    };
    setcookie(self::ID, '', $this->now - 3600);
    unset($_COOKIE[self::ID]);
    return false;
  }

  // Break down the request URI into its parts.
  private function load_path_segments() {
    $path = explode('?', $this->request_uri)[0];
    return explode('/', trim($path, '/'));
  }

  // Parse the data passed for POST and PUT requests.
  private static function load_request_data() {
    $json = file_get_contents('php://input');
    return $json ? json_decode($json, true) : [];
  }

}

class User {

  public $id = null;
  public $name = null;
  public $fullname = null;
  public $readonly = true;
  public $admin = false;
  public $active = false;

  public function __construct($session) {
    $username = null;
    if (!$session->initialized) {
      $this->id = 0;
      $this->name = '[init]';
      $this->fullname = 'Database Initialization';
      $this->active = $this->admin = true;
    } elseif (!empty($session->id)) {
      $stmt = $session->db->prepare('
        SELECT sess_user, sess_last, sess_closed
          FROM login_session
         WHERE sess_id = ?'
      );
      $stmt->execute([$session->id]);
      $row = $stmt->fetch(\PDO::FETCH_ASSOC);
      $session_closed = $row['sess_closed'];
      $last_activity = $row['sess_last'];
      if (!empty($session_closed)) {
        error_log("session {$session->id} closed $session_closed");
      } elseif ($session->now - $last_activity > 60 * 60 * 48) {  // >= two days
        $session->delete();
      } else {
        $username = $row['sess_user'];
        $stmt = $session->db->prepare('
          UPDATE login_session
             SET sess_last = ?
           WHERE sess_id = ?
        ');
        $stmt->execute([$session->now, $session->id]);
        $stmt = $session->db->prepare('
          SELECT account_id, account_name, account_fullname, account_readonly,
                 account_status, account_admin
            FROM login_account
           WHERE account_name = ?
        ');
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row) {
          $session->debug_log(json_encode($row));
          $this->id = $row['account_id'];
          $this->name = $row['account_name'];
          $this->fullname = $row['account_fullname'];
          $this->readonly = $row['account_readonly'] !== 0;
          $this->active = $row['account_status'] === 'Active';
          $this->admin = $row['account_admin'] === 1;
          $session->debug_log('user=' . json_encode($this));
        }
      }
    }
    if ($session->endpoint === 'session' && $session->method === 'POST') {
      $username = $session->request_data['username'];
    }
    if ($session->request_uri !== '/library/api/maintenance-mode') {
      error_log("{$session->method} {$session->request_uri} $username");
    }
  }

}

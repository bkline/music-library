<?php

/**
 * Top-level routing for the music library API.
 */

require 'utilities.php';

// Ensure consistent locale
setlocale(LC_ALL, 'en_US.UTF-8');
$session = new MusicLibrary\Utilities\Session();

switch ($session->method) {

case 'GET':

  // Fetch records.
  switch ($session->endpoint) {

  case 'account':
    require 'users.php';
    $session->reply((new \MusicLibrary\Users\User($session))->get());
    break;

  case 'audit':
    $session->verify_is_admin();
    $query = 'SELECT * FROM LibraryAudit ORDER BY AuditWhen DESC';
    $session->reply($session->select($query));
    break;

  case 'music':
  case 'item':  // alias
    require 'items.php';
    $session->reply((new \MusicLibrary\Items\Item($session))->get());
    break;

  case 'maintenance-mode':
    $session->reply($session->check_maintenance_mode());
    break;

  case 'print':
    require 'print.php';
    $session->reply((new \MusicLibrary\Print\Job($session))->get());
    break;

  case 'report':
    require 'reports.php';
    $session->reply((new \MusicLibrary\Reports\Report($session))->get());
    break;

  case 'session':
    $session->reply($session->get());
    break;

  default:
    require 'tables.php';
    $session->reply((new \MusicLibrary\Lookup\Tables($session))->get());
    break;
  }

  break;

case 'POST':

  // Create new records.
  switch ($session->endpoint) {

  case 'account':
    require 'users.php';
    $session->reply((new \MusicLibrary\Users\User($session))->post());
    break;

  case 'music':
  case 'item':  // alias
    require 'items.php';
    $session->reply((new \MusicLibrary\Items\Item($session))->post());
    break;

  case 'report':
    require 'reports.php';
    $session->reply((new \MusicLibrary\Reports\Report($session))->post());
    break;

  case 'session':
    $session->reply($session->post());
    break;

  default:
    require 'tables.php';
    $session->reply((new \MusicLibrary\Lookup\Tables($session))->post());
    break;
  }

  break;

case 'PUT':

  // Update existing records.
  switch ($session->endpoint) {

  case 'account':
    require 'users.php';
    $session->reply((new \MusicLibrary\Users\User($session))->put());
    break;

  case 'music':
  case 'item':  // alias
    require 'items.php';
    $session->reply((new \MusicLibrary\Items\Item($session))->put());
    break;

  default:
    require 'tables.php';
    $session->reply((new \MusicLibrary\Lookup\Tables($session))->put());
    break;
  }

  break;

case 'DELETE':

  // Delete existing records.
  switch ($session->endpoint) {

  case 'account':  // used for testing; don't expose in the front end
    require 'users.php';
    $session->reply((new \MusicLibrary\Users\User($session))->delete());
    break;

  case 'music':
  case 'item':  // alias
    require 'items.php';
    $session->reply((new \MusicLibrary\Items\Item($session))->delete());
    break;

  case 'session':
    $session->reply($session->delete());
    break;

  default:
    require 'tables.php';
    $session->reply((new \MusicLibrary\Lookup\Tables($session))->delete());
    break;
  }

  break;

default:
  header("HTTP/1.0 405 Method Not Allowed");
  break;
}

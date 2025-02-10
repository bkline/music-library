<?php

$secrets = json_decode(file_get_contents(__DIR__ . '/secrets.json'));
$args = [$secrets->database->uri];
if (isset($secrets->database->account)) {
  $args[] = $secrets->database->account;
  if (isset($secrets->database->password)) {
    $args[] = $secrets->database->password;
  }
}

$db = new PDO(...$args);

// Check connection
if (!$db) {
  die("Connection failed: " . $db->connect_error);
}

// Fetch existing passwords
$sql = 'SELECT account_password, account_hash FROM login_account';
$stmt = $db->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
  $ph = $row['account_hash'];
  $pw = $row['account_password'];
  $ok = password_verify($pw, $ph) ? 'OK' : 'NO';
  echo "$ph $ok\n";
}
$n = count($rows);
echo "Checked $n password hashes.\n";
?>

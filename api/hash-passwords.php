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
$sql = 'SELECT account_id, account_password FROM login_account';
$stmt = $db->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$sql = 'UPDATE login_account SET account_hash = ? WHERE account_id = ?';
$stmt = $db->prepare($sql);
foreach ($rows as $row) {
  $id = $row['account_id'];
  $pw = $row['account_password'];
  $ph = password_hash($pw, PASSWORD_DEFAULT);
  $stmt->execute([$ph, $id]);
}
$n = count($rows);
echo "Hashed $n passwords.\n";
?>

<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER']);
$db      = get_db();

json_response(['renter' => fetch_renter($db, $session['user_id'])]);

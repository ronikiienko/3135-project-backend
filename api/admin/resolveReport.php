<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);
if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$reportId = isset($_GET['reportId']) ? (int) $_GET['reportId'] : null;
if (!$reportId) {
    error_response('PAYLOAD_MALFORMED', 400);
}

$stmt = $db->prepare('SELECT id, is_resolved FROM reports WHERE id = :id');
$stmt->execute([':id' => $reportId]);
$report = $stmt->fetch();

if (!$report) {
    error_response('REPORT_NOT_FOUND', 404);
}
if ($report['is_resolved']) {
    error_response('ALREADY_RESOLVED', 409);
}

$stmt = $db->prepare('UPDATE reports SET is_resolved = true WHERE id = :id');
$stmt->execute([':id' => $reportId]);

json_response([]);

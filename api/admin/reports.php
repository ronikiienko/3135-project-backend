<?php

require_once __DIR__ . '/../../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['ADMIN']);
$db      = get_db();

$admin = fetch_admin($db, $session['user_id']);
if ($admin['is_deleted']) {
    error_response('FORBIDDEN', 403);
}

$stmt = $db->query('
    SELECT
        rep.id,
        rep.reporter_id,
        rep.reported_id,
        rep.reason,
        rep.body,
        rep.is_resolved,
        COALESCE(rs.name, CONCAT(rn.fName, " ", rn.lName)) AS reporter_name,
        COALESCE(ds.name, CONCAT(dn.fName, " ", dn.lName)) AS reported_name
    FROM reports rep
    LEFT JOIN shelters rs ON rs.id = rep.reporter_id
    LEFT JOIN renters  rn ON rn.id = rep.reporter_id
    LEFT JOIN shelters ds ON ds.id = rep.reported_id
    LEFT JOIN renters  dn ON dn.id = rep.reported_id
    ORDER BY rep.is_resolved ASC, rep.id DESC
');

$reports = array_map(fn($r) => [
    'id'            => (int) $r['id'],
    'reporter_id'   => $r['reporter_id'] !== null ? (int) $r['reporter_id'] : null,
    'reported_id'   => (int) $r['reported_id'],
    'reporter_name' => $r['reporter_name'],
    'reported_name' => $r['reported_name'],
    'reason'        => $r['reason'],
    'body'          => $r['body'],
    'is_resolved'   => (bool) $r['is_resolved'],
], $stmt->fetchAll());

json_response(['reports' => $reports]);

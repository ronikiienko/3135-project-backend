<?php

require_once __DIR__ . '/../src/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$session = require_auth(['RENTER', 'SHELTER', 'ADMIN']);
$db      = get_db();

$userId = $session['user_id'];

// Get all unique correspondents with their latest message
$stmt = $db->prepare('
    SELECT
        correspondent_id,
        COALESCE(s.name, CONCAT(rn.fName, " ", rn.lName), a.name) AS correspondent_name,
        u.avatar_filename,
        last_body,
        last_created_at
    FROM (
        SELECT
            CASE WHEN sender_id = :user_id THEN recipient_id ELSE sender_id END AS correspondent_id,
            SUBSTRING_INDEX(GROUP_CONCAT(body ORDER BY created_at DESC SEPARATOR "|||"), "|||", 1) AS last_body,
            MAX(created_at) AS last_created_at
        FROM messages
        WHERE sender_id = :user_id2 OR recipient_id = :user_id3
        GROUP BY correspondent_id
    ) conv
    JOIN users u ON u.id = conv.correspondent_id
    LEFT JOIN shelters s ON s.id = conv.correspondent_id
    LEFT JOIN renters rn ON rn.id = conv.correspondent_id
    LEFT JOIN admins a ON a.id = conv.correspondent_id
    ORDER BY last_created_at DESC
');
$stmt->execute([
    ':user_id'  => $userId,
    ':user_id2' => $userId,
    ':user_id3' => $userId,
]);
$rows = $stmt->fetchAll();

$conversations = array_map(fn($r) => [
    'correspondent_id'   => (int) $r['correspondent_id'],
    'correspondent_name' => $r['correspondent_name'],
    'avatar_filename'    => $r['avatar_filename'],
    'last_message'       => $r['last_body'],
    'last_message_at'    => format_datetime($r['last_created_at']),
], $rows);

json_response(['conversations' => $conversations]);

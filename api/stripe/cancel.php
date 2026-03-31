<?php

require_once __DIR__ . '/../../src/bootstrap.php';

$scheme       = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$baseUrl      = $scheme . '://' . $_SERVER['HTTP_HOST'];
$frontendBase = $baseUrl . '/3135-project-backend/public/dist/index.html#';

$rentalId = isset($_GET['rentalId']) ? (int) $_GET['rentalId'] : null;

if ($rentalId) {
    header('Location: ' . $frontendBase . '/rental/' . $rentalId);
} else {
    header('Location: ' . $frontendBase . '/dashboard');
}
exit;

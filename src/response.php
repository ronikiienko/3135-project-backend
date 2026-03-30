<?php

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function error_response(string $code, int $status): never
{
    json_response(['error' => $code], $status);
}

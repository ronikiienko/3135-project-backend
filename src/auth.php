<?php

function session_init(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name($_ENV['SESSION_NAME'] ?? 'app_session');
        session_start();
    }
}

function get_session(): ?array
{
    session_init();
    if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
        return null;
    }
    return ['user_id' => $_SESSION['user_id'], 'role' => $_SESSION['role']];
}

function require_auth(array $required_roles = []): array
{
    $session = get_session();
    if ($session === null) {
        error_response('UNAUTHENTICATED', 401);
    }
    if (!empty($required_roles) && !in_array($session['role'], $required_roles)) {
        error_response('FORBIDDEN', 403);
    }
    return $session;
}

function set_session(int $userId, string $role): void
{
    session_init();
    $_SESSION['user_id'] = $userId;
    $_SESSION['role']    = $role;
}

function destroy_session(): void
{
    session_init();
    session_destroy();
}

<?php

function save_file(array $file, string $subdir): string
{
    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = bin2hex(random_bytes(16)) . ($ext ? ".$ext" : '');
    $dir  = __DIR__ . '/../public/' . $subdir;
    $dest = $dir . '/' . $filename;

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        error_response('INTERNAL_SERVER', 500);
    }

    return $filename;
}

function save_multi_files(string $fieldName, string $subdir): array
{
    if (!isset($_FILES[$fieldName])) {
        return [];
    }

    $files     = $_FILES[$fieldName];
    $filenames = [];

    if (is_array($files['name'])) {
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $filenames[] = save_file([
                    'name'     => $files['name'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                ], $subdir);
            }
        }
    } elseif ($files['error'] === UPLOAD_ERR_OK) {
        $filenames[] = save_file($files, $subdir);
    }

    return $filenames;
}

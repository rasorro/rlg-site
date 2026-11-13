<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// config.php sits one level above the web root (the folder this site is served from), outside anything public.
require_once dirname($_SERVER['DOCUMENT_ROOT']) . '/config.php';
require_once __DIR__ . '/score-signature.php';

$body = json_decode(file_get_contents('php://input'), true);

$name = trim($body['name'] ?? '');
$score = $body['score'] ?? null;
$showPath = isset($body['showPath']) ? (bool) $body['showPath'] : false;

if ($name === '' || strlen($name) > 100 || $score === null || !is_int($score) || $score < 0 || $score > 1000000) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Signing is enforced once SCORE_SECRET is set in config.php, so the server can ship before the game does.
$secret = defined('SCORE_SECRET') ? (string) SCORE_SECRET : '';
$sig = null;
if ($secret !== '') {
    $sig = $body['sig'] ?? null;
    if (!score_signature_valid($secret, $name, $score, $showPath, $body['ts'] ?? null, $sig, time())) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    $sig = strtolower($sig);
}

// Clean after the signature check: the game signs the name exactly as typed.
$name = leaderboard_clean_name($name);
if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($sig !== null) {
        $stmt = $pdo->prepare('INSERT INTO leaderboard (name, score, show_path, sig) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $score, $showPath ? 1 : 0, $sig]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO leaderboard (name, score, show_path) VALUES (?, ?, ?)');
        $stmt->execute([$name, $score, $showPath ? 1 : 0]);
    }

    http_response_code(201);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    // 23000 = unique key violation: this exact signed score was already submitted (replay).
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'Duplicate submission']);
        exit;
    }
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

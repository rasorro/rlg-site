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

require_once '/home/maliyatr/config.php';

$body = json_decode(file_get_contents('php://input'), true);

$name = trim($body['name'] ?? '');
$score = $body['score'] ?? null;
$showPath = isset($body['showPath']) ? (bool) $body['showPath'] : false;

if ($name === '' || strlen($name) > 100 || $score === null || !is_int($score) || $score < 0 || $score > 1000000) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare('INSERT INTO leaderboard (name, score, show_path) VALUES (?, ?, ?)');
    $stmt->execute([$name, $score, $showPath ? 1 : 0]);

    http_response_code(201);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

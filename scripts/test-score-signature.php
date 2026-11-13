<?php
// Run: php scripts/test-score-signature.php   (CI runs this; exits non-zero on failure)
require __DIR__ . '/../public/api/score-signature.php';

$secret = 'test-secret';
$now = 1_700_000_000;
$sign = fn (string $n, int $s, bool $p, int $ts) => hash_hmac('sha256', "$n|$s|" . ($p ? 1 : 0) . "|$ts", $secret);
$fail = 0;
$check = function (string $label, bool $ok) use (&$fail) {
    echo ($ok ? 'ok   ' : 'FAIL ') . $label . PHP_EOL;
    if (!$ok) $fail++;
};

$good = $sign('Ann', 42, true, $now);
$check('valid signature accepted', score_signature_valid($secret, 'Ann', 42, true, $now, $good, $now));
$check('uppercase hex accepted', score_signature_valid($secret, 'Ann', 42, true, $now, strtoupper($good), $now));
$check('changed score rejected', !score_signature_valid($secret, 'Ann', 43, true, $now, $good, $now));
$check('changed name rejected', !score_signature_valid($secret, 'Bob', 42, true, $now, $good, $now));
$check('changed mode rejected', !score_signature_valid($secret, 'Ann', 42, false, $now, $good, $now));
$check('wrong secret rejected', !score_signature_valid('other', 'Ann', 42, true, $now, $good, $now));
$check('expired timestamp rejected', !score_signature_valid($secret, 'Ann', 42, true, $now, $good, $now + SCORE_MAX_AGE_SECONDS + 1));
$check('missing sig rejected', !score_signature_valid($secret, 'Ann', 42, true, $now, null, $now));
$check('non-integer ts rejected', !score_signature_valid($secret, 'Ann', 42, true, '1700000000', $good, $now));
$check('name with separator cannot be reshaped', !score_signature_valid($secret, 'Ann|42', 1, true, $now, $good, $now));

$check('plain name unchanged', leaderboard_clean_name('Ann') === 'Ann');
$check('tags and controls stripped', leaderboard_clean_name("  <b>An
n</b> ") === 'bAnn/b');
$check('zero-width and direction marks stripped', leaderboard_clean_name("A​n‮n") === 'Ann');
$check('spaces collapsed', leaderboard_clean_name('A   n  n') === 'A n n');
$check('emoji and accents kept', leaderboard_clean_name('José 🚀') === 'José 🚀');
$check('only junk becomes empty', leaderboard_clean_name("<>
") === '');
$check('invalid UTF-8 becomes empty', leaderboard_clean_name("ÿþ") === '');

exit($fail === 0 ? 0 : 1);

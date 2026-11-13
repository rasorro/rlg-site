<?php
// Score signing. The game computes HMAC-SHA256(SCORE_SECRET, "name|score|showPath|ts") as lowercase hex and sends it
// as `sig` with `ts` (unix seconds). The server recomputes it, so a request without the secret can't invent a score,
// and the single-use `sig` column (see docs/leaderboard-signing.md) stops a captured request being replayed.

// A day, not minutes: players with a wrong device clock must still be able to submit. Replays are stopped by the unique sig, not by this.
const SCORE_MAX_AGE_SECONDS = 86400;

function score_signature_payload(string $name, int $score, bool $showPath, int $ts): string
{
    return $name . '|' . $score . '|' . ($showPath ? 1 : 0) . '|' . $ts;
}

function score_signature_valid(string $secret, string $name, int $score, bool $showPath, $ts, $sig, int $now): bool
{
    if (!is_int($ts) || !is_string($sig) || abs($now - $ts) > SCORE_MAX_AGE_SECONDS) {
        return false;
    }
    $expected = hash_hmac('sha256', score_signature_payload($name, $score, $showPath, $ts), $secret);
    return hash_equals($expected, strtolower($sig));
}

// Leaderboard names are shown inside the game, so store only plain text: no control characters (newlines, zero-width
// and direction tricks, escape codes) and no < > (rich-text tags). Returns '' if nothing usable is left.
function leaderboard_clean_name(string $name): string
{
    $clean = preg_replace('/[p{Cc}p{Cf}p{Zl}p{Zp}<>]/u', '', $name);
    if ($clean === null) { // invalid UTF-8
        return '';
    }
    return trim(preg_replace('/s+/u', ' ', $clean) ?? '');
}

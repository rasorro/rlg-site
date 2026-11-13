# Leaderboard score signing

`public/api/submit-score.php` rejects scores that weren't signed by the game once `SCORE_SECRET` is defined in the
server-side `config.php`. Until then it behaves exactly as before, so the server can be deployed first.

## What the game sends

POST JSON: `name`, `score`, `showPath`, plus `ts` (unix seconds, integer) and `sig`.

`sig` = lowercase hex of `HMAC-SHA256(SCORE_SECRET, "<name>|<score>|<showPath 1 or 0>|<ts>")`.
Sign the **trimmed** name, exactly as sent (the server trims it too).

```csharp
using System; using System.Security.Cryptography; using System.Text;

static string SignScore(string secret, string name, int score, bool showPath, long ts)
{
    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
    string payload = $"{name}|{score}|{(showPath ? 1 : 0)}|{ts}";
    return BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).Replace("-", "").ToLowerInvariant();
}
// ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();  (the server accepts +/- 24 h of clock drift)
```

## Rollout (in this order, so nobody's submission breaks)

1. Deploy the site (includes the PHP). Nothing changes yet.
2. Run once in phpMyAdmin: `ALTER TABLE leaderboard ADD COLUMN sig CHAR(64) NULL, ADD UNIQUE KEY uniq_sig (sig);`
   (NULL is allowed, so old rows are fine.)
3. Ship the new Unity build that signs scores (new build version in `app/games.ts`).
4. Add `define('SCORE_SECRET', '<long random string>');` to `/home/maliyatr/config.php`. Use the same string in the game.

Responses: `403` bad or missing signature, `409` the same signed score was already submitted, `201` saved.
Players still on a cached old build get 403 after step 4 until they reload.

## Limits (be honest about these)

The secret has to live inside the WebGL build, and anyone can pull strings out of a `.wasm`/`.data` file.
This stops casual forging (hand-written requests, browser dev-tools, replaying a captured request).
It does not stop someone who extracts the secret. To raise the bar later: keep scores plausible server-side
(max score per game length) or obfuscate the secret in the build. It can never be fully forgery-proof client-side.

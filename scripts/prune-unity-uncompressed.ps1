$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$buildDirs = Get-ChildItem -Path "public/games" -Directory -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq "Build" }

$pruned = @()

foreach ($dir in $buildDirs) {
  $targets = Get-ChildItem -Path $dir.FullName -File -ErrorAction SilentlyContinue |
    Where-Object {
      ($_.Name -like "*.data" -or $_.Name -like "*.framework.js" -or $_.Name -like "*.wasm") -and
      (Test-Path (Join-Path $dir.FullName ($_.Name + ".gz")))
    }

  foreach ($file in $targets) {
    Remove-Item -LiteralPath $file.FullName -Force
    $pruned += $file.FullName
  }
}

if ($pruned.Count -gt 0) {
  Write-Output "Pruned files:"
  $pruned | ForEach-Object { Write-Output " - $_" }
} else {
  Write-Output "No uncompressed Unity files needed pruning."
}

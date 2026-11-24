# Polls for local changes and pushes them to GitHub.

$ErrorActionPreference = "Continue"
$repo = git -C $PSScriptRoot rev-parse --show-toplevel 2>$null
if (-not $repo) { exit 0 }

$gitDir = Join-Path $repo ".git"
$pidFile = Join-Path $gitDir "auto-sync-watch.pid"
$syncScript = Join-Path $PSScriptRoot "auto-sync.ps1"
Set-Content -Path $pidFile -Value $PID -Encoding ascii

while ($true) {
  Start-Sleep -Seconds 20
  try {
    $pending = git -C $repo status --porcelain
    if ($pending) {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $syncScript | Out-Null
    }
  } catch { }
}

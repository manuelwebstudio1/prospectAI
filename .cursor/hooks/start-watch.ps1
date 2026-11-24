# Starts the auto-sync watcher once per machine session.

$ErrorActionPreference = "Continue"
try { [void][Console]::In.ReadToEnd() } catch { }

$repo = git -C $PSScriptRoot rev-parse --show-toplevel 2>$null
if (-not $repo) {
  Write-Output "{}"
  exit 0
}

$gitDir = Join-Path $repo ".git"
$pidFile = Join-Path $gitDir "auto-sync-watch.pid"
$watchScript = Join-Path $PSScriptRoot "watch-and-sync.ps1"

$running = $false
if (Test-Path $pidFile) {
  $oldPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  if ($oldPid) {
    $proc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
    if ($proc) { $running = $true }
  }
}

if (-not $running) {
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-WindowStyle", "Hidden",
    "-File", $watchScript
  ) -WindowStyle Hidden | Out-Null
}

Write-Output "{}"
exit 0

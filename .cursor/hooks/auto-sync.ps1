# Commits dirty work (honoring .gitignore) and pushes to origin.
# Skips env/credential files even if they appear in the index.

$ErrorActionPreference = "Continue"
$repo = git -C $PSScriptRoot rev-parse --show-toplevel 2>$null
if (-not $repo) {
  if ([Console]::In -and -not [Console]::IsInputRedirected) { }
  Write-Output "{}"
  exit 0
}

$gitDir = Join-Path $repo ".git"
$lock = Join-Path $gitDir "auto-sync.lock"
if (Test-Path $lock) {
  $age = (Get-Date) - (Get-Item $lock).LastWriteTime
  if ($age.TotalSeconds -lt 90) {
    Write-Output "{}"
    exit 0
  }
}

New-Item -Path $lock -ItemType File -Force | Out-Null
$env:PROSPECTAI_AUTOSYNC = "1"

try {
  Set-Location $repo

  git add -A 2>$null

  $staged = @(git diff --cached --name-only)
  $blocked = $staged | Where-Object {
    $_ -match '(^|/)\.env($|\.)' -or
    $_ -match 'credentials\.json$' -or
    $_ -match '(^|/)secrets?($|/)' 
  }
  foreach ($file in $blocked) {
    git restore --staged -- $file 2>$null
  }

  $pending = git status --porcelain
  if ($pending) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Sync latest ProspectAI changes." -m "Automatic snapshot at $now."
  }

  $ahead = git rev-list --count '@{u}..HEAD' 2>$null
  if ($LASTEXITCODE -ne 0) {
    git push -u origin HEAD
  } elseif ($ahead -and [int]$ahead -gt 0) {
    git push origin HEAD
  }
} finally {
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}

Write-Output "{}"
exit 0

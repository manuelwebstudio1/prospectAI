# After an agent turn, snapshot remaining changes and push.

$ErrorActionPreference = "Continue"
try { [void][Console]::In.ReadToEnd() } catch { }

$sync = Join-Path $PSScriptRoot "auto-sync.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $sync | Out-Null
Write-Output "{}"
exit 0

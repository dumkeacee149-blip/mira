param(
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

function Require-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Resolve-Path (Join-Path $scriptDir "..")
$repoDir = Resolve-Path (Join-Path $appDir "..\..")

Write-Host "[Mira ASSISTANT] Repo: $repoDir"
Write-Host "[Mira ASSISTANT] App : $appDir"

Require-Cmd node
Require-Cmd pnpm
Require-Cmd git

Push-Location $repoDir
try {
  Write-Host "[1/5] Pull latest code..."
  git pull

  if (-not $SkipInstall) {
    Write-Host "[2/5] Install dependencies..."
    pnpm install
  }
  else {
    Write-Host "[2/5] Skip install (as requested)."
  }

  Push-Location $appDir
  try {
    Write-Host "[3/5] Build Windows installer..."
    pnpm run build:win
  }
  finally {
    Pop-Location
  }

  $distDir = Join-Path $appDir "dist"
  if (-not (Test-Path $distDir)) {
    throw "Build finished but dist folder not found: $distDir"
  }

  Write-Host "[4/5] Collect artifacts..."
  $artifacts = Get-ChildItem -Path $distDir -File -Recurse |
    Where-Object { $_.Extension -in @('.exe', '.zip', '.yml', '.blockmap') } |
    Sort-Object LastWriteTime -Descending

  if (-not $artifacts) {
    throw "No installer artifacts found under: $distDir"
  }

  Write-Host "[5/5] Done. Artifacts:"
  $artifacts | Select-Object LastWriteTime, FullName | Format-Table -AutoSize

  $latestExe = $artifacts | Where-Object { $_.Extension -eq '.exe' } | Select-Object -First 1
  if ($latestExe) {
    Write-Host "\n[Mira ASSISTANT] Windows installer ready: $($latestExe.FullName)" -ForegroundColor Green
  }
}
finally {
  Pop-Location
}

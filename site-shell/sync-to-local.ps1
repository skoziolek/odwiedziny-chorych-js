# Sync plugin from repo -> Local WordPress (LocalWP).
# Usage: .\sync-to-local.ps1  or double-click sync.bat
# No config file needed if your site folder is under %USERPROFILE%\Local Sites\

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Source = Join-Path $RepoRoot 'wordpress-plugin\odwiedziny-chorych'

function Get-AutoTargetDir {
    if ($env:OC_LOCAL_PLUGIN_DIR -and (Test-Path $env:OC_LOCAL_PLUGIN_DIR)) {
        return $env:OC_LOCAL_PLUGIN_DIR.TrimEnd('\', '/')
    }
    $preferred = Join-Path $env:USERPROFILE 'Local Sites\odwiedziny-chorych\app\public\wp-content\plugins\odwiedziny-chorych'
    if (Test-Path $preferred) {
        return $preferred
    }
    $localSites = Join-Path $env:USERPROFILE 'Local Sites'
    if (-not (Test-Path $localSites)) {
        return $null
    }
    foreach ($site in Get-ChildItem $localSites -Directory -ErrorAction SilentlyContinue) {
        $candidate = Join-Path $site.FullName 'app\public\wp-content\plugins\odwiedziny-chorych'
        if (Test-Path $candidate) {
            return $candidate
        }
    }
    return $null
}

$dest = $null
$configPath = Join-Path $PSScriptRoot 'config.local.ps1'
if (Test-Path $configPath) {
    . $configPath
    if ($TargetPluginDir -and -not [string]::IsNullOrWhiteSpace($TargetPluginDir)) {
        $dest = ($TargetPluginDir -replace '[\\/]+$', '').TrimEnd()
    }
}

if (-not $dest) {
    $dest = Get-AutoTargetDir
}

if (-not $dest) {
    Write-Host ''
    Write-Host 'Could not find Local plugin folder.' -ForegroundColor Yellow
    Write-Host 'Expected something like:'
    Write-Host "  $($env:USERPROFILE)\Local Sites\<site-name>\app\public\wp-content\plugins\odwiedziny-chorych"
    Write-Host ''
    Write-Host 'Fix options:'
    Write-Host '  1) Double-click: open-plugin-folder-in-explorer.bat (check path exists)'
    Write-Host '  2) Copy config.example.ps1 -> config.local.ps1 and set $TargetPluginDir'
    Write-Host '  3) Set env var OC_LOCAL_PLUGIN_DIR to your plugin folder (then run sync again)'
    Write-Host ''
    exit 1
}

if (-not (Test-Path $Source)) {
    Write-Error "Plugin source not found: $Source"
    exit 1
}

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Write-Host "Created: $dest" -ForegroundColor DarkGray
}

Write-Host ''
Write-Host 'Sync: repo -> Local WordPress' -ForegroundColor Cyan
Write-Host "  From: $Source"
Write-Host "  To:   $dest"
Write-Host ''

$null = robocopy $Source $dest /MIR /R:2 /W:2 /XD .git /NFL /NDL /NJH /NJS /NP
$rc = $LASTEXITCODE

if ($rc -ge 8) {
    Write-Error "robocopy failed with exit code $rc"
    exit $rc
}

Write-Host 'OK. In browser: Ctrl+F5 on the app page.' -ForegroundColor Green
Write-Host ''

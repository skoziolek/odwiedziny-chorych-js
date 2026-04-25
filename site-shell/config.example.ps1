# Copy to config.local.ps1 only if auto-detect fails (see sync-to-local.ps1).

# Use YOUR Windows username automatically — no need to type C:\Users\...
$TargetPluginDir = Join-Path $env:USERPROFILE 'Local Sites\odwiedziny-chorych\app\public\wp-content\plugins\odwiedziny-chorych'

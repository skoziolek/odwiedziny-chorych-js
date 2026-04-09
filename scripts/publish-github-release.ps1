#Requires -Version 5.1
<#
.SYNOPSIS
  Tworzy lub aktualizuje Release na GitHubie dla tagu v1.2.0 i wgrywa ZIP wtyczki WordPress.

.EXAMPLE
  $env:GITHUB_TOKEN = "ghp_xxxxxxxx"   # classic PAT: zakres repo (public_repo wystarczy dla publicznego repo)
  .\scripts\publish-github-release.ps1
#>
param(
  [string] $Version = "1.2.0"
)

$ErrorActionPreference = "Stop"
$owner = "skoziolek"
$repo = "odwiedziny-chorych-js"
$tag = "v$Version"
$zipName = "odwiedziny-chorych-$tag.zip"

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Error "Ustaw zmienna srodowiskowa GITHUB_TOKEN (https://github.com/settings/tokens — uprawnienia: repo)."
  exit 1
}

$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  User-Agent    = "publish-github-release.ps1"
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$pluginDir = Join-Path $repoRoot "wordpress-plugin\odwiedziny-chorych"
if (-not (Test-Path $pluginDir)) {
  Write-Error "Brak folderu wtyczki: $pluginDir"
  exit 1
}

$zipPath = Join-Path ([System.IO.Path]::GetTempPath()) $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $pluginDir -DestinationPath $zipPath -CompressionLevel Optimal -Force
Write-Host "Utworzono: $zipPath ($([math]::Round((Get-Item $zipPath).Length / 1KB, 1)) KB)"

$base = "https://api.github.com/repos/$owner/$repo"
$release = $null
try {
  $release = Invoke-RestMethod -Uri "$base/releases/tags/$tag" -Headers $headers -Method GET
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -ne 404) { throw }
}

if (-not $release) {
  $bodyObj = @{
    tag_name   = $tag
    name       = "Odwiedziny Chorych $tag (WordPress)"
    body       = @"
### Wtyczka WordPress

Załącznik **$zipName** — w panelu WordPress: **Wtyczki → Dodaj nową → Wyślij**.

Wersja wtyczki: **$Version**

Instrukcja: https://github.com/$owner/$repo/blob/$tag/wordpress-plugin/odwiedziny-chorych/INSTRUKCJA_WGRANIA_WORDPRESS.md
"@
    draft      = $false
    prerelease = $false
  }
  $json = $bodyObj | ConvertTo-Json
  $release = Invoke-RestMethod -Uri "$base/releases" -Headers $headers -Method POST -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -ContentType "application/json; charset=utf-8"
  Write-Host "Utworzono release dla $tag"
} else {
  Write-Host "Release dla $tag juz istnieje (id=$($release.id)) — aktualizuje zalacznik..."
}

foreach ($a in @($release.assets)) {
  if ($a.name -eq $zipName) {
    $null = Invoke-RestMethod -Uri "$base/releases/assets/$($a.id)" -Headers $headers -Method DELETE
    Write-Host "Usunieto stary zalacznik: $zipName"
  }
}

$uploadUrl = ($release.upload_url -replace '\{\?name,label\}', '') + "?name=$zipName"
$uploadHeaders = @{
  Authorization        = "Bearer $token"
  Accept                 = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "Content-Type"         = "application/octet-stream"
}

$resp = Invoke-WebRequest -Uri $uploadUrl -Method POST -Headers $uploadHeaders -InFile $zipPath -UseBasicParsing
if ($resp.StatusCode -notin @(200, 201)) {
  Write-Error "Upload nie powiodl sie: $($resp.StatusCode)"
  exit 1
}

$final = Invoke-RestMethod -Uri "$base/releases/tags/$tag" -Headers $headers -Method GET
Write-Host "Gotowe. Strona release: $($final.html_url)"

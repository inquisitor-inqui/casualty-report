# Casualty Report build (Windows PowerShell 5.1+).
# 1. runs the tests, 2. copies the site into dist/site, 3. stamps updatedAt
# (dist copy only) and absolute link-preview URLs, 4. zips dist/site for itch.io.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

Write-Host 'Running tests...'
& node tests/parse.test.js
if ($LASTEXITCODE -ne 0) { Write-Host 'Tests failed. Build stopped.' -ForegroundColor Red; exit 1 }

$dist = Join-Path $root 'dist'
$site = Join-Path $dist 'site'
$zip = Join-Path $dist 'casualty-report.zip'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $site | Out-Null

$files = 'index.html', 'styles.css', 'icons.js', 'parse.js', 'app.js', 'data.js', 'og-image.png'
foreach ($f in $files) { Copy-Item (Join-Path $root $f) $site }

$utf8 = New-Object System.Text.UTF8Encoding($false)

# Stamp updatedAt in the dist copy only, if it's empty.
$dataPath = Join-Path $site 'data.js'
$data = [IO.File]::ReadAllText($dataPath, $utf8)
$re = New-Object System.Text.RegularExpressions.Regex 'updatedAt\s*:\s*(""|'''')'
if ($re.IsMatch($data)) {
  $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  $data = $re.Replace($data, "updatedAt: ""$stamp""", 1)
  [IO.File]::WriteAllText($dataPath, $data, $utf8)
  Write-Host "Stamped updatedAt = $stamp"
}

# Make og:/twitter: URLs absolute from SITE_URL.
$indexPath = Join-Path $site 'index.html'
$html = [IO.File]::ReadAllText($indexPath, $utf8)
$m = [regex]::Match($html, 'var SITE_URL = "([^"]*)"')
if ($m.Success -and $m.Groups[1].Value -and $m.Groups[1].Value -notmatch 'YOUR-SITE') {
  $base = $m.Groups[1].Value.TrimEnd('/')
  $html = $html.Replace('content="og-image.png"', "content=""$base/og-image.png""").Replace('content="./"', "content=""$base/""")
  [IO.File]::WriteAllText($indexPath, $html, $utf8)
} else {
  Write-Host 'Note: SITE_URL in index.html is still the placeholder; link previews use relative URLs.' -ForegroundColor Yellow
}

Compress-Archive -Path (Join-Path $site '*') -DestinationPath $zip -Force

Write-Host ''
Write-Host "Built $site" -ForegroundColor Green
Write-Host "Zipped $zip" -ForegroundColor Green

# Optional: download JSON into N1/data so the deployed site can load without third-party requests.
# Run with PowerShell from the extracted N1 folder.
$ErrorActionPreference = 'Stop'
$directory = Join-Path $PSScriptRoot 'data'
New-Item -ItemType Directory -Path $directory -Force | Out-Null
foreach ($kind in @('kanji', 'grammar', 'vocab')) {
    $url = "https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/$kind/n1.json"
    $path = Join-Path $directory "$kind.json"
    Write-Host "Downloading $kind ..."
    Invoke-WebRequest -Uri $url -OutFile $path -UseBasicParsing
    if ((Get-Item $path).Length -lt 1000) { throw "Unexpectedly small file: $path" }
    Write-Host "Saved: $path"
}
Write-Host 'Done. Upload N1/data/*.json together with N1/index.html, app.js and style.css.'

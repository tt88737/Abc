$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $root 'index.html'

if (-not (Test-Path -LiteralPath $htmlPath)) {
    throw 'index.html was not generated'
}

$html = Get-Content -LiteralPath $htmlPath -Raw

if ($html -notmatch 'function recentWindowStats') {
    throw 'expected dashboard to compute recent window stats when persisted recent fields are missing'
}

if ($html -notmatch 'threeWindowAnalysisCache') {
    throw 'expected dashboard to cache three-window analysis per source'
}

if ($html -notmatch 'threeWindowHtmlCache') {
    throw 'expected dashboard to cache rendered three-window HTML per source'
}

if ($html -match "recentCovered \?\? '-'") {
    throw 'expected dashboard to avoid placeholder recent window stats in three-compound tables'
}

$threeLoaderPattern = 'threeWindow5:\s*async\s*\(\)\s*=>\s*\{(?<body>[\s\S]*?)\n\s*\}'
$threeLoader = [regex]::Match($html, $threeLoaderPattern)
if (-not $threeLoader.Success) {
    throw 'expected dashboard to define a threeWindow5 tab loader'
}

if ($threeLoader.Groups['body'].Value -match 'ensureRecordsData') {
    throw 'expected threeWindow5 tab to avoid loading full records data before first render'
}

if ($html -notmatch 'class="table-scroll"') {
    throw 'expected wide three-window tables to render inside a horizontal scroll container'
}

Write-Host 'dashboard three-window ui shape ok'

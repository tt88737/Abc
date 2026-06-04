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

if ($html -notmatch 'isFileDashboard') {
    throw 'expected local file dashboard to skip failing json fetch attempts'
}

if ($html -notmatch 'three-window-detail-toggle') {
    throw 'expected heavy three-window detail tables to render behind explicit toggles'
}

if ($html -notmatch 'cacheBustUrl') {
    throw 'expected local script data loads to include cache-busting urls'
}

if ($html -match 'dashboardCacheVersion = ''\$GeneratedAt''') {
    throw 'expected dashboard cache version to be a runtime value, not a literal template token'
}

if ($html -notmatch 'delete window\[globalName\]') {
    throw 'expected script data loads to clear stale global data before appending script tags'
}

if ($html -match 'if \(window5State\?\.items\) return window5State') {
    throw 'expected window5 state loader to load real data when initial items array is empty'
}

if ($html -match 'if \(threeCompoundState\?\.items\) return threeCompoundState') {
    throw 'expected three-compound state loader to load real data when initial items array is empty'
}

Write-Host 'dashboard three-window ui shape ok'

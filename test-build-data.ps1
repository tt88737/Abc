$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $root 'test-data-output'
$pagesDir = Join-Path $outDir 'pages'
$dataDir = Join-Path $outDir 'data'

if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force
}
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $root 'pages\am.html') -Destination (Join-Path $pagesDir 'am.html')
Copy-Item -LiteralPath (Join-Path $root 'pages\hk.html') -Destination (Join-Path $pagesDir 'hk.html')

powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'build-data.ps1') -RootDir $outDir

$recordsPath = Join-Path $dataDir 'records.json'
$summaryPath = Join-Path $dataDir 'dashboard-summary.json'
$dashboardPath = Join-Path $outDir 'index.html'

foreach ($path in @($recordsPath, $summaryPath, $dashboardPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "expected build output missing: $path"
    }
}

$records = Get-Content -LiteralPath $recordsPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (@($records.records).Count -le 0) {
    throw 'records.json should contain parsed records'
}
if ($null -eq $records.summary) {
    throw 'records.json should include summary'
}

$dashboard = Get-Content -LiteralPath $dashboardPath -Raw -Encoding UTF8
$removedWindowToken = 'window' + '5'
$removedHistoryToken = 'history' + 'Pattern'
$removedReviewToken = 'data' + 'Review'
$removedRecommendationToken = 'recommendation' + 'Track'
$removedPatternToken = 'pattern' + 'Watch'
$removedWindowStateGlobal = '__' + ($removedWindowToken.ToUpperInvariant()) + '_STATE__'
$removedWindowRenderToken = 'render' + $removedWindowToken.Substring(0,1).ToUpperInvariant() + $removedWindowToken.Substring(1)

foreach ($token in @(
    'data-tab="decisionHome"',
    'data-tab="gateChallenge"',
    'data-tab="fixed8Pattern"',
    'data-tab="manualFetch"',
    'function renderDecisionHome',
    'function renderGateChallenge',
    'function renderFixed8Pattern',
    'function renderManualFetch'
)) {
    if (-not $dashboard.Contains($token)) {
        throw "dashboard should contain $token"
    }
}

foreach ($token in @(
    "data-tab=`"$removedWindowToken`"",
    $removedWindowRenderToken,
    $removedWindowToken + '-state',
    $removedWindowStateGlobal,
    $removedHistoryToken,
    $removedReviewToken,
    $removedRecommendationToken,
    $removedPatternToken
)) {
    if ($dashboard.Contains($token)) {
        throw "dashboard should not contain removed module token: $token"
    }
}

foreach ($fileName in @(
    $removedWindowToken + '-state.json',
    $removedWindowToken + '-state.js',
    'history-pattern-state.json',
    'history-pattern-state.js'
)) {
    $path = Join-Path $dataDir $fileName
    if (Test-Path -LiteralPath $path) {
        throw "removed module output should not be generated: $fileName"
    }
}

Write-Host 'PASS'
if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force
}

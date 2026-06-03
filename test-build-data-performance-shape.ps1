$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $root 'build-data.ps1'
$text = Get-Content -LiteralPath $scriptPath -Raw

if ($text.Contains('ConvertTo-Json -Depth 12')) {
    throw 'build-data.ps1 should not perform unused full payload ConvertTo-Json -Depth 12'
}

if (-not $text.Contains("fetch('data/dashboard-summary.json'")) {
    throw 'dashboard should start from dashboard-summary.json'
}

if (-not $text.Contains('New-DashboardSummary')) {
    throw 'dashboard summary generator should exist'
}

if (-not $text.Contains('[switch]$Profile')) {
    throw 'build-data.ps1 should expose -Profile switch'
}

if (-not $text.Contains('function Invoke-Profiled')) {
    throw 'build-data.ps1 should define Invoke-Profiled'
}

foreach ($stage in @('parse-pages', 'generated-predictions', 'game-predictions', 'records-json-serialize', 'three-compound-python')) {
    if (-not $text.Contains("'$stage'")) {
        throw "build profile should include stage $stage"
    }
}

foreach ($stage in @('game-settle-existing', 'game-current-targets', 'game-sort-output')) {
    if (-not $text.Contains("'$stage'")) {
        throw "build profile should include game sub-stage $stage"
    }
}

Write-Host 'build-data performance shape ok'

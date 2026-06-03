$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $root 'build-data.ps1'
$outDir = Join-Path $root 'test-three-compound-embed-output'
$pagesDir = Join-Path $outDir 'pages'
$utf8NoBom = [Text.UTF8Encoding]::new($false)

$issueText = [string][char]0x671F
$openText = [string]::Concat(@([char]0x5F00, [char]0x5956, [char]0x65F6, [char]0x95F4))

function New-RecordHtml {
    param([int]$Issue, [string]$Date, [int[]]$Numbers)

    $balls = for ($i = 0; $i -lt 7; $i++) {
        $n = $Numbers[$i].ToString('00')
        '<div class="ball" data-name="A" data-index="{0}"><p><span class="plain">{1}</span><b>A</b></p></div>' -f $i, $n
    }

    return @"
<li>
  <dt><b>$Issue</b>$issueText($openText`:$Date)</dt>
  <dl>
    $($balls -join "`n    ")
  </dl>
</li>
"@
}

if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force
}
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null

$records = @()
for ($i = 1; $i -le 15; $i++) {
    $records += New-RecordHtml -Issue $i -Date "2025-01-$($i.ToString('00'))" -Numbers @(1, 2, 3, 10, 11, 12, 49)
}
for ($i = 1; $i -le 15; $i++) {
    $records += New-RecordHtml -Issue $i -Date "2026-01-$($i.ToString('00'))" -Numbers @(4, 5, 6, 13, 14, 15, 48)
}

[IO.File]::WriteAllText((Join-Path $pagesDir 'am.html'), "<html><body>$($records -join "`n")</body></html>", $utf8NoBom)

try {
    & $scriptPath -RootDir $outDir | Out-Null

    $recordsPath = Join-Path $outDir 'data\records.json'
    $summaryPath = Join-Path $outDir 'data\dashboard-summary.json'
    $statePath = Join-Path $outDir 'data\three-compound-state.json'
    $indexPath = Join-Path $outDir 'index.html'

    if (-not (Test-Path -LiteralPath $recordsPath)) { throw 'records.json was not created' }
    if (-not (Test-Path -LiteralPath $summaryPath)) { throw 'dashboard-summary.json was not created' }
    if (-not (Test-Path -LiteralPath $statePath)) { throw 'three-compound-state.json was not created' }
    if (-not (Test-Path -LiteralPath $indexPath)) { throw 'index.html was not created' }

    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $am = @($state.items | Where-Object { $_.source -eq 'am' } | Select-Object -First 1)
    if (-not $am) { throw 'am three-compound state was not created' }
    if (@($am.crossYearPools).Count -ne 4) { throw "expected 4 crossYearPools, got $(@($am.crossYearPools).Count)" }

    $html = [IO.File]::ReadAllText($indexPath, [Text.Encoding]::UTF8)
    if ($html.Contains('embedded-records')) {
        throw 'dashboard should not embed records json'
    }
    if (-not $html.Contains("fetch('data/dashboard-summary.json'")) {
        throw 'dashboard should load dashboard summary first'
    }
    if (-not $html.Contains("fetch('data/records.json'")) {
        throw 'dashboard should still be able to load records json externally'
    }
    if (-not $html.Contains("fetch('data/game-predictions.json'")) {
        throw 'dashboard should be able to load game predictions externally'
    }
    if (-not $html.Contains("fetch('data/three-compound-state.json'")) {
        throw 'dashboard should be able to load three-compound state externally'
    }
    if (-not $html.Contains('fullDataTabs')) {
        throw 'dashboard should lazy load full data by tab'
    }
    if (-not $html.Contains('threeCompoundState = await threeResponse.json()')) {
        throw 'dashboard should read lazy-loaded threeCompound state'
    }
    if (-not $html.Contains('threeCrossYearPoolTable')) {
        throw 'dashboard should include cross-year pool table renderer'
    }

    $summaryText = Get-Content -LiteralPath $summaryPath -Raw
    if (-not $summaryText.Contains('"summary"')) { throw 'dashboard summary should include summary' }
    if (-not $summaryText.Contains('"recentRecords"')) { throw 'dashboard summary should include recentRecords' }
    if ($summaryText.Contains('"threeCompound"')) { throw 'dashboard summary should not include threeCompound state' }
    if ($summaryText.Contains('"games"')) { throw 'dashboard summary should not include game predictions' }

    Write-Host 'build three-compound embed ok'
}
finally {
    if (Test-Path -LiteralPath $outDir) {
        Remove-Item -LiteralPath $outDir -Recurse -Force
    }
}

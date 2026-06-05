$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $root 'build-data.ps1'
$outDir = Join-Path $root 'test-sanzhong-output'
$pagesDir = Join-Path $outDir 'pages'
$utf8NoBom = [Text.UTF8Encoding]::new($false)

$yang = [string][char]0x7F8A
$issueText = [string][char]0x671F
$openText = [string]::Concat(@([char]0x5F00, [char]0x5956, [char]0x65F6, [char]0x65F6, [char]0x95F4)) -replace ([string][char]0x65F6 + [string][char]0x65F6), ([string][char]0x65F6)

if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force
}
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null

function New-RecordHtml {
    param([int]$Issue, [string]$Date, [int[]]$Numbers)

    $balls = for ($i = 0; $i -lt 7; $i++) {
        $n = $Numbers[$i].ToString('00')
        '<div class="ball" data-name="{0}" data-index="{1}"><p><span class="red">{2}</span><b>{0}</b></p></div>' -f $yang, $i, $n
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

$records = @()
for ($i = 1; $i -le 36; $i++) {
    $date = ([datetime]'2026-01-01').AddDays($i - 1).ToString('yyyy-MM-dd')
    if ($i % 4 -eq 0) {
        $nums = @(1, 2, 3, 10, 11, 12, 49)
    }
    elseif ($i % 4 -eq 1) {
        $nums = @(4, 5, 6, 13, 14, 15, 48)
    }
    elseif ($i % 4 -eq 2) {
        $nums = @(7, 8, 9, 16, 17, 18, 47)
    }
    else {
        $nums = @(19, 20, 21, 22, 23, 24, 46)
    }
    $records += New-RecordHtml -Issue $i -Date $date -Numbers $nums
}

[IO.File]::WriteAllText((Join-Path $pagesDir 'am.html'), "<html><body>$($records -join "`n")</body></html>", $utf8NoBom)

try {
    & $scriptPath -RootDir $outDir | Out-Null

    $statePath = Join-Path $outDir 'data/three-compound-state.json'
    if (-not (Test-Path -LiteralPath $statePath)) {
        throw 'three-compound-state.json was not created'
    }

    $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $am = @($state.items | Where-Object { $_.source -eq 'am' } | Select-Object -First 1)
    if (-not $am) {
        throw 'am three-compound state was not created'
    }
    $yearPools = @($am.pools)
    $crossYearPools = @($am.crossYearPools)
    $yearSizes = @($yearPools | ForEach-Object { [int]$_.poolSize } | Sort-Object)
    $crossYearSizes = @($crossYearPools | ForEach-Object { [int]$_.poolSize } | Sort-Object)
    if (($yearSizes -join ',') -ne '5,6,7,8') {
        throw "am three-compound year pools should include 5/6/7/8, got $($yearSizes -join ',')"
    }
    if (($crossYearSizes -join ',') -ne '5,6,7,8') {
        throw "am three-compound cross-year pools should include 5/6/7/8, got $($crossYearSizes -join ',')"
    }
    $eightPool = @($yearPools | Where-Object { [int]$_.poolSize -eq 8 } | Select-Object -First 1)
    if (@($eightPool.pool).Count -ne 8) {
        throw 'am three-compound 8-code year pool should include 8 numbers'
    }
    if (@($eightPool.windows).Count -eq 0 -or -not @($eightPool.windows | Where-Object { $_.poolSnapshot })) {
        throw 'am three-compound year pool windows should keep pool snapshots'
    }
    if (@($eightPool.changeHistory).Count -eq 0) {
        throw 'am three-compound change history should be saved'
    }

    $dashboard = [IO.File]::ReadAllText((Join-Path $outDir 'index.html'), [Text.Encoding]::UTF8)
    if (-not $dashboard.Contains('data-tab="threeWindow5"')) {
        throw 'dashboard should render the three-hit five-window tab'
    }
    if (-not $dashboard.Contains('function buildThreeHitCombos(records)')) {
        throw 'dashboard should include three-hit combo coverage analysis'
    }
    if (Test-Path -LiteralPath (Join-Path $outDir 'data/predictions.json')) {
        throw 'predictions.json should not be created'
    }

    Write-Host 'PASS'
}
finally {
    if (Test-Path -LiteralPath $outDir) {
        Remove-Item -LiteralPath $outDir -Recurse -Force
    }
}

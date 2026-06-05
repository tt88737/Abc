param(
    [string]$RootDir = $PSScriptRoot,
    [switch]$Profile
)

$ErrorActionPreference = 'Stop'
$Utf8NoBom = [Text.UTF8Encoding]::new($false)
$BuildProfileRows = New-Object 'System.Collections.Generic.List[object]'

function Invoke-Profiled {
    param(
        [string]$Name,
        [scriptblock]$Script
    )

    $sw = [Diagnostics.Stopwatch]::StartNew()
    try {
        return & $Script
    }
    finally {
        $sw.Stop()
        if ($Profile) {
            $BuildProfileRows.Add([pscustomobject]@{
                stage = $Name
                seconds = [Math]::Round($sw.Elapsed.TotalSeconds, 3)
            }) | Out-Null
        }
    }
}

function Add-ProfileRow {
    param([string]$Name, [double]$Seconds)
    if ($Profile) {
        $BuildProfileRows.Add([pscustomobject]@{
            stage = $Name
            seconds = [Math]::Round($Seconds, 3)
        }) | Out-Null
    }
}

function Write-DataJsonAndJs {
    param(
        [string]$JsonPath,
        [object]$Data,
        [string]$GlobalName,
        [int]$Depth
    )

    $json = ($Data | ConvertTo-Json -Depth $Depth -Compress) -join [Environment]::NewLine
    [IO.File]::WriteAllText($JsonPath, $json, $Utf8NoBom)
    $safeJson = $json -replace '</script', '<\/script'
    $js = "window.$GlobalName = $safeJson;"
    [IO.File]::WriteAllText([IO.Path]::ChangeExtension($JsonPath, '.js'), $js, $Utf8NoBom)
}

function Write-DataJsonTextAndJs {
    param(
        [string]$JsonPath,
        [string]$Json,
        [string]$GlobalName
    )

    [IO.File]::WriteAllText($JsonPath, $Json, $Utf8NoBom)
    $safeJson = $Json -replace '</script', '<\/script'
    $js = "window.$GlobalName = $safeJson;"
    [IO.File]::WriteAllText([IO.Path]::ChangeExtension($JsonPath, '.js'), $js, $Utf8NoBom)
}

function Write-DataJsFromJsonFile {
    param(
        [string]$JsonPath,
        [string]$GlobalName
    )

    if (-not (Test-Path -LiteralPath $JsonPath)) { return }
    $json = [IO.File]::ReadAllText($JsonPath, [Text.Encoding]::UTF8)
    $safeJson = $json -replace '</script', '<\/script'
    $js = "window.$GlobalName = $safeJson;"
    [IO.File]::WriteAllText([IO.Path]::ChangeExtension($JsonPath, '.js'), $js, $Utf8NoBom)
}

function U {
    param([int[]]$Codes)
    return [string]::Concat(($Codes | ForEach-Object { [char]$_ }))
}

function Get-SourceKind {
    param([string]$FileName)
    if ($FileName -match '^hk|^\d{4}1\.html$') { return 'hk' }
    return 'am'
}

function Get-SourceName {
    param([string]$Source)
    if ($Source -eq 'hk') { return (U @(0x9999, 0x6E2F)) }
    return (U @(0x6FB3, 0x95E8))
}

function Get-YearFromFile {
    param(
        [string]$FileName,
        [string]$Html
    )

    if ($FileName -match '^(\d{4})1?\.html$') { return [int]$Matches[1] }
    if ($Html -match '(\d{4})&#24180;' -or $Html -match '(\d{4})\p{IsCJKUnifiedIdeographs}') { return [int]$Matches[1] }
    return $null
}

function Convert-ColorName {
    param([string]$Color)
    switch ($Color) {
        'red' { return (U @(0x7EA2)) }
        'green' { return (U @(0x7EFF)) }
        'blue' { return (U @(0x84DD)) }
        default { return $Color }
    }
}

function Normalize-Zodiac {
    param([string]$Value)

    $decoded = [System.Net.WebUtility]::HtmlDecode($Value.Trim())
    $zodiacs = @(
        (U @(0x9F20)), (U @(0x725B)), (U @(0x864E)), (U @(0x5154)),
        (U @(0x9F99)), (U @(0x86C7)), (U @(0x9A6C)), (U @(0x7F8A)),
        (U @(0x7334)), (U @(0x9E21)), (U @(0x72D7)), (U @(0x732A))
    )
    foreach ($zodiac in $zodiacs) {
        if ($decoded.StartsWith($zodiac)) {
            return $zodiac
        }
    }
    return $decoded
}

function Parse-RecordBlocks {
    param(
        [string]$Html,
        [string]$Source,
        [Nullable[int]]$Year,
        [string]$FileName
    )

    $records = New-Object 'System.Collections.Generic.List[object]'
    $issueText = [regex]::Escape((U @(0x671F)))
    $openText = [regex]::Escape((U @(0x5F00, 0x5956, 0x65F6, 0x95F4)))
    $pattern = '(?is)<li>\s*<dt><b>(\d+)</b>' + $issueText + '\(' + $openText + ':(\d{4}-\d{2}-\d{2})\)</dt>\s*<dl>(.*?)</dl>\s*</li>'

    foreach ($recordMatch in [regex]::Matches($Html, $pattern)) {
        $ballsHtml = $recordMatch.Groups[3].Value
        $balls = New-Object 'System.Collections.Generic.List[object]'
        $ballPattern = '(?is)<div\s+class="ball"[^>]*data-name="([^"]+)"[^>]*data-index="(\d+)"[^>]*>\s*<p>\s*<span\s+class="([^"]+)">(\d+)</span>\s*<b>([^<]+)</b>\s*</p>\s*</div>'

        foreach ($ballMatch in [regex]::Matches($ballsHtml, $ballPattern)) {
            $balls.Add([pscustomobject]@{
                index = [int]$ballMatch.Groups[2].Value
                number = [int]$ballMatch.Groups[4].Value
                numberText = $ballMatch.Groups[4].Value
                color = $ballMatch.Groups[3].Value
                colorName = Convert-ColorName $ballMatch.Groups[3].Value
                zodiac = Normalize-Zodiac $ballMatch.Groups[5].Value
            }) | Out-Null
        }

        if ($balls.Count -eq 7) {
            $records.Add([pscustomobject]@{
                id = ('{0}-{1}-{2}' -f $Source, $recordMatch.Groups[2].Value, $recordMatch.Groups[1].Value)
                source = $Source
                sourceName = Get-SourceName $Source
                year = $Year
                issue = [int]$recordMatch.Groups[1].Value
                date = $recordMatch.Groups[2].Value
                file = $FileName
                balls = @($balls | Sort-Object index)
            }) | Out-Null
        }
    }

    return $records
}

function Get-ParsedPageRecords {
    param(
        [string]$PagesDir,
        [string]$CachePath
    )

    $cachedFiles = @{}
    $cacheRoot = Join-Path (Split-Path -Parent $CachePath) 'page-parse-cache'
    if (Test-Path -LiteralPath $CachePath) {
        try {
            $cache = Get-Content -LiteralPath $CachePath -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($item in @($cache.files)) {
                if ($item.name) { $cachedFiles[[string]$item.name] = $item }
            }
        }
        catch {
            $cachedFiles = @{}
        }
    }

    $allRecords = New-Object 'System.Collections.Generic.List[object]'
    $cacheFiles = New-Object 'System.Collections.Generic.List[object]'
    if (-not (Test-Path -LiteralPath $cacheRoot)) { New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null }
    foreach ($file in (Get-ChildItem -LiteralPath $PagesDir -Filter '*.html' -File)) {
        $length = [int64]$file.Length
        $mtimeUtc = $file.LastWriteTimeUtc.ToString('o')
        $cached = $cachedFiles[[string]$file.Name]
        $records = $null
        $cacheFileName = "$($file.Name).json"
        $cacheFilePath = Join-Path $cacheRoot $cacheFileName
        if ($cached -and [int64]$cached.length -eq $length -and [string]$cached.mtimeUtc -eq $mtimeUtc -and $cached.cacheFile) {
            $candidatePath = Join-Path $cacheRoot ([string]$cached.cacheFile)
            if (Test-Path -LiteralPath $candidatePath) {
                try {
                    $records = @((Get-Content -LiteralPath $candidatePath -Raw -Encoding UTF8 | ConvertFrom-Json).records)
                }
                catch {
                    $records = $null
                }
            }
        }
        if ($null -eq $records) {
            $html = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
            $source = Get-SourceKind $file.Name
            $year = Get-YearFromFile -FileName $file.Name -Html $html
            $records = @(Parse-RecordBlocks -Html $html -Source $source -Year $year -FileName $file.Name)
            $recordJson = ([pscustomobject]@{ records = @($records) } | ConvertTo-Json -Depth 10 -Compress) -join [Environment]::NewLine
            [IO.File]::WriteAllText($cacheFilePath, $recordJson, $Utf8NoBom)
        }
        foreach ($record in @($records)) { $allRecords.Add($record) | Out-Null }
        $cacheFiles.Add([pscustomobject]@{
            name = $file.Name
            length = $length
            mtimeUtc = $mtimeUtc
            cacheFile = $cacheFileName
        }) | Out-Null
    }

    $cacheDir = Split-Path -Parent $CachePath
    if (-not (Test-Path -LiteralPath $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null }
    $cacheJson = ([pscustomobject]@{ files = $cacheFiles.ToArray() } | ConvertTo-Json -Depth 10 -Compress) -join [Environment]::NewLine
    [IO.File]::WriteAllText($CachePath, $cacheJson, $Utf8NoBom)
    return $allRecords
}

function Get-Counts {
    param(
        [object[]]$Items,
        [scriptblock]$Selector
    )

    $counts = @{}
    foreach ($item in $Items) {
        $key = & $Selector $item
        if ([string]::IsNullOrWhiteSpace([string]$key)) { continue }
        if (-not $counts.ContainsKey($key)) { $counts[$key] = 0 }
        $counts[$key]++
    }

    return @(
        foreach ($key in $counts.Keys) {
            [pscustomobject]@{ name = $key; count = $counts[$key] }
        }
    ) | Sort-Object -Property @{ Expression = 'count'; Descending = $true }, @{ Expression = 'name'; Descending = $false }
}

function Get-Summary {
    param([object[]]$Records)

    $allBalls = @($Records | ForEach-Object { $_.balls })
    $latest = @($Records | Sort-Object @{ Expression = 'date'; Descending = $true }, @{ Expression = 'issue'; Descending = $true } | Select-Object -First 1)
    $bySource = @{}
    foreach ($source in @('am', 'hk')) {
        $sourceRecords = @($Records | Where-Object { $_.source -eq $source })
        $sourceBalls = @($sourceRecords | ForEach-Object { $_.balls })
        $sourceLatest = @($sourceRecords | Sort-Object @{ Expression = 'date'; Descending = $true }, @{ Expression = 'issue'; Descending = $true } | Select-Object -First 1)
        $bySource[$source] = [pscustomobject]@{
            source = $source
            sourceName = Get-SourceName $source
            totalRecords = $sourceRecords.Count
            totalBalls = $sourceBalls.Count
            years = Get-Counts $sourceRecords { param($r) [string]$r.year }
            numbers = Get-Counts $sourceBalls { param($b) $b.numberText }
            zodiacs = Get-Counts $sourceBalls { param($b) $b.zodiac }
            colors = Get-Counts $sourceBalls { param($b) $b.colorName }
            latest = if ($sourceLatest.Count -gt 0) { $sourceLatest[0] } else { $null }
        }
    }

    return [pscustomobject]@{
        generatedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
        totalRecords = $Records.Count
        totalBalls = $allBalls.Count
        bySource = $bySource
        sources = Get-Counts $Records { param($r) $r.sourceName }
        years = Get-Counts $Records { param($r) [string]$r.year }
        numbers = Get-Counts $allBalls { param($b) $b.numberText }
        zodiacs = Get-Counts $allBalls { param($b) $b.zodiac }
        colors = Get-Counts $allBalls { param($b) $b.colorName }
        latest = if ($latest.Count -gt 0) { $latest[0] } else { $null }
    }
}

function Get-LatestRecord {
    param([object[]]$Records, [string]$Source)
    return @($Records | Where-Object { $_.source -eq $Source } | Sort-Object @{ Expression = 'date'; Descending = $true }, @{ Expression = 'issue'; Descending = $true } | Select-Object -First 1)[0]
}

function Get-Window5RawWindows {
    param([object[]]$Rows)

    if (@($Rows).Count -eq 0) { return @() }
    $maxIssue = @($Rows | ForEach-Object { [int]$_.issue } | Measure-Object -Maximum).Maximum
    $windows = @()
    for ($start = 1; $start -le $maxIssue; $start += 5) {
        $end = $start + 4
        $chunk = @($Rows | Where-Object { [int]$_.issue -ge $start -and [int]$_.issue -le $end })
        if ($chunk.Count -eq 0) { continue }
        $nums = @($chunk | ForEach-Object { ([int]$_.balls[6].numberText).ToString('00') } | Select-Object -Unique)
        $windows += [pscustomobject]@{ start = $start; end = $end; nums = $nums }
    }
    return $windows
}

function Get-GreedyWindow5Pool {
    param([object[]]$Windows)

    $maxPoolSize = 8
    $selected = New-Object 'System.Collections.Generic.List[string]'
    $uncovered = New-Object 'System.Collections.Generic.List[int]'
    for ($i = 0; $i -lt @($Windows).Count; $i++) { $uncovered.Add($i) | Out-Null }
    while ($uncovered.Count -gt 0 -and $selected.Count -lt $maxPoolSize) {
        $bestNum = ''
        $bestGain = -1
        foreach ($n in 1..49) {
            $num = $n.ToString('00')
            if ($selected.Contains($num)) { continue }
            $gain = 0
            foreach ($idx in @($uncovered)) {
                if (@($Windows[$idx].nums) -contains $num) { $gain++ }
            }
            if ($gain -gt $bestGain) {
                $bestGain = $gain
                $bestNum = $num
            }
        }
        if ($bestGain -le 0 -or [string]::IsNullOrWhiteSpace($bestNum)) { break }
        $selected.Add($bestNum) | Out-Null
        foreach ($idx in @($uncovered.ToArray())) {
            if (@($Windows[$idx].nums) -contains $bestNum) { $uncovered.Remove($idx) | Out-Null }
        }
    }
    return @($selected)
}

function Get-StableWindow5Pool {
    param([object[]]$SourceRows, [string]$CurrentYear)

    $freq = @{}
    $years = @($SourceRows | Where-Object { ([string]$_.date).Length -ge 4 -and -not ([string]$_.date).StartsWith($CurrentYear + '-') } | ForEach-Object { ([string]$_.date).Substring(0, 4) } | Sort-Object -Unique)
    foreach ($year in $years) {
        $rows = @($SourceRows | Where-Object { ([string]$_.date).StartsWith($year + '-') } | Sort-Object @{ Expression = 'issue'; Descending = $false })
        $pool = @(Get-GreedyWindow5Pool -Windows (Get-Window5RawWindows -Rows $rows))
        foreach ($num in $pool) {
            if (-not $freq.ContainsKey($num)) { $freq[$num] = 0 }
            $freq[$num]++
        }
    }
    $take = 15
    if ($freq.Count -lt $take) {
        foreach ($row in $SourceRows) {
            $num = ([int]$row.balls[6].numberText).ToString('00')
            if (-not $freq.ContainsKey($num)) { $freq[$num] = 0 }
            $freq[$num]++
        }
    }
    return @($freq.GetEnumerator() | Sort-Object @{ Expression = 'Value'; Descending = $true }, @{ Expression = { [int]$_.Key }; Descending = $false } | Select-Object -First $take | ForEach-Object { $_.Key })
}

function Get-Window5CoverageScore {
    param([object[]]$Rows, [string[]]$Pool)

    $windows = @(Get-Window5RawWindows -Rows $Rows)
    $completed = @($windows | Where-Object { [int]$_.count -ge 5 })
    $covered = 0
    $hitDraws = 0
    foreach ($win in $completed) {
        $hit = $false
        foreach ($num in @($win.nums)) {
            if ($Pool -contains ([int]$num).ToString('00')) {
                $hit = $true
                $hitDraws++
            }
        }
        if ($hit) { $covered++ }
    }
    $recent = @($completed | Select-Object -Last 10)
    $recentCovered = 0
    foreach ($win in $recent) {
        foreach ($num in @($win.nums)) {
            if ($Pool -contains ([int]$num).ToString('00')) {
                $recentCovered++
                break
            }
        }
    }
    [pscustomobject]@{
        covered = $covered
        hitDraws = $hitDraws
        recentCovered = $recentCovered
        total = $completed.Count
    }
}

function Compare-Window5PoolScore {
    param([object]$A, [object]$B)

    if ($null -eq $B) { return 1 }
    $aTuple = @([int]$A.covered, [int]$A.hitDraws, [int]$A.recentCovered)
    $bTuple = @([int]$B.covered, [int]$B.hitDraws, [int]$B.recentCovered)
    for ($i = 0; $i -lt $aTuple.Count; $i++) {
        if ($aTuple[$i] -gt $bTuple[$i]) { return 1 }
        if ($aTuple[$i] -lt $bTuple[$i]) { return -1 }
    }
    return 0
}

function Get-OptimizedStableWindow5Pool {
    param([object[]]$YearRows, [string[]]$BasePool, [int]$Size = 15)

    $freq = @{}
    $colorRank = @{}
    $tailRank = @{}
    foreach ($row in @($YearRows)) {
        if ($null -eq $row.balls -or @($row.balls).Count -lt 7) { continue }
        $ball = $row.balls[6]
        $num = ([int]$ball.numberText).ToString('00')
        if (-not $freq.ContainsKey($num)) { $freq[$num] = @{ num = $num; color = [string]$ball.color; count = 0 } }
        $freq[$num].count++
        $tail = $num.Substring($num.Length - 1, 1)
        if (-not $tailRank.ContainsKey($tail)) { $tailRank[$tail] = 0 }
        $tailRank[$tail]++
        $color = [string]$ball.color
        if (-not $colorRank.ContainsKey($color)) { $colorRank[$color] = 0 }
        $colorRank[$color]++
    }
    $baseSet = @{}
    foreach ($num in @($BasePool)) { $baseSet[([int]$num).ToString('00')] = $true }
    $scored = foreach ($n in 1..49) {
        $num = $n.ToString('00')
        $item = if ($freq.ContainsKey($num)) { $freq[$num] } else { @{ num = $num; color = ''; count = 0 } }
        $tail = $num.Substring($num.Length - 1, 1)
        $tailScore = if ($tailRank.ContainsKey($tail)) { [double]$tailRank[$tail] } else { 0 }
        $colorKey = [string]$item.color
        $colorScore = if ($colorRank.ContainsKey($colorKey)) { [double]$colorRank[$colorKey] } else { 0 }
        $score = [double]$item.count * 8 + $tailScore * 3 + $colorScore * 2
        if ($baseSet.ContainsKey($num)) { $score += 20 }
        [pscustomobject]@{ num = $num; score = $score; tail = $tail }
    }
    $selected = New-Object 'System.Collections.Generic.List[string]'
    $tailCounts = @{}
    foreach ($item in @($scored | Sort-Object @{ Expression = 'score'; Descending = $true }, @{ Expression = { [int]$_.num }; Descending = $false })) {
        if ($selected.Count -ge $Size) { break }
        $currentTailCount = if ($tailCounts.ContainsKey($item.tail)) { [int]$tailCounts[$item.tail] } else { 0 }
        if ($currentTailCount -ge 2) { continue }
        $selected.Add($item.num) | Out-Null
        $tailCounts[$item.tail] = $currentTailCount + 1
    }
    foreach ($item in @($scored | Sort-Object @{ Expression = 'score'; Descending = $true }, @{ Expression = { [int]$_.num }; Descending = $false })) {
        if ($selected.Count -ge $Size) { break }
        if (-not $selected.Contains($item.num)) { $selected.Add($item.num) | Out-Null }
    }
    return @($selected | Select-Object -First $Size)
}

function New-Window5State {
    param([object[]]$Records, [object]$Existing = $null, [string]$GeneratedAt = '')

    $items = @(
        foreach ($source in @('am', 'hk')) {
            $sourceRows = @($Records | Where-Object { $_.source -eq $source -and -not [string]::IsNullOrWhiteSpace([string]$_.date) })
            if ($sourceRows.Count -eq 0) { continue }
            $latest = @($sourceRows | Sort-Object @{ Expression = 'date'; Descending = $true }, @{ Expression = 'issue'; Descending = $true } | Select-Object -First 1)[0]
            $year = ([string]$latest.date).Substring(0, 4)
            $yearRows = @($sourceRows | Where-Object { ([string]$_.date).StartsWith($year + '-') } | Sort-Object @{ Expression = 'issue'; Descending = $false })
            $pool = @(Get-GreedyWindow5Pool -Windows (Get-Window5RawWindows -Rows $yearRows) | Select-Object -First 8)
            $existingItem = @($Existing.items | Where-Object { $_.source -eq $source -and [string]$_.year -eq $year } | Select-Object -First 1)
            $oldPool = if ($existingItem.Count -gt 0) { @($existingItem[0].yearPool | Select-Object -First 8 | ForEach-Object { ([int]$_).ToString('00') }) } else { @() }
            $changed = ($pool -join ',') -ne ($oldPool -join ',')
            $changeTime = if ($changed -or $existingItem.Count -eq 0 -or [string]::IsNullOrWhiteSpace([string]$existingItem[0].changeTime)) { $GeneratedAt } else { [string]$existingItem[0].changeTime }
            $interval = if ($source -eq 'hk') { 10 } else { 20 }
            $latestIssue = [int]$latest.issue
            $oldHistory = if ($existingItem.Count -gt 0 -and $null -ne $existingItem[0].yearPoolHistory) { @($existingItem[0].yearPoolHistory) } else { @() }
            $yearPoolHistory = @($oldHistory)
            if ($changed) {
                $addedPoolNumbers = @($pool | Where-Object { $oldPool -notcontains $_ })
                $removedPoolNumbers = @($oldPool | Where-Object { $pool -notcontains $_ })
                $yearPoolHistory = @(
                    [pscustomobject]@{
                        changedAt = $GeneratedAt
                        source = $source
                        year = $year
                        issue = $latestIssue
                        beforePool = @($oldPool)
                        afterPool = @($pool)
                        added = @($addedPoolNumbers)
                        removed = @($removedPoolNumbers)
                        reason = if ($oldPool.Count -eq 0) { 'initial-year-pool' } else { 'year-pool-changed-after-draw' }
                    }
                    $yearPoolHistory
                ) | Select-Object -First 30
            }
            $latestHistoryIssue = if ($yearPoolHistory.Count -gt 0 -and $null -ne $yearPoolHistory[0].issue) { [int]$yearPoolHistory[0].issue } else { 0 }
            $hasLatestIssueChange = -not $changed -and $latestHistoryIssue -eq $latestIssue
            $oldStablePool = if ($existingItem.Count -gt 0 -and $null -ne $existingItem[0].stablePool) { @($existingItem[0].stablePool | Where-Object { [int]$_ -ge 1 } | Select-Object -First 15 | ForEach-Object { ([int]$_).ToString('00') }) } else { @() }
            $oldStableIssue = if ($existingItem.Count -gt 0 -and $null -ne $existingItem[0].stablePoolLastIssue) { [int]$existingItem[0].stablePoolLastIssue } else { 0 }
            $nextRecalcIssue = if ($oldStableIssue -gt 0) { $oldStableIssue + $interval } else { [Math]::Ceiling($latestIssue / $interval) * $interval }
            $shouldRecalcStable = $existingItem.Count -eq 0 -or $oldStablePool.Count -lt 15 -or $latestIssue -ge $nextRecalcIssue -or [string]$existingItem[0].year -ne $year
            $stableOptimizationStatus = 'not-triggered'
            $stableOptimizationReason = 'stable-pool-recalc-not-triggered'
            if ($shouldRecalcStable) {
                $baseStablePool = @(Get-StableWindow5Pool -SourceRows $sourceRows -CurrentYear $year | Select-Object -First 15)
                $optimizedStablePool = @(Get-OptimizedStableWindow5Pool -YearRows $yearRows -BasePool $baseStablePool -Size 15)
                $baseScore = Get-Window5CoverageScore -Rows $yearRows -Pool $baseStablePool
                $optimizedScore = Get-Window5CoverageScore -Rows $yearRows -Pool $optimizedStablePool
                if ((Compare-Window5PoolScore -A $optimizedScore -B $baseScore) -gt 0) {
                    $newStablePool = @($optimizedStablePool)
                    $stableOptimizationStatus = 'optimized'
                    $stableOptimizationReason = 'optimized-pool-better'
                } else {
                    $newStablePool = @($baseStablePool)
                    $stableOptimizationStatus = 'original-better'
                    $stableOptimizationReason = 'original-pool-better'
                }
            } else {
                $newStablePool = @($oldStablePool | Select-Object -First 15)
            }
            $stableChanged = ($newStablePool -join ',') -ne ($oldStablePool -join ',')
            $stableChangeTime = if ($stableChanged -or $existingItem.Count -eq 0 -or [string]::IsNullOrWhiteSpace([string]$existingItem[0].stablePoolChangeTime)) { $GeneratedAt } else { [string]$existingItem[0].stablePoolChangeTime }
            [pscustomobject]@{
                source = $source
                year = $year
                yearPool = $pool
                adjustmentStatus = if ($changed -or $hasLatestIssueChange) { 'changed' } else { 'no-change' }
                adjustmentReason = if ($changed -or $hasLatestIssueChange) { 'year-pool-adjusted-after-latest-draw' } else { 'year-pool-same-as-previous' }
                changeTime = $changeTime
                yearPoolHistory = @($yearPoolHistory)
                stablePool = @($newStablePool)
                stablePoolStatus = if (-not $shouldRecalcStable) { 'not-triggered' } elseif ($stableChanged) { 'changed' } else { 'no-change' }
                stablePoolReason = if (-not $shouldRecalcStable) { 'stable-pool-recalc-not-triggered' } else { 'stable-pool-recalculated-by-interval' }
                stablePoolOptimizationStatus = $stableOptimizationStatus
                stablePoolOptimizationReason = $stableOptimizationReason
                stablePoolChangeTime = $stableChangeTime
                stablePoolLastIssue = if ($shouldRecalcStable) { $latestIssue } else { $oldStableIssue }
                stablePoolNextRecalcIssue = if ($shouldRecalcStable) { $latestIssue + $interval } else { $nextRecalcIssue }
                computedAt = $GeneratedAt
            }
        }
    )

    return [pscustomobject]@{ generatedAt = $GeneratedAt; items = $items }
}

function New-DashboardSummary {
    param(
        [object]$Summary,
        [object[]]$Records
    )

    $recentRecords = @(
        foreach ($source in @('am', 'hk')) {
            [pscustomobject]@{
                source = $source
                records = @($Records | Where-Object { $_.source -eq $source } | Select-Object -First 20)
            }
        }
    )

    return [pscustomobject]@{
        summary = $Summary
        recentRecords = $recentRecords
    }
}

function New-DashboardHtml {
    $html = @'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>&#24320;&#22870;&#35760;&#24405;&#25968;&#25454;&#30475;&#26495;</title>
  <style>
    :root { color-scheme: light; font-family: "Microsoft YaHei", Arial, sans-serif; }
    body { margin: 0; background: #f4f5f7; color: #1f2933; }
    header { background: #0b42d8; color: #fff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
    header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    header a { color: #fff; text-decoration: none; font-size: 14px; }
    main { max-width: 1180px; margin: 0 auto; padding: 16px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .tabs button { border: 1px solid #cbd5e1; background: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
    .tabs button.active { background: #0b42d8; color: #fff; border-color: #0b42d8; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .panel { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; padding: 14px; }
    .panel h2 { margin: 0 0 10px; font-size: 16px; }
    .metric { font-size: 28px; font-weight: 800; }
    .muted { color: #667085; font-size: 13px; }
    .wide { grid-column: span 2; }
    .full { grid-column: 1 / -1; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
    .balls { display: flex; gap: 6px; flex-wrap: wrap; }
    .ball { min-width: 34px; padding: 4px 6px; color: #fff; border-radius: 4px; text-align: center; font-weight: 700; }
    .compact-table { table-layout: fixed; font-size: 13px; }
    .compact-table th, .compact-table td { padding: 7px 6px; }
    .compact-table .col-time { width: 112px; }
    .compact-table .col-source { width: 42px; }
    .compact-table .col-issue { width: 76px; }
    .compact-table .col-result { width: 56px; }
    .compact-table .col-draw { width: 176px; }
    .compact-balls { gap: 4px; align-items: flex-start; }
    .compact-balls .ball { min-width: 28px; padding: 3px 5px; line-height: 1.15; }
    .copy-qr { display: grid; grid-template-columns: 1fr 132px; gap: 12px; align-items: center; margin: 8px 0 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
    .copy-qr strong { display: block; margin-bottom: 6px; font-size: 13px; }
    .copy-qr code { display: block; white-space: normal; word-break: break-all; font-family: Consolas, "Microsoft YaHei", sans-serif; font-size: 13px; }
    .copy-qr img { width: 120px; height: 120px; border: 1px solid #d9dee7; background: #fff; padding: 5px; border-radius: 6px; }
    .history-list { display: grid; gap: 8px; }
    .history-group { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow: hidden; }
    .history-group summary { display: grid; grid-template-columns: 1fr 150px 110px; gap: 12px; align-items: center; padding: 10px 12px; cursor: pointer; font-size: 13px; font-weight: 700; list-style-position: inside; }
    .history-group[open] summary { border-bottom: 1px solid #e5e7eb; background: #f8fafc; }
    .history-group table { margin: 0; }
    .table-scroll { width: 100%; overflow-x: auto; }
    .table-scroll table { min-width: 1040px; }
    .change-summary { display: grid; gap: 6px; }
    .change-summary-row { display: grid; grid-template-columns: 42px 1fr; gap: 6px; align-items: start; }
    .change-summary-label { color: #667085; font-size: 12px; line-height: 22px; }
    .change-detail summary, .change-history-all summary { cursor: pointer; color: #0b42d8; font-weight: 700; }
    .change-detail[open] summary, .change-history-all[open] summary { margin-bottom: 8px; }
    .change-detail .mini-grid { grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; min-width: 680px; }
    .change-detail .muted { margin: 0 0 4px; }
    .change-history-all { margin-top: 10px; }
    .trail{display:flex;flex-wrap:wrap;gap:3px;max-width:220px}
    .trail i{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;font-style:normal;font-size:12px;color:#fff}
    .trail .hit{background:#078a16}
    .trail .miss{background:#b8c0cc;color:#1f2937}
    .red { background: #ef1010; }
    .green { background: #07860a; }
    .blue { background: #0617f2; }
    .rank { display: grid; gap: 8px; }
    .bar { display: grid; grid-template-columns: 58px 1fr 42px; gap: 8px; align-items: center; }
    .bar-track { background: #eef2f7; border-radius: 999px; overflow: hidden; height: 10px; }
    .bar-fill { background: #0b42d8; height: 100%; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; align-items: end; }
    .filters label { display: grid; gap: 4px; font-size: 13px; color: #475467; }
    select, input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 7px 9px; background: #fff; min-width: 120px; }
    .mini { font-size: 12px; color: #667085; }
    .num-grid { display: grid; grid-template-columns: repeat(7, minmax(42px, 1fr)); gap: 8px; max-width: 520px; }
    .num-grid input { min-width: 0; text-align: center; font-weight: 700; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .primary { border:1px solid #0b42d8; background:#0b42d8; color:#fff; padding:9px 14px; border-radius:6px; cursor:pointer; }
    .secondary { border:1px solid #cbd5e1; background:#fff; color:#1f2933; padding:9px 14px; border-radius:6px; cursor:pointer; }
    .detail-placeholder { padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; }
    .result-hit { color: #07860a; font-weight: 800; }
    .result-miss { color: #dc2626; font-weight: 800; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } .copy-qr { grid-template-columns: 1fr; } .history-group summary { grid-template-columns: 1fr; } .change-summary-row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>&#24320;&#22870;&#35760;&#24405;&#25968;&#25454;&#30475;&#26495;</h1>
    <a href="kjjl.html">&#36820;&#22238;&#24320;&#22870;&#35760;&#24405;</a>
  </header>
  <main>
    <nav class="tabs">
      <button class="active" data-tab="window5">5&#26399;&#31383;&#21475;</button>
      <button data-tab="threeWindow5">&#19977;&#20013;&#19977;5&#26399;&#31383;&#21475;</button>
      <button data-tab="historyPattern">&#21382;&#21490;&#35268;&#24459;&#35266;&#23519;</button>
      <button data-tab="patternWatch">&#39640;&#32423;&#20998;&#26512;</button>
      <button data-tab="manualFetch">&#25163;&#21160;&#37319;&#38598;</button>
    </nav>
    <section id="app"></section>
  </main>
  <script>
    const app = document.getElementById('app');
    const tabs = document.querySelectorAll('.tabs button');
    const isFileDashboard = location.protocol === 'file:';
    let records = [];
    let recentRecords = [];
    let summary = null;
    let window5State = {items: []};
    let threeCompoundState = {items: []};
    const threeWindowAnalysisCache = new Map();
    const threeWindowHtmlCache = new Map();
    const dashboardCacheVersion = String(Date.now());
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const pct = (value, max) => max ? Math.round(value / max * 100) : 0;
    function rankHtml(items, limit = 10) {
      const top = (items || []).slice(0, limit);
      const max = top[0]?.count || 1;
      return `<div class="rank">${top.map(item => `<div class="bar"><strong>${esc(item.name)}</strong><div class="bar-track"><div class="bar-fill" style="width:${pct(item.count, max)}%"></div></div><span>${item.count}</span></div>`).join('')}</div>`;
    }
    function ballsHtml(balls, compact = false) {
      return `<div class="balls ${compact ? 'compact-balls' : ''}">${balls.map(ball => `<span class="ball ${esc(ball.color)}">${esc(ball.numberText)}<br>${esc(ball.zodiac)}</span>`).join('')}</div>`;
    }
    const zodiacList = ['\u9f20','\u725b','\u864e','\u5154','\u9f99','\u86c7','\u9a6c','\u7f8a','\u7334','\u9e21','\u72d7','\u732a'];
    function zodiacOptions() {
      return `<option value="all">&#20840;&#37096;</option>${zodiacList.map(z => `<option value="${esc(z)}">${esc(z)}</option>`).join('')}`;
    }
    function uniq(values) { return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ''))].sort(); }
    function flattenBalls(list) { return list.flatMap((record, order) => record.balls.map(ball => ({...ball, record, order}))); }
    function sourceRecords(source) {
      const sourceRows = records.length ? records : recentRecords;
      return sourceRows.filter(r => r.source === source);
    }
    function sourceSummary(source) { return summary.bySource?.[source] || {}; }
    function displayYear(record) {
      const dateText = String(record?.date || '');
      return dateText.length >= 4 ? dateText.slice(0, 4) : String(record?.year || '');
    }
    const sourceRecordCache = {};
    const sanZhongCache = {};
    const maxMissLimit = 6;
    function cachedSourceRecords(source) {
      if (!sourceRecordCache[source]) sourceRecordCache[source] = sourceRecords(source);
      return sourceRecordCache[source];
    }
    function sourceOptions(selected = 'am') {
      return `<option value="am" ${selected === 'am' ? 'selected' : ''}>&#28595;&#38376;</option><option value="hk" ${selected === 'hk' ? 'selected' : ''}>&#39321;&#28207;</option>`;
    }
    const statusTextMap = {
      'changed': '&#26377;&#21464;&#26356;',
      'no-change': '&#26080;&#21464;&#26356;',
      'not-triggered': '&#26410;&#35302;&#21457;',
      'optimized': '&#24050;&#20248;&#21270;',
      'original-better': '&#21407;&#27744;&#26356;&#20248;',
      'initial-year-pool': '&#39318;&#27425;&#29983;&#25104;&#24403;&#24180;&#35206;&#30422;&#27744;',
      'year-pool-changed-after-draw': '&#26368;&#26032;&#24320;&#22870;&#21518;&#24403;&#24180;&#35206;&#30422;&#27744;&#21457;&#29983;&#21464;&#21270;',
      'year-pool-adjusted-after-latest-draw': '&#26368;&#26032;&#24320;&#22870;&#21518;&#24403;&#24180;&#35206;&#30422;&#27744;&#24050;&#35843;&#25972;',
      'year-pool-same-as-previous': '&#26412;&#27425;&#37325;&#31639;&#19982;&#19978;&#27425;&#19968;&#33268;',
      'stable-pool-recalc-not-triggered': '&#26410;&#21040;&#37325;&#31639;&#26465;&#20214;&#65292;&#27839;&#29992;&#19978;&#27425;&#36328;&#24180;&#31283;&#23450;&#27744;',
      'stable-pool-recalculated-by-interval': '&#24050;&#25353;&#21608;&#26399;&#35268;&#21017;&#37325;&#31639;&#36328;&#24180;&#31283;&#23450;&#27744;',
      'optimized-pool-better': '&#20248;&#21270;&#27744;&#26356;&#20248;',
      'original-pool-better': '&#21407;&#27744;&#26356;&#20248;'
      ,'initial': '&#39318;&#27425;&#29983;&#25104;'
      ,'normal-observe': '&#27491;&#24120;&#35266;&#23519;'
      ,'downrank-observe': '&#38477;&#26435;&#35266;&#23519;'
      ,'trigger-recalc': '&#35302;&#21457;&#37325;&#31639;'
      ,'compound-window-stable': '&#23436;&#25972;&#31383;&#21475;&#35206;&#30422;&#34920;&#29616;&#31283;&#23450;'
      ,'two-completed-window-misses': '&#36830;&#32493;&#23436;&#25972;&#28431;&#31383;&#36798;&#21040;2&#20010;'
      ,'current-miss-exceeds-historical-max': '&#24403;&#21069;&#23436;&#25972;&#28431;&#31383;&#36229;&#36807;&#21382;&#21490;&#26368;&#22823;&#28431;&#31383;'
      ,'recent-coverage-below-year': '&#36817;10&#23436;&#25972;&#31383;&#21475;&#35206;&#30422;&#29575;&#26126;&#26174;&#20302;&#20110;&#20840;&#24180;'
      ,'medium-change': '&#20013;&#31561;&#21464;&#21270;'
      ,'rebuild': '&#37325;&#26500;'
      ,'better-completed-window-coverage-pool': '&#21457;&#29616;&#26356;&#20248;&#23436;&#25972;&#31383;&#21475;&#35206;&#30422;&#27744;'
      ,'initial-three-compound-pool': '&#39318;&#27425;&#29983;&#25104;&#19977;&#20013;&#19977;&#22797;&#24335;&#27744;'
      ,'better-all-history-compound-pool': '&#21457;&#29616;&#26356;&#20248;&#20840;&#37096;&#21382;&#21490;&#36328;&#24180;&#22797;&#24335;&#27744;'
      ,'initial-cross-year-compound-pool': '&#39318;&#27425;&#29983;&#25104;&#36328;&#24180;&#22797;&#24335;&#27744;'
    };
    function statusText(value) {
      return statusTextMap[value] || esc(value || '-');
    }
    function asArray(value) {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined || value === '') return [];
      return [value];
    }
    function normalizeNumberGroup(value) {
      if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.value)) return value.value;
      return asArray(value);
    }
    function numberChips(nums) {
      return `<div class="balls compact-balls">${normalizeNumberGroup(nums).map(n => `<span class="ball blue">${esc(String(Number(n)).padStart(2, '0'))}</span>`).join('')}</div>`;
    }
    const window5Pools = {
      hk: {stablePool: ['02','01','04','08','03','07','10','11','13','24','34','39','40','42','44']},
      am: {stablePool: ['08','01','05','06','09','10','12','20','23','30','02','03','24']}
    };
    function specialNum(record) {
      return String(Number(record?.balls?.[6]?.numberText || 0)).padStart(2, '0');
    }
    function completeSpecialPool8(pool, rows) {
      const selected = [];
      normalizedPool(pool).forEach(num => {
        if (selected.length < 8 && !selected.includes(num)) selected.push(num);
      });
      const counts = new Map();
      asArray(rows).forEach(row => {
        const num = specialNum(row);
        if (!num || num === '00') return;
        counts.set(num, (counts.get(num) || 0) + 1);
      });
      [...counts.entries()].sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0])).forEach(([num]) => {
        if (selected.length < 8 && !selected.includes(num)) selected.push(num);
      });
      for (let n = 1; selected.length < 8 && n <= 49; n++) {
        const num = String(n).padStart(2, '0');
        if (!selected.includes(num)) selected.push(num);
      }
      return selected.slice(0, 8);
    }
    function fiveWindowCoverage(rows, pool) {
      if (!rows.length) return [];
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const poolSet = new Set(pool);
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        const hits = chunk.filter(row => poolSet.has(specialNum(row))).map(row => ({issue: row.issue, date: row.date, num: specialNum(row)}));
        windows.push({start, end, count: chunk.length, hits, covered: hits.length > 0});
      }
      return windows;
    }
    function normalizedPool(nums) {
      return asArray(nums).map(num => String(Number(num)).padStart(2, '0')).filter(num => num !== '00');
    }
    function poolSnapshotForWindow(currentPool, history, windowStart) {
      let snapshot = normalizedPool(currentPool);
      const changes = asArray(history).slice().sort((a, b) => Number(b.issue || 0) - Number(a.issue || 0));
      changes.forEach(change => {
        if (Number(windowStart || 0) <= Number(change.issue || 0) && Array.isArray(change.beforePool) && change.beforePool.length) {
          snapshot = normalizedPool(change.beforePool);
        }
      });
      return snapshot;
    }
    function fiveWindowCoverageSnapshots(rows, currentPool, history) {
      if (!rows.length) return [];
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        const poolSnapshot = poolSnapshotForWindow(currentPool, history, start);
        const poolSet = new Set(poolSnapshot);
        const hits = chunk.filter(row => poolSet.has(specialNum(row))).map(row => ({issue: row.issue, date: row.date, num: specialNum(row)}));
        windows.push({start, end, count: chunk.length, poolSnapshot, hits, covered: hits.length > 0});
      }
      return windows;
    }
    function nextOpenWindowStart(latestIssue, windows, size = 5) {
      const issue = Number(latestIssue || 0);
      if (!issue) return 1;
      const start = Math.floor((issue - 1) / size) * size + 1;
      const current = asArray(windows).find(item => Number(item.start || 0) === start);
      if (current && Number(current.count || 0) >= size) return start + size;
      return start;
    }
    const maxWindow5PoolSize = 8;
    const maxStableWindow5PoolSize = 15;
    function greedyFiveWindowPool(windows) {
      const allNums = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
      const uncovered = new Set(windows.map((_, idx) => idx));
      const selected = [];
      while (uncovered.size > 0) {
        if (selected.length >= maxWindow5PoolSize) break;
        let best = null;
        allNums.forEach(num => {
          if (selected.includes(num)) return;
          let gain = 0;
          uncovered.forEach(idx => {
            if (windows[idx].nums.has(num)) gain++;
          });
          if (!best || gain > best.gain || (gain === best.gain && Number(num) < Number(best.num))) best = {num, gain};
        });
        if (!best || best.gain <= 0) break;
        selected.push(best.num);
        [...uncovered].forEach(idx => {
          if (windows[idx].nums.has(best.num)) uncovered.delete(idx);
        });
      }
      return selected;
    }
    function fiveWindowRawWindows(rows) {
      if (!rows.length) return [];
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        windows.push({start, end, count: chunk.length, nums: new Set(chunk.map(specialNum))});
      }
      return windows;
    }
    function fiveWindowAnalysis(source) {
      if (!records.length && window5State?.items?.length) {
        const stateItems = (window5State.items || []).filter(item => item.source === source);
        const stateItem = stateItems.slice().sort((a, b) => Number(b.stablePoolLastIssue || 0) - Number(a.stablePoolLastIssue || 0))[0];
        const latest = sourceSummary(source).latest || {};
        const latestIssue = Number(latest.issue || stateItem?.stablePoolLastIssue || 0);
        const currentYear = String(stateItem?.year || displayYear(latest) || '');
        const currentStart = nextOpenWindowStart(latestIssue, [], 5);
        const currentWindow = {start: currentStart, end: currentStart + 4, count: latestIssue ? Math.min(5, latestIssue - currentStart + 1) : 0, hits: [], covered: false};
        return {
          source,
          latest,
          currentYear,
          currentWindow,
          yearPool: (stateItem?.yearPool || []).slice(0, 8),
          stablePool: (stateItem?.stablePool || (window5Pools[source] || window5Pools.am).stablePool || []).slice(0, maxStableWindow5PoolSize),
          yearWindows: [],
          stableWindows: [],
          yearly: [],
          adjustmentStatus: stateItem?.adjustmentStatus || 'not-triggered',
          adjustmentReason: stateItem?.adjustmentReason || '',
          changeTime: stateItem?.changeTime || '',
          yearPoolHistory: Array.isArray(stateItem?.yearPoolHistory) ? stateItem.yearPoolHistory : [],
          stablePoolStatus: stateItem?.stablePoolStatus || 'not-triggered',
          stablePoolReason: stateItem?.stablePoolReason || '',
          stablePoolOptimizationStatus: stateItem?.stablePoolOptimizationStatus || '',
          stablePoolOptimizationReason: stateItem?.stablePoolOptimizationReason || '',
          stablePoolChangeTime: stateItem?.stablePoolChangeTime || '',
          stablePoolNextRecalcIssue: stateItem?.stablePoolNextRecalcIssue || ''
        };
      }
      const sourceRows = cachedSourceRecords(source).slice().sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      const latest = sourceRows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.issue || 0) - Number(a.issue || 0))[0];
      const currentYear = displayYear(latest);
      const yearRows = sourceRows.filter(row => displayYear(row) === currentYear).sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      const pools = window5Pools[source] || window5Pools.am;
      const rawYearWindows = fiveWindowRawWindows(yearRows);
      const stateItem = (window5State.items || []).find(item => item.source === source && String(item.year) === String(currentYear));
      const yearPoolHistory = Array.isArray(stateItem?.yearPoolHistory) ? stateItem.yearPoolHistory : [];
      const yearPool = completeSpecialPool8((stateItem?.yearPool?.length ? stateItem.yearPool : greedyFiveWindowPool(rawYearWindows)).slice(0, 8), yearRows);
      const stablePool = (stateItem?.stablePool?.length ? stateItem.stablePool : pools.stablePool).slice(0, maxStableWindow5PoolSize);
      const yearWindows = fiveWindowCoverageSnapshots(yearRows, yearPool, yearPoolHistory);
      const stableWindows = fiveWindowCoverage(yearRows, stablePool);
      const latestIssue = Number(latest?.issue || 0);
      const currentStart = nextOpenWindowStart(latestIssue, yearWindows);
      const currentWindow = yearWindows.find(item => item.start === currentStart) || {start: currentStart, end: currentStart + 4, count: 0, hits: [], covered: false};
      const yearly = [];
      const years = uniq(sourceRows.map(displayYear));
      years.forEach(year => {
        const rows = sourceRows.filter(row => displayYear(row) === year).sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
        const pool = year === currentYear ? yearPool : stablePool;
        const windows = year === currentYear ? fiveWindowCoverageSnapshots(rows, pool, yearPoolHistory) : fiveWindowCoverage(rows, pool);
        const misses = windows.filter(item => !item.covered);
        yearly.push({year, total: windows.length, covered: windows.length - misses.length, misses});
      });
      const adjustmentStatus = stateItem?.adjustmentStatus || (yearPool.length > 0 ? 'no-change' : '&#26080;&#25968;&#25454;');
      const adjustmentReason = stateItem?.adjustmentReason || (yearPool.length > 0 ? 'year-pool-same-as-previous' : '&#24403;&#24180;&#26242;&#26080;&#24320;&#22870;&#31383;&#21475;');
      const changeTime = stateItem?.changeTime || summary.generatedAt || '';
      const stablePoolStatus = stateItem?.stablePoolStatus || 'not-triggered';
      const stablePoolReason = stateItem?.stablePoolReason || '';
      const stablePoolOptimizationStatus = stateItem?.stablePoolOptimizationStatus || '';
      const stablePoolOptimizationReason = stateItem?.stablePoolOptimizationReason || '';
      const stablePoolChangeTime = stateItem?.stablePoolChangeTime || '';
      const stablePoolNextRecalcIssue = stateItem?.stablePoolNextRecalcIssue || '';
      return {source, latest, currentYear, currentWindow, yearPool, stablePool, yearWindows, stableWindows, yearly, adjustmentStatus, adjustmentReason, changeTime, yearPoolHistory, stablePoolStatus, stablePoolReason, stablePoolOptimizationStatus, stablePoolOptimizationReason, stablePoolChangeTime, stablePoolNextRecalcIssue};
    }
    function regularNums(record) {
      return (record?.balls || []).slice(0, 6).map(ball => String(ball.numberText || ball.number || '').padStart(2, '0'));
    }
    function comboKey(nums) {
      return nums.map(n => String(n).padStart(2, '0')).sort((a, b) => Number(a) - Number(b)).join('-');
    }
    function threeHitCompoundWindowCoverage(rows, pool) {
      if (!rows.length) return [];
      const poolSet = new Set(pool);
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        const hits = [];
        chunk.forEach(row => {
          const matched = regularNums(row).filter(num => poolSet.has(num)).sort((a, b) => Number(a) - Number(b));
          if (matched.length >= 3) hits.push({issue: row.issue, date: row.date, matched});
        });
        windows.push({start, end, count: chunk.length, hits, covered: hits.length > 0});
      }
      return windows;
    }
    function threeCompoundWindowPoolSnapshot(pool, history, windowStart) {
      return poolSnapshotForWindow(pool, history, windowStart);
    }
    function threeHitCompoundWindowCoverageSnapshots(rows, pool, history) {
      if (!rows.length) return [];
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        const poolSnapshot = threeCompoundWindowPoolSnapshot(pool, history, start);
        const poolSet = new Set(poolSnapshot);
        const hits = [];
        chunk.forEach(row => {
          const matched = regularNums(row).filter(num => poolSet.has(num)).sort((a, b) => Number(a) - Number(b));
          if (matched.length >= 3) hits.push({issue: row.issue, date: row.date, matched});
        });
        windows.push({start, end, count: chunk.length, poolSnapshot, hits, covered: hits.length > 0});
      }
      return windows;
    }
    function snapshotWindows(rows, poolItem) {
      const existing = asArray(poolItem?.windows || poolItem?.yearWindows);
      if (existing.some(win => Array.isArray(win.poolSnapshot))) return existing;
      return threeHitCompoundWindowCoverageSnapshots(rows, poolItem?.pool || [], poolItem?.changeHistory || []);
    }
    function threeHitStatsFromWindows(windows) {
      const completed = asArray(windows).filter(item => Number(item.count || 0) >= 5);
      const covered = completed.filter(item => item.covered).length;
      const hitDraws = completed.reduce((sum, item) => sum + asArray(item.hits).length, 0);
      const recent = completed.slice(-10).reduce((sum, item, index) => sum + (item.covered ? index + 1 : 0), 0);
      return {windows, completed, covered, hitDraws, recent, hitRate: completed.length ? Math.round(covered / completed.length * 10000) / 100 : 0};
    }
    function threeHitPoolStats(rows, pool) {
      const windows = threeHitCompoundWindowCoverage(rows, pool);
      return threeHitStatsFromWindows(windows);
    }
    function threeHitScoreVector(rows, pool) {
      const stats = threeHitPoolStats(rows, pool);
      return [stats.covered, stats.hitDraws, stats.recent, -pool.reduce((sum, num) => sum + Number(num), 0)];
    }
    function betterThreeHitScore(a, b) {
      if (!b) return true;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] > b[i];
      }
      return false;
    }
    function allLotteryNumbers() {
      return Array.from({length: 49}, (_, i) => String(i + 1).padStart(2, '0'));
    }
    function seededShuffleNumbers(seed) {
      const nums = allLotteryNumbers();
      let state = 2166136261;
      String(seed).split('').forEach(ch => {
        state ^= ch.charCodeAt(0);
        state = Math.imul(state, 16777619) >>> 0;
      });
      for (let i = nums.length - 1; i > 0; i--) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const j = state % (i + 1);
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      return nums;
    }
    function topThreeHitFrequencyNumbers(rows) {
      const counts = new Map();
      rows.forEach(row => regularNums(row).forEach(num => counts.set(num, (counts.get(num) || 0) + 1)));
      return allLotteryNumbers().sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || Number(a) - Number(b));
    }
    function greedyThreeHitCompoundSeed(rows, poolSize, order) {
      let selected = [];
      while (selected.length < poolSize) {
        let bestNum = null;
        let bestScore = null;
        order.forEach(num => {
          if (selected.includes(num)) return;
          const candidate = selected.concat(num).sort((a, b) => Number(a) - Number(b));
          const score = threeHitScoreVector(rows, candidate);
          if (betterThreeHitScore(score, bestScore)) {
            bestScore = score;
            bestNum = num;
          }
        });
        selected = selected.concat(bestNum).sort((a, b) => Number(a) - Number(b));
      }
      return selected;
    }
    function improveThreeHitCompoundPool(rows, startPool) {
      const allNums = allLotteryNumbers();
      let selected = startPool.slice().sort((a, b) => Number(a) - Number(b));
      let bestScore = threeHitScoreVector(rows, selected);
      let improved = true;
      let rounds = 0;
      while (improved && rounds < 80) {
        improved = false;
        rounds++;
        const current = selected.slice();
        const outside = allNums.filter(num => !selected.includes(num));
        for (const outNum of current) {
          for (const inNum of outside) {
            const candidate = selected.filter(num => num !== outNum).concat(inNum).sort((a, b) => Number(a) - Number(b));
            const score = threeHitScoreVector(rows, candidate);
            if (betterThreeHitScore(score, bestScore)) {
              selected = candidate;
              bestScore = score;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
      return {pool: selected, score: bestScore};
    }
    function buildThreeHitCompoundPool(records, poolSize) {
      const rows = records.slice().sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      const frequencyOrder = topThreeHitFrequencyNumbers(rows);
      const randomSeeds = ['three-compound-local-search-a', 'three-compound-local-search-b', 'three-compound-local-search-c', 'three-compound-local-search-d'];
      const seeds = [
        greedyThreeHitCompoundSeed(rows, poolSize, allLotteryNumbers()),
        greedyThreeHitCompoundSeed(rows, poolSize, frequencyOrder),
        frequencyOrder.slice(0, poolSize).sort((a, b) => Number(a) - Number(b))
      ];
      randomSeeds.forEach(seed => {
        const shuffled = seededShuffleNumbers(`${seed}|${poolSize}|${rows.length}`);
        seeds.push(shuffled.slice(0, poolSize).sort((a, b) => Number(a) - Number(b)));
        seeds.push(greedyThreeHitCompoundSeed(rows, poolSize, shuffled));
      });
      let best = null;
      seeds.forEach(seed => {
        const improved = improveThreeHitCompoundPool(rows, seed);
        if (!best || betterThreeHitScore(improved.score, best.score)) best = improved;
      });
      const selected = best ? best.pool : [];
      const stats = threeHitPoolStats(rows, selected);
      return {poolSize, pool: selected, windows: stats.windows, covered: stats.covered, total: stats.completed.length, hitDraws: stats.hitDraws, hitRate: stats.hitRate};
    }
    function buildThreeHitCompoundPools(records) {
      const compoundPools = [{poolSize: 5}, {poolSize: 6}, {poolSize: 7}, {poolSize: 8}];
      return compoundPools.map(item => buildThreeHitCompoundPool(records, item.poolSize));
    }
    function buildThreeHitCombos(records) {
      const compound = buildThreeHitCompoundPool(records, 8);
      const comboMap = new Map();
      const rows = records.slice().sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      for (let i = 0; i < compound.pool.length - 2; i++) {
        for (let j = i + 1; j < compound.pool.length - 1; j++) {
          for (let k = j + 1; k < compound.pool.length; k++) {
            const numbers = [compound.pool[i], compound.pool[j], compound.pool[k]];
            comboMap.set(comboKey(numbers), {numbers, hits: 0, windows: new Set(), lastIssue: 0});
          }
        }
      }
      rows.forEach(row => {
        const regular = regularNums(row);
        comboMap.forEach(item => {
          if (item.numbers.every(num => regular.includes(num))) {
            item.hits++;
            item.windows.add(Math.floor((Number(row.issue || 0) - 1) / 5));
            item.lastIssue = Math.max(item.lastIssue, Number(row.issue || 0));
          }
        });
      });
      const combos = [...comboMap.values()].map(item => ({
        numbers: item.numbers,
        hits: item.hits,
        windowHits: item.windows.size,
        lastIssue: item.lastIssue,
        score: item.windows.size * 10 + item.hits + item.lastIssue / 1000
      })).sort((a, b) => b.score - a.score || comboKey(a.numbers).localeCompare(comboKey(b.numbers)));
      return {numberPool: compound.pool, combos: combos.slice(0, 12)};
    }
    function threeHitWindowCoverage(rows, combos) {
      if (!rows.length) return [];
      const maxIssue = Math.max(...rows.map(row => Number(row.issue || 0)));
      const windows = [];
      for (let start = 1; start <= maxIssue; start += 5) {
        const end = start + 4;
        const chunk = rows.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
        if (!chunk.length) continue;
        const hits = [];
        chunk.forEach(row => {
          const regular = regularNums(row);
          combos.forEach(combo => {
            if (combo.numbers.every(num => regular.includes(num))) hits.push({issue: row.issue, date: row.date, combo: combo.numbers});
          });
        });
        windows.push({start, end, count: chunk.length, hits, covered: hits.length > 0});
      }
      return windows;
    }
    function hitMatchedText(hit) {
      return asArray(hit?.matched || hit?.combo).join('-');
    }
    function stateWindowAnalysis(source) {
      const stateItems = asArray(threeCompoundState?.items).filter(item => item.source === source);
      const stateItem = stateItems.slice().sort((a, b) => Number(b.latestIssue || 0) - Number(a.latestIssue || 0))[0];
      if (!stateItem) return null;
      const compoundPools = asArray(stateItem.pools);
      const crossYearPools = asArray(stateItem.crossYearPools);
      const primary = compoundPools.find(item => Number(item.poolSize || 0) === 8) || compoundPools[compoundPools.length - 1];
      const yearWindows = asArray(primary?.windows);
      const latestIssue = Number(stateItem.latestIssue || yearWindows.reduce((max, win) => Math.max(max, Number(win.end || 0)), 0));
      const currentStart = nextOpenWindowStart(latestIssue, yearWindows, 5);
      const currentWindow = yearWindows.find(item => Number(item.start || 0) === currentStart) || {start: currentStart, end: currentStart + 4, count: 0, hits: [], covered: false};
      const completedWindows = yearWindows.filter(item => Number(item.count || 0) >= 5);
      const hitWindows = completedWindows.filter(item => item.covered).length;
      let maxMiss = 0;
      let currentMiss = 0;
      let run = 0;
      completedWindows.forEach(item => {
        if (item.covered) {
          maxMiss = Math.max(maxMiss, run);
          run = 0;
        } else {
          run++;
        }
      });
      maxMiss = Math.max(maxMiss, run);
      for (let i = completedWindows.length - 1; i >= 0; i--) {
        if (completedWindows[i].covered) break;
        currentMiss++;
      }
      const yearPoolsBySize = new Map(compoundPools.map(item => [Number(item.poolSize || 0), item]));
      crossYearPools.forEach(item => {
        const yearPool = asArray(yearPoolsBySize.get(Number(item.poolSize || 0))?.pool);
        const crossPool = asArray(item.pool);
        const yearSet = new Set(yearPool);
        const crossSet = new Set(crossPool);
        if (!Array.isArray(item.intersection)) item.intersection = crossPool.filter(num => yearSet.has(num));
        item.intersectionCount = item.intersection.length;
        if (!Array.isArray(item.crossYearOnly)) item.crossYearOnly = crossPool.filter(num => !yearSet.has(num));
        if (!Array.isArray(item.yearOnly)) item.yearOnly = yearPool.filter(num => !crossSet.has(num));
      });
      return {
        source,
        latest: {issue: latestIssue},
        currentYear: stateItem.year || '',
        numberPool: primary?.pool || [],
        compoundPools,
        crossYearPools,
        combos: [],
        currentWindow,
        yearWindows,
        stats: {
          total: completedWindows.length,
          hits: hitWindows,
          misses: completedWindows.length - hitWindows,
          hitRate: completedWindows.length ? Math.round(hitWindows / completedWindows.length * 100) : 0,
          currentMiss,
          maxMiss
        }
      };
    }
    function threeWindowAnalysis(source) {
      const cacheKey = `${source}|${threeCompoundState?.generatedAt || ''}|${records.length}`;
      if (threeWindowAnalysisCache.has(cacheKey)) return threeWindowAnalysisCache.get(cacheKey);
      if (!records.length) {
        const stateAnalysis = stateWindowAnalysis(source);
        if (stateAnalysis) {
          threeWindowAnalysisCache.set(cacheKey, stateAnalysis);
          return stateAnalysis;
        }
      }
      const sourceRows = cachedSourceRecords(source).slice().sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      const latest = sourceRows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.issue || 0) - Number(a.issue || 0))[0];
      const currentYear = displayYear(latest);
      const yearRows = sourceRows.filter(row => displayYear(row) === currentYear).sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
      const stateItem = (threeCompoundState.items || []).find(item => item.source === source && String(item.year) === String(currentYear));
      const compoundPools = Array.isArray(stateItem?.pools) && stateItem.pools.length ? stateItem.pools : buildThreeHitCompoundPools(yearRows.length ? yearRows : sourceRows);
      compoundPools.forEach(item => {
        item.windows = snapshotWindows(yearRows, item);
        const stats = threeHitStatsFromWindows(item.windows);
        item.covered = stats.covered;
        item.total = stats.completed.length;
        item.hitDraws = stats.hitDraws;
        item.hitRate = stats.hitRate;
      });
      const savedCrossYearPools = Array.isArray(stateItem?.crossYearPools) && stateItem.crossYearPools.length ? stateItem.crossYearPools : [];
      const crossYearPools = savedCrossYearPools.length ? savedCrossYearPools : buildThreeHitCompoundPools(sourceRows).map(item => {
        const yearStats = threeHitPoolStats(yearRows, item.pool || []);
        return {...item, scope: 'all-history', windows: yearStats.windows, covered: yearStats.covered, total: yearStats.completed.length, hitRate: yearStats.hitRate, hitDraws: yearStats.hitDraws, yearWindows: yearStats.windows, yearCovered: yearStats.covered, yearTotal: yearStats.completed.length, yearHitRate: yearStats.hitRate, historyWindows: item.windows, historyCovered: item.covered, historyTotal: item.total, historyHitRate: item.hitRate};
      });
      const yearPoolsBySize = new Map(compoundPools.map(item => [Number(item.poolSize || 0), item]));
      crossYearPools.forEach(item => {
        item.yearWindows = snapshotWindows(yearRows, item);
        item.windows = item.yearWindows;
        const yearStats = threeHitStatsFromWindows(item.yearWindows);
        item.covered = yearStats.covered;
        item.total = yearStats.completed.length;
        item.hitDraws = yearStats.hitDraws;
        item.hitRate = yearStats.hitRate;
        item.yearCovered = yearStats.covered;
        item.yearTotal = yearStats.completed.length;
        item.yearHitRate = yearStats.hitRate;
        const yearPool = yearPoolsBySize.get(Number(item.poolSize || 0))?.pool || [];
        const crossPool = item.pool || [];
        const yearSet = new Set(yearPool);
        const crossSet = new Set(crossPool);
        if (!Array.isArray(item.intersection)) item.intersection = crossPool.filter(num => yearSet.has(num));
        item.intersectionCount = item.intersection.length;
        if (!Array.isArray(item.crossYearOnly)) item.crossYearOnly = crossPool.filter(num => !yearSet.has(num));
        if (!Array.isArray(item.yearOnly)) item.yearOnly = yearPool.filter(num => !crossSet.has(num));
      });
      const primary = compoundPools.find(item => item.poolSize === 8) || compoundPools[compoundPools.length - 1];
      const yearWindows = primary ? primary.windows : [];
      const latestIssue = Number(latest?.issue || 0);
      const currentStart = nextOpenWindowStart(latestIssue, yearWindows, 5);
      const currentWindow = yearWindows.find(item => item.start === currentStart) || {start: currentStart, end: currentStart + 4, count: 0, hits: [], covered: false};
      const completedWindows = yearWindows.filter(item => Number(item.count || 0) >= 5);
      let maxMiss = 0;
      let currentMiss = 0;
      let run = 0;
      let hitWindows = 0;
      completedWindows.forEach(item => {
        if (item.covered) {
          hitWindows++;
          maxMiss = Math.max(maxMiss, run);
          run = 0;
        } else {
          run++;
        }
      });
      maxMiss = Math.max(maxMiss, run);
      for (let i = completedWindows.length - 1; i >= 0; i--) {
        if (completedWindows[i].covered) break;
        currentMiss++;
      }
      const comboCompat = buildThreeHitCombos(yearRows.length ? yearRows : sourceRows);
      const analysis = {source, latest, currentYear, numberPool: primary?.pool || [], compoundPools, crossYearPools, combos: comboCompat.combos, currentWindow, yearWindows, stats: {total: completedWindows.length, hits: hitWindows, misses: completedWindows.length - hitWindows, hitRate: completedWindows.length ? Math.round(hitWindows / completedWindows.length * 100) : 0, currentMiss, maxMiss}};
      threeWindowAnalysisCache.set(cacheKey, analysis);
      return analysis;
    }
    function randomWindowBaseline(pickCount, totalCount, drawsPerWindow) {
      if (!pickCount || !totalCount || !drawsPerWindow) return 0;
      return Math.round((1 - Math.pow(1 - pickCount / totalCount, drawsPerWindow)) * 10000) / 100;
    }
    function patternLevel(edge, currentMiss, maxMiss) {
      if (edge < 0 || (maxMiss > 0 && currentMiss > maxMiss)) return '&#22833;&#25928;';
      if (edge >= 15 && currentMiss <= 2) return '&#20248;&#31168;';
      if (edge >= 8 && currentMiss <= 3) return '&#33391;&#22909;';
      return '&#35266;&#23519;';
    }
    function patternStats(windows) {
      const completed = windows.filter(item => Number(item.count || 0) >= 5);
      const total = completed.length;
      const hits = completed.filter(item => item.covered).length;
      let currentMiss = 0;
      for (let i = completed.length - 1; i >= 0; i--) {
        if (completed[i].covered) break;
        currentMiss++;
      }
      let maxMiss = 0;
      let run = 0;
      completed.forEach(item => {
        if (item.covered) {
          maxMiss = Math.max(maxMiss, run);
          run = 0;
        } else {
          run++;
        }
      });
      maxMiss = Math.max(maxMiss, run);
      const recent = completed.slice(-10);
      const recentHits = recent.filter(item => item.covered).length;
      return {total, hits, hitRate: total ? Math.round(hits / total * 10000) / 100 : 0, currentMiss, maxMiss, recentHitRate: recent.length ? Math.round(recentHits / recent.length * 10000) / 100 : 0};
    }
    function recentWindowStats(item) {
      const completed = asArray(item?.yearWindows || item?.windows).filter(win => Number(win.count || 0) >= 5);
      const recent = completed.slice(-10);
      const covered = recent.filter(win => win.covered).length;
      const total = recent.length;
      const hitRate = total ? Math.round(covered / total * 10000) / 100 : 0;
      return {
        covered: item?.recentCovered ?? covered,
        total: item?.recentTotal ?? total,
        hitRate: item?.recentHitRate ?? hitRate
      };
    }
    function specialStructureStats(rows) {
      const items = rows.map(row => row.balls?.[6]).filter(Boolean);
      const colorMap = new Map();
      const tailMap = new Map();
      items.forEach(ball => {
        colorMap.set(ball.color, (colorMap.get(ball.color) || 0) + 1);
        const tail = String(ball.numberText || '').slice(-1);
        tailMap.set(tail, (tailMap.get(tail) || 0) + 1);
      });
      const toRows = (map) => [...map.entries()].map(([name, count]) => ({name, count})).sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
      return {colors: toRows(colorMap), tails: toRows(tailMap)};
    }
    function optimizedSpecialPool(rows, basePool, size) {
      const structure = specialStructureStats(rows);
      const tailRank = new Map(structure.tails.map((item, idx) => [String(item.name), structure.tails.length - idx]));
      const colorRank = new Map(structure.colors.map((item, idx) => [String(item.name), structure.colors.length - idx]));
      const freq = new Map();
      rows.forEach(row => {
        const ball = row.balls?.[6];
        if (!ball) return;
        const num = String(ball.numberText || '').padStart(2, '0');
        freq.set(num, {num, color: ball.color, count: (freq.get(num)?.count || 0) + 1});
      });
      const base = new Set(basePool);
      const scored = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0')).map(num => {
        const item = freq.get(num) || {num, color: '', count: 0};
        const tail = num.slice(-1);
        const score = item.count * 8 + (tailRank.get(tail) || 0) * 3 + (colorRank.get(item.color) || 0) * 2 + (base.has(num) ? 20 : 0);
        return {num, score};
      }).sort((a, b) => b.score - a.score || Number(a.num) - Number(b.num));
      const selected = [];
      const tailCounts = new Map();
      scored.forEach(item => {
        if (selected.length >= size) return;
        const tail = item.num.slice(-1);
        if ((tailCounts.get(tail) || 0) >= 2) return;
        selected.push(item.num);
        tailCounts.set(tail, (tailCounts.get(tail) || 0) + 1);
      });
      scored.forEach(item => {
        if (selected.length >= size) return;
        if (!selected.includes(item.num)) selected.push(item.num);
      });
      return selected;
    }
    function optimizationCompareRow(name, original, optimized, baseline) {
      const originalEdge = Math.round((original.hitRate - baseline) * 100) / 100;
      const optimizedEdge = Math.round((optimized.hitRate - baseline) * 100) / 100;
      const delta = Math.round((optimized.hitRate - original.hitRate) * 100) / 100;
      const verdict = delta > 0 ? '\u4F18\u5316\u66F4\u4F18' : delta < 0 ? '\u539F\u6C60\u66F4\u4F18' : '\u6301\u5E73';
      return `<tr><td>${name}</td><td>${esc(original.hitRate)}%</td><td>${esc(optimized.hitRate)}%</td><td>${esc(baseline)}%</td><td>${esc(originalEdge)}%</td><td>${esc(optimizedEdge)}%</td><td>${esc(delta)}%</td><td>${verdict}</td></tr>`;
    }
    function patternScoreItem(name, original, optimized, baseline, sizeLabel) {
      const optimizedHitRate = Number(optimized?.hitRate || 0);
      const originalHitRate = Number(original?.hitRate || 0);
      const edge = Math.round((originalHitRate - baseline) * 100) / 100;
      const optimizedEdge = Math.round((optimizedHitRate - baseline) * 100) / 100;
      const delta = Math.round((optimizedHitRate - originalHitRate) * 100) / 100;
      const recentDelta = Math.round((Number(original.recentHitRate || 0) - originalHitRate) * 100) / 100;
      const missPenalty = Math.min(24, Number(original.currentMiss || 0) * 8);
      const maxMiss = Number(original.maxMiss || 0);
      let score = 50 + edge * 0.9 + recentDelta * 0.35 - missPenalty;
      if (delta > 0) score += Math.min(12, delta * 0.5);
      if (delta < 0) score += Math.max(-10, delta * 0.35);
      if (original.level === '&#20248;&#31168;') score += 12;
      if (original.level === '&#33391;&#22909;') score += 6;
      if (original.level === '&#22833;&#25928;') score -= 18;
      score = Math.max(0, Math.min(100, Math.round(score)));
      const grade = score >= 90 ? '&#20248;' : score >= 80 ? '&#33391;' : score >= 60 ? '&#21450;&#26684;' : '&#35266;&#23519;';
      let action = '&#32487;&#32493;&#35266;&#23519;';
      if (original.level === '&#22833;&#25928;' || edge < 0) action = '&#26242;&#20572;&#35813;&#35268;&#24459;';
      else if (maxMiss > 0 && Number(original.currentMiss || 0) >= maxMiss) action = '&#31561;&#24453;&#31383;&#21475;&#32467;&#26463;';
      else if (score < 60) action = '&#35302;&#21457;&#37325;&#31639;';
      else if (delta >= 5 && optimizedEdge >= edge) action = '&#20248;&#20808;&#35266;&#23519;&#20248;&#21270;&#27744;';
      else if (delta <= -5) action = '&#20248;&#20808;&#37319;&#29992;&#21407;&#27744;';
      return {name, sizeLabel, score, grade, hitRate: originalHitRate, optimizedHitRate, baseline, edge, optimizedEdge, recentHitRate: original.recentHitRate, currentMiss: original.currentMiss, maxMiss: original.maxMiss, action};
    }
    function patternScoreTable(analysis) {
      const rows = [
        patternScoreItem('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', analysis.special, analysis.optimized.special.stats, analysis.special.baseline, `${analysis.special.poolSize}\u7801`),
        patternScoreItem('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', analysis.stable, analysis.optimized.stable.stats, analysis.stable.baseline, `${analysis.stable.poolSize}\u7801`)
      ];
      return `<section class="panel full"><h2>&#35268;&#24459;&#35780;&#20998;&#24635;&#34920;</h2><p class="muted">&#35780;&#20998;&#21482;&#29992;&#20110;&#35266;&#23519;&#65292;&#20197;&#23436;&#25104;&#30340;5&#26399;&#31383;&#21475;&#22238;&#27979;&#20026;&#20934;&#65292;&#19981;&#35745;&#20837;&#26410;&#32467;&#26463;&#31383;&#21475;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#35268;&#27169;</th><th>&#35780;&#20998;</th><th>&#31561;&#32423;</th><th>&#21407;&#27744;&#23454;&#38469;</th><th>&#20248;&#21270;&#23454;&#38469;</th><th>&#38543;&#26426;&#22522;&#20934;</th><th>&#36817;10&#31383;&#21475;</th><th>&#28431;&#31383;</th><th>&#24314;&#35758;&#21160;&#20316;</th></tr></thead><tbody>${rows.map(item => `<tr><td>${item.name}</td><td>${esc(item.sizeLabel)}</td><td>${esc(item.score)}</td><td>${item.grade}</td><td>${esc(item.hitRate)}%</td><td>${esc(item.optimizedHitRate)}%</td><td>${esc(item.baseline)}%</td><td>${esc(item.recentHitRate)}%</td><td>${esc(item.currentMiss)} / ${esc(item.maxMiss)}</td><td>${item.action}</td></tr>`).join('')}</tbody></table></section>`;
    }
    function rollingWindowCompare(originalWindows, optimizedWindows) {
      const original = originalWindows.filter(item => Number(item.count || 0) >= 5).slice(-10);
      const optimized = optimizedWindows.filter(item => Number(item.count || 0) >= 5).slice(-10);
      const count = Math.min(original.length, optimized.length);
      let originalWins = 0;
      let optimizedWins = 0;
      let ties = 0;
      for (let i = 0; i < count; i++) {
        const oldHit = !!original[original.length - count + i]?.covered;
        const newHit = !!optimized[optimized.length - count + i]?.covered;
        if (oldHit === newHit) ties++;
        else if (newHit) optimizedWins++;
        else originalWins++;
      }
      return {count, originalWins, optimizedWins, ties, label: `${optimizedWins}/${count}`};
    }
    function concentrationHealth(items) {
      const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
      const top = items.slice(0, 2).reduce((sum, item) => sum + Number(item.count || 0), 0);
      if (!total) return '&#26679;&#26412;&#19981;&#36275;';
      const ratio = top / total;
      if (ratio >= 0.75) return '&#20559;&#26012;';
      if (ratio >= 0.62) return '&#30053;&#20559;';
      return '&#20581;&#24247;';
    }
    function structureHealthForPattern(type, analysisItem) {
      if (type === 'three') {
        const span = concentrationHealth(analysisItem.structure?.spans || []);
        const parity = concentrationHealth(analysisItem.structure?.parity || []);
        return span === '&#20581;&#24247;' && parity === '&#20581;&#24247;' ? '&#20581;&#24247;' : `${span} / ${parity}`;
      }
      const colors = concentrationHealth(analysisItem.structure?.colors || []);
      const tails = concentrationHealth(analysisItem.structure?.tails || []);
      return colors === '&#20581;&#24247;' && tails === '&#20581;&#24247;' ? '&#20581;&#24247;' : `${colors} / ${tails}`;
    }
    function missRecoveryLabel(item) {
      const currentMiss = Number(item.currentMiss || 0);
      const maxMiss = Number(item.maxMiss || 0);
      if (currentMiss <= 0) return '&#26080;&#28431;&#31383;';
      if (maxMiss > 0 && currentMiss >= maxMiss) return '&#38656;&#35201;&#31561;&#24453;&#31383;&#21475;&#32467;&#26463;';
      if (currentMiss >= 2) return '&#35266;&#23519;&#24674;&#22797;';
      return '&#36731;&#24230;&#28431;&#31383;';
    }
    function patternDiagnosticRow(name, type, item, originalWindows, optimizedWindows, optimizedStats) {
      const rolling = rollingWindowCompare(originalWindows, optimizedWindows);
      const structure = structureHealthForPattern(type, item);
      const recovery = missRecoveryLabel(item);
      const delta = Math.round((Number(optimizedStats.hitRate || 0) - Number(item.hitRate || 0)) * 100) / 100;
      let action = '&#32487;&#32493;&#35266;&#23519;';
      if (item.level === '&#22833;&#25928;' || item.edge < 0) action = '&#26242;&#20572;&#35813;&#35268;&#24459;';
      else if (recovery === '&#38656;&#35201;&#31561;&#24453;&#31383;&#21475;&#32467;&#26463;') action = '&#31561;&#24453;&#31383;&#21475;&#32467;&#26463;';
      else if (structure !== '&#20581;&#24247;' && delta <= 0) action = '&#38477;&#26435;&#21407;&#32467;&#26500;';
      else if (rolling.optimizedWins > rolling.originalWins || delta >= 5) action = '&#20248;&#20808;&#35266;&#23519;&#20248;&#21270;&#27744;';
      return `<tr><td>${name}</td><td>${structure}</td><td>${esc(rolling.label)} &#65288;&#20248;&#21270;&#32988; / &#31383;&#21475;&#25968;&#65289;</td><td>${recovery}</td><td>${esc(delta)}%</td><td>${action}</td></tr>`;
    }
    function patternDiagnosticsTable(analysis) {
      return `<section class="panel full"><h2>&#35268;&#24459;&#35786;&#26029;</h2><p class="muted">&#29992;&#32467;&#26500;&#20581;&#24247;&#12289;&#36817;10&#31383;&#21475;&#32988;&#29575;&#21644;&#28431;&#31383;&#24674;&#22797;&#21028;&#26029;&#24403;&#21069;&#35268;&#24459;&#26159;&#21542;&#36824;&#20540;&#24471;&#36319;&#36394;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#32467;&#26500;&#20581;&#24247;</th><th>&#36817;10&#31383;&#21475;&#32988;&#29575;</th><th>&#28431;&#31383;&#24674;&#22797;</th><th>&#20248;&#21270;&#24046;&#20540;</th><th>&#35786;&#26029;&#24314;&#35758;</th></tr></thead><tbody>
        ${patternDiagnosticRow('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', 'special', analysis.special, analysis.specialWindows, analysis.optimized.special.windows, analysis.optimized.special.stats)}
        ${patternDiagnosticRow('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', 'special', analysis.stable, analysis.stableWindows, analysis.optimized.stable.windows, analysis.optimized.stable.stats)}
      </tbody></table></section>`;
    }
    function windowRhythmStats(windows) {
      const completed = windows.filter(item => Number(item.count || 0) >= 5);
      let earlyHits = 0;
      let lateHits = 0;
      let missRebounds = 0;
      let missFollowCount = 0;
      let streakFollowCount = 0;
      let streakBreaks = 0;
      completed.forEach((item, idx) => {
        if (item.covered) {
          const firstHitIssue = Math.min(...(item.hits || []).map(hit => Number(hit.issue || item.start)));
          const offset = firstHitIssue - Number(item.start || firstHitIssue) + 1;
          if (offset <= 2) earlyHits++;
          else lateHits++;
        }
        if (idx > 0 && !completed[idx - 1].covered) {
          missFollowCount++;
          if (item.covered) missRebounds++;
        }
        if (idx > 1 && completed[idx - 1].covered && completed[idx - 2].covered) {
          streakFollowCount++;
          if (!item.covered) streakBreaks++;
        }
      });
      const last = completed[completed.length - 1];
      const active = windows.find(item => Number(item.count || 0) > 0 && Number(item.count || 0) < 5) || null;
      const earlyTotal = earlyHits + lateHits;
      const rhythm = earlyTotal === 0 ? '&#26679;&#26412;&#19981;&#36275;' : earlyHits >= lateHits ? '&#21069;&#21322;&#31383;&#20559;&#24378;' : '&#21518;&#21322;&#31383;&#20559;&#24378;';
      const reboundRate = missFollowCount ? Math.round(missRebounds / missFollowCount * 10000) / 100 : 0;
      const decayRate = streakFollowCount ? Math.round(streakBreaks / streakFollowCount * 10000) / 100 : 0;
      let phase = '&#24179;&#31283;&#35266;&#23519;';
      if (active && Number(active.count || 0) <= 2 && !active.covered) phase = '&#26089;&#26399;&#35266;&#23519;';
      else if (active && Number(active.count || 0) >= 3 && !active.covered) phase = '&#21518;&#21322;&#31383;&#21387;&#21147;';
      else if (last && !last.covered) phase = '&#28431;&#31383;&#24674;&#22797;';
      else if (completed.length >= 2 && completed[completed.length - 1]?.covered && completed[completed.length - 2]?.covered) phase = '&#36830;&#20013;&#34928;&#20943;';
      let action = '&#32487;&#32493;&#36319;&#36394;';
      if (phase === '&#21518;&#21322;&#31383;&#21387;&#21147;') action = '&#31561;&#31383;&#21475;&#32467;&#26463;';
      else if (phase === '&#28431;&#31383;&#24674;&#22797;' && reboundRate < 50) action = '&#35302;&#21457;&#37325;&#31639;';
      else if (phase === '&#36830;&#20013;&#34928;&#20943;' && decayRate >= 50) action = '&#38477;&#20302;&#26435;&#37325;';
      return {rhythm, earlyHits, lateHits, reboundRate, missRebounds, missFollowCount, decayRate, streakBreaks, streakFollowCount, phase, action};
    }
    function windowRhythmRow(name, windows) {
      const stats = windowRhythmStats(windows);
      const rebound = stats.missFollowCount ? `${stats.reboundRate}% (${stats.missRebounds}/${stats.missFollowCount})` : '-';
      const decay = stats.streakFollowCount ? `${stats.decayRate}% (${stats.streakBreaks}/${stats.streakFollowCount})` : '-';
      return `<tr><td>${name}</td><td>${stats.rhythm}<br><span class="muted">${esc(stats.earlyHits)} / ${esc(stats.lateHits)}</span></td><td>${esc(rebound)}</td><td>${esc(decay)}</td><td>${stats.phase}</td><td>${stats.action}</td></tr>`;
    }
    function windowRhythmTable(analysis) {
      return `<section class="panel full"><h2>&#31383;&#21475;&#33410;&#22863;&#35266;&#23519;</h2><p class="muted">&#35266;&#23519;5&#26399;&#31383;&#21475;&#20869;&#30340;&#21629;&#20013;&#20301;&#32622;&#12289;&#28431;&#31383;&#21518;&#21453;&#24377;&#21644;&#36830;&#32493;&#35206;&#30422;&#34928;&#20943;&#65292;&#29992;&#20110;&#21028;&#26029;&#24403;&#21069;&#27809;&#20013;&#26159;&#31561;&#24453;&#36824;&#26159;&#21464;&#24369;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#39318;&#23614;&#26399;&#33410;&#22863;</th><th>&#28431;&#31383;&#21518;&#21453;&#24377;</th><th>&#36830;&#32493;&#35206;&#30422;&#34928;&#20943;</th><th>&#24403;&#21069;&#38454;&#27573;</th><th>&#33410;&#22863;&#24314;&#35758;</th></tr></thead><tbody>
        ${windowRhythmRow('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', analysis.specialWindows)}
        ${windowRhythmRow('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', analysis.stableWindows)}
      </tbody></table></section>`;
    }
    function failureProfileForWindow(item, context) {
      const tags = [];
      const idx = context.windows.indexOf(item);
      const prev1 = idx > 0 ? context.windows[idx - 1] : null;
      const prev2 = idx > 1 ? context.windows[idx - 2] : null;
      const optimized = context.optimizedWindows?.[idx];
      if (context.structure !== '&#20581;&#24247;') tags.push('&#32467;&#26500;&#20559;&#26012;');
      if (prev1?.covered && prev2?.covered) tags.push('&#36830;&#20013;&#21518;&#34928;&#20943;');
      if (Number(item.count || 0) >= 5 && !item.covered) tags.push('&#21518;&#21322;&#31383;&#26410;&#34917;');
      if (optimized?.covered && !item.covered) tags.push('&#20248;&#21270;&#27744;&#32988;&#20986;');
      if (!optimized?.covered && item.covered) tags.push('&#21407;&#27744;&#32988;&#20986;');
      if (context.windows.length < 6) tags.push('&#26679;&#26412;&#19981;&#36275;');
      return tags.length ? tags : ['&#24120;&#35268;&#28431;&#31383;'];
    }
    function failureProfileSummary(name, type, windows, optimizedWindows, analysisItem) {
      const completed = windows.filter(item => Number(item.count || 0) >= 5);
      const missed = completed.filter(item => !item.covered).slice(-8);
      const structure = structureHealthForPattern(type, analysisItem);
      const context = {windows: completed, optimizedWindows: optimizedWindows.filter(item => Number(item.count || 0) >= 5), structure};
      const tagCounts = new Map();
      const rows = missed.map(item => {
        const tags = failureProfileForWindow(item, context);
        tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
        return {window: `${String(item.start).padStart(3, '0')}-${String(item.end).padStart(3, '0')}`, tags};
      });
      const top = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || ['-', 0];
      let action = '&#32487;&#32493;&#35266;&#23519;';
      if (top[0] === '&#20248;&#21270;&#27744;&#32988;&#20986;') action = '&#20248;&#20808;&#35266;&#23519;&#20248;&#21270;&#27744;';
      else if (top[0] === '&#32467;&#26500;&#20559;&#26012;') action = '&#38477;&#26435;&#24182;&#37325;&#31639;';
      else if (top[0] === '&#36830;&#20013;&#21518;&#34928;&#20943;') action = '&#36830;&#20013;&#21518;&#38477;&#26435;';
      else if (top[0] === '&#21518;&#21322;&#31383;&#26410;&#34917;') action = '&#31561;&#24453;&#19979;&#31383;&#24674;&#22797;';
      return {name, rows, topTag: top[0], topCount: top[1], totalMissed: missed.length, action};
    }
    function failureProfileRow(item) {
      const missed = item.rows.length ? item.rows.map(row => `${row.window}: ${row.tags.join(' / ')}`).join('<br>') : '-';
      return `<tr><td>${item.name}</td><td>${missed}</td><td>${item.topTag} ${esc(item.topCount ? `(${item.topCount})` : '')}</td><td>${esc(item.totalMissed)}</td><td>${item.action}</td></tr>`;
    }
    function failureProfileTable(analysis) {
      const rows = [
        failureProfileSummary('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', 'special', analysis.specialWindows, analysis.optimized.special.windows, analysis.special),
        failureProfileSummary('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', 'special', analysis.stableWindows, analysis.optimized.stable.windows, analysis.stable)
      ];
      return `<section class="panel full"><h2>&#22833;&#36133;&#30011;&#20687;&#35266;&#23519;</h2><p class="muted">&#25226;&#26368;&#36817;&#28431;&#31383;&#25353;&#22833;&#36133;&#26631;&#31614;&#24402;&#22240;&#65292;&#35266;&#23519;&#28431;&#31383;&#20027;&#35201;&#30001;&#32467;&#26500;&#12289;&#33410;&#22863;&#36824;&#26159;&#21407;&#27744;/&#20248;&#21270;&#27744;&#24046;&#24322;&#24341;&#36215;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#26368;&#36817;&#28431;&#31383; / &#22833;&#36133;&#26631;&#31614;</th><th>&#26368;&#22823;&#39118;&#38505;&#26631;&#31614;</th><th>&#28431;&#31383;&#25968;</th><th>&#24314;&#35758;&#21160;&#20316;</th></tr></thead><tbody>${rows.map(failureProfileRow).join('')}</tbody></table></section>`;
    }
    function poolRelationStats(windows) {
      const stats = patternStats(windows);
      return {...stats, label: `${stats.hitRate}%`, missLabel: `${stats.currentMiss} / ${stats.maxMiss}`};
    }
    function specialPoolRelationRows(yearRows, analysis) {
      const yearSet = new Set(analysis.yearPool);
      const stableSet = new Set(analysis.stablePool);
      const intersection = analysis.yearPool.filter(num => stableSet.has(num));
      const yearOnly = analysis.yearPool.filter(num => !stableSet.has(num));
      const stableOnly = analysis.stablePool.filter(num => !yearSet.has(num));
      return [
        {name: '&#20132;&#38598;&#21306;', pool: intersection, stats: poolRelationStats(fiveWindowCoverage(yearRows, intersection))},
        {name: '&#24403;&#24180;&#29420;&#26377;', pool: yearOnly, stats: poolRelationStats(fiveWindowCoverage(yearRows, yearOnly))},
        {name: '&#31283;&#23450;&#29420;&#26377;', pool: stableOnly, stats: poolRelationStats(fiveWindowCoverage(yearRows, stableOnly))}
      ];
    }
    function relationVerdict(rows) {
      const best = rows.slice().sort((a, b) => Number(b.stats.hitRate || 0) - Number(a.stats.hitRate || 0) || Number(a.stats.currentMiss || 0) - Number(b.stats.currentMiss || 0))[0];
      if (!best || Number(best.stats.total || 0) === 0) return '&#26679;&#26412;&#19981;&#36275;';
      return `${best.name} &#21344;&#20248;`;
    }
    function poolRelationRow(group, item) {
      return `<tr><td>${group}</td><td>${item.name}</td><td>${numberChips(item.pool || [])}</td><td>${esc(item.stats.label)}</td><td>${esc(item.stats.recentHitRate)}%</td><td>${esc(item.stats.missLabel)}</td></tr>`;
    }
    function poolRelationTable(analysis) {
      const specialRows = specialPoolRelationRows(analysis.yearRows, analysis);
      const specialVerdict = relationVerdict(specialRows);
      return `<section class="panel full"><h2>&#27744;&#23376;&#20851;&#31995;&#35266;&#23519;</h2><p class="muted">&#25226;&#29305;&#21035;&#21495;&#27744;&#23376;&#25353;&#20132;&#38598;&#21644;&#29420;&#26377;&#21495;&#25386;&#24320;&#22238;&#27979;&#65292;&#35266;&#23519;&#24403;&#21069;&#21629;&#20013;&#26159;&#30001;&#32769;&#21495;&#31283;&#23450;&#36824;&#26159;&#24403;&#24180;&#28909;&#27744;&#36129;&#29486;&#12290;</p><table class="compact-table"><thead><tr><th>&#31867;&#22411;</th><th>&#20851;&#31995;</th><th>&#27744;&#23376;</th><th>&#31383;&#21475;&#21629;&#20013;</th><th>&#36817;10&#31383;&#21475;</th><th>&#28431;&#31383;</th></tr></thead><tbody>
        ${specialRows.map(item => poolRelationRow('\u7279\u522B\u53F7', item)).join('')}
      </tbody></table><p class="muted">&#29305;&#21035;&#21495;&#20851;&#31995;&#32467;&#35770;&#65306;${specialVerdict}</p></section>`;
    }
    function triggerDecisionItem(name, item, context) {
      const plus = [];
      const minus = [];
      let score = 50;
      const edge = Number(item.edge || 0);
      const recent = Number(item.recentHitRate || 0);
      const hitRate = Number(item.hitRate || 0);
      const currentMiss = Number(item.currentMiss || 0);
      const maxMiss = Number(item.maxMiss || 0);
      if (edge > 0) { score += Math.min(18, edge * 0.8); plus.push('&#36229;&#36807;&#38543;&#26426;&#22522;&#20934;'); }
      else { score -= 18; minus.push('&#20302;&#20110;&#38543;&#26426;&#22522;&#20934;'); }
      if (recent > hitRate) { score += 8; plus.push('&#36817;10&#31383;&#21475;&#36739;&#24378;'); }
      if (recent + 8 < hitRate) { score -= 8; minus.push('&#36817;10&#31383;&#21475;&#36716;&#24369;'); }
      if (currentMiss > 0) { score -= Math.min(18, currentMiss * 6); minus.push('&#24403;&#21069;&#28431;&#31383;'); }
      if (maxMiss > 0 && currentMiss >= maxMiss) { score -= 16; minus.push('&#25509;&#36817;&#21382;&#21490;&#26368;&#22823;&#28431;&#31383;'); }
      if (context.rhythm?.phase === '&#26089;&#26399;&#35266;&#23519;' || context.rhythm?.phase === '&#24179;&#31283;&#35266;&#23519;') { score += 6; plus.push('&#33410;&#22863;&#21487;&#35266;&#23519;'); }
      if (context.rhythm?.phase === '&#21518;&#21322;&#31383;&#21387;&#21147;') { score -= 10; minus.push('&#21518;&#21322;&#31383;&#21387;&#21147;'); }
      if (context.rhythm?.phase === '&#36830;&#20013;&#34928;&#20943;') { score -= 6; minus.push('&#36830;&#20013;&#34928;&#20943;'); }
      if (context.failure?.topTag === '&#20248;&#21270;&#27744;&#32988;&#20986;') { score -= 8; minus.push('&#21407;&#27744;&#36755;&#32473;&#20248;&#21270;&#27744;'); }
      if (context.failure?.topTag === '&#32467;&#26500;&#20559;&#26012;') { score -= 10; minus.push('&#32467;&#26500;&#20559;&#26012;'); }
      if (context.relationVerdict && context.relationVerdict !== '&#26679;&#26412;&#19981;&#36275;') { score += 6; plus.push(context.relationVerdict); }
      if (Number(item.total || 0) < 6) { score -= 10; minus.push('&#26679;&#26412;&#19981;&#36275;'); }
      score = Math.max(0, Math.min(100, Math.round(score)));
      let action = '&#27491;&#24120;&#35266;&#23519;';
      if (score >= 85) action = '&#24378;&#36319;&#36394;';
      else if (context.rhythm?.phase === '&#21518;&#21322;&#31383;&#21387;&#21147;' || (maxMiss > 0 && currentMiss >= maxMiss)) action = '&#31561;&#24453;&#31383;&#21475;&#32467;&#26463;';
      else if (score >= 70) action = '&#27491;&#24120;&#35266;&#23519;';
      else if (score >= 55) action = '&#38477;&#26435;&#35266;&#23519;';
      else if (score >= 40) action = '&#35302;&#21457;&#37325;&#31639;';
      else action = '&#26242;&#20572;&#35813;&#35268;&#24459;';
      return {name, score, action, plus: plus.slice(0, 3), minus: minus.slice(0, 3), phase: context.rhythm?.phase || '-'};
    }
    function triggerDecisionTable(analysis) {
      const specialRows = specialPoolRelationRows(analysis.yearRows, analysis);
      const rows = [
        triggerDecisionItem('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', analysis.special, {rhythm: windowRhythmStats(analysis.specialWindows), failure: failureProfileSummary('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', 'special', analysis.specialWindows, analysis.optimized.special.windows, analysis.special), relationVerdict: relationVerdict(specialRows)}),
        triggerDecisionItem('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', analysis.stable, {rhythm: windowRhythmStats(analysis.stableWindows), failure: failureProfileSummary('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', 'special', analysis.stableWindows, analysis.optimized.stable.windows, analysis.stable), relationVerdict: relationVerdict(specialRows)})
      ];
      return `<section class="panel full"><h2>&#26465;&#20214;&#35302;&#21457;&#24635;&#34920;</h2><p class="muted">&#27719;&#24635;&#21629;&#20013;&#36229;&#39069;&#12289;&#36817;&#26399;&#36235;&#21183;&#12289;&#28431;&#31383;&#12289;&#33410;&#22863;&#12289;&#22833;&#36133;&#30011;&#20687;&#21644;&#27744;&#23376;&#20851;&#31995;&#65292;&#29992;&#20110;&#21028;&#26029;&#24403;&#21069;&#31383;&#21475;&#35813;&#24378;&#36319;&#36394;&#12289;&#35266;&#23519;&#36824;&#26159;&#38477;&#26435;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#35302;&#21457;&#35780;&#20998;</th><th>&#24403;&#21069;&#29366;&#24577;</th><th>&#20027;&#35201;&#21152;&#20998;</th><th>&#20027;&#35201;&#25187;&#20998;</th><th>&#24314;&#35758;&#21160;&#20316;</th></tr></thead><tbody>${rows.map(item => `<tr><td>${item.name}</td><td>${esc(item.score)}</td><td>${item.phase}</td><td>${item.plus.join('<br>') || '-'}</td><td>${item.minus.join('<br>') || '-'}</td><td>${item.action}</td></tr>`).join('')}</tbody></table></section>`;
    }
    function patternWatchAnalysis(source) {
      const special = fiveWindowAnalysis(source);
      const three = threeWindowAnalysis(source);
      const specialStats = patternStats(special.yearWindows);
      const stableStats = patternStats(special.stableWindows);
      const specialBaseline = singleDrawBaseline(special.yearPool.length, 49);
      const stableBaseline = randomWindowBaseline(special.stablePool.length, 49, 5);
      const yearRows = cachedSourceRecords(source).filter(row => displayYear(row) === special.currentYear);
      const optimizedSpecial = optimizedSpecialPool(yearRows, special.yearPool, 8);
      const optimizedStable = optimizedSpecialPool(yearRows, special.stablePool, 15);
      const optimizedSpecialWindows = fiveWindowCoverage(yearRows, optimizedSpecial);
      const optimizedStableWindows = fiveWindowCoverage(yearRows, optimizedStable);
      const optimizedSpecialStats = patternStats(optimizedSpecialWindows);
      const optimizedStableStats = patternStats(optimizedStableWindows);
      const compoundPools = (three.compoundPools || []).map(item => ({...item, baseline: randomWindowBaseline(Number(item.poolSize || 0), 49, 5)}));
      const crossYearCompoundPools = (three.crossYearPools || []).map(item => ({...item, baseline: randomWindowBaseline(Number(item.poolSize || 0), 49, 5)}));
      return {
        source,
        currentYear: special.currentYear,
        yearRows,
        yearPool: special.yearPool,
        stablePool: special.stablePool,
        threeCompoundPools: compoundPools,
        crossYearThreeCompoundPools: crossYearCompoundPools,
        specialWindows: special.yearWindows,
        stableWindows: special.stableWindows,
        special: {...specialStats, baseline: specialBaseline, edge: Math.round((specialStats.hitRate - specialBaseline) * 100) / 100, level: patternLevel(specialStats.hitRate - specialBaseline, specialStats.currentMiss, specialStats.maxMiss), poolSize: special.yearPool.length, structure: specialStructureStats(yearRows)},
        stable: {...stableStats, baseline: stableBaseline, edge: Math.round((stableStats.hitRate - stableBaseline) * 100) / 100, level: patternLevel(stableStats.hitRate - stableBaseline, stableStats.currentMiss, stableStats.maxMiss), poolSize: special.stablePool.length, structure: specialStructureStats(yearRows)},
        optimized: {special: {pool: optimizedSpecial, stats: optimizedSpecialStats, windows: optimizedSpecialWindows}, stable: {pool: optimizedStable, stats: optimizedStableStats, windows: optimizedStableWindows}}
      };
    }
    function specialPoolReviewGroups(rows, pool, limit = 10) {
      const poolSet = new Set(normalizedPool(pool));
      return rows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.issue || 0) - Number(a.issue || 0)).slice(0, limit).map(row => {
        const actualNumbers = [specialNum(row)];
        return {date: row.date || '', issue: row.issue || '', hit: poolSet.has(actualNumbers[0]), actualNumbers};
      });
    }
    function poolSnapshotForIssue(poolItem, issue) {
      const win = asArray(poolItem?.windows || poolItem?.yearWindows).find(item => Number(item.start || 0) <= Number(issue || 0) && Number(item.end || 0) >= Number(issue || 0));
      return normalizedPool(win?.poolSnapshot?.length ? win.poolSnapshot : poolItem?.pool || []);
    }
    function threePoolReviewGroups(rows, poolItem, limit = 10) {
      const currentPool = normalizedPool(poolItem?.pool || []);
      const currentSet = new Set(currentPool);
      return rows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.issue || 0) - Number(a.issue || 0)).slice(0, limit).map(row => {
        const actualNumbers = regularNums(row);
        const effectivePool = poolSnapshotForIssue(poolItem, row.issue);
        const effectiveSet = new Set(effectivePool);
        const matched = actualNumbers.filter(num => effectiveSet.has(num));
        const currentMatched = actualNumbers.filter(num => currentSet.has(num));
        return {date: row.date || '', issue: row.issue || '', hit: matched.length >= 3, currentHit: currentMatched.length >= 3, actualNumbers, poolSnapshot: effectivePool, matched, currentMatched};
      });
    }
    function singleDrawBaseline(pickCount, totalCount = 49) {
      return totalCount ? Math.round(Number(pickCount || 0) / totalCount * 10000) / 100 : 0;
    }
    function yearPoolHistoryTable(history) {
      const rows = (Array.isArray(history) ? history : []).slice(0, 10);
      if (!rows.length) return `<section class="panel full"><h2>&#35206;&#30422;&#27744;&#21464;&#26356;&#26085;&#24535;</h2><p class="muted">&#26242;&#26080;&#21464;&#26356;&#35760;&#24405;</p></section>`;
      return `<section class="panel full"><h2>&#35206;&#30422;&#27744;&#21464;&#26356;&#26085;&#24535;</h2><table class="compact-table"><thead><tr><th>&#26102;&#38388;</th><th>&#35302;&#21457;&#26399;&#21495;</th><th>&#21464;&#26356;&#21069;</th><th>&#21464;&#26356;&#21518;</th><th>&#26032;&#22686;</th><th>&#31227;&#38500;</th><th>&#21407;&#22240;</th></tr></thead><tbody>${rows.map(item => `<tr><td>${esc(item.changedAt || '-')}</td><td>${esc(item.issue || '-')}</td><td>${numberChips(item.beforePool || [])}</td><td>${numberChips(item.afterPool || [])}</td><td>${numberChips(item.added || [])}</td><td>${numberChips(item.removed || [])}</td><td>${statusText(item.reason)}</td></tr>`).join('')}</tbody></table></section>`;
    }
    function latestYearPoolChangeHtml(history) {
      const latestYearPoolChange = Array.isArray(history) && history.length ? history[0] : null;
      if (!latestYearPoolChange) return '';
      const added = Array.isArray(latestYearPoolChange.added) ? latestYearPoolChange.added : [];
      const removed = Array.isArray(latestYearPoolChange.removed) ? latestYearPoolChange.removed : [];
      if (!added.length && !removed.length) return '';
      return `<div class="change-summary"><p>&#26368;&#26032;&#21464;&#26356;&#65306;${esc(latestYearPoolChange.issue || '-')}&#26399;</p><p>&#26032;&#22686;&#65306;${added.length ? numberChips(added) : '-'}</p><p>&#31227;&#38500;&#65306;${removed.length ? numberChips(removed) : '-'}</p></div>`;
    }
    async function renderWindow5Details(source) {
      await ensureRecordsData();
      const analysis = fiveWindowAnalysis(source);
      const missRows = analysis.yearly.map(row => `<tr><td>${esc(row.year)}</td><td>${esc(row.covered)} / ${esc(row.total)}</td><td>${esc(row.total - row.covered)}</td><td>${row.misses.slice(0, 12).map(item => `${String(item.start).padStart(3, '0')}-${String(item.end).padStart(3, '0')}`).join(', ') || '-'}</td></tr>`).join('');
      const window5HitText = item => (item.hits || []).map(hit => `${esc(hit.issue)}:${esc(hit.num)}`).join(', ') || '-';
      return `
        ${yearPoolHistoryTable(analysis.yearPoolHistory)}
        <section class="panel full"><h2>&#24403;&#24180;&#31383;&#21475;&#26126;&#32454;</h2><div class="table-scroll"><table class="compact-table"><thead><tr><th>&#31383;&#21475;</th><th>&#24403;&#26102;&#27744;</th><th>&#24050;&#24320;</th><th>&#29366;&#24577;</th><th>&#21629;&#20013;</th></tr></thead><tbody>${analysis.yearWindows.map(item => `<tr><td>${String(item.start).padStart(3, '0')}-${String(item.end).padStart(3, '0')}</td><td>${numberChips(item.poolSnapshot || analysis.yearPool)}</td><td>${esc(item.count)}</td><td>${item.covered ? '&#24050;&#35206;&#30422;' : '&#35266;&#23519;&#20013;'}</td><td>${window5HitText(item)}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="panel full"><h2>&#24180;&#24230;&#22238;&#27979;</h2><div class="table-scroll"><table class="compact-table"><thead><tr><th>&#24180;&#20221;</th><th>&#35206;&#30422;&#31383;&#21475;</th><th>&#28431;&#31383;&#21475;</th><th>&#28431;&#31383;&#21475;&#21015;&#34920;</th></tr></thead><tbody>${missRows}</tbody></table></div></section>`;
    }
    function renderWindow5() {
      const selected = document.getElementById('window5-source')?.value || 'am';
      const analysis = fiveWindowAnalysis(selected);
      const win = analysis.currentWindow;
      const hitText = win.hits.length ? win.hits.map(item => `${esc(item.issue)}&#26399; ${esc(item.num)}`).join(' / ') : '&#35266;&#23519;&#20013;';
      app.innerHTML = `<div class="grid">
        <section class="panel full"><div class="filters"><label>&#26469;&#28304;<select id="window5-source">${sourceOptions(selected)}</select></label></div></section>
        <section class="panel wide"><h2>5&#26399;&#31383;&#21475;&#35266;&#23519;</h2><p>${esc(analysis.currentYear)}&#24180; ${String(win.start).padStart(3, '0')}-${String(win.end).padStart(3, '0')}&#31383;&#21475;</p><p>&#24050;&#24320;&#65306;${esc(win.count)}&#26399;&#65292;&#21097;&#20313;&#65306;${esc(Math.max(0, 5 - win.count))}&#26399;</p><p>&#29366;&#24577;&#65306;${win.covered ? '&#24050;&#35206;&#30422;' : '&#35266;&#23519;&#20013;'}</p><p>&#21629;&#20013;&#65306;${hitText}</p></section>
        <section class="panel"><h2>&#24403;&#24180;&#35206;&#30422;&#27744;</h2>${numberChips(analysis.yearPool)}<p>${statusText(analysis.adjustmentStatus)}</p><p class="muted">${statusText(analysis.adjustmentReason)}</p>${latestYearPoolChangeHtml(analysis.yearPoolHistory)}<p class="muted">&#21464;&#26356;&#26102;&#38388;&#65306;${esc(analysis.changeTime || '-')}</p></section>
        <section class="panel"><h2>&#36328;&#24180;&#31283;&#23450;&#27744;</h2>${numberChips(analysis.stablePool)}<p>${statusText(analysis.stablePoolStatus)}</p><p class="muted">${statusText(analysis.stablePoolReason)}</p><p>&#20248;&#21270;&#65306;${statusText(analysis.stablePoolOptimizationStatus)}</p><p class="muted">${statusText(analysis.stablePoolOptimizationReason)}</p><p class="muted">&#21464;&#26356;&#26102;&#38388;&#65306;${esc(analysis.stablePoolChangeTime || '-')}</p><p class="muted">&#19979;&#27425;&#37325;&#31639;&#26399;&#21495;&#65306;${esc(analysis.stablePoolNextRecalcIssue || '-')}</p></section>
        <section class="panel full"><h2>&#26126;&#32454;&#25968;&#25454;</h2><div class="detail-placeholder"><button class="secondary window5-detail-toggle" type="button">&#23637;&#24320;&#21464;&#26356;&#35760;&#24405;&#12289;&#24403;&#24180;&#31383;&#21475;&#26126;&#32454;&#21644;&#24180;&#24230;&#22238;&#27979;</button></div><div id="window5-details"></div></section>
      </div>`;
      document.getElementById('window5-source').addEventListener('change', renderWindow5);
      document.querySelector('.window5-detail-toggle')?.addEventListener('click', async () => {
        const detail = document.getElementById('window5-details');
        if (!detail || detail.dataset.loaded === '1') return;
        detail.innerHTML = '<p class="muted">&#21152;&#36733;&#26126;&#32454;&#20013;...</p>';
        detail.innerHTML = await renderWindow5Details(selected);
        detail.dataset.loaded = '1';
      });
    }
    function threeCompoundHistoryTable(pools) {
      const rows = [];
      (pools || []).forEach(pool => {
        (pool.changeHistory || []).slice(0, 8).forEach(item => {
          rows.push({poolSize: pool.poolSize, ...item});
        });
      });
      if (!rows.length) {
        return `<section class="panel full"><h2>&#19977;&#20013;&#19977;&#22797;&#24335;&#27744;&#21464;&#26356;&#35760;&#24405;</h2><p class="muted">&#26242;&#26080;&#21464;&#26356;&#35760;&#24405;&#65292;&#24403;&#21069;&#27744;&#23376;&#27839;&#29992;&#19978;&#27425;&#32467;&#26524;&#12290;</p></section>`;
      }
      rows.sort((a, b) => String(b.changedAt || '').localeCompare(String(a.changedAt || '')) || Number(b.poolSize || 0) - Number(a.poolSize || 0));
      const changedRows = rows.filter(item => Number(item.changeCount || 0) > 0);
      const visibleRows = (changedRows.length ? changedRows : rows).slice(0, 12);
      const hiddenCount = Math.max(0, rows.length - visibleRows.length);
      const threeCompoundChangeSummary = item => {
        const added = asArray(item.added);
        const removed = asArray(item.removed);
        if (!added.length && !removed.length) return '&#26080;&#21464;&#21270;';
        return `<div class="change-summary"><div class="change-summary-row"><span class="change-summary-label">&#26032;&#22686;</span>${added.length ? numberChips(added) : '<span class="muted">-</span>'}</div><div class="change-summary-row"><span class="change-summary-label">&#31227;&#38500;</span>${removed.length ? numberChips(removed) : '<span class="muted">-</span>'}</div></div>`;
      };
      const coverageChangeText = item => `${esc(item.beforeCovered ?? '-')} / ${esc(item.afterCovered ?? '-')}<br>${esc(item.beforeHitRate ?? '-')}% -> ${esc(item.afterHitRate ?? '-')}%`;
      const detailBlock = item => `<details class="change-detail"><summary>&#23637;&#24320;</summary><div class="grid mini-grid"><div><p class="muted">&#26087;&#27744;</p>${numberChips(item.beforePool || [])}</div><div><p class="muted">&#26032;&#27744;</p>${numberChips(item.afterPool || [])}</div><div><p class="muted">&#20445;&#30041;</p>${numberChips(item.kept || [])}</div><div><p class="muted">&#26032;&#22686;</p>${numberChips(item.added || [])}</div><div><p class="muted">&#31227;&#38500;</p>${numberChips(item.removed || [])}</div></div></details>`;
      const historyRows = items => items.map(item => `<tr><td>${esc(item.changedAt || '-')}</td><td>${esc(item.issue || '-')}</td><td>${esc(item.poolSize)}&#30721;</td><td>${threeCompoundChangeSummary(item)}</td><td>${coverageChangeText(item)}</td><td>${statusText(item.changeLevel)}<br><span class="muted">${esc(item.changeCount ?? 0)}&#20010;&#21464;&#21270;</span></td><td>${detailBlock(item)}</td></tr>`).join('');
      const tableHead = `<thead><tr><th>&#26102;&#38388;</th><th>&#26399;&#21495;</th><th>&#35268;&#27169;</th><th>&#21464;&#21270;&#25688;&#35201;</th><th>&#35206;&#30422;&#21464;&#21270;</th><th>&#24133;&#24230;</th><th>&#35814;&#24773;</th></tr></thead>`;
      const allHistory = hiddenCount ? `<details class="change-history-all"><summary>&#26174;&#31034;&#20840;&#37096;&#35760;&#24405;&#65288;&#21547;0&#20010;&#21464;&#21270;/&#31283;&#23450;&#35760;&#24405;&#65289;</summary><div class="table-scroll"><table class="compact-table">${tableHead}<tbody>${historyRows(rows)}</tbody></table></div></details>` : `<p class="muted">&#26174;&#31034;&#20840;&#37096;&#35760;&#24405;</p>`;
      return `<section class="panel full"><h2>&#19977;&#20013;&#19977;&#22797;&#24335;&#27744;&#21464;&#26356;&#35760;&#24405;</h2><p class="muted">&#40664;&#35748;&#21482;&#26174;&#31034;&#26377;&#26032;&#22686;/&#31227;&#38500;&#30340;&#35760;&#24405;&#65292;&#23436;&#25972;&#27744;&#23376;&#28857;&#20987;&#23637;&#24320;&#26597;&#30475;&#12290;</p><div class="table-scroll"><table class="compact-table">${tableHead}<tbody>${historyRows(visibleRows)}</tbody></table></div>${hiddenCount ? `<p class="muted">&#24050;&#38544;&#34255; ${esc(hiddenCount)} &#26465;&#31283;&#23450;/&#36739;&#26087;&#35760;&#24405;&#12290;</p>` : ''}${allHistory}</section>`;
    }
    function threeCrossYearPoolTable(analysis) {
      const rows = (analysis.crossYearPools || []).map(item => {
        const winRows = item.yearWindows || item.windows || [];
        const misses = winRows.filter(win => Number(win.count || 0) >= 5 && !win.covered);
        const current = winRows.find(win => win.start === analysis.currentWindow.start) || {hits: [], covered: false, count: 0};
        const currentHits = (current.hits || []).map(hit => `${esc(hit.issue)}:${esc(hitMatchedText(hit))}`).join(', ') || '-';
        const yearCovered = item.yearCovered ?? item.covered ?? 0;
        const yearTotal = item.yearTotal ?? item.total ?? 0;
        const yearHitRate = item.yearHitRate ?? item.hitRate ?? 0;
        return `<tr><td>${esc(item.poolSize)}&#30721;</td><td>${numberChips(item.pool || [])}</td><td>${esc(yearCovered)} / ${esc(yearTotal)}<br>${esc(yearHitRate)}%</td><td>${esc(item.historyCovered ?? '-')} / ${esc(item.historyTotal ?? '-')}<br>${esc(item.historyHitRate ?? '-')}%</td><td>${numberChips(item.intersection || [])}<br><span class="muted">${esc(item.intersectionCount ?? 0)}&#20010;</span></td><td>${numberChips(item.crossYearOnly || [])}</td><td>${numberChips(item.yearOnly || [])}</td><td>${esc(item.yearCurrentMiss ?? item.currentMiss ?? 0)} / ${esc(item.yearMaxMiss ?? item.maxMiss ?? 0)}</td><td>${esc(misses.slice(0, 8).map(win => `${String(win.start).padStart(3, '0')}-${String(win.end).padStart(3, '0')}`).join(', ') || '-')}</td><td>${current.covered ? '&#24050;&#21629;&#20013;' : '&#35266;&#23519;&#20013;'}</td><td>${currentHits}</td></tr>`;
      }).join('');
      return `<section class="panel full"><h2>&#36328;&#24180;&#22797;&#24335;&#27744;&#65288;&#20840;&#37096;&#21382;&#21490;&#65289;</h2><p class="muted">&#29992;&#35813;&#26469;&#28304;&#20840;&#37096;&#21382;&#21490;&#24320;&#22870;&#29983;&#25104;5/6/7/8&#30721;&#27744;&#65292;&#20877;&#22238;&#25918;&#21040;&#24403;&#24180;5&#26399;&#31383;&#21475;&#35266;&#23519;&#24403;&#21069;&#26377;&#25928;&#24615;&#12290;</p><div class="table-scroll"><table class="compact-table"><thead><tr><th>&#35268;&#27169;</th><th>&#36328;&#24180;&#27744;</th><th>&#24403;&#24180;&#35206;&#30422;</th><th>&#20840;&#21382;&#21490;&#35206;&#30422;</th><th>&#19982;&#24403;&#24180;&#20132;&#38598;</th><th>&#36328;&#24180;&#29420;&#26377;</th><th>&#24403;&#24180;&#29420;&#26377;</th><th>&#28431;&#31383;</th><th>&#24403;&#24180;&#28431;&#31383;</th><th>&#24403;&#21069;&#31383;&#21475;</th><th>&#24403;&#21069;&#21629;&#20013;</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
    }
    function threeWindowDetailHtml(analysis) {
      return `
        ${threeCrossYearPoolTable(analysis)}
        ${threeCompoundHistoryTable(analysis.compoundPools)}
        <section class="panel full"><h2>8&#30721;&#22797;&#24335;&#27744;&#31383;&#21475;&#26126;&#32454;</h2><div class="table-scroll"><table class="compact-table"><thead><tr><th>&#31383;&#21475;</th><th>&#24403;&#26102;&#27744;</th><th>&#24050;&#24320;</th><th>&#29366;&#24577;</th><th>&#21629;&#20013;&#21495;&#30721;</th></tr></thead><tbody>${analysis.yearWindows.map(item => `<tr><td>${String(item.start).padStart(3, '0')}-${String(item.end).padStart(3, '0')}</td><td>${numberChips(item.poolSnapshot || analysis.numberPool)}</td><td>${esc(item.count)}</td><td>${item.covered ? '&#24050;&#21629;&#20013;' : '&#35266;&#23519;&#20013;'}</td><td>${item.hits.slice(0, 8).map(hit => `${esc(hit.issue)}:${esc(hitMatchedText(hit))}`).join(', ') || '-'}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
    function bindThreeWindowControls(analysis) {
      document.getElementById('three-window5-source')?.addEventListener('change', renderThreeWindow5);
      document.querySelector('.three-window-detail-toggle')?.addEventListener('click', () => {
        const detail = document.getElementById('three-window-details');
        if (!detail || detail.dataset.loaded === '1') return;
        detail.innerHTML = threeWindowDetailHtml(analysis);
        detail.dataset.loaded = '1';
      });
    }
    function renderThreeWindow5() {
      const selected = document.getElementById('three-window5-source')?.value || 'am';
      const htmlCacheKey = `${selected}|${threeCompoundState?.generatedAt || ''}|${records.length}`;
      const cachedAnalysis = threeWindowAnalysisCache.get(`${selected}|${threeCompoundState?.generatedAt || ''}|${records.length}`);
      if (threeWindowHtmlCache.has(htmlCacheKey)) {
        app.innerHTML = threeWindowHtmlCache.get(htmlCacheKey);
        bindThreeWindowControls(cachedAnalysis || threeWindowAnalysis(selected));
        return;
      }
      const analysis = threeWindowAnalysis(selected);
      const win = analysis.currentWindow;
      const hitText = win.hits.length ? win.hits.map(item => `${esc(item.issue)}&#26399; ${esc(hitMatchedText(item))}`).join(' / ') : '&#35266;&#23519;&#20013;';
      const poolRows = analysis.compoundPools.map(item => {
        const misses = item.windows.filter(win => Number(win.count || 0) >= 5 && !win.covered);
        const current = item.windows.find(win => win.start === analysis.currentWindow.start) || {hits: [], covered: false, count: 0};
        const currentHits = current.hits.map(hit => `${esc(hit.issue)}:${esc(hitMatchedText(hit))}`).join(', ') || '-';
        const recent = recentWindowStats(item);
        return `<tr><td>${esc(item.poolSize)}&#30721;</td><td>${numberChips(item.pool)}</td><td>${esc(item.covered)} / ${esc(item.total)}</td><td>${esc(item.hitRate)}%</td><td>${esc(recent.covered)} / ${esc(recent.total)}<br>${esc(recent.hitRate)}%</td><td>${esc(item.currentMiss ?? 0)} / ${esc(item.maxMiss ?? 0)}</td><td>${statusText(item.healthStatus)}<br><span class="muted">${statusText(item.healthReason)}</span></td><td>${esc(item.hitDraws)}</td><td>${esc(misses.slice(0, 8).map(win => `${String(win.start).padStart(3, '0')}-${String(win.end).padStart(3, '0')}`).join(', ') || '-')}</td><td>${current.covered ? '&#24050;&#21629;&#20013;' : '&#35266;&#23519;&#20013;'}</td><td>${currentHits}</td></tr>`;
      }).join('');
      const html = `<div class="grid">
        <section class="panel full"><div class="filters"><label>&#26469;&#28304;<select id="three-window5-source">${sourceOptions(selected)}</select></label></div></section>
        <section class="panel wide"><h2>&#19977;&#20013;&#19977;5&#26399;&#31383;&#21475;</h2><p>${esc(analysis.currentYear)}&#24180; ${String(win.start).padStart(3, '0')}-${String(win.end).padStart(3, '0')}&#31383;&#21475;</p><p>&#24050;&#24320;&#65306;${esc(win.count)}&#26399;&#65292;&#21097;&#20313;&#65306;${esc(Math.max(0, 5 - win.count))}&#26399;</p><p>&#29366;&#24577;&#65306;${win.covered ? '&#24050;&#21629;&#20013;' : '&#35266;&#23519;&#20013;'}</p><p>&#21629;&#20013;&#65306;${hitText}</p></section>
        <section class="panel"><h2>&#31383;&#21475;&#25112;&#32489;</h2><p>&#24403;&#21069;&#28431;&#31383;&#65306;${esc(analysis.stats.currentMiss)}</p><p>&#21382;&#21490;&#26368;&#22823;&#28431;&#31383;&#65306;${esc(analysis.stats.maxMiss)}</p><p>&#32479;&#35745;&#31383;&#21475;&#65306;${esc(analysis.stats.total)}&#65292;&#21629;&#20013;&#65306;${esc(analysis.stats.hits)}</p><p>&#31383;&#21475;&#21629;&#20013;&#29575;&#65306;${esc(analysis.stats.hitRate)}%</p></section>
        <section class="panel full"><h2>&#19977;&#20013;&#19977;&#22797;&#24335;&#27744;&#23545;&#27604;</h2><div class="table-scroll"><table class="compact-table"><thead><tr><th>&#35268;&#27169;</th><th>&#22797;&#24335;&#27744;</th><th>&#31383;&#21475;&#35206;&#30422;</th><th>&#35206;&#30422;&#29575;</th><th>&#36817;10&#31383;&#21475;</th><th>&#28431;&#31383;</th><th>&#20581;&#24247;&#29366;&#24577;</th><th>&#21629;&#20013;&#24320;&#22870;</th><th>&#23436;&#25972;&#28431;&#31383;</th><th>&#24403;&#21069;&#31383;&#21475;</th><th>&#24403;&#21069;&#21629;&#20013;</th></tr></thead><tbody>${poolRows}</tbody></table></div></section>
        <section class="panel full"><h2>&#26126;&#32454;&#25968;&#25454;</h2><div class="detail-placeholder"><button class="secondary three-window-detail-toggle" type="button">&#23637;&#24320;&#36328;&#24180;&#27744;&#12289;&#21464;&#26356;&#35760;&#24405;&#21644;8&#30721;&#31383;&#21475;&#26126;&#32454;</button></div><div id="three-window-details"></div></section>
      </div>`;
      threeWindowHtmlCache.set(htmlCacheKey, html);
      app.innerHTML = html;
      bindThreeWindowControls(analysis);
    }
    function patternMetricRow(name, item, sizeLabel) {
      return `<tr><td>${name}</td><td>${esc(sizeLabel)}</td><td>${esc(item.hitRate)}%</td><td>${esc(item.baseline)}%</td><td>${esc(item.edge)}%</td><td>${esc(item.currentMiss)}</td><td>${esc(item.maxMiss)}</td><td>${esc(item.recentHitRate)}%</td><td>${item.level}</td></tr>`;
    }
    function threeCompoundPatternTable(analysis) {
      const buildRows = (items, groupName) => (items || []).map(item => {
        const hitRate = Number(item.hitRate || 0);
        const baseline = Number(item.baseline || 0);
        const edge = Math.round((hitRate - baseline) * 100) / 100;
        const level = patternLevel(edge, Number(item.currentMiss || 0), Number(item.maxMiss || 0));
        const recent = recentWindowStats(item);
        return `<tr><td>${groupName}</td><td>${esc(item.poolSize)}&#30721;</td><td>${numberChips(item.pool || [])}</td><td>${esc(item.covered || 0)} / ${esc(item.total || 0)}</td><td>${esc(hitRate)}%</td><td>${esc(baseline)}%</td><td>${esc(edge)}%</td><td>${esc(recent.covered)} / ${esc(recent.total)}<br>${esc(recent.hitRate)}%</td><td>${esc(item.currentMiss ?? 0)} / ${esc(item.maxMiss ?? 0)}</td><td>${level}</td><td>${statusText(item.healthStatus)}<br><span class="muted">${statusText(item.healthReason)}</span></td></tr>`;
      });
      const rows = buildRows(analysis.threeCompoundPools, '&#24403;&#24180;&#27744;').concat(buildRows(analysis.crossYearThreeCompoundPools, '&#36328;&#24180;&#27744;')).join('');
      return `<section class="panel full"><h2>&#19977;&#20013;&#19977;&#22797;&#24335;&#27744;&#34920;&#29616;</h2><p class="muted">&#19977;&#20013;&#19977;&#35266;&#23519;5/6/7/8&#30721;&#22797;&#24335;&#27744;&#12290;&#24403;&#24180;&#27744;&#29992;&#24403;&#24180;&#25968;&#25454;&#29983;&#25104;&#65292;&#36328;&#24180;&#27744;&#29992;&#20840;&#37096;&#21382;&#21490;&#29983;&#25104;&#24182;&#22238;&#25918;&#24403;&#24180;&#31383;&#21475;&#12290;</p><table class="compact-table"><thead><tr><th>&#31867;&#22411;</th><th>&#35268;&#27169;</th><th>&#22797;&#24335;&#27744;</th><th>&#23436;&#25972;&#31383;&#21475;&#35206;&#30422;</th><th>&#35206;&#30422;&#29575;</th><th>&#38543;&#26426;&#22522;&#20934;</th><th>&#36229;&#39069;</th><th>&#36817;10&#31383;&#21475;</th><th>&#28431;&#31383;</th><th>&#31561;&#32423;</th><th>&#20581;&#24247;&#29366;&#24577;</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    }
    function simpleRankList(items) {
      return `<table class="compact-table"><thead><tr><th>&#32467;&#26500;</th><th>&#27425;&#25968;</th></tr></thead><tbody>${items.map(item => `<tr><td>${esc(item.name)}</td><td>${esc(item.count)}</td></tr>`).join('')}</tbody></table>`;
    }
    function renderPatternWatch() {
      const selected = document.getElementById('pattern-source')?.value || 'am';
      const analysis = patternWatchAnalysis(selected);
      app.innerHTML = `<div class="grid">
        <section class="panel full"><div class="filters"><label>&#26469;&#28304;<select id="pattern-source">${sourceOptions(selected)}</select></label></div></section>
        <section class="panel full"><h2>&#35268;&#24459;&#35266;&#23519;</h2><p class="muted">${esc(analysis.currentYear)}&#24180;&#65292;&#23545;&#27604;&#23454;&#38469;5&#26399;&#31383;&#21475;&#21629;&#20013;&#29575;&#19982;&#38543;&#26426;&#22522;&#20934;&#12290;</p><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#35268;&#27169;</th><th>&#23454;&#38469;</th><th>&#38543;&#26426;&#22522;&#20934;</th><th>&#36229;&#39069;</th><th>&#24403;&#21069;&#28431;&#31383;</th><th>&#26368;&#22823;&#28431;&#31383;</th><th>&#36817;10&#31383;&#21475;</th><th>&#31561;&#32423;</th></tr></thead><tbody>
          ${patternMetricRow('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', analysis.special, `${analysis.special.poolSize}\u7801`)}
          ${patternMetricRow('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', analysis.stable, `${analysis.stable.poolSize}\u7801`)}
        </tbody></table></section>
        ${threeCompoundPatternTable(analysis)}
        ${triggerDecisionTable(analysis)}
        ${patternScoreTable(analysis)}
        ${patternDiagnosticsTable(analysis)}
        ${windowRhythmTable(analysis)}
        ${failureProfileTable(analysis)}
        ${poolRelationTable(analysis)}
        <section class="panel full"><h2>&#35268;&#24459;&#20248;&#21270;&#27744;</h2><p class="muted">&#21407;&#27744;&#19981;&#21160;&#65292;&#27492;&#22788;&#20165;&#29992;&#20110;&#35266;&#23519;&#35268;&#24459;&#32467;&#26500;&#20248;&#21270;&#21518;&#30340;&#22238;&#27979;&#34920;&#29616;&#12290;</p><div class="grid">
          <section class="panel"><h2>&#29305;&#21035;&#21495;&#24403;&#24180;8&#30721;&#20248;&#21270;</h2>${numberChips(analysis.optimized.special.pool)}<p class="muted">&#20445;&#30041;&#21407;&#27744;&#26680;&#24515;&#65292;&#25353;&#24403;&#24180;&#39057;&#27425;&#12289;&#39068;&#33394;&#12289;&#23614;&#25968;&#20998;&#25955;&#20248;&#21270;&#12290;</p></section>
          <section class="panel"><h2>&#29305;&#21035;&#21495;&#36328;&#24180;&#31283;&#23450;&#20248;&#21270;</h2>${numberChips(analysis.optimized.stable.pool)}<p class="muted">&#20445;&#30041;&#36328;&#24180;&#31283;&#23450;&#27744;&#26435;&#37325;&#65292;&#25353;&#24403;&#24180;&#32467;&#26500;&#20570;&#36731;&#37327;&#35843;&#25972;&#12290;</p></section>
        </div></section>
        <section class="panel full"><h2>&#20248;&#21270;&#34920;&#29616;&#23545;&#27604;</h2><table class="compact-table"><thead><tr><th>&#35266;&#23519;&#39033;</th><th>&#21407;&#22987;&#23454;&#38469;</th><th>&#20248;&#21270;&#23454;&#38469;</th><th>&#38543;&#26426;&#22522;&#20934;</th><th>&#21407;&#22987;&#36229;&#39069;</th><th>&#20248;&#21270;&#36229;&#39069;</th><th>&#21464;&#21270;</th><th>&#32467;&#35770;</th></tr></thead><tbody>
          ${optimizationCompareRow('\u7279\u522B\u53F7\u5F53\u5E748\u7801\u6C60', analysis.special, analysis.optimized.special.stats, analysis.special.baseline)}
          ${optimizationCompareRow('\u7279\u522B\u53F7\u8DE8\u5E74\u7A33\u5B9A\u6C60', analysis.stable, analysis.optimized.stable.stats, analysis.stable.baseline)}
        </tbody></table></section>
        <section class="panel wide"><h2>&#29305;&#21035;&#21495;&#39068;&#33394;&#32467;&#26500;</h2>${simpleRankList(analysis.special.structure.colors)}</section>
        <section class="panel wide"><h2>&#29305;&#21035;&#21495;&#23614;&#25968;&#32467;&#26500;</h2>${simpleRankList(analysis.special.structure.tails.slice(0, 10))}</section>
      </div>`;
      document.getElementById('pattern-source').addEventListener('change', renderPatternWatch);
    }
    function renderHistoryPattern() {
      const selected = document.getElementById('history-pattern-source')?.value || 'am';
      const range = document.getElementById('history-pattern-range')?.value || 'year';
      const analysis = buildHistorySpecialFixed8Analysis(selected, range);
      app.innerHTML = `<div class="grid">
        <section class="panel full">
          <div class="filters">
            <label>&#26469;&#28304;<select id="history-pattern-source">${sourceOptions(selected)}</select></label>
            <label>&#35266;&#23519;&#33539;&#22260;<select id="history-pattern-range"><option value="year" ${range === 'year' ? 'selected' : ''}>&#24403;&#24180;</option><option value="all" ${range === 'all' ? 'selected' : ''}>&#20840;&#37096;&#21382;&#21490;</option></select></label>
          </div>
        </section>
        <section class="panel full">
          <h2>&#21382;&#21490;&#35268;&#24459;&#35266;&#23519;</h2>
          <p class="muted">&#29305;&#21035;&#21495;&#22266;&#23450;8&#30721;&#65292;&#25353;001-005&#12289;006-010&#12289;011-015&#12289;016-020...&#22266;&#23450;5&#26399;&#31383;&#21475;&#22238;&#27979;&#35206;&#30422;&#29575;&#12290;</p>
        </section>
        <section class="panel full">
          <h2>&#29305;&#21035;&#21495;&#22266;&#23450;8&#30721;</h2>
          <div class="grid">
            <section class="panel"><h2>&#35206;&#30422;8&#30721;</h2>${numberChips(analysis.pool)}<p class="muted">${esc(analysis.rangeLabel)}&#65292;${esc(analysis.method)}</p></section>
            <section class="panel"><h2>&#31383;&#21475;&#35206;&#30422;&#29575;</h2><div class="metric">${esc(analysis.hitRate)}%</div><p class="muted">${esc(analysis.covered)} / ${esc(analysis.total)} &#20010;&#23436;&#25972;&#31383;&#21475;</p></section>
            <section class="panel"><h2>&#28431;&#31383;</h2><div class="metric">${esc(analysis.misses.length)}</div><p class="muted">&#24403;&#21069;&#28431;&#31383;&#65306;${esc(analysis.currentMiss)}&#65292;&#26368;&#22823;&#28431;&#31383;&#65306;${esc(analysis.maxMiss)}</p></section>
          </div>
        </section>
        <section class="panel full">
          <h2>&#26410;&#35206;&#30422;&#31383;&#21475;</h2>
          ${historyMissWindowsTable(analysis.misses)}
        </section>
      </div>`;
      document.getElementById('history-pattern-source').addEventListener('change', renderHistoryPattern);
      document.getElementById('history-pattern-range').addEventListener('change', renderHistoryPattern);
    }
    function historyWindowLabel(win) {
      return `${String(win.start).padStart(3, '0')}-${String(win.end).padStart(3, '0')}`;
    }
    function historyMissWindowsTable(windows) {
      const rows = asArray(windows).slice(0, 80);
      if (!rows.length) return '<p class="muted">&#26242;&#26080;&#26410;&#35206;&#30422;&#30340;&#23436;&#25972;&#31383;&#21475;&#12290;</p>';
      return `<div class="table-scroll"><table class="compact-table"><thead><tr><th>&#24180;&#20221;</th><th>&#31383;&#21475;</th><th>&#24320;&#22870;&#25968;</th><th>&#31383;&#21475;&#29305;&#21035;&#21495;</th></tr></thead><tbody>${rows.map(win => `<tr><td>${esc(win.year)}</td><td>${historyWindowLabel(win)}</td><td>${esc(win.count)}</td><td>${numberChips(win.nums)}</td></tr>`).join('')}</tbody></table></div>`;
    }
    function historyFixedFiveWindows(rows) {
      const groups = new Map();
      asArray(rows).forEach(row => {
        const year = displayYear(row);
        if (!year) return;
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year).push(row);
      });
      const windows = [];
      [...groups.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).forEach(([year, yearRows]) => {
        const sorted = yearRows.slice().sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
        const maxIssue = sorted.reduce((max, row) => Math.max(max, Number(row.issue || 0)), 0);
        for (let start = 1; start <= maxIssue; start += 5) {
          const end = start + 4;
          const chunk = sorted.filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end);
          if (chunk.length < 5) continue;
          const nums = [...new Set(chunk.map(specialNum))].sort((a, b) => Number(a) - Number(b));
          windows.push({year, start, end, count: chunk.length, nums});
        }
      });
      return windows;
    }
    function bestFixed8PoolForWindows(windows) {
      const selected = [];
      const uncovered = new Set(asArray(windows).map((_, idx) => idx));
      const allNums = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
      while (selected.length < 8) {
        let best = null;
        allNums.forEach(num => {
          if (selected.includes(num)) return;
          let gain = 0;
          uncovered.forEach(idx => {
            if (windows[idx].nums.includes(num)) gain++;
          });
          if (!best || gain > best.gain || (gain === best.gain && Number(num) < Number(best.num))) best = {num, gain};
        });
        if (!best) break;
        selected.push(best.num);
        [...uncovered].forEach(idx => {
          if (windows[idx].nums.includes(best.num)) uncovered.delete(idx);
        });
      }
      return completeSpecialPool8(selected, []);
    }
    function historyCoverageStats(windows, pool) {
      const poolSet = new Set(pool);
      const evaluated = asArray(windows).map(win => ({...win, covered: win.nums.some(num => poolSet.has(num))}));
      const covered = evaluated.filter(win => win.covered).length;
      const misses = evaluated.filter(win => !win.covered);
      let maxMiss = 0;
      let currentMiss = 0;
      let run = 0;
      evaluated.forEach(win => {
        if (win.covered) {
          maxMiss = Math.max(maxMiss, run);
          run = 0;
        } else {
          run++;
        }
      });
      maxMiss = Math.max(maxMiss, run);
      for (let i = evaluated.length - 1; i >= 0; i--) {
        if (evaluated[i].covered) break;
        currentMiss++;
      }
      return {windows: evaluated, covered, misses, total: evaluated.length, hitRate: evaluated.length ? Math.round(covered / evaluated.length * 10000) / 100 : 0, currentMiss, maxMiss};
    }
    function buildHistorySpecialFixed8Analysis(source, range) {
      const sourceRows = cachedSourceRecords(source).filter(row => row.source === source);
      const latest = sourceRows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.issue || 0) - Number(a.issue || 0))[0];
      const currentYear = displayYear(latest);
      const rows = range === 'all' ? sourceRows : sourceRows.filter(row => displayYear(row) === currentYear);
      const windows = historyFixedFiveWindows(rows);
      const pool = bestFixed8PoolForWindows(windows);
      const stats = historyCoverageStats(windows, pool);
      return {...stats, source, pool, currentYear, range, rangeLabel: range === 'all' ? '&#20840;&#37096;&#21382;&#21490;' : `${currentYear}&#24180;`, method: '&#25353;&#23436;&#25972;5&#26399;&#31383;&#21475;&#35206;&#30422;&#25968;&#36138;&#24515;&#36873;&#21462;&#35206;&#30422;&#29575;&#26368;&#39640;8&#30721;'};
    }
    const defaultFetchUrls = {
      am: 'https://2025kj.zkclhb.com:2025/am.html',
      hk: 'https://2025kj.zkclhb.com:2025/hk.html'
    };
    function manualFetchSourceOptions(selected = 'am') {
      return `<option value="am" ${selected === 'am' ? 'selected' : ''}>&#28595;&#38376;</option><option value="hk" ${selected === 'hk' ? 'selected' : ''}>&#39321;&#28207;</option>`;
    }
    function localFetchCommand(amSourceUrl, amBaseUrl, hkSourceUrl, hkBaseUrl) {
      return `cd C:\\codex\\test\\am; powershell -NoProfile -ExecutionPolicy Bypass -File .\\fetch-all.ps1 -AmSourceUrl "${amSourceUrl}" -AmBaseUrl "${amBaseUrl}" -HkSourceUrl "${hkSourceUrl}" -HkBaseUrl "${hkBaseUrl}" -SkipSnapshot`;
    }
    async function triggerManualFetch() {
      const btn = document.getElementById('manual-fetch-submit');
      const result = document.getElementById('manual-fetch-result');
      const source = document.getElementById('manual-fetch-source').value;
      const sourceUrl = document.getElementById('manual-fetch-url').value.trim();
      const baseUrl = document.getElementById('manual-fetch-base').value.trim() || sourceUrl;
      const amSourceUrl = source === 'am' ? sourceUrl : defaultFetchUrls.am;
      const amBaseUrl = source === 'am' ? baseUrl : defaultFetchUrls.am;
      const hkSourceUrl = source === 'hk' ? sourceUrl : defaultFetchUrls.hk;
      const hkBaseUrl = source === 'hk' ? baseUrl : defaultFetchUrls.hk;
      if (!sourceUrl) {
        result.innerHTML = '<span class="muted">&#35831;&#20808;&#22635;&#20889;&#37319;&#38598;&#32593;&#22336;</span>';
        return;
      }
      btn.disabled = true;
      if (isFileDashboard) {
        const command = localFetchCommand(amSourceUrl, amBaseUrl, hkSourceUrl, hkBaseUrl);
        result.innerHTML = `<strong>&#26412;&#22320;&#25163;&#21160;&#37319;&#38598;</strong><p class="muted">&#26412;&#22320; file:// &#39029;&#38754;&#27809;&#26377; Vercel API&#65292;&#35831;&#22312; PowerShell &#36816;&#34892;&#19979;&#38754;&#21629;&#20196;&#12290;</p><code style="display:block;white-space:normal;word-break:break-all;padding:10px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc">${esc(command)}</code><p class="muted">&#36816;&#34892;&#21518;&#37325;&#26032;&#25171;&#24320;&#26412;&#22320; index.html &#26597;&#30475;&#26368;&#26032;&#25968;&#25454;&#12290;</p>`;
        btn.disabled = false;
        return;
      }
      result.innerHTML = '<span class="muted">&#24050;&#25552;&#20132;&#65292;&#31561;&#24453; GitHub Actions &#24320;&#22987;&#36816;&#34892;...</span>';
      try {
        const response = await fetch('/api/manual-fetch', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({source, sourceUrl, baseUrl, amSourceUrl, amBaseUrl, hkSourceUrl, hkBaseUrl})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.detail || `HTTP ${response.status}`);
        result.innerHTML = `<strong>&#24050;&#35302;&#21457;&#25163;&#21160;&#37319;&#38598;</strong><p class="muted">GitHub Actions &#20250;&#19968;&#27425;&#25235;&#21462;&#28595;&#38376;&#21644;&#39321;&#28207;&#65292;&#24182;&#25552;&#20132;&#26368;&#26032;&#25968;&#25454;&#12290;</p>`;
      } catch (err) {
        result.innerHTML = `<strong>&#35302;&#21457;&#22833;&#36133;</strong><p class="muted">${esc(err.message)}</p>`;
      } finally {
        btn.disabled = false;
      }
    }
    function renderManualFetch() {
      const selected = document.getElementById('manual-fetch-source')?.value || 'am';
      const defaultUrl = defaultFetchUrls[selected] || defaultFetchUrls.am;
      const manualFetchIntro = isFileDashboard
        ? '&#26412;&#22320;&#39029;&#38754;&#19981;&#33021;&#30452;&#25509;&#35843;&#29992; Vercel API&#65292;&#28857;&#20987;&#21518;&#20250;&#29983;&#25104; PowerShell &#37319;&#38598;&#21629;&#20196;&#12290;'
        : '&#22312; Vercel &#39029;&#38754;&#30452;&#25509;&#35302;&#21457; GitHub Actions &#37319;&#38598;&#65292;&#28857;&#20987;&#19968;&#27425;&#20250;&#21516;&#26102;&#37319;&#38598;&#28595;&#38376;&#21644;&#39321;&#28207;&#12290;&#19979;&#26041;&#19979;&#25289;&#26694;&#29992;&#20110;&#20462;&#25913;&#26576;&#19968;&#20010;&#26469;&#28304;&#30340;&#37319;&#38598;&#32593;&#22336;&#12290;';
      app.innerHTML = `<div class="grid">
        <section class="panel full">
          <h2>&#25163;&#21160;&#37319;&#38598;</h2>
          <p class="muted">${manualFetchIntro}</p>
          <div class="filters">
            <label>&#26469;&#28304;<select id="manual-fetch-source">${manualFetchSourceOptions(selected)}</select></label>
            <label>&#37319;&#38598;&#32593;&#22336;<input id="manual-fetch-url" style="min-width:360px" value="${esc(defaultUrl)}"></label>
            <label>Base URL<input id="manual-fetch-base" style="min-width:360px" value="${esc(defaultUrl)}"></label>
          </div>
          <div class="actions"><button id="manual-fetch-submit" class="primary">&#31435;&#21363;&#37319;&#38598;</button><a class="secondary" href="https://github.com/tt88737/Abc/actions/workflows/manual-fetch.yml" target="_blank" rel="noreferrer">GitHub Actions</a></div>
          <div id="manual-fetch-result" class="mini">${isFileDashboard ? '&#28857;&#20987;&#31435;&#21363;&#37319;&#38598;&#21518;&#65292;&#22797;&#21046;&#29983;&#25104;&#30340; PowerShell &#21629;&#20196;&#21040;&#26412;&#26426;&#36816;&#34892;&#12290;' : '&#38656;&#35201;&#22312; Vercel &#37197;&#32622; GITHUB_TOKEN&#65292;&#25165;&#33021;&#20174;&#39029;&#38754;&#35302;&#21457;&#12290;'}</div>
        </section>
      </div>`;
      document.getElementById('manual-fetch-source').addEventListener('change', renderManualFetch);
      document.getElementById('manual-fetch-submit').addEventListener('click', triggerManualFetch);
    }
    let recordsDataPromise = null;
    let window5Promise = null;
    let threeCompoundPromise = null;
    function cacheBustUrl(src) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}v=${encodeURIComponent(dashboardCacheVersion)}`;
    }
    function loadScriptData(src, globalName) {
      return new Promise((resolve, reject) => {
        delete window[globalName];
        const script = document.createElement('script');
        script.src = cacheBustUrl(src);
        script.onload = () => {
          if (window[globalName]) resolve(window[globalName]);
          else reject(new Error(`${globalName} missing`));
        };
        script.onerror = () => reject(new Error(`script ${src} failed`));
        document.head.appendChild(script);
      });
    }
    async function loadJsonOrScript(jsonUrl, jsUrl, globalName) {
      if (isFileDashboard) {
        return await loadScriptData(jsUrl, globalName);
      }
      try {
        const response = await fetch(jsonUrl, {cache: 'no-store'});
        if (!response.ok) throw new Error(`${jsonUrl} HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        return await loadScriptData(jsUrl, globalName);
      }
    }
    async function ensureRecordsData() {
      if (records.length) return records;
      if (!recordsDataPromise) {
        recordsDataPromise = loadJsonOrScript('data/records.json', 'data/records.js', '__RECORDS_DATA__').then(data => {
          records = data.records || [];
          summary = data.summary || summary || {};
          return records;
        });
      }
      return recordsDataPromise;
    }
    async function ensureWindow5Data() {
      if (window5State?.items?.length) return window5State;
      if (!window5Promise) {
        window5Promise = loadJsonOrScript('data/window5-state.json', 'data/window5-state.js', '__WINDOW5_STATE__').then(data => {
          window5State = data || {items: []};
          return window5State;
        });
      }
      return window5Promise;
    }
    async function ensureThreeCompoundData() {
      if (threeCompoundState?.items?.length) return threeCompoundState;
      if (!threeCompoundPromise) {
        threeCompoundPromise = loadJsonOrScript('data/three-compound-state.json', 'data/three-compound-state.js', '__THREE_COMPOUND_STATE__').then(data => {
          threeCompoundState = data || {items: []};
          return threeCompoundState;
        });
      }
      return threeCompoundPromise;
    }
    const tabDataLoaders = {
      window5: async () => {
        window5State = await ensureWindow5Data();
      },
      threeWindow5: async () => {
        threeCompoundState = await ensureThreeCompoundData();
      },
      patternWatch: async () => {
        await ensureRecordsData();
      }
    };
    const renderers = {
      window5: renderWindow5,
      threeWindow5: renderThreeWindow5,
      historyPattern: renderHistoryPattern,
      patternWatch: renderPatternWatch,
      manualFetch: renderManualFetch
    };
    function showLoading(tab) {
      const label = document.querySelector(`.tabs button[data-tab="${tab}"]`)?.textContent || '';
      app.innerHTML = `<section class="panel"><h2>${esc(label)}</h2><p class="muted">&#21152;&#36733;&#20013;...</p></section>`;
    }
    function switchTab(tab) {
      tabs.forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
      showLoading(tab);
      setTimeout(async () => {
        try {
          if (tabDataLoaders[tab]) await tabDataLoaders[tab]();
          (renderers[tab] || renderWindow5)();
        } catch (err) {
          app.innerHTML = `<section class="panel"><h2>&#21152;&#36733;&#22833;&#36133;</h2><p>${esc(err.message)}</p></section>`;
        }
      }, 20);
    }
    tabs.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    async function loadDashboardData() {
      app.innerHTML = `<section class="panel"><h2>&#25968;&#25454;&#21152;&#36733;</h2><p class="muted">&#27491;&#22312;&#21152;&#36733;&#26368;&#26032;&#25968;&#25454;...</p></section>`;
      return await loadJsonOrScript('data/dashboard-summary.json', 'data/dashboard-summary.js', '__DASHBOARD_SUMMARY__');
    }
    loadDashboardData().then(data => {
      recentRecords = (data.recentRecords || []).flatMap(item => item.records || []);
      summary = data.summary || {};
      switchTab('window5');
    }).catch(err => {
      app.innerHTML = `<section class="panel"><h2>&#25968;&#25454;&#21152;&#36733;&#22833;&#36133;</h2><p>${esc(err.message)}</p></section>`;
    });
  </script>
</body>
</html>
'@
    return $html
}

$pagesDir = Join-Path $RootDir 'pages'
if (-not (Test-Path -LiteralPath $pagesDir)) { throw "Pages directory not found: $pagesDir" }
$dataDir = Join-Path $RootDir 'data'
if (-not (Test-Path -LiteralPath $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
$pageParseCachePath = Join-Path $dataDir 'page-parse-cache.json'

$records = Invoke-Profiled 'parse-pages' {
    return Get-ParsedPageRecords -PagesDir $pagesDir -CachePath $pageParseCachePath
}

$deduped = Invoke-Profiled 'dedupe-sort-summary' {
    $unique = @{}
    $swDedupe = [Diagnostics.Stopwatch]::StartNew()
    foreach ($record in $records) { $unique[$record.id] = $record }
    $swDedupe.Stop()
    Add-ProfileRow 'dedupe-build-map' $swDedupe.Elapsed.TotalSeconds
    $swSort = [Diagnostics.Stopwatch]::StartNew()
    $rows = @($unique.Values | Sort-Object @{ Expression = 'date'; Descending = $true }, @{ Expression = 'source'; Descending = $false }, @{ Expression = 'issue'; Descending = $true })
    $swSort.Stop()
    Add-ProfileRow 'dedupe-sort-records' $swSort.Elapsed.TotalSeconds
    $swSummary = [Diagnostics.Stopwatch]::StartNew()
    $script:summary = Get-Summary $rows
    $swSummary.Stop()
    Add-ProfileRow 'summary-counts' $swSummary.Elapsed.TotalSeconds
    return $rows
}

$dashboardSummaryPath = Join-Path $dataDir 'dashboard-summary.json'
$dashboardSummary = Invoke-Profiled 'dashboard-summary' {
    return New-DashboardSummary -Summary $summary -Records $deduped
}
Invoke-Profiled 'write-dashboard-summary-json' {
    Write-DataJsonAndJs -JsonPath $dashboardSummaryPath -Data $dashboardSummary -GlobalName '__DASHBOARD_SUMMARY__' -Depth 10
} | Out-Null
$window5Path = Join-Path $dataDir 'window5-state.json'
$existingWindow5 = $null
if (Test-Path -LiteralPath $window5Path) {
    try { $existingWindow5 = Get-Content -LiteralPath $window5Path -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $existingWindow5 = $null }
}
$window5 = Invoke-Profiled 'window5-state' {
    return New-Window5State -Records $deduped -Existing $existingWindow5 -GeneratedAt $summary.generatedAt
}
Invoke-Profiled 'write-window5-json' {
    Write-DataJsonAndJs -JsonPath $window5Path -Data $window5 -GlobalName '__WINDOW5_STATE__' -Depth 8
} | Out-Null
$threeCompoundPath = Join-Path $dataDir 'three-compound-state.json'
$payload = [pscustomobject]@{ summary = $summary; records = $deduped; window5 = $window5; threeCompound = @{ items = @() } }
$jsonPath = Join-Path $dataDir 'records.json'
$json = Invoke-Profiled 'records-json-serialize' {
    return $payload | ConvertTo-Json -Depth 10 -Compress
}
Invoke-Profiled 'write-records-json' {
    Write-DataJsonTextAndJs -JsonPath $jsonPath -Json $json -GlobalName '__RECORDS_DATA__'
} | Out-Null
$threeCompoundScript = Join-Path $PSScriptRoot 'build-three-compound.py'
if (Test-Path -LiteralPath $threeCompoundScript) {
    Invoke-Profiled 'three-compound-python' {
        & python $threeCompoundScript $RootDir $summary.generatedAt | Out-Null
    } | Out-Null
    Invoke-Profiled 'write-three-compound-js' {
        Write-DataJsFromJsonFile -JsonPath $threeCompoundPath -GlobalName '__THREE_COMPOUND_STATE__'
    } | Out-Null
}
$dashboardPath = Join-Path $RootDir 'index.html'
Invoke-Profiled 'write-dashboard-html' {
    [IO.File]::WriteAllText($dashboardPath, (New-DashboardHtml), $Utf8NoBom)
} | Out-Null
Write-Host "Records: $($deduped.Count)"
Write-Host "Saved: $jsonPath"
Write-Host "Saved: $dashboardPath"
if ($Profile) {
    Write-Host 'Profile:'
    $BuildProfileRows | Sort-Object seconds -Descending | ForEach-Object {
        Write-Host ('  {0}: {1}s' -f $_.stage, $_.seconds)
    }
}

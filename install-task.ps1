param(
    [string]$TaskName = 'Fetch-Lottery-Records',
    [string]$ScriptPath = (Join-Path $PSScriptRoot 'fetch-all.ps1'),
    [string]$RunAt = '21:45'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $ScriptPath)) {
    throw "Script not found: $ScriptPath"
}

$runTime = [datetime]::ParseExact($RunAt, 'HH:mm', [Globalization.CultureInfo]::InvariantCulture)
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::Today.Add($runTime.TimeOfDay))
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Fetch lottery records and refresh generated dashboard data.' `
    -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Run time: every day at $RunAt"
Write-Host "Script: $ScriptPath"

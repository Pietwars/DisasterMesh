[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('Setup','Check','Build','Install','Update','Monitor','Record')]
    [string]$Action,
    [string]$Port,
    [ValidateSet('ttgo','t3s3-sx1262','t3s3-sx1276')][string]$Board = 'ttgo',
    [ValidateSet('wifi','wifi_sd','repeater','room')][string]$Role = 'wifi',
    [ValidateRange(1,86400)][int]$IntervalSeconds = 60,
    [ValidateRange(1,604800)][int]$DurationSeconds = 86400,
    [string]$OutputFile
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root
$Python = Join-Path $Root '.venv\Scripts\python.exe'
function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}
if ($Action -eq 'Setup') {
    Invoke-Checked 'py' @('-3.12','-m','venv','.venv')
    Invoke-Checked $Python @('-m','pip','install','platformio==6.2.0')
    Write-Host 'Setup complete. Node.js 22, Git and g++ must also be available in PATH. See docs/WINDOWS_MVP.md.'
    exit 0
}
if (!(Test-Path $Python)) { throw 'Run -Action Setup first.' }
if ($Action -in @('Install','Update','Monitor') -and $Port -notmatch '^COM[0-9]+$') {
    throw 'Specify the actual device port using -Port COM5 (example).'
}
$Prefix = switch ($Board) {
    'ttgo' { 'disaster_ttgo' }
    't3s3-sx1262' { 'disaster_t3s3_sx1262' }
    't3s3-sx1276' { 'disaster_t3s3_sx1276' }
}
$Profile = "${Prefix}_${Role}"
Write-Host "Selected profile: $Profile. Verify the physical radio chip before Install or Update."
$BaseArgs = @('-m','platformio','run','-j','2','-d','firmware/MeshCore','-e',$Profile)
switch ($Action) {
    'Check' { Invoke-Checked $Python @('tools/check.py','--profile',$Profile) }
    'Record' {
        if (!$OutputFile) {
            New-Item -ItemType Directory -Path 'test-results' -Force | Out-Null
            $OutputFile = Join-Path 'test-results' ('diagnostics-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.jsonl')
        }
        Write-Host "Recording board diagnostics to $OutputFile. Connect this PC to the board Wi-Fi; Ctrl+C stops recording."
        Invoke-Checked $Python @('tools/capture_diagnostics.py','--output',$OutputFile,'--interval',"$IntervalSeconds",'--duration',"$DurationSeconds")
    }
    'Build' {
        Invoke-Checked $Python @('tools/embed_web.py')
        Invoke-Checked $Python $BaseArgs
    }
    'Install' {
        Write-Warning 'FIRST INSTALL ONLY: uploadfs replaces identity, contacts and history. Keep a local backup first.'
        Invoke-Checked $Python @('tools/embed_web.py')
        Invoke-Checked $Python ($BaseArgs + @('-t','upload','--upload-port',$Port))
        Invoke-Checked $Python ($BaseArgs + @('-t','uploadfs','--upload-port',$Port))
    }
    'Update' {
        Invoke-Checked $Python @('tools/embed_web.py')
        Invoke-Checked $Python ($BaseArgs + @('-t','upload','--upload-port',$Port))
    }
    'Monitor' { Invoke-Checked $Python (@('-m','platformio','device','monitor','--port',$Port,'--baud','115200') + $(if ($Role -in @('repeater','room')) { @('--eol','CR') } else { @() })) }
}

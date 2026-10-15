[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('Setup','Check','Build','Install','Update','Monitor')]
    [string]$Action,
    [string]$Port
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
$BaseArgs = @('-m','platformio','run','-j','2','-d','firmware/MeshCore','-e','disaster_ttgo_wifi')
switch ($Action) {
    'Check' { Invoke-Checked $Python @('tools/check.py') }
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
    'Monitor' { Invoke-Checked $Python @('-m','platformio','device','monitor','--port',$Port,'--baud','115200') }
}

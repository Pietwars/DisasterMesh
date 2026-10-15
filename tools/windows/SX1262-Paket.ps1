[CmdletBinding()]
param(
    [ValidateSet('Check','Backup','Install','Update')][string]$Action = 'Check',
    [string]$Port,
    [switch]$SameRole
)
$ErrorActionPreference = 'Stop'
$Script = Join-Path $PSScriptRoot 'flash_sx1262.py'
if (!(Test-Path $Script)) { throw 'Use Flashen.ps1 from an extracted SX1262 firmware package.' }
$Arguments = @('-3.12',$Script,$Action)
if ($Port) { $Arguments += @('--port',$Port) }
if ($SameRole) { $Arguments += '--same-role' }
& py @Arguments
if ($LASTEXITCODE -ne 0) { throw "Flash tool stopped with exit code $LASTEXITCODE" }

# claude-usage skill installer (Windows PowerShell)
param(
    [switch]$All,
    [switch]$Claude,
    [switch]$Codex,
    [switch]$Cursor,
    [string]$Dir = "",
    [switch]$Local,
    [string]$Repo = "https://github.com/AgoniZc/claude-usage.git",
    [string]$Branch = "main"
)

$SkillName = "claude-usage"
$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host @"
Usage: .\install.ps1 [OPTIONS]

Options:
  -All       Install to Claude Code, Codex, and Cursor (default)
  -Claude    Install to ~\.claude\skills\$SkillName
  -Codex     Install to ~\.codex\skills\$SkillName
  -Cursor    Install to ~\.cursor\skills\$SkillName
  -Dir PATH  Custom skills parent directory
  -Local     Copy from this script's directory
  -Repo URL  Git repository URL
"@
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js >= 18."
}
$nodeVersion = node -p "process.versions.node.split('.')[0]"
if ([int]$nodeVersion -lt 18) {
    Write-Error "Node.js >= 18 required."
}

$installClaude = $Claude -or $All
$installCodex = $Codex -or $All
$installCursor = $Cursor -or $All
$hasCustom = $Dir -ne ""

if (-not ($installClaude -or $installCodex -or $installCursor -or $hasCustom)) {
    $installClaude = $installCodex = $installCursor = $true
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = $null
$workDir = $null

try {
    if ($Local -and (Test-Path "$ScriptDir\bin\cli.js") -and (Test-Path "$ScriptDir\SKILL.md")) {
        $srcDir = $ScriptDir
    }
    elseif ((Test-Path "$ScriptDir\bin\cli.js") -and (Test-Path "$ScriptDir\SKILL.md")) {
        $srcDir = $ScriptDir
    }
    else {
        $workDir = Join-Path $env:TEMP ("claude-usage-install-" + [guid]::NewGuid().ToString())
        New-Item -ItemType Directory -Path $workDir | Out-Null
        Write-Host "Cloning $Repo ..."
        git clone --depth 1 --branch $Branch $Repo "$workDir\$SkillName" 2>$null
        if ($LASTEXITCODE -ne 0) {
            git clone --depth 1 $Repo "$workDir\$SkillName"
        }
        $srcDir = Join-Path $workDir $SkillName
    }

    function Install-One {
        param([string]$Parent)
        $dest = Join-Path $Parent $SkillName
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
        Copy-Item -Path "$srcDir\*" -Destination $dest -Recurse -Force
        Remove-Item -Force "$dest\install.sh","$dest\install.ps1" -ErrorAction SilentlyContinue
        Write-Host "Installed to $dest"
    }

    $userHome = $env:USERPROFILE
    if ($installClaude) { Install-One (Join-Path $userHome ".claude\skills") }
    if ($installCodex)   { Install-One (Join-Path $userHome ".codex\skills") }
    if ($installCursor)  { Install-One (Join-Path $userHome ".cursor\skills") }
    if ($hasCustom)      { Install-One $Dir }

    Write-Host ""
    Write-Host "Done. Restart your agent to load the skill."
    Write-Host "Test: cd $userHome\.claude\skills\$SkillName; node bin\cli.js --today"
}
finally {
    if ($workDir -and (Test-Path $workDir)) {
        Remove-Item -Recurse -Force $workDir
    }
}

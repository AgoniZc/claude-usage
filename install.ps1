# claude-usage skill installer for Claude Code (Windows PowerShell)
param(
    [switch]$Local,
    [string]$Repo = "https://github.com/AgoniZc/claude-usage.git",
    [string]$Branch = "main"
)

$SkillName = "claude-usage"
$InstallDir = if ($env:CLAUDE_USAGE_DIR) { $env:CLAUDE_USAGE_DIR } else { Join-Path $env:USERPROFILE ".claude\skills" }
$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js >= 18."
}
$nodeVersion = node -p "process.versions.node.split('.')[0]"
if ([int]$nodeVersion -lt 18) {
    Write-Error "Node.js >= 18 required."
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
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        git clone --depth 1 --branch $Branch $Repo "$workDir\$SkillName" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            git clone --depth 1 $Repo "$workDir\$SkillName" 2>&1 | Out-Null
        }
        $ErrorActionPreference = $prevEAP
        if ($LASTEXITCODE -ne 0) {
            throw "git clone failed: $Repo"
        }
        $srcDir = Join-Path $workDir $SkillName
    }

    $dest = Join-Path $InstallDir $SkillName
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item -Path "$srcDir\*" -Destination $dest -Recurse -Force
    Remove-Item -Recurse -Force "$dest\.git" -ErrorAction SilentlyContinue
    Remove-Item -Force "$dest\install.sh","$dest\install.ps1" -ErrorAction SilentlyContinue

    Write-Host "Installed to $dest"
    Write-Host ""
    Write-Host "Done. Restart Claude Code to load the skill."
    Write-Host "Test: cd $dest; node bin\cli.js --today"
}
finally {
    if ($workDir -and (Test-Path $workDir)) {
        Remove-Item -Recurse -Force $workDir
    }
}

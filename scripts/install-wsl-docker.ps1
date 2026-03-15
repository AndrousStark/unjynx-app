# ============================================================
# UNJYNX Dev Setup - WSL2 + Docker Desktop Installation
# ============================================================
# RUN THIS AS ADMINISTRATOR in PowerShell:
#   Right-click PowerShell > "Run as Administrator"
#   Then run: .\scripts\install-wsl-docker.ps1
# ============================================================

Write-Host "`n=== UNJYNX Dev Setup - WSL2 + Docker Desktop ===" -ForegroundColor Cyan
Write-Host "This script requires Administrator privileges.`n" -ForegroundColor Yellow

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell > 'Run as Administrator' and try again." -ForegroundColor Yellow
    exit 1
}

# Step 1: Install WSL2
Write-Host "`n[1/4] Installing WSL2..." -ForegroundColor Green
wsl --install --no-distribution
if ($LASTEXITCODE -ne 0) {
    Write-Host "WSL install may require a restart. Continuing..." -ForegroundColor Yellow
}

# Step 2: Enable Virtual Machine Platform (required for Docker)
Write-Host "`n[2/4] Enabling Virtual Machine Platform..." -ForegroundColor Green
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Step 3: Set WSL2 as default
Write-Host "`n[3/4] Setting WSL2 as default version..." -ForegroundColor Green
wsl --set-default-version 2 2>$null

# Step 4: Install Docker Desktop via winget
Write-Host "`n[4/4] Installing Docker Desktop..." -ForegroundColor Green
winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host @"

IMPORTANT: You MUST restart your computer now!

After restart:
1. Docker Desktop should start automatically
2. Open a terminal and run: docker --version
3. Then run: docker compose up -d
   (from the UNJYNX project directory)

If Docker Desktop fails to start after restart:
- Open Docker Desktop from Start Menu
- It may ask to enable WSL2 integration - click Yes
- Wait for Docker to fully initialize (green icon in system tray)

"@ -ForegroundColor Yellow

$restart = Read-Host "Restart now? (Y/N)"
if ($restart -eq 'Y' -or $restart -eq 'y') {
    Restart-Computer -Force
}

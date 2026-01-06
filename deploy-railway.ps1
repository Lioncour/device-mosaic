# Railway Deployment Script
Write-Host "=== Railway Deployment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Railway authentication..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Not logged in to Railway" -ForegroundColor Yellow
    Write-Host "Please run: railway login" -ForegroundColor White
    Write-Host "This will open your browser for authentication." -ForegroundColor Gray
    Write-Host ""
    $login = Read-Host "Press Enter after you've logged in, or type 'skip' to login manually later"
    if ($login -eq "skip") {
        Write-Host "`nTo login manually, run: railway login" -ForegroundColor Yellow
        exit 0
    }
}

# Check login status again
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Still not logged in. Please run 'railway login' first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Check if already linked to a project
Write-Host "Checking for existing Railway project..." -ForegroundColor Yellow
$project = railway status 2>&1
if ($LASTEXITCODE -eq 0 -and $project -match "project") {
    Write-Host "✓ Already linked to a Railway project" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current project info:" -ForegroundColor Cyan
    railway status
    Write-Host ""
    $deploy = Read-Host "Deploy to this project? (y/n)"
    if ($deploy -eq "y" -or $deploy -eq "Y") {
        Write-Host "`nDeploying..." -ForegroundColor Yellow
        railway up
    } else {
        Write-Host "Skipping deployment." -ForegroundColor Yellow
    }
} else {
    Write-Host "No Railway project linked." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating new Railway project..." -ForegroundColor Cyan
    Write-Host "This will create a new project and link it to this repository." -ForegroundColor Gray
    Write-Host ""
    
    $create = Read-Host "Create new project? (y/n)"
    if ($create -eq "y" -or $create -eq "Y") {
        railway init
        
        Write-Host "`nLinking to GitHub repository..." -ForegroundColor Yellow
        railway link
        
        Write-Host "`nDeploying..." -ForegroundColor Yellow
        railway up
        
        Write-Host "`n✓ Deployment initiated!" -ForegroundColor Green
        Write-Host "`nGet your app URL:" -ForegroundColor Cyan
        Write-Host "  railway domain" -ForegroundColor White
        Write-Host "`nOr check the Railway dashboard: https://railway.app" -ForegroundColor White
    } else {
        Write-Host "Skipping project creation." -ForegroundColor Yellow
        Write-Host "`nTo create manually:" -ForegroundColor Cyan
        Write-Host "  1. Go to https://railway.app" -ForegroundColor White
        Write-Host "  2. New Project → Deploy from GitHub repo" -ForegroundColor White
        Write-Host "  3. Select: Lioncour/device-mosaic" -ForegroundColor White
    }
}


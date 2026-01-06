# Deployment Setup Script
Write-Host "=== Device Mosaic Deployment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check current git status
Write-Host ""
Write-Host "Current Git Status:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "=== Step 1: Create GitHub Repository ===" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: device-mosaic" -ForegroundColor White
Write-Host "3. Description: Distributed video wall across multiple devices" -ForegroundColor White
Write-Host "4. Choose Public or Private" -ForegroundColor White
Write-Host "5. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
Write-Host "6. Click 'Create repository'" -ForegroundColor White
Write-Host ""

$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/device-mosaic.git)"

if ($repoUrl) {
    Write-Host ""
    Write-Host "Adding remote and pushing code..." -ForegroundColor Yellow
    
    # Rename branch to main if needed
    $currentBranch = git branch --show-current
    if ($currentBranch -eq "master") {
        git branch -M main
        Write-Host "✓ Renamed branch to 'main'" -ForegroundColor Green
    }
    
    # Add remote
    git remote add origin $repoUrl 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Added remote 'origin'" -ForegroundColor Green
    } else {
        # Try to set URL if remote exists
        git remote set-url origin $repoUrl
        Write-Host "✓ Updated remote 'origin'" -ForegroundColor Green
    }
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== Step 2: Deploy to Railway ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://railway.app" -ForegroundColor White
        Write-Host "2. Sign up/login with GitHub" -ForegroundColor White
        Write-Host "3. Click 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor White
        Write-Host "4. Select your 'device-mosaic' repository" -ForegroundColor White
        Write-Host "5. Railway will automatically deploy your app!" -ForegroundColor White
        Write-Host ""
        Write-Host "Your app will be live at: https://your-app.railway.app" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to push. Please check your repository URL and try again." -ForegroundColor Red
    }
} else {
    Write-Host "No repository URL provided. Exiting." -ForegroundColor Yellow
}


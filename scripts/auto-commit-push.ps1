# Auto Commit and Push Script for RekaSDA Pro
# This script automatically commits all changes and pushes to the current branch

param(
    [string]$CommitMessage = "auto: update project files"
)

Write-Host "Checking git status..." -ForegroundColor Cyan

# Check if there are any changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit. Repository is clean." -ForegroundColor Green
    exit 0
}

Write-Host "Staging all changes..." -ForegroundColor Yellow
git add .

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing to remote..." -ForegroundColor Yellow

    # Get current branch name
    $branch = git branch --show-current

    git push origin $branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully committed and pushed!" -ForegroundColor Green
        Write-Host "Commit details:" -ForegroundColor Cyan
        git log --oneline -1
    } else {
        Write-Host "Push failed. Please check your connection and try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Commit failed. Please check your changes." -ForegroundColor Red
    exit 1
}
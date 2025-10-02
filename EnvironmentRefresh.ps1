$sourceRepo = "C:\Users\Andrew\Documents\GitHub\DaggerQuest.com"
$destinationRepo = "C:\Users\Andrew\Documents\GitHub\DaggerQuest-Test-Realm"

# Items to skip
$skipItems = @(".git", "README.md", "readmeimage.webp")

Write-Host "Starting copy operation from $sourceRepo to $destinationRepo"

# Check if source repository exists
if (-not (Test-Path $sourceRepo)) {
    Write-Error "Source repository not found at: $sourceRepo"
    exit 1
}

# Check if destination repository exists
if (-not (Test-Path $destinationRepo)) {
    Write-Error "Destination repository not found at: $destinationRepo"
    exit 1
}

# Get all root-level items in the source repository
$rootItems = Get-ChildItem -Path $sourceRepo -Force

foreach ($item in $rootItems) {
    # Skip items in the skip list
    if ($skipItems -contains $item.Name) {
        Write-Host "Skipping: $($item.Name)" -ForegroundColor Yellow
        continue
    }
    
    $sourcePath = $item.FullName
    $destinationPath = Join-Path $destinationRepo $item.Name
    
    if ($item.PSIsContainer) {
        # It's a directory
        Write-Host "Copying directory: $($item.Name)" -ForegroundColor Green
        
        # Remove destination directory if it exists
        if (Test-Path $destinationPath) {
            Remove-Item $destinationPath -Recurse -Force
        }
        
        # Copy the directory
        Copy-Item $sourcePath $destinationPath -Recurse -Force
    } else {
        # It's a file
        Write-Host "Copying file: $($item.Name)" -ForegroundColor Cyan
        
        # Copy the file (will overwrite if exists)
        Copy-Item $sourcePath $destinationPath -Force
    }
}

# Find and update all CNAME files to point to test subdomain
Write-Host "Updating CNAME files..." -ForegroundColor Magenta
$cnameFiles = Get-ChildItem -Path $destinationRepo -Name "CNAME" -Recurse -Force
foreach ($cnameFile in $cnameFiles) {
    $cnameFilePath = Join-Path $destinationRepo $cnameFile
    Write-Host "Updating CNAME file: $cnameFilePath" -ForegroundColor Cyan
    Set-Content -Path $cnameFilePath -Value "test.daggerquest.com" -Force
}

if ($cnameFiles.Count -eq 0) {
    Write-Host "No CNAME files found" -ForegroundColor Yellow
} else {
    Write-Host "Updated $($cnameFiles.Count) CNAME file(s)" -ForegroundColor Green
}

# Normalize line endings after copy to prevent "modified but no content changes" issues
Write-Host "Normalizing line endings..." -ForegroundColor Magenta
Set-Location $destinationRepo
git add --renormalize . 2>$null

Write-Host "Copy operation completed successfully!" -ForegroundColor Green
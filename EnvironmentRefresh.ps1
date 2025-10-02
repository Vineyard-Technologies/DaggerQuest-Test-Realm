param(
    [string]$SourceRepo,
    [string]$TargetRepo
)

# Auto-detect repository paths based on script location
if (-not $TargetRepo) {
    $TargetRepo = Split-Path -Parent $PSCommandPath
}

if (-not $SourceRepo) {
    $ParentDir = Split-Path -Parent $TargetRepo
    $SourceRepo = Join-Path $ParentDir "DaggerQuest.com"
}

# Color output functions
function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host $message -ForegroundColor Red
}

# Files and folders to preserve in the test environment
$PreservedItems = @(
    ".git",
    "README.md",
    "readmeimage.webp",
    "public\CNAME",
    "public\robots.txt",
    "EnvironmentRefresh.ps1"
)

Write-Info "DaggerQuest Test Environment Refresh Script"
Write-Info "=========================================="
Write-Info "Source: $SourceRepo"
Write-Info "Target: $TargetRepo"
Write-Info ""

# Validate source repository exists
if (-not (Test-Path $SourceRepo)) {
    Write-Error "Source repository not found: $SourceRepo"
    Write-Error "Please ensure the DaggerQuest.com repository is cloned to the expected location."
    exit 1
}

# Validate target repository exists
if (-not (Test-Path $TargetRepo)) {
    Write-Error "Target repository not found: $TargetRepo"
    exit 1
}

Write-Info "Validating repositories..."

# Check if source has .git folder
if (-not (Test-Path (Join-Path $SourceRepo ".git"))) {
    Write-Error "Source directory is not a git repository: $SourceRepo"
    exit 1
}

# Check if target has .git folder
if (-not (Test-Path (Join-Path $TargetRepo ".git"))) {
    Write-Error "Target directory is not a git repository: $TargetRepo"
    exit 1
}

Write-Success "Repository validation complete."
Write-Info ""

# Get all items in target directory (excluding preserved items)
Write-Info "Identifying files to remove from test environment..."
$TargetItems = Get-ChildItem -Path $TargetRepo -Force | Where-Object {
    $ItemName = $_.Name
    $IsPreserved = $PreservedItems | Where-Object { 
        $PreservedItem = $_
        # Handle both file names and relative paths
        return ($ItemName -eq $PreservedItem) -or ($ItemName -eq (Split-Path $PreservedItem -Leaf))
    }
    return -not $IsPreserved
}

Write-Info "Found $($TargetItems.Count) items to remove/replace."

# Remove non-preserved items from target
Write-Info "Removing existing files from test environment..."
foreach ($Item in $TargetItems) {
    try {
        if ($Item.PSIsContainer) {
            Remove-Item -Path $Item.FullName -Recurse -Force
            Write-Host "  Removed directory: $($Item.Name)" -ForegroundColor Gray
        } else {
            Remove-Item -Path $Item.FullName -Force
            Write-Host "  Removed file: $($Item.Name)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Warning "Failed to remove $($Item.Name): $($_.Exception.Message)"
    }
}

Write-Success "Cleanup complete."
Write-Info ""

# Copy all items from source (excluding preserved items)
Write-Info "Copying files from DaggerQuest.com repository..."
$SourceItems = Get-ChildItem -Path $SourceRepo -Force | Where-Object {
    $ItemName = $_.Name
    $IsPreserved = $PreservedItems | Where-Object { 
        $PreservedItem = $_
        # Handle both file names and relative paths
        return ($ItemName -eq $PreservedItem) -or ($ItemName -eq (Split-Path $PreservedItem -Leaf))
    }
    return -not $IsPreserved
}

Write-Info "Found $($SourceItems.Count) items to copy."

foreach ($Item in $SourceItems) {
    $DestinationPath = Join-Path $TargetRepo $Item.Name
    try {
        if ($Item.PSIsContainer) {
            Copy-Item -Path $Item.FullName -Destination $DestinationPath -Recurse -Force
            Write-Host "  Copied directory: $($Item.Name)" -ForegroundColor Gray
        } else {
            Copy-Item -Path $Item.FullName -Destination $DestinationPath -Force
            Write-Host "  Copied file: $($Item.Name)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "Failed to copy $($Item.Name): $($_.Exception.Message)"
    }
}

Write-Success "Copy operation complete."
Write-Info ""

# Handle special case for public folder (preserve CNAME and robots.txt)
$SourcePublic = Join-Path $SourceRepo "public"
$TargetPublic = Join-Path $TargetRepo "public"

if ((Test-Path $SourcePublic) -and (Test-Path $TargetPublic)) {
    Write-Info "Handling public folder synchronization..."
    
    # Preserve the protected files
    $ProtectedPublicFiles = @("CNAME", "robots.txt")
    $TempDir = Join-Path $env:TEMP "DaggerQuest-Protected-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    # Backup protected files
    foreach ($ProtectedFile in $ProtectedPublicFiles) {
        $SourceFile = Join-Path $TargetPublic $ProtectedFile
        if (Test-Path $SourceFile) {
            Copy-Item -Path $SourceFile -Destination $TempDir -Force
            Write-Host "  Preserved: public\$ProtectedFile" -ForegroundColor Yellow
        }
    }
    
    # Copy all public folder contents from source
    Get-ChildItem -Path $SourcePublic -Recurse -Force | ForEach-Object {
        $RelativePath = $_.FullName.Substring($SourcePublic.Length + 1)
        $DestPath = Join-Path $TargetPublic $RelativePath
        
        if ($_.PSIsContainer) {
            if (-not (Test-Path $DestPath)) {
                New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
            }
        } else {
            $ParentDir = Split-Path $DestPath -Parent
            if (-not (Test-Path $ParentDir)) {
                New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
            }
            Copy-Item -Path $_.FullName -Destination $DestPath -Force
        }
    }
    
    # Restore protected files
    foreach ($ProtectedFile in $ProtectedPublicFiles) {
        $BackupFile = Join-Path $TempDir $ProtectedFile
        $TargetFile = Join-Path $TargetPublic $ProtectedFile
        if (Test-Path $BackupFile) {
            Copy-Item -Path $BackupFile -Destination $TargetFile -Force
            Write-Host "  Restored: public\$ProtectedFile" -ForegroundColor Yellow
        }
    }
    
    # Cleanup temp directory
    Remove-Item -Path $TempDir -Recurse -Force
    
    Write-Success "Public folder synchronization complete."
}

Write-Info ""
Write-Success "Environment refresh complete!"
Write-Info ""
Write-Info "Preserved files:"
foreach ($Item in $PreservedItems) {
    $FullPath = Join-Path $TargetRepo $Item
    if (Test-Path $FullPath) {
        Write-Host "  ✓ $Item" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $Item (not found)" -ForegroundColor Red
    }
}

Write-Info ""
Write-Info "The test environment has been synchronized with the main DaggerQuest.com repository."
Write-Info "All files have been updated except for the preserved items listed above."
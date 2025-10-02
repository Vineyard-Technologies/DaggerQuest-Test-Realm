#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const sourceRepo = 'C:\\Users\\Andrew\\Documents\\GitHub\\DaggerQuest.com';
const destinationRepo = 'C:\\Users\\Andrew\\Documents\\GitHub\\DaggerQuest-Test-Realm';
const skipItems = ['.git', 'README.md', 'readmeimage.webp'];

console.log(`Starting copy operation from ${sourceRepo} to ${destinationRepo}`);

// Check if source repository exists
if (!fs.existsSync(sourceRepo)) {
    console.error(`Source repository not found at: ${sourceRepo}`);
    process.exit(1);
}

// Check if destination repository exists
if (!fs.existsSync(destinationRepo)) {
    console.error(`Destination repository not found at: ${destinationRepo}`);
    process.exit(1);
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
    if (fs.existsSync(destination)) {
        fs.rmSync(destination, { recursive: true, force: true });
    }
    
    fs.mkdirSync(destination, { recursive: true });
    
    const items = fs.readdirSync(source, { withFileTypes: true });
    
    for (const item of items) {
        const sourcePath = path.join(source, item.name);
        const destPath = path.join(destination, item.name);
        
        if (item.isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

// Get all root-level items in the source repository
const rootItems = fs.readdirSync(sourceRepo, { withFileTypes: true });

for (const item of rootItems) {
    // Skip items in the skip list
    if (skipItems.includes(item.name)) {
        console.log(`\x1b[33mSkipping: ${item.name}\x1b[0m`);
        continue;
    }
    
    const sourcePath = path.join(sourceRepo, item.name);
    const destinationPath = path.join(destinationRepo, item.name);
    
    if (item.isDirectory()) {
        // It's a directory
        console.log(`\x1b[32mCopying directory: ${item.name}\x1b[0m`);
        copyDirectory(sourcePath, destinationPath);
    } else {
        // It's a file
        console.log(`\x1b[36mCopying file: ${item.name}\x1b[0m`);
        fs.copyFileSync(sourcePath, destinationPath);
    }
}

// Function to find CNAME files recursively
function findCNAMEFiles(dir, cnameFiles = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
            findCNAMEFiles(itemPath, cnameFiles);
        } else if (item.name === 'CNAME') {
            cnameFiles.push(itemPath);
        }
    }
    
    return cnameFiles;
}

// Find and update all CNAME files to point to test subdomain
console.log('\x1b[35mUpdating CNAME files...\x1b[0m');
const cnameFiles = findCNAMEFiles(destinationRepo);

for (const cnameFile of cnameFiles) {
    console.log(`\x1b[36mUpdating CNAME file: ${cnameFile}\x1b[0m`);
    fs.writeFileSync(cnameFile, 'test.daggerquest.com', 'utf8');
}

if (cnameFiles.length === 0) {
    console.log('\x1b[33mNo CNAME files found\x1b[0m');
} else {
    console.log(`\x1b[32mUpdated ${cnameFiles.length} CNAME file(s)\x1b[0m`);
}

// Normalize line endings after copy to prevent "modified but no content changes" issues
console.log('\x1b[35mNormalizing line endings...\x1b[0m');
process.chdir(destinationRepo);

try {
    execSync('git add --renormalize .', { stdio: 'pipe' });
} catch (error) {
    // Ignore errors from git renormalize
}

console.log('\x1b[32mCopy operation completed successfully!\x1b[0m');
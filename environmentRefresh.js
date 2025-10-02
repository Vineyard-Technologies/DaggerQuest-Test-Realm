#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration - determine paths dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script is in the root of DaggerQuest-Test-Realm, so go up one level to find sibling repos
const parentDir = path.dirname(__dirname);
const sourceRepo = path.join(parentDir, 'DaggerQuest.com');
const destinationRepo = __dirname; // Current directory is the destination repo
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

// Clean up files/folders that don't exist in source repo
console.log('\x1b[35mCleaning up extra files/folders...\x1b[0m');
const sourceRootItems = fs.readdirSync(sourceRepo, { withFileTypes: true });
const destRootItems = fs.readdirSync(destinationRepo, { withFileTypes: true });

// Get list of items that should exist (from source + skip items + this script)
const expectedItems = new Set();
sourceRootItems.forEach(item => expectedItems.add(item.name));
skipItems.forEach(item => expectedItems.add(item));
expectedItems.add('environmentRefresh.js'); // Don't delete this script

for (const item of destRootItems) {
    if (!expectedItems.has(item.name)) {
        const itemPath = path.join(destinationRepo, item.name);
        console.log(`\x1b[31mRemoving extra item: ${item.name}\x1b[0m`);
        
        if (item.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(itemPath);
        }
    }
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
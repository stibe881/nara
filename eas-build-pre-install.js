#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create necessary directories for EAS Build
const directories = [
    '.expo',
    '.expo/web',
    '.expo/web/cache',
    '.expo/cache'
];

console.log('EAS Pre-install: Creating cache directories...');

directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    try {
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true, mode: 0o777 });
            console.log(`Created: ${dir}`);
        } else {
            // Ensure directory has proper permissions
            fs.chmodSync(fullPath, 0o777);
            console.log(`Exists (chmod applied): ${dir}`);
        }
    } catch (error) {
        console.error(`Error creating ${dir}:`, error.message);
    }
});

console.log('EAS Pre-install: Done.');

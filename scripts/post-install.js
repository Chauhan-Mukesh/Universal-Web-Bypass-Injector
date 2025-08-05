#!/usr/bin/env node

/**
 * Post-install script for Universal Web Bypass Injector
 * Sets up the development environment after npm install
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Running post-install setup...')

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
  console.log('✅ Created dist directory')
}

// Check if all required files exist
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.js',
  'popup.html',
  'logo.png'
]

let allFilesExist = true
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file)
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Warning: Required file ${file} not found`)
    allFilesExist = false
  }
}

if (allFilesExist) {
  console.log('✅ All required files found')
} else {
  console.log('⚠️  Some required files are missing')
}

console.log('✅ Post-install setup completed')

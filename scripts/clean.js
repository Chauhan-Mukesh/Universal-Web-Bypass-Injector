#!/usr/bin/env node

/**
 * 🧹 Clean Script
 * Removes build artifacts and temporary files
 */

const fs = require('fs')
const path = require('path')

const CONFIG = {
  sourceDir: process.cwd(),
  dirsToClean: [
    'dist',
    'packages',
    'coverage',
    '.nyc_output',
    'node_modules/.cache'
  ],
  filesToClean: [
    'security-report.json',
    'eslint-report.json',
    'build-report.json',
    '*.log',
    '*.tmp',
    '.DS_Store'
  ]
}

/**
 * 🗑️ Remove directory recursively
 */
function removeDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`  🗑️ Removed directory: ${dir}`)
    return true
  }
  return false
}

/**
 * 🗑️ Remove file
 */
function removeFile(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file)
    console.log(`  🗑️ Removed file: ${file}`)
    return true
  }
  return false
}

/**
 * 🧹 Main clean function
 */
function clean() {
  console.log('🧹 Starting cleanup...')

  let removedCount = 0

  // Clean directories
  CONFIG.dirsToClean.forEach(dir => {
    const fullPath = path.join(CONFIG.sourceDir, dir)
    if (removeDirectory(fullPath)) {
      removedCount++
    }
  })

  // Clean files
  CONFIG.filesToClean.forEach(pattern => {
    const fullPath = path.join(CONFIG.sourceDir, pattern)
    if (removeFile(fullPath)) {
      removedCount++
    }
  })

  console.log(`✅ Cleanup completed (${removedCount} items removed)`)
}

// 🚀 Run cleanup if called directly
if (require.main === module) {
  clean()
}

module.exports = { clean }

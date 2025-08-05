#!/usr/bin/env node

/**
 * 🧪 Extension Testing Script
 * Validates the extension structure and basic functionality
 */

const fs = require('fs')
const path = require('path')

// 🎯 Configuration
const CONFIG = {
  sourceDir: process.cwd(),
  manifestPath: path.join(process.cwd(), 'manifest.json'),
  requiredFiles: [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.js',
    'popup.html',
    'logo.png'
  ],
  optionalFiles: [
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ]
}

const testResults = []

/**
 * ✅ Add test result
 */
function addResult(test, status, message = '') {
  testResults.push({ test, status, message })
  const emoji = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌'
  console.log(`${emoji} ${test}: ${message || status}`)
}

/**
 * 🔍 Test file existence
 */
function testFileExistence() {
  console.log('🔍 Testing file existence...')

  // Test required files
  CONFIG.requiredFiles.forEach(file => {
    const filePath = path.join(CONFIG.sourceDir, file)
    if (fs.existsSync(filePath)) {
      addResult(`Required file: ${file}`, 'pass')
    } else {
      addResult(`Required file: ${file}`, 'fail', 'File not found')
    }
  })

  // Test optional files
  CONFIG.optionalFiles.forEach(file => {
    const filePath = path.join(CONFIG.sourceDir, file)
    if (fs.existsSync(filePath)) {
      addResult(`Optional file: ${file}`, 'pass')
    } else {
      addResult(`Optional file: ${file}`, 'warn', 'File not found (optional)')
    }
  })
}

/**
 * 📋 Test manifest structure
 */
function testManifestStructure() {
  console.log('📋 Testing manifest structure...')

  if (!fs.existsSync(CONFIG.manifestPath)) {
    addResult('Manifest existence', 'fail', 'manifest.json not found')
    return
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(CONFIG.manifestPath, 'utf8'))

    // Test required manifest fields
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'description',
      'permissions',
      'content_scripts',
      'background',
      'action'
    ]

    requiredFields.forEach(field => {
      if (manifest[field]) {
        addResult(`Manifest field: ${field}`, 'pass')
      } else {
        addResult(`Manifest field: ${field}`, 'fail', 'Field missing')
      }
    })

    // Test manifest version
    if (manifest.manifest_version === 3) {
      addResult('Manifest version', 'pass', 'Using Manifest V3')
    } else {
      addResult('Manifest version', 'warn', `Using Manifest V${manifest.manifest_version}`)
    }

    // Test permissions
    if (Array.isArray(manifest.permissions) && manifest.permissions.length > 0) {
      addResult('Permissions', 'pass', `${manifest.permissions.length} permissions defined`)
    } else {
      addResult('Permissions', 'warn', 'No permissions defined')
    }

    // Test content scripts
    if (Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0) {
      addResult('Content scripts', 'pass', `${manifest.content_scripts.length} content scripts`)
    } else {
      addResult('Content scripts', 'fail', 'No content scripts defined')
    }
  } catch (error) {
    addResult('Manifest parsing', 'fail', `JSON parsing error: ${error.message}`)
  }
}

/**
 * 📦 Test script files
 */
function testScriptFiles() {
  console.log('📦 Testing script files...')

  const scripts = ['background.js', 'content.js', 'popup.js']

  scripts.forEach(script => {
    const scriptPath = path.join(CONFIG.sourceDir, script)

    if (fs.existsSync(scriptPath)) {
      const content = fs.readFileSync(scriptPath, 'utf8')

      // Check file size
      const sizeKB = (content.length / 1024).toFixed(2)
      if (content.length > 0) {
        addResult(`${script} content`, 'pass', `${sizeKB} KB`)
      } else {
        addResult(`${script} content`, 'fail', 'File is empty')
      }

      // Check for basic patterns
      if (content.includes('chrome.') || content.includes('browser.')) {
        addResult(`${script} API usage`, 'pass', 'Uses browser APIs')
      } else {
        addResult(`${script} API usage`, 'warn', 'No browser API usage detected')
      }

      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        addResult(`${script} error handling`, 'pass', 'Has error handling')
      } else {
        addResult(`${script} error handling`, 'warn', 'No error handling detected')
      }
    }
  })
}

/**
 * 🎨 Test HTML and assets
 */
function testHtmlAndAssets() {
  console.log('🎨 Testing HTML and assets...')

  // Test popup.html
  const popupPath = path.join(CONFIG.sourceDir, 'popup.html')
  if (fs.existsSync(popupPath)) {
    const content = fs.readFileSync(popupPath, 'utf8')

    if (content.includes('<!DOCTYPE html>')) {
      addResult('Popup HTML structure', 'pass', 'Valid HTML5 document')
    } else {
      addResult('Popup HTML structure', 'warn', 'Missing DOCTYPE')
    }

    if (content.includes('popup.js')) {
      addResult('Popup script reference', 'pass', 'References popup.js')
    } else {
      addResult('Popup script reference', 'warn', 'No script reference found')
    }
  }

  // Test logo
  const logoPath = path.join(CONFIG.sourceDir, 'logo.png')
  if (fs.existsSync(logoPath)) {
    const stats = fs.statSync(logoPath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    addResult('Logo file', 'pass', `${sizeKB} KB`)
  }
}

/**
 * 🔧 Test build artifacts
 */
function testBuildArtifacts() {
  console.log('🔧 Testing build artifacts...')

  const distPath = path.join(CONFIG.sourceDir, 'dist')
  if (fs.existsSync(distPath)) {
    addResult('Build directory', 'pass', 'dist/ directory exists')

    const buildFiles = fs.readdirSync(distPath)
    if (buildFiles.length > 0) {
      addResult('Build artifacts', 'pass', `${buildFiles.length} files in dist/`)
    } else {
      addResult('Build artifacts', 'warn', 'dist/ directory is empty')
    }
  } else {
    addResult('Build directory', 'warn', 'No dist/ directory (run npm run build)')
  }

  // Test package.json scripts
  const packagePath = path.join(CONFIG.sourceDir, 'package.json')
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

    if (pkg.scripts && pkg.scripts.build) {
      addResult('Build script', 'pass', 'npm run build available')
    } else {
      addResult('Build script', 'fail', 'No build script defined')
    }

    if (pkg.scripts && pkg.scripts.test) {
      addResult('Test script', 'pass', 'npm test available')
    } else {
      addResult('Test script', 'fail', 'No test script defined')
    }
  }
}

/**
 * 📊 Generate test summary
 */
function generateSummary() {
  console.log('\n📊 Extension Test Summary')
  console.log('================================')

  const passed = testResults.filter(r => r.status === 'pass').length
  const warned = testResults.filter(r => r.status === 'warn').length
  const failed = testResults.filter(r => r.status === 'fail').length
  const total = testResults.length

  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️ Warnings: ${warned}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${total}`)

  const score = ((passed + warned * 0.5) / total * 100).toFixed(1)
  console.log(`🎯 Score: ${score}%`)

  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    testResults
      .filter(r => r.status === 'fail')
      .forEach(r => console.log(`  - ${r.test}: ${r.message}`))
  }

  if (warned > 0) {
    console.log('\n⚠️ Warnings:')
    testResults
      .filter(r => r.status === 'warn')
      .forEach(r => console.log(`  - ${r.test}: ${r.message}`))
  }

  return { passed, warned, failed, total, score }
}

/**
 * 🚀 Main test function
 */
function runExtensionTests() {
  console.log('🧪 Starting extension validation tests...')
  console.log('==========================================')

  try {
    testFileExistence()
    testManifestStructure()
    testScriptFiles()
    testHtmlAndAssets()
    testBuildArtifacts()

    const summary = generateSummary()

    console.log('\n==========================================')

    if (summary.failed === 0) {
      console.log('🎉 Extension validation PASSED!')
      if (summary.warned > 0) {
        console.log('⚠️ Please review warnings above')
      }
      process.exit(0)
    } else {
      console.log('❌ Extension validation FAILED!')
      console.log('Please fix the failed tests above')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Extension test failed:', error.message)
    process.exit(1)
  }
}

// 🚀 Run tests if called directly
if (require.main === module) {
  runExtensionTests()
}

module.exports = { runExtensionTests, CONFIG }

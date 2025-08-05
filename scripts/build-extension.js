#!/usr/bin/env node

/**
 * 🏗️ Extension Build Script
 * Professional build system for Universal Web Bypass Injector
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 🎯 Configuration
const CONFIG = {
  sourceDir: process.cwd(),
  buildDir: path.join(process.cwd(), 'dist'),
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  version: require('../package.json').version
}

// 📁 Files to include in build
const INCLUDE_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.js',
  'popup.html',
  'logo.png'
]

// 📁 Directories to include
const INCLUDE_DIRS = [
  'icons'
]

/**
 * 🧹 Clean build directory
 */
function cleanBuildDir() {
  console.log('🧹 Cleaning build directory...')
  
  if (fs.existsSync(CONFIG.buildDir)) {
    fs.rmSync(CONFIG.buildDir, { recursive: true, force: true })
  }
  
  fs.mkdirSync(CONFIG.buildDir, { recursive: true })
  console.log('✅ Build directory cleaned')
}

/**
 * 📋 Validate source files
 */
function validateSources() {
  console.log('🔍 Validating source files...')
  
  const missingFiles = INCLUDE_FILES.filter(file => 
    !fs.existsSync(path.join(CONFIG.sourceDir, file))
  )
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles)
    process.exit(1)
  }
  
  console.log('✅ All source files found')
}

/**
 * 📝 Process manifest.json for environment
 */
function processManifest() {
  console.log('📝 Processing manifest.json...')
  
  const manifestPath = path.join(CONFIG.sourceDir, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  
  // Update version
  manifest.version = CONFIG.version
  
  // Environment-specific modifications
  if (CONFIG.environment === 'development') {
    manifest.name += ' (Development)'
    manifest.description += ' [Development Build]'
  } else if (CONFIG.environment === 'staging') {
    manifest.name += ' (Staging)'
    manifest.description += ' [Staging Build]'
  }
  
  // Add build info (in development only)
  if (CONFIG.environment !== 'production') {
    manifest.build_info = {
      environment: CONFIG.environment,
      timestamp: CONFIG.timestamp,
      version: CONFIG.version
    }
  }
  
  // Write processed manifest
  const outputPath = path.join(CONFIG.buildDir, 'manifest.json')
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  
  console.log(`✅ Manifest processed for ${CONFIG.environment}`)
}

/**
 * 📦 Copy files to build directory
 */
function copyFiles() {
  console.log('📦 Copying files...')
  
  // Copy individual files
  INCLUDE_FILES.filter(file => file !== 'manifest.json').forEach(file => {
    const sourcePath = path.join(CONFIG.sourceDir, file)
    const destPath = path.join(CONFIG.buildDir, file)
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`  📄 ${file}`)
    }
  })
  
  // Copy directories
  INCLUDE_DIRS.forEach(dir => {
    const sourcePath = path.join(CONFIG.sourceDir, dir)
    const destPath = path.join(CONFIG.buildDir, dir)
    
    if (fs.existsSync(sourcePath)) {
      copyDirectory(sourcePath, destPath)
      console.log(`  📁 ${dir}/`)
    }
  })
  
  console.log('✅ Files copied')
}

/**
 * 📁 Recursively copy directory
 */
function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true })
  
  const files = fs.readdirSync(source)
  
  files.forEach(file => {
    const sourcePath = path.join(source, file)
    const destPath = path.join(destination, file)
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath)
    } else {
      fs.copyFileSync(sourcePath, destPath)
    }
  })
}

/**
 * 🔧 Optimize for production
 */
function optimizeForProduction() {
  if (CONFIG.environment !== 'production') {
    return
  }
  
  console.log('🚀 Applying production optimizations...')
  
  // Remove debug code from JavaScript files
  const jsFiles = ['background.js', 'content.js', 'popup.js']
  
  jsFiles.forEach(file => {
    const filePath = path.join(CONFIG.buildDir, file)
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')
      
      // Remove console.debug statements
      content = content.replace(/console\.debug\([^)]*\);?\n?/g, '')
      
      // Remove TODO comments
      content = content.replace(/\/\/ TODO:.*\n/g, '')
      
      // Remove development-only code blocks
      content = content.replace(/\/\* DEV_START \*\/[\s\S]*?\/\* DEV_END \*\//g, '')
      
      fs.writeFileSync(filePath, content)
      console.log(`  🔧 Optimized ${file}`)
    }
  })
  
  console.log('✅ Production optimizations applied')
}

/**
 * 📊 Generate build report
 */
function generateBuildReport() {
  console.log('📊 Generating build report...')
  
  const files = fs.readdirSync(CONFIG.buildDir, { recursive: true })
  const totalSize = files.reduce((size, file) => {
    const filePath = path.join(CONFIG.buildDir, file)
    if (fs.statSync(filePath).isFile()) {
      return size + fs.statSync(filePath).size
    }
    return size
  }, 0)
  
  const report = {
    build: {
      environment: CONFIG.environment,
      version: CONFIG.version,
      timestamp: CONFIG.timestamp,
      totalFiles: files.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    },
    files: files.filter(file => {
      const filePath = path.join(CONFIG.buildDir, file)
      return fs.statSync(filePath).isFile()
    }).map(file => {
      const filePath = path.join(CONFIG.buildDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: `${(stats.size / 1024).toFixed(2)} KB`
      }
    })
  }
  
  // Write build report
  const reportPath = path.join(CONFIG.buildDir, 'build-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('📊 Build Report:')
  console.log(`  🏷️  Version: ${report.build.version}`)
  console.log(`  🌍 Environment: ${report.build.environment}`)
  console.log(`  📁 Files: ${report.build.totalFiles}`)
  console.log(`  📦 Total Size: ${report.build.totalSize}`)
  
  console.log('✅ Build report generated')
}

/**
 * 🚀 Main build function
 */
function build() {
  console.log('🏗️ Starting extension build...')
  console.log(`📋 Environment: ${CONFIG.environment}`)
  console.log(`🏷️ Version: ${CONFIG.version}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    validateSources()
    cleanBuildDir()
    processManifest()
    copyFiles()
    optimizeForProduction()
    generateBuildReport()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Build completed successfully!')
    console.log(`📦 Output: ${CONFIG.buildDir}`)
    
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

// 🚀 Run build if called directly
if (require.main === module) {
  build()
}

module.exports = { build, CONFIG }
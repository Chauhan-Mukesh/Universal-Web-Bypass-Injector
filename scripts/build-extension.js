#!/usr/bin/env node

/**
 * 🏗️ Extension Build Script
 * Professional build system for Universal Web Bypass Injector
 */

const fs = require('fs')
const path = require('path')

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
  'settings.html',
  'settings.js',
  'statistics.html',
  'statistics.js',
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

  // Add build info to build report only (not to manifest)
  const buildInfo = {
    environment: CONFIG.environment,
    timestamp: CONFIG.timestamp,
    version: CONFIG.version
  }

  // Store build info separately for internal use
  const buildInfoPath = path.join(CONFIG.buildDir, 'build-info.json')
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2))

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
  const jsFiles = ['background.js', 'content.js', 'popup.js', 'statistics.js']

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
 * 🔐 Verify manifest integrity
 */
function verifyManifestIntegrity() {
  console.log('🔐 Verifying manifest integrity...')

  const manifestPath = path.join(CONFIG.buildDir, 'manifest.json')
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifest file not found in build directory')
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    // Essential fields verification
    const requiredFields = ['manifest_version', 'name', 'version', 'permissions']
    const missingFields = requiredFields.filter(field => !manifest[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required manifest fields: ${missingFields.join(', ')}`)
    }

    // Version format validation
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}. Expected: X.Y.Z`)
    }

    // Manifest version validation
    if (manifest.manifest_version !== 3) {
      throw new Error(`Unsupported manifest version: ${manifest.manifest_version}. Expected: 3`)
    }

    // Chrome Web Store compliance checks
    const complianceIssues = []

    // Check for excessive permissions
    const sensitivePermissions = ['debugger', 'system.storage', 'enterprise.deviceAttributes']
    const hasSensitivePerms = manifest.permissions?.some(perm => 
      sensitivePermissions.includes(perm)
    )
    if (hasSensitivePerms) {
      complianceIssues.push('Contains sensitive permissions that may require additional review')
    }

    // Check host permissions scope
    if (manifest.host_permissions?.includes('<all_urls>')) {
      complianceIssues.push('Uses broad host permissions - ensure justification is clear')
    }

    // Check content scripts scope
    if (manifest.content_scripts?.some(cs => 
      cs.matches?.includes('http://*/*') || cs.matches?.includes('https://*/*')
    )) {
      complianceIssues.push('Content scripts run on all websites - ensure necessity is justified')
    }

    // Report compliance issues as warnings
    if (complianceIssues.length > 0) {
      console.log('⚠️ Chrome Web Store compliance notes:')
      complianceIssues.forEach(issue => console.log(`  - ${issue}`))
    }

    // Verify referenced files exist
    const referencedFiles = []
    
    if (manifest.background?.service_worker) {
      referencedFiles.push(manifest.background.service_worker)
    }
    
    if (manifest.content_scripts) {
      manifest.content_scripts.forEach(cs => {
        if (cs.js) referencedFiles.push(...cs.js)
        if (cs.css) referencedFiles.push(...cs.css)
      })
    }

    if (manifest.action?.default_popup) {
      referencedFiles.push(manifest.action.default_popup)
    }

    if (manifest.web_accessible_resources) {
      manifest.web_accessible_resources.forEach(war => {
        if (war.resources) referencedFiles.push(...war.resources)
      })
    }

    const missingFiles = referencedFiles.filter(file => 
      !fs.existsSync(path.join(CONFIG.buildDir, file))
    )

    if (missingFiles.length > 0) {
      throw new Error(`Manifest references missing files: ${missingFiles.join(', ')}`)
    }

    console.log('✅ Manifest integrity verified')
    return { valid: true, issues: complianceIssues }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in manifest.json')
    }
    throw error
  }
}

/**
 * 🚀 Main build function
 */
function build(options = {}) {
  console.log('🏗️ Starting extension build...')
  console.log(`📋 Environment: ${CONFIG.environment}`)
  console.log(`🏷️ Version: ${CONFIG.version}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    validateSources()
    cleanBuildDir()
    processManifest()
    copyFiles()
    verifyManifestIntegrity() // Add manifest verification
    optimizeForProduction()
    generateBuildReport()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Build completed successfully!')
    console.log(`📦 Output: ${CONFIG.buildDir}`)

    // Auto-package if requested
    if (options.autoPackage) {
      console.log('📦 Auto-packaging enabled, creating ZIP...')
      try {
        const { packageExtension } = require('./package-extension.js')
        return packageExtension()
      } catch (error) {
        console.error('⚠️ Auto-packaging failed:', error.message)
        console.log('💡 You can manually package with: npm run package')
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

// 🚀 Run build if called directly
if (require.main === module) {
  // Check for auto-package flag
  const args = process.argv.slice(2)
  const autoPackage = args.includes('--package') || args.includes('--auto-package')
  
  build({ autoPackage })
}

module.exports = { build, CONFIG }

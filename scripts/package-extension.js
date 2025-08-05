#!/usr/bin/env node

/**
 * 📦 Extension Packaging Script
 * Creates distribution packages for different environments
 */

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const crypto = require('crypto')

// 🎯 Configuration
const CONFIG = {
  buildDir: path.join(process.cwd(), 'dist'),
  packageDir: path.join(process.cwd(), 'packages'),
  environment: process.env.NODE_ENV || 'development',
  version: require('../package.json').version,
  timestamp: new Date().toISOString().replace(/[:.]/g, '-')
}

// Get environment from command line arguments
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
if (envArg) {
  CONFIG.environment = envArg.split('=')[1]
}

/**
 * 🔍 Validate build directory
 */
function validateBuildDir() {
  console.log('🔍 Validating build directory...')

  if (!fs.existsSync(CONFIG.buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.')
    process.exit(1)
  }

  const requiredFiles = ['manifest.json', 'background.js', 'content.js']
  const missingFiles = requiredFiles.filter(file =>
    !fs.existsSync(path.join(CONFIG.buildDir, file))
  )

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files in build:', missingFiles)
    process.exit(1)
  }

  console.log('✅ Build directory validated')
}

/**
 * 📁 Prepare package directory
 */
function preparePackageDir() {
  console.log('📁 Preparing package directory...')

  if (!fs.existsSync(CONFIG.packageDir)) {
    fs.mkdirSync(CONFIG.packageDir, { recursive: true })
  }

  console.log('✅ Package directory ready')
}

/**
 * 📦 Create ZIP package
 */
function createZipPackage() {
  return new Promise((resolve, reject) => {
    console.log('📦 Creating ZIP package...')

    const packageName = `universal-web-bypass-injector-${CONFIG.environment}-v${CONFIG.version}-${CONFIG.timestamp}`
    const zipPath = path.join(CONFIG.packageDir, `${packageName}.zip`)

    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2)
      console.log(`✅ ZIP package created: ${packageName}.zip (${sizeKB} KB)`)
      resolve({ path: zipPath, name: packageName, size: sizeKB })
    })

    archive.on('error', (err) => {
      console.error('❌ ZIP creation failed:', err)
      reject(err)
    })

    archive.pipe(output)

    // Add all files from build directory
    archive.directory(CONFIG.buildDir, false)

    archive.finalize()
  })
}

/**
 * 🔐 Generate checksums
 */
function generateChecksums(packagePath) {
  console.log('🔐 Generating checksums...')

  const fileBuffer = fs.readFileSync(packagePath)

  const checksums = {
    md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
    sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex')
  }

  // Write checksums file
  const checksumPath = packagePath.replace('.zip', '.checksums.txt')
  const checksumContent = [
    `MD5:    ${checksums.md5}`,
    `SHA1:   ${checksums.sha1}`,
    `SHA256: ${checksums.sha256}`,
    '',
    `File: ${path.basename(packagePath)}`,
    `Created: ${new Date().toISOString()}`,
    `Environment: ${CONFIG.environment}`,
    `Version: ${CONFIG.version}`
  ].join('\n')

  fs.writeFileSync(checksumPath, checksumContent)

  console.log('✅ Checksums generated')
  return checksums
}

/**
 * 📋 Create package manifest
 */
function createPackageManifest(packageInfo, checksums) {
  console.log('📋 Creating package manifest...')

  const manifest = {
    package: {
      name: packageInfo.name,
      version: CONFIG.version,
      environment: CONFIG.environment,
      created: CONFIG.timestamp,
      size: packageInfo.size
    },
    checksums,
    contents: getPackageContents(),
    build: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }

  const manifestPath = path.join(CONFIG.packageDir, `${packageInfo.name}.manifest.json`)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log('✅ Package manifest created')
  return manifest
}

/**
 * 📁 Get package contents
 */
function getPackageContents() {
  const contents = []

  function walkDir(dir, basePath = '') {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const relativePath = path.join(basePath, file)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory()) {
        contents.push({
          type: 'directory',
          path: relativePath,
          size: 0
        })
        walkDir(filePath, relativePath)
      } else {
        contents.push({
          type: 'file',
          path: relativePath,
          size: stats.size
        })
      }
    })
  }

  walkDir(CONFIG.buildDir)
  return contents
}

/**
 * 🧪 Validate package
 */
function validatePackage(packagePath) {
  console.log('🧪 Validating package...')

  // Check if package exists and has content
  const stats = fs.statSync(packagePath)
  if (stats.size === 0) {
    throw new Error('Package is empty')
  }

  // Minimum size check (should be at least 10KB for a basic extension)
  if (stats.size < 10240) {
    console.warn('⚠️ Package seems unusually small, please verify contents')
  }

  console.log('✅ Package validated')
}

/**
 * 📊 Generate packaging report
 */
function generateReport(packageInfo, manifest) {
  console.log('📊 Generating packaging report...')

  const report = {
    summary: {
      package_name: packageInfo.name,
      version: CONFIG.version,
      environment: CONFIG.environment,
      size: packageInfo.size,
      files_count: manifest.contents.filter(item => item.type === 'file').length,
      created: CONFIG.timestamp
    },
    files: manifest.contents,
    checksums: manifest.checksums
  }

  const reportPath = path.join(CONFIG.packageDir, `${packageInfo.name}.report.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('📊 Packaging Report:')
  console.log(`  📦 Package: ${report.summary.package_name}`)
  console.log(`  🏷️ Version: ${report.summary.version}`)
  console.log(`  🌍 Environment: ${report.summary.environment}`)
  console.log(`  📁 Files: ${report.summary.files_count}`)
  console.log(`  📏 Size: ${report.summary.size} KB`)

  console.log('✅ Packaging report generated')
}

/**
 * 🚀 Main packaging function
 */
async function packageExtension() {
  console.log('📦 Starting extension packaging...')
  console.log(`🌍 Environment: ${CONFIG.environment}`)
  console.log(`🏷️ Version: ${CONFIG.version}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    validateBuildDir()
    preparePackageDir()

    const packageInfo = await createZipPackage()
    validatePackage(packageInfo.path)

    const checksums = generateChecksums(packageInfo.path)
    const manifest = createPackageManifest(packageInfo, checksums)

    generateReport(packageInfo, manifest)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Packaging completed successfully!')
    console.log(`📦 Package: ${packageInfo.name}.zip`)
    console.log(`📁 Location: ${CONFIG.packageDir}`)

    return packageInfo
  } catch (error) {
    console.error('❌ Packaging failed:', error.message)
    process.exit(1)
  }
}

// 🚀 Run packaging if called directly
if (require.main === module) {
  // Check if archiver is available, install if needed
  try {
    require('archiver')
  } catch (_error) {
    console.log('📦 Installing archiver dependency...')
    const { execSync } = require('child_process')
    execSync('npm install archiver --save-dev', { stdio: 'inherit' })
  }

  packageExtension()
}

module.exports = { packageExtension, CONFIG }

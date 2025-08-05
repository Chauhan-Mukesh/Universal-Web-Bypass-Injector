#!/usr/bin/env node

/**
 * 🔒 Security Check Script
 * Comprehensive security validation for the extension
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 🎯 Configuration
const CONFIG = {
  sourceDir: process.cwd(),
  manifestPath: path.join(process.cwd(), 'manifest.json'),
  packagePath: path.join(process.cwd(), 'package.json')
}

// 🚫 Dangerous patterns to check for
const SECURITY_PATTERNS = [
  {
    pattern: /eval\s*\(/gi,
    description: 'Usage of eval() function',
    severity: 'high',
    category: 'code-execution'
  },
  {
    pattern: /innerHTML\s*=/gi,
    description: 'Direct innerHTML assignment',
    severity: 'medium',
    category: 'xss-risk'
  },
  {
    pattern: /document\.write\s*\(/gi,
    description: 'Usage of document.write()',
    severity: 'medium',
    category: 'xss-risk'
  },
  {
    pattern: /(password|secret|key|token)\s*[:=]\s*['"'][^'"]{4,}['"']/gi,
    description: 'Potential hardcoded secrets',
    severity: 'critical',
    category: 'secrets'
  },
  {
    pattern: /console\.log\s*\(\s*['"'][^'"]*password[^'"]*['"']/gi,
    description: 'Password logging',
    severity: 'high',
    category: 'data-leak'
  },
  {
    pattern: /http:\/\/[^'")\s]+/gi,
    description: 'HTTP (non-HTTPS) URLs',
    severity: 'low',
    category: 'insecure-transport'
  }
]

// ⚠️ Dangerous permissions to flag
const DANGEROUS_PERMISSIONS = [
  { permission: 'tabs', severity: 'medium', reason: 'Can access all browser tabs' },
  { permission: 'history', severity: 'high', reason: 'Can access browsing history' },
  { permission: 'bookmarks', severity: 'medium', reason: 'Can access bookmarks' },
  { permission: 'webRequest', severity: 'high', reason: 'Can intercept web requests' },
  { permission: 'webRequestBlocking', severity: 'critical', reason: 'Can block web requests' },
  { permission: '<all_urls>', severity: 'critical', reason: 'Can access all websites' },
  { permission: 'cookies', severity: 'medium', reason: 'Can access cookies' }
]

let securityIssues = []

/**
 * 🔍 Scan files for security patterns
 */
function scanForSecurityPatterns() {
  console.log('🔍 Scanning for security patterns...')
  
  const jsFiles = [
    'background.js',
    'content.js',
    'popup.js'
  ]
  
  jsFiles.forEach(file => {
    const filePath = path.join(CONFIG.sourceDir, file)
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      SECURITY_PATTERNS.forEach(pattern => {
        const matches = content.match(pattern.pattern)
        
        if (matches) {
          matches.forEach(match => {
            securityIssues.push({
              type: 'security-pattern',
              file: file,
              pattern: pattern.description,
              match: match.trim(),
              severity: pattern.severity,
              category: pattern.category,
              line: getLineNumber(content, match)
            })
          })
        }
      })
    }
  })
  
  console.log(`✅ Pattern scanning completed (${securityIssues.length} issues found)`)
}

/**
 * 📄 Get line number for a match
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n')
  return lines.length
}

/**
 * 🔐 Check manifest permissions
 */
function checkManifestSecurity() {
  console.log('🔐 Checking manifest security...')
  
  if (!fs.existsSync(CONFIG.manifestPath)) {
    securityIssues.push({
      type: 'manifest-missing',
      severity: 'critical',
      description: 'manifest.json not found'
    })
    return
  }
  
  const manifest = JSON.parse(fs.readFileSync(CONFIG.manifestPath, 'utf8'))
  
  // Check permissions
  const permissions = manifest.permissions || []
  const hostPermissions = manifest.host_permissions || []
  
  const allPermissions = [...permissions, ...hostPermissions]
  allPermissions.forEach(permission => {
    const dangerousPermission = DANGEROUS_PERMISSIONS.find(p => 
      permission.includes(p.permission)
    )
    
    if (dangerousPermission) {
      securityIssues.push({
        type: 'dangerous-permission',
        permission: permission,
        severity: dangerousPermission.severity,
        reason: dangerousPermission.reason,
        category: 'permissions'
      })
    }
  })
  
  // Check Content Security Policy
  const csp = manifest.content_security_policy
  if (!csp) {
    securityIssues.push({
      type: 'missing-csp',
      severity: 'medium',
      description: 'No Content Security Policy defined',
      category: 'csp'
    })
  } else {
    // Check for unsafe CSP directives
    const cspString = typeof csp === 'string' ? csp : JSON.stringify(csp)
    
    if (cspString.includes('unsafe-inline')) {
      securityIssues.push({
        type: 'unsafe-csp',
        severity: 'high',
        description: 'CSP allows unsafe-inline',
        category: 'csp'
      })
    }
    
    if (cspString.includes('unsafe-eval')) {
      securityIssues.push({
        type: 'unsafe-csp',
        severity: 'critical',
        description: 'CSP allows unsafe-eval',
        category: 'csp'
      })
    }
  }
  
  console.log('✅ Manifest security check completed')
}

/**
 * 📦 Check package dependencies
 */
function checkDependencySecurity() {
  console.log('📦 Checking dependency security...')
  
  try {
    // Run npm audit
    const auditResult = execSync('npm audit --json', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    const audit = JSON.parse(auditResult)
    
    if (audit.metadata && audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities
      
      Object.keys(vulns).forEach(severity => {
        if (vulns[severity] > 0) {
          securityIssues.push({
            type: 'dependency-vulnerability',
            severity: severity,
            count: vulns[severity],
            description: `${vulns[severity]} ${severity} dependency vulnerabilities`,
            category: 'dependencies'
          })
        }
      })
    }
    
  } catch (error) {
    console.warn('⚠️ Could not run npm audit:', error.message)
    securityIssues.push({
      type: 'audit-failed',
      severity: 'low',
      description: 'Could not run dependency security audit',
      category: 'dependencies'
    })
  }
  
  console.log('✅ Dependency security check completed')
}

/**
 * 🔍 Check for sensitive files
 */
function checkForSensitiveFiles() {
  console.log('🔍 Checking for sensitive files...')
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'config.json',
    'secrets.json',
    'private.key',
    '.htpasswd',
    'password.txt'
  ]
  
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(path.join(CONFIG.sourceDir, file))) {
      securityIssues.push({
        type: 'sensitive-file',
        file: file,
        severity: 'high',
        description: `Sensitive file found: ${file}`,
        category: 'files'
      })
    }
  })
  
  console.log('✅ Sensitive file check completed')
}

/**
 * 📊 Generate security report
 */
function generateSecurityReport() {
  console.log('📊 Generating security report...')
  
  const report = {
    summary: {
      total_issues: securityIssues.length,
      critical: securityIssues.filter(i => i.severity === 'critical').length,
      high: securityIssues.filter(i => i.severity === 'high').length,
      medium: securityIssues.filter(i => i.severity === 'medium').length,
      low: securityIssues.filter(i => i.severity === 'low').length,
      scan_date: new Date().toISOString()
    },
    issues_by_category: {},
    issues: securityIssues
  }
  
  // Group issues by category
  securityIssues.forEach(issue => {
    const category = issue.category || 'other'
    if (!report.issues_by_category[category]) {
      report.issues_by_category[category] = []
    }
    report.issues_by_category[category].push(issue)
  })
  
  // Write report to file
  const reportPath = path.join(CONFIG.sourceDir, 'security-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('📊 Security Report Summary:')
  console.log(`  🔍 Total Issues: ${report.summary.total_issues}`)
  console.log(`  🚨 Critical: ${report.summary.critical}`)
  console.log(`  ⚠️  High: ${report.summary.high}`)
  console.log(`  📋 Medium: ${report.summary.medium}`)
  console.log(`  ℹ️  Low: ${report.summary.low}`)
  
  return report
}

/**
 * 🚨 Display critical issues
 */
function displayCriticalIssues() {
  const criticalIssues = securityIssues.filter(i => i.severity === 'critical')
  const highIssues = securityIssues.filter(i => i.severity === 'high')
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL SECURITY ISSUES:')
    criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.description || issue.pattern}`)
      if (issue.file) console.log(`     📁 File: ${issue.file}`)
      if (issue.line) console.log(`     📍 Line: ${issue.line}`)
      if (issue.match) console.log(`     🔍 Match: ${issue.match}`)
    })
  }
  
  if (highIssues.length > 0) {
    console.log('\n⚠️ HIGH PRIORITY ISSUES:')
    highIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.description || issue.pattern}`)
      if (issue.file) console.log(`     📁 File: ${issue.file}`)
    })
  }
}

/**
 * 🚀 Main security check function
 */
function runSecurityCheck() {
  console.log('🔒 Starting comprehensive security check...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    scanForSecurityPatterns()
    checkManifestSecurity()
    checkDependencySecurity()
    checkForSensitiveFiles()
    
    const report = generateSecurityReport()
    displayCriticalIssues()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const criticalCount = report.summary.critical
    const highCount = report.summary.high
    
    if (criticalCount > 0) {
      console.log('❌ Security check FAILED - Critical issues found!')
      process.exit(1)
    } else if (highCount > 0) {
      console.log('⚠️ Security check completed with HIGH priority issues')
      console.log('   Consider reviewing and addressing these issues')
      process.exit(0)
    } else {
      console.log('✅ Security check PASSED - No critical issues found!')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ Security check failed:', error.message)
    process.exit(1)
  }
}

// 🚀 Run security check if called directly
if (require.main === module) {
  runSecurityCheck()
}

module.exports = { runSecurityCheck, CONFIG }
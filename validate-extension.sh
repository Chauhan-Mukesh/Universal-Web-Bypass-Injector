#!/bin/bash

# Universal Web Bypass Injector - Validation Script
# This script runs comprehensive tests and validations

echo "🛡️  Universal Web Bypass Injector - Validation Script"
echo "=================================================="

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run tests."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to run tests."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔍 Running code quality checks..."

# Run linting
echo "  - Running ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

# Run tests
echo "🧪 Running test suite..."
if npm test; then
    echo "✅ All tests passed"
else
    echo "❌ Some tests failed"
    exit 1
fi

# Validate manifest.json
echo "📋 Validating manifest.json..."
if node -e "
const manifest = require('./manifest.json');
if (!manifest.manifest_version || manifest.manifest_version !== 3) {
    console.error('❌ Invalid manifest version');
    process.exit(1);
}
if (!manifest.name || !manifest.version || !manifest.description) {
    console.error('❌ Missing required manifest fields');
    process.exit(1);
}
console.log('✅ Manifest validation passed');
"; then
    echo "✅ Manifest is valid"
else
    echo "❌ Manifest validation failed"
    exit 1
fi

# Check file structure
echo "📁 Checking file structure..."
required_files=("manifest.json" "content.js" "background.js" "popup.html" "popup.js")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file is missing"
        exit 1
    fi
done

# Check for icons
if [ -d "icons" ]; then
    echo "  ✅ Icons directory exists"
    icon_files=("icon16.png" "icon48.png" "icon128.png")
    for icon in "${icon_files[@]}"; do
        if [ -f "icons/$icon" ]; then
            echo "    ✅ icons/$icon exists"
        else
            echo "    ⚠️  icons/$icon is missing (optional but recommended)"
        fi
    done
else
    echo "  ⚠️  Icons directory is missing"
fi

# Check for logo.png (new requirement)
if [ -f "logo.png" ]; then
    echo "  ✅ logo.png exists (required by manifest)"
else
    echo "  ⚠️  logo.png is missing - extension will not load properly"
    echo "    Please ensure logo.png is present in the root directory"
fi

# Validate JavaScript syntax
echo "🔧 Validating JavaScript syntax..."
js_files=("content.js" "background.js" "popup.js")
for js_file in "${js_files[@]}"; do
    if node -c "$js_file" 2>/dev/null; then
        echo "  ✅ $js_file syntax is valid"
    else
        echo "  ❌ $js_file has syntax errors"
        exit 1
    fi
done

# Check HTML validation
echo "🌐 Checking HTML structure..."
if grep -q "<!DOCTYPE html>" popup.html; then
    echo "  ✅ popup.html has proper DOCTYPE"
else
    echo "  ❌ popup.html missing DOCTYPE"
    exit 1
fi

# Performance check - file sizes
echo "📊 Checking file sizes..."
for file in "${js_files[@]}"; do
    size=$(wc -c < "$file")
    if [ "$size" -gt 1048576 ]; then  # 1MB
        echo "  ⚠️  $file is large (${size} bytes) - consider optimization"
    else
        echo "  ✅ $file size is reasonable (${size} bytes)"
    fi
done

# Security check - basic patterns
echo "🔒 Running basic security checks..."
if grep -q "eval(" content.js background.js popup.js 2>/dev/null; then
    echo "  ⚠️  Found eval() usage - potential security risk"
else
    echo "  ✅ No eval() usage found"
fi

if grep -q "innerHTML" content.js background.js popup.js 2>/dev/null; then
    echo "  ⚠️  Found innerHTML usage - ensure proper sanitization"
else
    echo "  ✅ No innerHTML usage found"
fi

echo ""
echo "🎉 All validations completed successfully!"
echo "✅ Extension is ready for testing and deployment"
echo ""
echo "📝 Next steps:"
echo "  1. Load the extension in Chrome developer mode"
echo "  2. Test on various websites"
echo "  3. Monitor console for any errors"
echo "  4. Package for distribution if needed"
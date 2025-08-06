# 🤝 Contributing to Universal Web Bypass Injector

Thank you for your interest in contributing to Universal Web Bypass Injector! This guide will help you understand how to contribute effectively to our project.

## 📋 Table of Contents
- [🚀 Getting Started](#-getting-started)
- [🎯 Ways to Contribute](#-ways-to-contribute)
- [🔧 Development Setup](#-development-setup)
- [📝 Code Style Guidelines](#-code-style-guidelines)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [📦 Submission Process](#-submission-process)
- [🌐 Website Support](#-website-support)
- [📚 Documentation](#-documentation)
- [❓ Getting Help](#-getting-help)

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Git**
- **Modern web browser** (Chrome, Edge, Opera)
- **Code editor** (VS Code recommended)

### 🔧 First Steps
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Universal-Web-Bypass-Injector.git
   cd Universal-Web-Bypass-Injector
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
   ```

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include detailed steps to reproduce
- Provide browser and extension version information
- Include screenshots if applicable

### ✨ Feature Requests
- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the use case and benefits
- Consider implementation complexity
- Provide mockups if applicable

### 🌐 Website Support
- Use the [website support template](.github/ISSUE_TEMPLATE/website_support.md)
- Test thoroughly before submitting
- Provide technical details when possible
- Include screenshots of the issue

### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test improvements

### 📚 Documentation
- README improvements
- Code comments
- API documentation
- User guides
- Developer guides

## 🔧 Development Setup

### 📦 Installation
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the extension
npm run build
```

### 🌐 Loading Extension for Testing
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project directory
5. The extension should now be loaded and ready for testing

### 🔄 Development Workflow
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**
3. **Test thoroughly**
4. **Commit with descriptive messages**
5. **Push to your fork**
6. **Create a pull request**

## 📝 Code Style Guidelines

### 🎨 JavaScript Style
- **ES6+** features preferred
- **camelCase** for variables and functions
- **PascalCase** for classes
- **UPPER_CASE** for constants
- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings

### 📋 Example Code Style
```javascript
// ✅ Good
const BYPASS_SELECTORS = [
  '.paywall-overlay',
  '#subscription-banner'
]

class WebsiteBypass {
  constructor(domain) {
    this.domain = domain
    this.isActive = false
  }

  removeElement(selector) {
    const element = document.querySelector(selector)
    if (element) {
      element.remove()
      console.log(`Removed element: ${selector}`)
    }
  }
}

// ❌ Bad
const bypass_selectors = [
  ".paywall-overlay",
  "#subscription-banner"
];

class websiteBypass {
  constructor(domain) {
    this.domain = domain;
    this.isActive = false;
  }

  removeElement(selector) {
    var element = document.querySelector(selector);
    if (element) {
      element.remove();
    }
  }
}
```

### 🔧 ESLint Configuration
We use ESLint with the Standard configuration. Run linting with:
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

## 🧪 Testing Guidelines

### 📋 Test Types
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Manual Testing**: Test extension in actual browsers

### ✅ Test Requirements
- **All new features** must include tests
- **Bug fixes** should include regression tests
- **Maintain test coverage** above 80%
- **Tests must pass** before submitting PR

### 🧪 Writing Tests
```javascript
// Example test structure
describe('WebsiteBypass', () => {
  let bypass

  beforeEach(() => {
    bypass = new WebsiteBypass('example.com')
  })

  test('should remove paywall elements', () => {
    // Setup DOM
    document.body.innerHTML = '<div class="paywall">Content</div>'
    
    // Execute
    bypass.removeElement('.paywall')
    
    // Assert
    expect(document.querySelector('.paywall')).toBeNull()
  })
})
```

### 🏃 Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run with coverage report
```

## 📦 Submission Process

### 📝 Pull Request Guidelines
1. **Use the PR template** provided
2. **Reference related issues** (e.g., "Fixes #123")
3. **Provide clear description** of changes
4. **Include test evidence** (screenshots, test results)
5. **Keep PRs focused** - one feature/fix per PR

### ✅ PR Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] All CI checks pass

### 🔄 Review Process
1. **Automated checks** run via CI/CD
2. **Code review** by maintainers
3. **Testing** on multiple browsers
4. **Approval** and merge

## 🌐 Website Support

### 📋 Adding Website Support
When adding support for a new website:

1. **Research the website structure**:
   ```javascript
   // Identify blocking elements
   const selectors = [
     '.paywall-container',
     '#overlay-ad',
     '.subscription-prompt'
   ]
   ```

2. **Test thoroughly**:
   - Test on actual website
   - Verify no functionality is broken
   - Test edge cases

3. **Document your changes**:
   ```javascript
   // Add clear comments
   // Website: example.com
   // Issue: Paywall blocks content after 3 articles
   // Solution: Remove .paywall-container and enable scroll
   ```

4. **Update website list** in documentation

### 🧪 Testing Website Support
- Test on the actual website
- Verify the bypass works correctly
- Ensure no legitimate functionality is broken
- Test with different article types
- Verify across different browsers

## 📚 Documentation

### 📝 Code Documentation
- **JSDoc comments** for functions
- **Inline comments** for complex logic
- **README updates** for new features
- **Changelog entries** for releases

### 📋 Documentation Example
```javascript
/**
 * Removes paywall elements from the current page
 * @param {string[]} selectors - Array of CSS selectors to remove
 * @param {boolean} restoreScroll - Whether to restore page scrolling
 * @returns {number} Number of elements removed
 */
function removePaywallElements(selectors, restoreScroll = true) {
  // Implementation...
}
```

## ❓ Getting Help

### 💬 Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific questions

### 🆘 When You Need Help
- **Stuck on implementation**: Create a draft PR and ask for guidance
- **Unclear requirements**: Comment on the related issue
- **Testing issues**: Ask for help in the PR description

### 📚 Resources
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [JavaScript MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [ESLint Documentation](https://eslint.org/docs/rules/)
- [Development Guide](DEVELOPMENT.md) - Complete technical documentation

## 🏆 Recognition

Contributors who make significant contributions will be:
- **Listed in README** contributors section
- **Mentioned in release notes**
- **Given appropriate GitHub repository permissions**

## 📄 License

By contributing to Universal Web Bypass Injector, you agree that your contributions will be licensed under the same [GPL-3.0 License](LICENSE) that covers the project.

---

Thank you for contributing to Universal Web Bypass Injector! Your efforts help make the web more accessible for everyone. 🚀
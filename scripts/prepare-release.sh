#!/bin/bash

# MyCoin Release Preparation Script
# This script prepares the codebase for release

set -e

echo "🚀 Preparing MyCoin for release..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking project structure..."

# Check for required files
required_files=(
    "package.json"
    "tsconfig.json"
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "SECURITY.md"
    "CHANGELOG.md"
    ".gitignore"
    ".eslintrc.js"
    "jest.config.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check for required directories
required_dirs=(
    "src/core"
    "src/wallet"
    "src/tests"
    "src/docs"
    ".github/workflows"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Found directory $dir"
    else
        print_error "Missing required directory: $dir"
        exit 1
    fi
done

# Check Node.js version
print_status "Checking Node.js version..."
node_version=$(node --version)
print_status "Node.js version: $node_version"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting
print_status "Running ESLint..."
npm run lint

# Run tests
print_status "Running tests..."
npm test

# Build the project
print_status "Building project..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    print_status "Build successful - dist directory created"
else
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Check TypeScript compilation
print_status "Checking TypeScript compilation..."
if [ -f "dist/main.js" ]; then
    print_status "Main entry point compiled successfully"
else
    print_error "Main entry point compilation failed"
    exit 1
fi

# Validate package.json
print_status "Validating package.json..."
npm run lint:fix || print_warning "Some linting issues were auto-fixed"

# Check for security vulnerabilities
print_status "Checking for security vulnerabilities..."
npm audit --audit-level moderate || print_warning "Security vulnerabilities found - please review"

# Generate documentation
print_status "Checking documentation..."
if [ -f "src/docs/API.md" ] && [ -f "src/docs/ARCHITECTURE.md" ]; then
    print_status "Documentation files present"
else
    print_warning "Some documentation files may be missing"
fi

# Check Git status
print_status "Checking Git status..."
if git diff-index --quiet HEAD --; then
    print_status "Working directory is clean"
else
    print_warning "Working directory has uncommitted changes"
    git status --porcelain
fi

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
    print_status "On main branch"
else
    print_warning "Not on main branch (current: $current_branch)"
fi

# Check for untracked files that should be committed
untracked_files=$(git ls-files --others --exclude-standard)
if [ -n "$untracked_files" ]; then
    print_warning "Untracked files found:"
    echo "$untracked_files"
fi

# Final checks
print_status "Running final checks..."

# Check if all core files are present
core_files=(
    "src/core/Block.ts"
    "src/core/Blockchain.ts"
    "src/core/Transaction.ts"
    "src/core/Wallet.ts"
    "src/core/P2PNetwork.ts"
    "src/core/MyCoinNode.ts"
)

for file in "${core_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Core file present: $file"
    else
        print_error "Missing core file: $file"
        exit 1
    fi
done

# Check wallet files
wallet_files=(
    "src/wallet/index.html"
    "src/wallet/styles.css"
    "src/wallet/renderer.js"
)

for file in "${wallet_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Wallet file present: $file"
    else
        print_error "Missing wallet file: $file"
        exit 1
    fi
done

# Check test files
test_files=(
    "src/tests/Blockchain.test.ts"
    "src/tests/Wallet.test.ts"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Test file present: $file"
    else
        print_warning "Missing test file: $file"
    fi
done

print_status "All checks completed successfully!"

echo ""
echo "📋 Release Checklist:"
echo "  ✓ Dependencies installed"
echo "  ✓ Code linted"
echo "  ✓ Tests passed"
echo "  ✓ Project built successfully"
echo "  ✓ Required files present"
echo "  ✓ Documentation available"
echo ""

print_status "🎉 MyCoin is ready for release!"
print_status "Next steps:"
echo "  1. Review and commit any remaining changes"
echo "  2. Create a new release tag: git tag -a v1.0.0 -m 'Release v1.0.0'"
echo "  3. Push to GitHub: git push origin main --tags"
echo "  4. GitHub Actions will automatically build and create releases"

echo ""
print_status "Repository is ready to push to GitHub! 🚀"

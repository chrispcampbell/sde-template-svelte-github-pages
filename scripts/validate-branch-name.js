#!/usr/bin/env node

/**
 * Validates branch names to ensure they meet requirements for URL-safe paths.
 * Allows: /, -, _, a-z, A-Z, 0-9
 *
 * Usage: node validate-branch-name.js <branch-name>
 */

const branchName = process.argv[2]

if (!branchName) {
  console.error('ERROR: Branch name is required')
  console.error('Usage: node validate-branch-name.js <branch-name>')
  process.exit(1)
}

// Allow: /, -, _, a-z, A-Z, 0-9
const validBranchPattern = /^[\/\-_a-zA-Z0-9]+$/

if (!validBranchPattern.test(branchName)) {
  console.error(`ERROR: Branch name "${branchName}" contains invalid characters`)
  console.error('Branch names must only contain: /, -, _, a-z, A-Z, 0-9')
  console.error('This ensures URL-safe paths for GitHub Pages deployment')
  process.exit(1)
}

// Additional validation: cannot start or end with /
if (branchName.startsWith('/') || branchName.endsWith('/')) {
  console.error(`ERROR: Branch name "${branchName}" cannot start or end with "/"`)
  process.exit(1)
}

// Additional validation: cannot have consecutive slashes
if (branchName.includes('//')) {
  console.error(`ERROR: Branch name "${branchName}" cannot contain consecutive slashes "//"`)
  process.exit(1)
}

console.log(`✓ Branch name "${branchName}" is valid`)

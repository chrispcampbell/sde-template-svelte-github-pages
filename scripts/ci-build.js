#!/usr/bin/env node

/**
 * Builds the app and model-check reports and copies the artifacts to the staged directory.
 *
 * Usage: node ci-build.js
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Build the app and model-check report
console.log('Building the app and model-check report...')
execSync('npm run build', { stdio: 'inherit' })

// Remove existing `staged` directory if it exists
if (existsSync('staged')) {
  console.log('Removing existing staged directory...')
  rmSync('staged', { recursive: true, force: true })
}

// Create `staged` directory
console.log('Creating staged directory...')
mkdirSync('staged', { recursive: true })

// Copy app files from `packages/app/public` to `staged/app`
console.log('Copying app files...')
mkdirSync('staged/app', { recursive: true })
cpSync('packages/app/public', 'staged/app', { recursive: true })

// Copy model-check report from `sde-prep/check-report` to `staged/extras/check-compare-to-base`
console.log('Copying model-check report files...')
mkdirSync('staged/extras/check-compare-to-base', { recursive: true })
cpSync('sde-prep/check-report', 'staged/extras/check-compare-to-base', { recursive: true })

// Copy model-check bundle from `sde-prep/check-bundle.js` to `staged/extras/check-bundle.js`
console.log('Copying model-check bundle...')
mkdirSync('staged/extras', { recursive: true })
cpSync('sde-prep/check-bundle.js', 'staged/extras/check-bundle.js')

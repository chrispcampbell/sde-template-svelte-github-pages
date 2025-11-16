#!/usr/bin/env node

/**
 * Stores build artifacts in the `artifacts` orphan branch.
 *
 * The `artifacts` directory contains build artifacts for all branches that
 * have been built. The directory structure is as follows:
 *   artifacts/
 *   ├── latest/
 *   |   ├── index.html         # Main branch app
 *   |   ├── assets/            # Main branch assets
 *   ├── branch/
 *   |   ├── main/
 *   |   │   ├── app/           # Main branch app files
 *   |   │   └── extras/        # Main branch check bundles and reports
 *   |   ├── chris/1234-test/
 *   |   │   ├── app/
 *   |   │   └── extras/
 *   |   └── feature/new-ui/
 *   |       ├── app/
 *   |       └── extras/
 *   └── metadata/
 *       └── index.json         # Build metadata
 *
 * This script should be called after the artifacts for the current branch have been
 * built.  Typically the branch artifacts will be copied to a `staged` directory, and
 * then this script will copy those branch artifacts into the correct location in the
 * separate `artifacts` branch (an orphan branch that contains all historical artifacts).
 *
 * The `metadata/index.json` file is used to keep track of all available branch builds,
 * mainly for use by the model-check tool, which allows selecting any available bundle.
 *
 * Once updated, the `artifacts` directory can be uploaded to GitHub Pages to make the
 * entire directory structure available at the public URL.
 *
 * Usage: node ci-store-artifacts.js <branch-name> <staged-dir> <check-bundle-dir>
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join as joinPath } from 'node:path'

const artifactsBranchName = 'artifacts'
const artifactsDir = 'artifacts'

/**
 * Main entry point.
 */
function main() {
  const branchName = process.argv[2]
  const stagedDir = process.argv[3]

  if (!branchName || !stagedDir) {
    console.error('ERROR: All arguments are required')
    console.error('Usage: node store-artifacts.js <branch-name> <staged-dir-path>')
    process.exit(1)
  }

  if (!existsSync(stagedDir)) {
    console.error(`ERROR: Staged directory '${stagedDir}' does not exist`)
    process.exit(1)
  }

  try {
    console.log(`Storing artifacts for branch '${branchName}'...`)

    // Check if `artifacts` branch exists
    let artifactsExists
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${artifactsBranchName}`, { stdio: 'ignore' })
      artifactsExists = true
    } catch (e) {
      artifactsExists = false
    }

    if (!artifactsExists) {
      // The orphan branch doesn't already exist, so created it now
      console.log(`Creating orphan '${artifactsBranchName}' branch...`)
      execSync(`git checkout --orphan ${artifactsBranchName}`, { stdio: 'inherit' })

      // By default, the new branch will inherit the contents of the current branch
      // (i.e., the contents will be git added), but we only want to keep the `artifacts`
      // directory, so unstage all cached files first
      execSync('git rm -rf --cached .', { stdio: 'inherit' })

      // Add a `.gitignore` file that ignores everything except the `artifacts` directory
      // and the `.gitignore` file itself
      const ignoredFiles = [
        '*',
        '!artifacts',
        '!artifacts/**',
        '!.gitignore'
      ]
      writeFileSync('.gitignore', ignoredFiles.join('\n'))
      execSync('git add .gitignore', { stdio: 'inherit' })
      console.log(`Created .gitignore file for '${artifactsBranchName}' branch`)
    } else {
      // Switch to the existing `artifacts` branch
      console.log(`Switching to existing '${artifactsBranchName}' branch...`)
      execSync(`git checkout ${artifactsBranchName}`, { stdio: 'inherit' })
    }

    // Remove existing branch directory if it exists
    const currentBranchDir = joinPath(artifactsDir, 'branch', branchName)
    if (existsSync(currentBranchDir)) {
      console.log(`Removing existing branch directory '${currentBranchDir}'...`)
      rmSync(currentBranchDir, { recursive: true })
    }

    // Copy staged files to branch directory
    console.log(`Copying staged files from '${stagedDir}' to '${currentBranchDir}'...`)
    cpSync(stagedDir, currentBranchDir, { recursive: true })

    // Update `metadata/index.json`
    // TODO: This should be kept in sync with the `ci-build.js` script
    const paths = {
      app: `${currentBranchDir}/app`,
      checkReport: `${currentBranchDir}/extras/check-compare-to-base`,
      checkBundle: `${currentBranchDir}/extras/check-bundle.js`
    }
    updateMetadata(branchName, paths)

    // For main branch, also copy app files to top-level `latest` directory
    if (branchName === 'main') {
      if (existsSync('latest')) {
        console.log(`Removing existing 'latest' directory...`)
        rmSync('latest', { recursive: true })
      }
      console.log(`Copying main branch app files to 'latest' directory...`)
      const stagedAppSrcDir = joinPath(stagedDir, 'app')
      const stagedAppDstDir = joinPath(artifactsDir, 'latest')
      cpSync(stagedAppSrcDir, stagedAppDstDir, { recursive: true })
    }

    // Add all updated files in the `artifacts` directory to git
    execSync(`git add ${artifactsDir}`, { stdio: 'inherit' })

    // Check if there are changes to commit
    try {
      execSync('git diff --cached --quiet', { stdio: 'ignore' })
      console.log('No changes to commit')
    } catch (e) {
      // There are changes, commit them
      const commitMessage = `build: update artifacts for branch ${branchName}`
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
      console.log(`Committed artifacts for branch '${branchName}'...`)
    }

    // // Push to remote
    // console.log(`Pushing '${artifactsBranchName}' branch to remote...`)
    // execSync(`git push origin ${artifactsBranchName}`, { stdio: 'inherit' })

    console.log(`✅ Successfully stored artifacts for branch '${branchName}'`)
  } catch (error) {
    console.error('❌ Error storing artifacts:', error.message)
    process.exit(1)
  }
}

/**
 * Update the `metadata/index.json` file with the new branch name and check bundle path.
 */
function updateMetadata(branchName, paths) {
  const metadataDir = joinPath(artifactsDir, 'metadata')
  const metadataFile = joinPath(metadataDir, 'index.json')

  // Create metadata directory if it doesn't exist
  mkdirSync(metadataDir, { recursive: true })

  let metadata = []
  if (existsSync(metadataFile)) {
    try {
      metadata = JSON.parse(readFileSync(metadataFile, 'utf8'))
    } catch (e) {
      console.warn('⚠️ Could not parse existing metadata, starting fresh')
      metadata = []
    }
  }

  // Remove existing entry for this branch
  metadata = metadata.filter(entry => entry.path !== branchName)

  // Add new entry
  const newEntry = {
    path: branchName,
    app: paths.app,
    checkReport: paths.checkReport,
    checkBundle: paths.checkBundle,
    lastModified: new Date().toISOString()
  }
  metadata.push(newEntry)

  // Sort by lastModified (newest first)
  metadata.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))

  // Write updated metadata
  writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))
  console.log(`Updated metadata for branch '${branchName}'`)
}

main()

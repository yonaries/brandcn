#!/usr/bin/env node

import {execSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'

function exec(command) {
  try {
    return execSync(command, {encoding: 'utf8'}).trim()
  } catch {
    console.error(`Failed: ${command}`)
    throw new Error(`Failed: ${command}`)
  }
}

function getLatestVersion() {
  try {
    const releases = exec('gh release list --limit 1 --json tagName')
    const parsed = JSON.parse(releases)
    if (parsed.length > 0) {
      return parsed[0].tagName.replace(/^v/, '')
    }
  } catch {
    // Fallback to git tags if gh cli not available
    try {
      const tag = exec('git describe --tags --abbrev=0')
      return tag.replace(/^v/, '')
    } catch {
      return '0.0.0'
    }
  }

  return '0.0.0'
}

function analyzeCommits(lastVersion) {
  try {
    const commits =
      lastVersion === '0.0.0' ? exec('git log --oneline') : exec(`git log v${lastVersion}..HEAD --oneline`)

    if (!commits) return 'patch'

    if (commits.includes('BREAKING') || commits.includes('!:')) {
      return 'major'
    }

    if (commits.includes('feat:') || commits.includes('feat(')) {
      return 'minor'
    }

    return 'patch'
  } catch {
    return 'patch'
  }
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major': {
      return `${major + 1}.0.0`
    }

    case 'minor': {
      return `${major}.${minor + 1}.0`
    }

    case 'patch': {
      return `${major}.${minor}.${patch + 1}`
    }

    default: {
      return `${major}.${minor}.${patch + 1}`
    }
  }
}

function updatePackageJson(newVersion) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  pkg.version = newVersion
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
}

function main() {
  console.log('🚀 Starting release...')

  // Get current version from GitHub releases
  const currentVersion = getLatestVersion()
  console.log(`📦 Current version: ${currentVersion}`)

  // Analyze commits to determine bump type
  const bumpType = process.argv[2] || analyzeCommits(currentVersion)
  console.log(`🔍 Detected change type: ${bumpType}`)

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType)
  console.log(`📈 New version: ${newVersion}`)

  // Update package.json
  updatePackageJson(newVersion)
  console.log('✅ Updated package.json')

  // Commit and tag
  exec('git add package.json')
  exec(`git commit -m "chore: release v${newVersion}"`)
  exec(`git tag v${newVersion}`)

  // Push
  exec('git push origin main')
  exec(`git push origin v${newVersion}`)

  console.log(`🎉 Released v${newVersion}!`)
}

main()

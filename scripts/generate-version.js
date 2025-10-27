const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

// Get git information
let gitCommit = 'unknown';
let gitBranch = 'unknown';

try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  console.warn('Could not get git commit:', error.message);
}

try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
} catch (error) {
  console.warn('Could not get git branch:', error.message);
}

// Generate version info
const versionInfo = {
  version: packageJson.version,
  buildTimestamp: new Date().toISOString(),
  gitCommit,
  gitBranch,
  environment: process.env.NODE_ENV || 'development',
  buildNumber: Date.now(),
};

// Write version info to file
const outputPath = path.join(__dirname, '..', 'src', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2), 'utf8');

console.log('✅ Version info generated:');
console.log(`   Version: ${versionInfo.version}`);
console.log(`   Commit: ${versionInfo.gitCommit}`);
console.log(`   Branch: ${versionInfo.gitBranch}`);
console.log(`   Build: ${new Date(versionInfo.buildTimestamp).toLocaleString()}`);

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distProperties = ['main', 'module', 'types'];
const packagesDir = 'packages';

/**
 * Find files with the given pattern in the specified directory
 * @param {string} directory - The directory to search in
 * @param {string} pattern - The file pattern to match
 * @returns {string[]} - An array of file paths
 */
function findFiles(directory, pattern) {
  return execSync(`find ${directory} -name ${pattern}`, { encoding: 'utf8' })
    .toString()
    .split('\n')
    .filter(Boolean);
}

/**
 * Copy files to the dist directory of each package
 * @param {string[]} files - An array of file paths
 */
function copyFilesToDist(files) {
  files.forEach(file => {
    const dirName = path.dirname(file);
    const distDir = path.join(dirName, 'dist');

    const isPackageJson = file.endsWith('package.json');

    if (!isPackageJson) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const destPath = path.join(distDir, path.basename(file));

    if (isPackageJson) {
      // Read the original file content and write it to the destination path
      const originalContent = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(destPath, originalContent);
    } else {
      // Copy the file to the destination path
      fs.copyFileSync(file, destPath);
    }
  });
}

/**
 * @param {string} value
 * @returns {string}
 */
function removeDist(value) {
  const dist = 'dist/';
  if (value.startsWith(dist)) {
    return value.substring(dist.length);
  }
  return value;
}

/**
 * Clean up package.json in the dist directory of each package
 * @param {string[]} packageJsonFiles - An array of file paths
 */
function cleanupPackageJson(packageJsonFiles) {
  packageJsonFiles.forEach(file => {
    if (fs.statSync(file).size > 0) {
      const dirName = path.dirname(file);
      const distDir = path.join(dirName, 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      const destPath = path.join(distDir, 'package.json');
      const originalContent = fs.readFileSync(file, 'utf8');
      const { scripts, files, ...rest } = JSON.parse(originalContent); // Exclude the 'scripts' and 'files' properties

      // Remote 'dist/' folder from paths for publishing purposes
      distProperties.forEach(property => {
        if (rest[property]) {
          rest[property] = removeDist(rest[property]);
        }
      });

      const modifiedContent = JSON.stringify(rest, null, 2); // Convert the remaining properties back to JSON
      fs.writeFileSync(destPath, modifiedContent);
    }
  });
}

const packageJsonFiles = findFiles(packagesDir, 'package.json');
const licenseFiles = findFiles(packagesDir, 'LICENSE');
const readmeFiles = findFiles(packagesDir, 'README.md');

// Copy files to dist directory
const allFiles = [...packageJsonFiles, ...licenseFiles, ...readmeFiles];
copyFilesToDist(allFiles);

// Clean up package.json in the dist directory
cleanupPackageJson(packageJsonFiles);

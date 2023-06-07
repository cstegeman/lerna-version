# Publish from the top-level dist directory of each package
cd dist || exit

set +e
if ! npm publish --scope=@coolblue-development --access=restricted --registry=https://npm.pkg.github.com/; then
    echo "Package publishing failed. Skipping to the next package."
fi
set -e

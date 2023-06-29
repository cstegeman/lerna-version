import { Octokit } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GH_TOKEN
});

const args = process.argv;
const org = 'coolblue-development';
const packageType = 'npm';
const repo = 'test';
const packageArg = args.find(arg => arg.startsWith('--packages='));

let packages = null;
if (packageArg) {
  packages = packageArg.split('=')[1];
}

const packageNames = packages?.split(',').map(item => item.trim());

if (!packageNames) {
  throw new Error("Please provide the packages argument: --packages=package1,package2")
}

/**
 * https://docs.github.com/en/rest/packages/packages?apiVersion=2022-11-28#list-package-versions-for-a-package-owned-by-an-organization
 * https://docs.github.com/en/rest/packages/packages?apiVersion=2022-11-28#delete-package-version-for-an-organization
 */
function deletePackages() {
  const listPackagesRequests = packageNames.map(packageName => {
    return octokit.request(`GET /user/packages/${packageType}/${packageName}/versions`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  })

  Promise.all(listPackagesRequests).then(data => {
    const versions = data.map((item, index) => {
      const id = item.data[0].id;
      const name = item.data[0].name;
      const packageName = packageNames[index];
      const tagName = `@cstegeman/${packageName}@${name}`;

      return { id, packageName, tagName, name };
    });

    deletePackageVersions(versions);
    deleteReleaseVersions(versions)
    deleteTagVersions(versions)
  });

  function deletePackageVersions(versions) {
    console.log(versions)

    return;
    const deletePackagesRequests = versions.map(({ id, packageName }) => {
      return octokit.request(`DELETE /user/packages/${packageType}/${packageName}/versions/${id}`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    })

    Promise.all(deletePackagesRequests).then(data => {
      data.forEach(item => console.log(item));
    });
  }
}

/**
 * https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release-by-tag-name
 * https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#delete-a-release
 */
function deleteReleaseVersions(versions) {
  const releasesRequests = versions.map(({ tagName }) => {
    return octokit.request(`GET /repos/${org}/${repo}/releases/tags/${tagName}`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  });

  Promise.all(releasesRequests).then(data => {
    data.forEach((item, index) => deleteRelease(item.data.id, versions[index].tagName));
  });

  function deleteRelease(id, tagName) {
    console.log('deleteRelease', id, tagName);

    return;
    octokit.request(`DELETE /repos/${org}/${repo}/releases/${id}`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
        .then(() => console.log(`${tagName} id reverted`))
        .catch(() => console.error(`Reverting for ${tagName} failed`));
  }
}

/**
 * https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#delete-a-reference
 */
function deleteTagVersions(versions) {
  versions.forEach(({ name }) => {
    console.log('deleteTagVersions', name);

    return;
    octokit.request(`DELETE /repos/${org}/${repo}/git/refs/tags/${name}`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  })
}

deletePackages();

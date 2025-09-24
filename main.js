const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const { Octokit } = require("@octokit/rest");

const baseDownloadURL = "https://github.com/digitalocean/doctl/releases/download";
const fallbackVersion = "1.98.1";
const octokit = new Octokit();

async function getRecentReleases(count = 5) {
    try {
        const response = await octokit.repos.listReleases({
            owner: 'digitalocean',
            repo: 'doctl',
            per_page: count
        });
        return response.data.map(release => release.name);
    } catch (error) {
        core.warning(`Failed to fetch recent releases: ${error.message}`);
        return [`v${fallbackVersion}`];
    }
}

async function downloadDoctl(version, type, architecture) {
    var platform = 'linux';
    var arch = 'amd64';
    var extension = 'tar.gz';

    switch (type) {
        case 'darwin':
            platform = 'darwin';
            break;
        case 'win32':
            platform = 'windows';
            extension = 'zip'
            break;
        case 'linux':
            platform = 'linux';
            break;
        default:
            core.warning(`unknown platform: ${type}; defaulting to ${platform}`);
            break;
    }

    switch (architecture) {
        case 'arm64': 
            arch = 'arm64';
            break;
        case 'x64':
            arch = 'amd64';
            break;
        case 'ia32':
            arch = '386';
            break;
        default:
            core.warning(`unknown architecture: ${architecture}; defaulting to ${arch}`);
            break;
    }

    // Ensure version handling: GitHub path needs 'v' prefix, filename needs version without 'v'
    const githubVersion = version.startsWith('v') ? version : `v${version}`;
    const fileVersion = version.startsWith('v') ? version.substr(1) : version;
    
    const downloadURL = `${baseDownloadURL}/${githubVersion}/doctl-${fileVersion}-${platform}-${arch}.${extension}`;
    core.debug(`doctl download url: ${downloadURL}`);
    
    try {
        const doctlDownload = await tc.downloadTool(downloadURL);
        if (extension === 'zip') {
            return tc.extractZip(doctlDownload);
        } else {
            return tc.extractTar(doctlDownload);
        }
    } catch (error) {
        core.warning(`Failed to download doctl v${fileVersion}: ${error.message}`);
        throw new Error(`Download failed for version ${fileVersion}: ${error.message}`);
    }
}

async function downloadDoctlWithFallback(requestedVersion, type, architecture) {
    // If a specific version was requested, try it first
    if (requestedVersion !== 'latest') {
        try {
            core.info(`Attempting to download doctl ${requestedVersion}`);
            return await downloadDoctl(requestedVersion, type, architecture);
        } catch (error) {
            core.warning(`Failed to download requested version ${requestedVersion} with error ${error.message}, will try recent versions`);
        }
    }

    // Get recent releases and try them in order
    const recentReleases = await getRecentReleases(5);
    
    for (const version of recentReleases) {
        try {
            core.info(`Attempting to download doctl ${version}`);
            const installPath = await downloadDoctl(version, type, architecture);
            core.info(`Successfully downloaded doctl ${version}`);
            return { installPath, version };
        } catch (error) {
            core.warning(`Failed to download doctl ${version}, trying next version with error ${error.message}`);
            continue;
        }
    }

    // If all recent versions fail, throw an error
    throw new Error(`Failed to download doctl. Tried versions: ${recentReleases.join(', ')}`);
}

async function run() {
  try {
    var version = core.getInput('version');
    var requestedVersion = version;
    
    if ((!version) || (version.toLowerCase() === 'latest')) {
        version = await octokit.repos.getLatestRelease({
            owner: 'digitalocean',
            repo: 'doctl'
        }).then(result => {
            return result.data.name;
        }).catch(error => {
            // GitHub rate-limits are by IP address and runners can share IPs.
            // This mostly effects macOS where the pool of runners seems limited.
            // Fallback to a known version if API access is rate limited.
            core.warning(`${error.message}

Failed to retrieve latest version; falling back to: v${fallbackVersion}`);
            return `v${fallbackVersion}`;
        });
        requestedVersion = 'latest';
    }
    
    // Strip 'v' prefix for filename in download URL
    if (version.charAt(0) === 'v') {
        version = version.substr(1);
    }
    
    var path = tc.find("doctl", version);
    var actualVersion = version;
    
    if (!path) {
        try {
            // Try the requested/latest version first
            const installPath = await downloadDoctl(version, process.platform, process.arch);
            path = await tc.cacheDir(installPath, 'doctl', version);
            actualVersion = version;
        } catch (error) {
            // If the download fails (e.g., missing artifacts), try fallback versions
            core.warning(`Failed to download doctl ${version}, trying fallback versions with error ${error.message}`);
            const result = await downloadDoctlWithFallback(requestedVersion, process.platform, process.arch);
            const resultVersion = result.version.startsWith('v') ? result.version.substr(1) : result.version;
            path = await tc.cacheDir(result.installPath, 'doctl', resultVersion);
            actualVersion = resultVersion;
        }
    }
    
    core.addPath(path);
    core.info(`>>> doctl version v${actualVersion} installed to ${path}`);

    // Skip authentication if requested
    // for workflows where auth isn't necessary (e.g. doctl app spec validate --schema-only)
    var no_auth = core.getInput('no_auth');
    if (no_auth.toLowerCase() === 'true') {
      core.info('>>> Skipping doctl auth');
      return;
    }

    var token = core.getInput('token', { required: true });
    core.setSecret(token);
    await exec.exec('doctl auth init -t', [token]);
    core.info('>>> Successfully logged into doctl');
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();

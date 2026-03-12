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
        return [fallbackVersion];
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

    const downloadURL = `${baseDownloadURL}/v${version}/doctl-${version}-${platform}-${arch}.${extension}`;
    core.debug(`doctl download url: ${downloadURL}`);
    
    try {
        const doctlDownload = await tc.downloadTool(downloadURL);
        return tc.extractTar(doctlDownload);
    } catch (error) {
        core.warning(`Failed to download doctl v${version}: ${error.message}`);
        throw new Error(`Download failed for version ${version}: ${error.message}`);
    }
}

async function downloadDoctlWithFallback(requestedVersion, type, architecture) {
    // If a specific version was requested, try it first
    if (requestedVersion !== 'latest') {
        try {
            core.info(`Attempting to download doctl v${requestedVersion}`);
            return await downloadDoctl(requestedVersion, type, architecture);
        } catch (error) {
            core.warning(`Failed to download requested version v${requestedVersion}, will try recent versions`);
        }
    }

    // Get recent releases and try them in order
    const recentReleases = await getRecentReleases(5);
    
    for (const version of recentReleases) {
        try {
            core.info(`Attempting to download doctl v${version}`);
            const installPath = await downloadDoctl(version, type, architecture);
            core.info(`Successfully downloaded doctl v${version}`);
            return { installPath, version };
        } catch (error) {
            core.warning(`Failed to download doctl v${version}, trying next version`);
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

Failed to retrieve latest version; falling back to: ${fallbackVersion}`);
            return fallbackVersion;
        });
        requestedVersion = 'latest';
    }
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
            core.warning(`Failed to download doctl v${version}, trying fallback versions`);
            const result = await downloadDoctlWithFallback(requestedVersion, process.platform, process.arch);
            path = await tc.cacheDir(result.installPath, 'doctl', result.version);
            actualVersion = result.version;
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

const os = require('os');
const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const { Octokit } = require("@octokit/rest");

const baseDownloadURL = "https://github.com/digitalocean/doctl/releases/download";
const fallbackVersion = "1.98.1";
const octokit = new Octokit();

async function downloadDoctl(version, osType, osMachine) {
    var platform = 'linux';
    var arch = 'amd64';
    var extension = 'tar.gz';

    switch (osType) {
        case 'Darwin': 
            platform = 'darwin';
            break;
        case 'Windows_NT':
            platform = 'windows';
            extension = 'zip'
            break;
        case 'Linux':
            platform = 'linux';
            break;
        default:
            core.warning(`unknown platform: ${osType}; defaulting to ${platform}`);
            break;
    }

    switch (osMachine) {
        case 'arm64': 
            arch = 'arm64';
            break;
        case 'x86_64':
            arch = 'amd64';
            break;
        case 'i386':
        case 'i686':
            arch = '386';
            break;
        default:
            core.warning(`unknown architecture: ${osMachine}; defaulting to ${arch}`);
            break;
    }

    const downloadURL = `${baseDownloadURL}/v${version}/doctl-${version}-${platform}-${arch}.${extension}`;
    core.debug(`doctl download url: ${downloadURL}`);
    const doctlDownload = await tc.downloadTool(downloadURL);

    return tc.extractTar(doctlDownload);
}

async function run() {
  try {
    var version = core.getInput('version');
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
    }
    if (version.charAt(0) === 'v') {
        version = version.substr(1);
    }

    var path = tc.find("doctl", version);
    if (!path) {
        const installPath = await downloadDoctl(version, os.type(), os.machine());
        path = await tc.cacheDir(installPath, 'doctl', version);
    }
    core.addPath(path);
    core.info(`>>> doctl version v${version} installed to ${path}`);

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

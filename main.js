const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const { Octokit } = require("@octokit/rest");

const baseDownloadURL = "https://github.com/digitalocean/doctl/releases/download"
const fallbackVersion = "1.42.0"
const octokit = new Octokit();

async function downloadDoctl(version) {
    var doctlInstall;

    if (process.platform === 'win32') {
        const doctlDownload = await tc.downloadTool(`${baseDownloadURL}/v${version}/doctl-${version}-windows-amd64.zip`);
        doctlInstall = await tc.extractZip(doctlDownload);
    }
    else if (process.platform === 'darwin') {
        const doctlDownload = await tc.downloadTool(`${baseDownloadURL}/v${version}/doctl-${version}-darwin-amd64.tar.gz`);
        doctlInstall = await tc.extractTar(doctlDownload);
    }
    else {
        const doctlDownload = await tc.downloadTool(`${baseDownloadURL}/v${version}/doctl-${version}-linux-amd64.tar.gz`);
        doctlInstall = await tc.extractTar(doctlDownload);
    }

    return doctlInstall;
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
            // Fallback to a known version if rate limited.
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
        const installPath = await downloadDoctl(version);
        path = await tc.cacheDir(installPath, 'doctl', version);
    }
    core.addPath(path);
    core.info(`>>> doctl version v${version} installed to ${path}`);

    var token = core.getInput('token', { required: true });
    await exec.exec('doctl auth init -t', [token]);
    core.info('>>> Successfully logged into doctl');
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();

# GitHub Actions for DigitalOcean

This action enables you to interact with [DigitalOcean](https://www.digitalocean.com/) services via [the `doctl` command-line client](https://github.com/digitalocean/doctl).

## Usage

As an example, one common use case is retrieving the credentials for a Kubernetes cluster hosted on DigitalOcean for use in a deployment workflow:


```yaml
    - name: Save DigitalOcean kubeconfig
      uses: digitalocean/action-doctl@master
      env:
        DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      with:
        args: kubernetes cluster kubeconfig show k8s-cluster-name > $GITHUB_WORKSPACE/.kubeconfig
```

See [this repository](https://github.com/andrewsomething/example-doctl-action) for a full end-to-end example that also demonstrates building the Docker image, pushing it to Docker Hub, and using `kubectl` to deploy to the Kubernetes cluster on DigitalOcean.

### Secrets

- `DIGITALOCEAN_ACCESS_TOKEN` – **Required** A DigitalOcean personal access token ([more info](https://www.digitalocean.com/docs/api/create-personal-access-token/)).

### Environment variables

We provide defaults for the following, these may also be overridden:

- `DIGITALOCEAN_OUTPUT_FORMAT`- **Optional** doctl's output output format, defaults to `json`

By default, this action is configured to save output in JSON format to `${HOME}/${GITHUB_ACTION}.${DIGITALOCEAN_OUTPUT_FORMAT}`for consumption by downstream actions.

## License

The Dockerfile and associated scripts and documentation in this project are released under the [MIT License](LICENSE).

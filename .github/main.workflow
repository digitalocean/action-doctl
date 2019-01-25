workflow "Test and Lint" {
  on = "pull_request"
  resolves = "Test Build doctl"
}

action "Shell Lint" {
  uses = "actions/bin/shellcheck@master"
  args = "*/*.sh"
}

action "Docker Lint" {
  uses = "docker://replicated/dockerfilelint"
  args = ["*/Dockerfile"]
}

action "Test Build doctl" {
  needs = ["Shell Lint", "Docker Lint"]
  uses = "actions/docker/cli@master"
  args = "build /doctl"
}
workflow "Test and Lint" {
  on = "push"
  resolves = ["Lint shell scripts", "Test build doctl"]
}

action "Lint shell scripts" {
  uses = "actions/bin/shellcheck@master"
  args = "*/*.sh"
}

action "Test build doctl" {
  uses = "actions/docker/cli@master"
  args = "build $GITHUB_WORKSPACE/doctl"
}
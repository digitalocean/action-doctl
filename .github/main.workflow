workflow "New workflow" {
  on = "push"
  resolves = ["Launch Droplet"]
}

action "Launch Droplet" {
  uses = "docker://andrewsomething/doctl:1.11.0"
  secrets = ["DIGITALOCEAN_ACCESS_TOKEN"]
  env = {
    IMAGE = "docker-18-04"
    SIZE = "s-1vcpu-1gb"
    KEYS = "107149,3939600,21021639"
    REGION = "nyc3"
    TAGS = "doctl,github-actions"
  }
  args = ["compute", "droplet", "create", "foobar", "--size $SIZE", "--image $IMAGE", "--ssh-keys $KEYS", "--region $REGION", "--tag-names $TAGS", "--enable-monitoring", "--enable-private-networking", "--wait"]
}

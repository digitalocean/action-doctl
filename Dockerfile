FROM digitalocean/doctl:1.34.0

LABEL "name"="doctl"
LABEL "version"="1.4.1"
LABEL "maintainer"="Andrew Starr-Bochicchio <asb@digitalocean.com>"
LABEL "repository"="https://github.com/digitalocean/action-doctl"
LABEL "homepage"="https://github.com/digitalocean/action-doctl"

LABEL "com.github.actions.name"="GitHub Action for DigitalOcean - doctl"
LABEL "com.github.actions.description"="Use doctl to manage your DigitalOcean resources."
LABEL "com.github.actions.icon"="droplet"
LABEL "com.github.actions.color"="blue"

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD [ "help" ]

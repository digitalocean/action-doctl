FROM digitalocean/doctl:1.34.0

LABEL "name"="doctl"
LABEL "version"="1.4.1"
LABEL "maintainer"="Andrew Starr-Bochicchio <asb@digitalocean.com>"
LABEL "repository"="https://github.com/digitalocean/action-doctl"
LABEL "homepage"="https://github.com/digitalocean/action-doctl"

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD [ "help" ]

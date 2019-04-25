FROM alpine:3.5

LABEL "name"="doctl"
LABEL "version"="1.1.0"
LABEL "maintainer"="Andrew Starr-Bochicchio <asb@digitalocean.com>"
LABEL "repository"="https://github.com/digitalocean/action-doctl"
LABEL "homepage"="https://github.com/digitalocean/action-doctl"

LABEL "com.github.actions.name"="GitHub Action for DigitalOcean - doctl"
LABEL "com.github.actions.description"="Use doctl to manage you DigitalOcean resources."
LABEL "com.github.actions.icon"="droplet"
LABEL "com.github.actions.color"="blue"

ENV DOCTL_VERSION=1.15.0

RUN apk add --no-cache curl

RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

RUN curl -L https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz  | tar xz -C /usr/local/bin/

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD [ "help" ]

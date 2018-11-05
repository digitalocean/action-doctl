FROM alpine:3.5

LABEL "name"="doctl"
LABEL "version"="0.0.1-dev"
LABEL "maintainer"="Andrew Starr-Bochicchio <asb@do.co>"

LABEL "com.github.actions.name"="GitHub Action for DigitalOcean"
LABEL "com.github.actions.description"="Wraps doctl to enable common DigitalOcean commands."
LABEL "com.github.actions.icon"="droplet"
LABEL "com.github.actions.color"="blue"

ENV DOCTL_VERSION=1.11.0

RUN apk add --no-cache curl

RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

RUN curl -L https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz  | tar xz -C /usr/local/bin/

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD [ "help" ]

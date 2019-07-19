FROM alpine:3.5

LABEL "name"="doctl"
LABEL "version"="1.2.0"
LABEL "maintainer"="Andrew Starr-Bochicchio <asb@digitalocean.com>"
LABEL "repository"="https://github.com/digitalocean/action-doctl"
LABEL "homepage"="https://github.com/digitalocean/action-doctl"

LABEL "com.github.actions.name"="GitHub Action for DigitalOcean - doctl"
LABEL "com.github.actions.description"="Use doctl to manage you DigitalOcean resources."
LABEL "com.github.actions.icon"="droplet"
LABEL "com.github.actions.color"="blue"

ENV DOCTL_VERSION=1.22.0
ENV DOCTL_SHA256=5817d5c397e49e9d4b025e95d5a161b4200631ff68a4a1bbda618a3261d717a2

RUN apk add --no-cache curl

RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

RUN curl -L https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz  | tar xz -C /usr/local/bin/

RUN /bin/echo "${DOCTL_SHA256}  /usr/local/bin/doctl" | sha256sum -c -

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD [ "help" ]

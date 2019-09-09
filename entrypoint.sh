#!/bin/sh

set -e

# Exit early if DIGITALOCEAN_ACCESS_TOKEN is not set
if [ -z "$DIGITALOCEAN_ACCESS_TOKEN" ]; then
    echo "The DIGITALOCEAN_ACCESS_TOKEN environment variable must be set."
    exit 1
fi

# Default to json output
[ -n "$DIGITALOCEAN_OUTPUT_FORMAT" ] || export DIGITALOCEAN_OUTPUT_FORMAT=json

# Capture output
output=$( sh -c "/app/doctl $* -o ${DIGITALOCEAN_OUTPUT_FORMAT}" )

# Preserve output for consumption by downstream actions
echo "$output" > "${HOME}/${GITHUB_ACTION}.${DIGITALOCEAN_OUTPUT_FORMAT}"

# Write output to STDOUT
echo "$output"
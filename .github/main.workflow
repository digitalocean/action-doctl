on: [push, pull_request]

jobs:

  build:
    name: Lint and test build
    runs-on: ubuntu-latest
    steps:

    - name: Checkout master
      uses: actions/checkout@master

    - name: Lint shell scripts
      run: shellcheck *.sh

    - name: Test build doctl container
      run: docker build $GITHUB_WORKSPACE
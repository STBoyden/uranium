#!/usr/bin/env bash

set -xe

sudo dnf check-update

sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  libxdo-devel

sudo dnf group install "c-development"

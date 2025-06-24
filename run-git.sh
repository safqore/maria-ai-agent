#!/bin/bash

# Set the locale to C.UTF-8
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

# Run git command with the correct locale
git "$@"

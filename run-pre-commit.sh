#!/bin/bash

# Set the locale to C.UTF-8
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

# Activate conda environment if it exists
if [ -f ~/.conda/envs/maria-ai-agent/bin/activate ]; then
    source ~/.conda/envs/maria-ai-agent/bin/activate
elif [ -f ~/anaconda3/envs/maria-ai-agent/bin/activate ]; then
    source ~/anaconda3/envs/maria-ai-agent/bin/activate
elif [ -f ~/miniconda3/envs/maria-ai-agent/bin/activate ]; then
    source ~/miniconda3/envs/maria-ai-agent/bin/activate
elif [ -n "$CONDA_PREFIX" ]; then
    echo "Using current conda environment: $CONDA_PREFIX"
else
    echo "Warning: Could not find conda environment. Using system Python."
fi

# Run pre-commit with the correct locale
pre-commit "$@"

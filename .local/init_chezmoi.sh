# !/bin/bash

# Ask the github username to init chez moi

echo "Enter your github username: "
read GITHUB_USERNAME

# Init chezmoi
chezmoi init --apply git@github.com:$GITHUB_USERNAME/dotfiles.git  --verbose

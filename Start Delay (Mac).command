#!/bin/bash
cd "$(dirname "$0")" || exit 1

# Finder-launched shells may not have Homebrew/nvm on PATH.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is not installed. Get the LTS version from https://nodejs.org, then run this again."
  read -r -p "Press Enter to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: installing dependencies..."
  npm install || { read -r -p "Press Enter to close."; exit 1; }
fi

echo "Starting Delay. Your browser will open at http://localhost:5173"
echo "Close this window (or press Ctrl+C) to stop the app."
npm start

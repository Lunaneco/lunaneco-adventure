#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
  fi
fi
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js 22.12以上をインストールして、もう一度起動してください。'
  read -r '?Enterキーで閉じます。'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
npm run build || exit 1
npm run preview -- --open --port 4173

#!/usr/bin/env bash
set -euo pipefail

pack_file=$(npm pack --ignore-scripts --silent | tail -n 1)
pack_path=$(pwd)/$pack_file
temp_dir=$(mktemp -d)

cleanup() {
  status=$?

  if [[ $status -eq 0 ]]; then
    rm -rf "$temp_dir"
  else
    echo "build:test failed; temp dir preserved at: $temp_dir" >&2
  fi

  rm -f "$pack_path"

  return "$status"
}
trap cleanup EXIT

cd "$temp_dir"

npm init -y >/dev/null
npm install "$pack_path" >/dev/null

cat > input.md <<'EOF'
```javascript --run
1 + 2; // RESULT
```
EOF

./node_modules/.bin/runmd input.md --output output.md

grep -q "1 + 2; //" output.md
grep -q "3" output.md

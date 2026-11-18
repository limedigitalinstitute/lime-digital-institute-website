#!/bin/sh
# Allow /event/<slug> pages through the maintenance gate on the live server.
# Run on the VPS as root:  sh patch-maintenance-gate.sh
# Patches the compose source tree the "web" container was built from, bumps the
# main.js cache-bust tag, rebuilds the container, then verifies.
set -eu

CID=$(docker ps -q --filter "label=traefik.http.routers.lime-website.rule" | head -1)
[ -n "$CID" ] || { echo "web container not found"; exit 1; }
SRC=$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' "$CID")
[ -d "$SRC" ] || { echo "compose dir not found: $SRC"; exit 1; }
echo "container=$CID source=$SRC"

cd "$SRC"
JS=assets/main.js
MARK='Pretty event URLs (/event/<slug>)'
RULE='event\/[^/]+\/?$/.test(path)'
if grep -qF "$RULE" "$JS"; then
  echo "main.js already patched"
else
  cp "$JS" "$JS.bak-$(date +%Y%m%d%H%M%S)"
  # Insert the allow-rule right after the path is computed inside isPublicPage().
  awk -v mark="$MARK" '
    { print }
    /const path = url.split\(.#.\)\[0\].split\(.\?.\)\[0\];/ && !done {
      print "    // " mark " end in the slug, not \"event\"."
      print "    if (/(^|\\/)event\\/[^/]+\\/?$/.test(path)) return true;"
      done = 1
    }' "$JS" > "$JS.tmp" && mv "$JS.tmp" "$JS"
  grep -qF "$RULE" "$JS" || { echo "patch failed: anchor line not found"; exit 1; }
  echo "main.js patched"
fi

# Long cache on versioned assets: bump the tag so browsers fetch the new file.
NEWV="v=$(date +%Y%m%d)a"
OLD=$(grep -rhoE 'main\.js\?v=[0-9a-z]+' --include='*.html' --include='*.php' . | sort -u | head -1 || true)
if [ -n "$OLD" ] && [ "$OLD" != "main.js?$NEWV" ]; then
  grep -rlE 'main\.js\?v=[0-9a-z]+' --include='*.html' --include='*.php' . \
    | xargs sed -i -E "s/main\.js\?v=[0-9a-z]+/main.js?$NEWV/g"
  echo "cache tag: $OLD -> main.js?$NEWV"
fi

docker compose up -d --build web
sleep 5
echo "--- verify"
curl -s "https://limedigitalinstitute.org/assets/main.js?$NEWV" | grep -cF "$RULE" | sed 's/^/event rule lines in live main.js (want 1): /'
curl -s https://limedigitalinstitute.org/event | grep -oE 'main\.js\?v=[0-9a-z]+' | head -1

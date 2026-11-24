#!/bin/sh
# Push every local commit to GitHub. Never fail the commit if the network is down.
if [ -n "$PROSPECTAI_AUTOSYNC" ]; then
  exit 0
fi
git push origin HEAD >/dev/null 2>&1 || true
exit 0

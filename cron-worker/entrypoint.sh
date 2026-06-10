#!/bin/sh
set -eu

# Where to reach the main app. Defaults to Zeabur internal networking so this
# works even before the public domain is switched over. Override with APP_URL
# if needed (e.g. https://ccbabylife.com).
: "${APP_URL:=http://ccbabylife.zeabur.internal:8080}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "FATAL: CRON_SECRET env var is required (must match the app's CRON_SECRET)" >&2
  exit 1
fi

# Wrapper: hit one cron endpoint, log result to PID 1's stdout so it shows up
# in Zeabur logs. Never exit non-zero (a failed run must not kill crond).
cat > /usr/local/bin/hit <<'SH'
#!/bin/sh
path="$1"
ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
code="$(curl -sS -m 120 -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}${path}" 2>/dev/null)" || code="ERR"
echo "[$ts] cron ${path} -> ${code}"
SH
chmod +x /usr/local/bin/hit

# Schedules in UTC — identical to the original vercel.json crons.
cat > /etc/crontabs/root <<EOF
0 1 * * * APP_URL='${APP_URL}' CRON_SECRET='${CRON_SECRET}' hit /api/cron/baby-age-push   > /proc/1/fd/1 2>&1
0 13 * * * APP_URL='${APP_URL}' CRON_SECRET='${CRON_SECRET}' hit /api/cron/dispatch-pushes > /proc/1/fd/1 2>&1
0 20 * * 3 APP_URL='${APP_URL}' CRON_SECRET='${CRON_SECRET}' hit /api/cron/scrape-trending  > /proc/1/fd/1 2>&1
EOF

echo "cron-worker started. APP_URL=${APP_URL}"
echo "schedules (UTC): baby-age-push 01:00 daily | dispatch-pushes 13:00 daily | scrape-trending 20:00 Wed"

# Foreground crond, log level 8 → job runs are logged to stdout.
exec crond -f -l 8 -L /dev/stdout

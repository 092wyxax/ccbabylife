# Tiny scheduled-task worker for Zeabur. Replaces the old vercel.json crons.
# Deploy as a SECOND Zeabur service with Root Directory = cron-worker.
# It calls the main app's /api/cron/* endpoints on a schedule (UTC), passing
# the shared CRON_SECRET as a Bearer token.
FROM alpine:3.20
RUN apk add --no-cache curl tzdata
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
# busybox crond runs in UTC — matches the original vercel.json schedules.
ENTRYPOINT ["/entrypoint.sh"]

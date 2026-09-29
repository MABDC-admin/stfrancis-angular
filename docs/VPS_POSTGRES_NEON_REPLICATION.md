# VPS PostgreSQL Primary to Neon Secondary

This deployment uses:

- VPS PostgreSQL as the primary write database
- Neon as a logical subscriber
- the application connected only to the VPS primary

## 1. Start the VPS stack

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

## 2. Verify PostgreSQL logical replication settings

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "show wal_level;"
docker compose --env-file .env.vps -f docker-compose.vps.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "show max_replication_slots;"
docker compose --env-file .env.vps -f docker-compose.vps.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "show max_wal_senders;"
```

Expected:
- `wal_level = logical`
- `max_replication_slots >= 1`
- `max_wal_senders >= 1`

## 3. Create the publication on the VPS primary

```bash
export $(grep -v '^#' .env.vps | xargs)
bash scripts/setup-vps-postgres-replication.sh
```

Verify:

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pubname, puballtables FROM pg_publication;"
```

## 4. Create the Neon subscription

This setup assumes the VPS primary was rebuilt from the existing Neon data first, so the Neon subscription should start without a second initial copy.

Use [scripts/setup-neon-subscription.sql](C:/Users/DENNIS/Desktop/sms-angular-registrar-module-starter/scripts/setup-neon-subscription.sql) as the template. Replace:

- `<VPS_PUBLIC_IP>`
- `<REPLICATION_PASSWORD>`

Then run it on Neon.

## 5. Verify subscriber state

Run on Neon:

```sql
SELECT subname, subenabled, subslotname FROM pg_subscription;
```

## 6. Prove data replication

Insert or update a controlled row on the VPS primary, then verify the same row appears in Neon.

For this deployment, replication was verified by inserting a controlled row into `IntegrationLog` on the VPS primary and confirming it appeared in Neon.

## 7. Failover note

This setup is **manual failover only**.

- normal operation: app uses VPS PostgreSQL
- outage response: switch app `DATABASE_URL` manually to Neon
- recovery: re-establish the VPS primary and rebuild replication as needed

## Live deployment notes

- VPS app URL: `http://91.98.20.229:8088`
- Primary database: VPS PostgreSQL in Docker
- Secondary database: Neon logical subscriber

## Object storage

The database topology above is separate from file/object storage.

- `STORAGE_PROVIDER=local` keeps uploaded files on the VPS Docker volume.
- `STORAGE_PROVIDER=r2` stores new uploads in Cloudflare R2 and keeps only temp upload files on the VPS volume.
- Provision or verify the R2 bucket from the backend workspace with:

```bash
cd sms-nestjs-backend
ENV_FILE=../.env.vps node scripts/setup-r2-bucket.mjs --check
```

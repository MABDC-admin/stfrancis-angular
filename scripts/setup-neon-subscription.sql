-- Run this on the Neon database after:
-- 1) the VPS primary schema and data have already been imported from Neon, and
-- 2) the VPS publication has been created.
--
-- Replace the placeholder values before execution.

CREATE SUBSCRIPTION sfxsai_subscription
CONNECTION 'host=<VPS_PUBLIC_IP> port=5432 dbname=sfxsai_sms user=sfxsai_repl password=<REPLICATION_PASSWORD> sslmode=disable'
PUBLICATION sfxsai_publication
WITH (copy_data = false, create_slot = true, enabled = true);

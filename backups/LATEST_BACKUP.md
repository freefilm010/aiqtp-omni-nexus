# AIQTP Full Code + System Backup

**Generated:** 2026-05-23 20:20 UTC
**Archive:** `aiqtp-full-code-backup-20260523-201819.zip`
**Size:** 86 MB (89,372,570 bytes)
**SHA-256:** `1e3303050dea357765904161c3711aed5e76b259e2256303e0176ee9edc22747`
**File count:** 1,038 source files

## Contents

- `source/full-source.tgz` — complete repository (every file, excluding only
  `node_modules`, `.git`, `dist`, `.next`, `build`, `.turbo`, `.vercel/output`)
- `edge-functions/supabase/` — full edge function source tree
- `database/` — every public table as CSV + schema detail + functions
- `chats/chat_messages.csv` — 1,719 chat messages
- `chats/chat_conversations.csv` — conversation index
- `storage/objects.csv` + `storage/buckets.csv` — storage inventory
- `meta/README.md`, `meta/project.json`, `meta/file-tree.txt`

## Where to download

The binary lives in the private **`admin-backups`** storage bucket (admin-only,
RLS-protected). Two ways to retrieve it:

1. **Admin Dashboard → Files Vault** (`/admin/files`) → Backups tab → Open.
   Generates a short-lived signed URL.
2. **Database reference:** `admin_file_assets` row
   `id = 3e9bcc9f-534b-49b5-bdf3-2387681e0c29`
   `storage_path = auto/20260523-202040-aiqtp-full-code-backup.zip`

## Restore

```bash
# 1. Source
tar -xzf source/full-source.tgz -C ./restored/

# 2. Database (per table)
psql "$SUPABASE_DB_URL" -c "\COPY public.\"<table>\" FROM 'database/<table>.csv' CSV HEADER"

# 3. Edge functions
supabase functions deploy <name>
```

Binaries are intentionally NOT committed to the repo. Only admins with role
`admin` (via `has_role(auth.uid(),'admin')`) can list, download, or replace
vault contents.
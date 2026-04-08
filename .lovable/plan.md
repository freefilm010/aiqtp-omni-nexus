

# Plan: Export & Import Lovable Build Chat History into Platform Database

## What This Does
Exports all ~1,717 loaded Lovable build chat messages (the conversation history between you and Lovable building this project since September 2025) and imports them into your platform's `chat_conversations` and `chat_messages` tables so they're accessible from the Admin Chat Viewer and Chat Management panel.

## Steps

### Step 1: Create a migration to insert via service role (bypasses RLS)
The `chat_messages` table has RLS policies that require `auth.uid()` matching. Since we're doing a bulk import from a script (not a browser session), we need a migration that inserts directly.

- Create a new `chat_conversations` record for the build history:
  - `user_id`: `3a280905-6c76-4449-a435-944d75ed0e59` (DAVID REY)
  - `agent_type`: `copilot`
  - `title`: `"Lovable Build History — AIQTP Project"`
  - `folder`: `default`

### Step 2: Extract all 1,717 messages via chat_search tools
- Read messages in batches of 20 using `read_chat_messages` (indices 1–1717)
- Parse each message's role (User → `user`, Assistant → `assistant`), content, and timestamp
- Write them to a staging JSON file

### Step 3: Bulk insert into `chat_messages`
- Run a Python script that reads the staged JSON and inserts each message into `chat_messages` via `psql` (which has insert access)
- Each record gets: `conversation_id` (from Step 1), `role`, `content`, `created_at` (original timestamp)

### Step 4: Update conversation metadata
- Set `message_count` to the actual inserted count
- Verify the Admin Chat Viewer at `/admin` can load and export the full history

## Technical Notes
- The `psql` connection has INSERT access, so bulk insert will work without needing a migration for the data itself
- A migration IS needed for the conversation record since it requires a specific `user_id` foreign key
- Messages will be chunked to avoid timeout limits
- Estimated ~86 batches of 20 messages each


# How to Import Collections into PocketBase

This guide explains how to import the `pocketbase-collections.json` file into your PocketBase instance.

## Method 1: Using PocketBase Admin UI (Recommended)

1. **Start PocketBase** (if not already running):
   ```bash
   docker-compose up -d
   ```

2. **Open PocketBase Admin UI:**
   - Go to http://localhost:8090/_/
   - Log in with your admin account

3. **Import Collections:**
   - Go to **Settings** → **Import collections** (in the left sidebar)
   - Click **Load from JSON file** button
   - Select the `pocketbase-collections.json` file
   - **OR** copy the entire file content and paste it into the text area
   - Click **Review** to validate
   - If validation passes, click **Import**
   
   **⚠️ Important**: 
   - Use the "Load from JSON file" button if possible (most reliable)
   - If pasting manually, copy the ENTIRE file (Ctrl+A, Ctrl+C) to avoid corruption
   - Make sure no text is accidentally modified when pasting

4. **Verify Import:**
   - Check that all collections appear in the Collections list:
     - `teams` (new - organizations/companies)
     - `buildings` (with `teamId` field)
     - `rooms`
     - `tenants`
     - `reading_groups`
     - `invoices`
     - `settings` (with `teamId` field - per team)
     - `admin_invitations` (with `teamId` field)
   
   **Note**: The `users` collection is NOT included in the import because it's a system collection. You must configure it manually (see below).

## Method 2: Using PocketBase CLI

If you have PocketBase CLI access:

```bash
# Import collections
pocketbase collections import pocketbase-collections.json
```

## Method 3: Manual Setup (Alternative)

If the import doesn't work, you can manually create collections using the setup guide:
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step instructions

## After Import

**⚠️ Important**: The `users` collection is a system collection and cannot be imported. You must configure it manually.

1. **Add `role` and `teamId` fields to `users` collection:**
   - Go to Collections → `users`
   - Click **New Field** (or edit the collection)
   - Add field: `role`
     - **Type**: Select
     - **Options**: `owner`, `admin`
     - **Default value**: `admin`
     - **Required**: ✅ Yes
   - Click **Save**
   - Add field: `teamId`
     - **Type**: Relation
     - **Collection**: `teams`
     - **Required**: ❌ No (will be set when user joins/creates a team)
   - Click **Save**

2. **Create your team:**
   - Go to Collections → `teams`
   - Click **New Record**
   - Enter your team/organization name (e.g., "My Property Management")
   - Click **Save**
   - **Copy the team ID** - you'll need it for the next steps

3. **Update your user record:**
   - Go to Collections → `users`
   - Find your admin account
   - Set `role` to `owner`
   - Set `teamId` to your team ID
   - Click **Save**

4. **Create initial settings record:**
   - Go to Collections → `settings`
   - Click **New Record**
   - Set `teamId` to your team ID
   - Fill in default values (see SETUP_GUIDE.md for details)
   - Click **Save**

## Troubleshooting

### Import Fails
- Make sure PocketBase is running
- Check that you're logged in as admin
- Verify the JSON file is valid (no syntax errors)
- Try importing collections one at a time if bulk import fails

### Collections Already Exist
- If collections already exist, you may need to delete them first
- Or manually update existing collections to match the schema

### Field Type Mismatches
- Some field types might need adjustment after import
- Check each collection's schema and update if needed

## Notes

- **The `users` collection is NOT included in the JSON** because it's a system collection. You must configure it manually (add `role` and `teamId` fields).
- Collection IDs and field IDs have been removed from the JSON - PocketBase will generate them automatically during import.
- Relation references use collection names (e.g., `"users"`, `"teams"`) - PocketBase will resolve them to actual collection IDs.
- Default values are not included in the JSON - set them manually in PocketBase admin UI after import.
- If you see "Invalid collections configuration" error, make sure:
  - The JSON file is valid (no syntax errors)
  - You're logged in as admin
  - PocketBase is running and accessible

# PocketBase Setup Guide

## ✅ Step 1: Verify PocketBase is Running

PocketBase is now running in Docker! You can verify it's working:

- **API Health Check**: http://localhost:8090/api/health
- **Admin UI**: http://localhost:8090/_/

Open the admin UI in your browser to continue with setup.

---

## 📝 Step 2: Create Admin Account

### If you see the setup screen (first time):

1. **Get the setup URL from PocketBase logs:**
   ```bash
   docker-compose logs pocketbase | grep "pbinstal"
   ```
   Look for a URL like: `http://localhost:8090/_/#/pbinstal/...`

2. **Open that URL in your browser** (or try http://localhost:8090/_/ if it redirects to setup)

3. **Create your first admin account:**
   - Enter your email
   - Enter a secure password
   - Confirm your password
4. Click **Create** to complete the setup

**Note**: This account will be your **owner** account for the Staykha application.

**💡 Tip**: If http://localhost:8090/_/ shows a login page instead of setup:
- Check the logs for the setup URL: `docker-compose logs pocketbase | grep pbinstal`
- Use that specific URL, or
- Clear your browser cache and try again in an incognito window

### If you see a login page (already initialized):

If PocketBase shows a login page instead of the setup screen, it means PocketBase has already been initialized. You have two options:

#### Option A: Use existing admin account
- If you know the existing admin credentials, log in with them
- Then proceed to Step 3

#### Option B: Reset PocketBase (start fresh)

If you want to start fresh or don't remember the admin credentials:

1. **Stop and remove everything:**
   ```bash
   # Stop and remove containers, networks, and volumes
   docker-compose down -v
   ```

2. **Remove all data directories:**
   ```bash
   # Remove both pb_data and pb_migrations directories
   rm -rf pb_data pb_migrations
   
   # Recreate empty directories
   mkdir -p pb_data pb_migrations
   ```
   
   **Note:** If you get permission errors, the files might be owned by root. In that case:
   ```bash
   sudo rm -rf pb_data pb_migrations
   sudo mkdir -p pb_data pb_migrations
   ```

3. **Clear browser cache (important!):**
   - Open http://localhost:8090/_/ in an **incognito/private window**
   - Or clear your browser cache and cookies for localhost:8090
   - PocketBase stores authentication state in browser localStorage

4. **Start PocketBase again:**
   ```bash
   docker-compose up -d
   ```

5. **Wait a few seconds, then open http://localhost:8090/_/ in a fresh/incognito browser window**
   - You should now see the setup screen
   - Create your admin account as described above

**⚠️ Warning**: This will delete all existing data in PocketBase!

**💡 Tip**: If you still see the login page after resetting, try:
- Using an incognito/private browser window
- Clearing browser cache and cookies
- Using a different browser
- Checking if PocketBase created data files: `ls -la pb_data/`

---

## ⚙️ Step 3: Configure Users Collection

The `users` collection already exists in PocketBase. You need to add custom fields:

1. In the PocketBase admin UI, go to **Collections** → **users**
2. Click **New Field** (or edit the collection)
3. Add the `role` field:
   - **Name**: `role`
   - **Type**: Select
   - **Options**: 
     - `owner`
     - `admin`
   - **Default value**: `admin`
   - **Required**: ✅ Yes
4. Click **Save**
5. Add the `teamId` field:
   - **Name**: `teamId`
   - **Type**: Relation
   - **Collection**: `teams`
   - **Required**: ❌ No (will be set when user joins/creates a team)
6. Click **Save**

### Update Your User Record

1. Go to **Collections** → **users**
2. Find your admin account (the one you just created)
3. Click on it to edit
4. Set `role` to `owner`
5. **Note**: `teamId` will be set after you create a team (see Step 5)
6. Click **Save**

---

## 📦 Step 4: Create Collections

Create the following collections in the PocketBase admin panel. For each collection:

1. Go to **Collections** → **New Collection**
2. Enter the collection name
3. Add fields as specified below
4. Set access rules
5. Save

**⚠️ Important Note on Access Rules**: 
- **CRITICAL**: All access rules MUST start with `@request.auth.id` (with the `@` symbol). Missing the `@` will cause syntax errors.
- Access rules check user role (`owner` or `admin`) to restrict who can access data
- **SECURITY CRITICAL**: All collections MUST have a `teamId` field to enforce team isolation. Without this, admins from different teams can access each other's data.
- For the `teams` collection: Use `id = @request.auth.teamId` (the team's `id` field, not a `teamId` field)
- For all other collections: Access rules MUST include `teamId = @request.auth.teamId` to ensure users can only access data from their own team
- This prevents cross-team data access and ensures proper data isolation between teams
- **When copying rules into PocketBase**: Make sure to include the `@` symbol at the beginning of `@request.auth.id`

### Collection: `teams`

**Fields:**
- `name` (Text, Required)

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && id = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && id = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && @request.auth.role = "owner"`
- **Update**: `@request.auth.id != "" && @request.auth.role = "owner" && id = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && id = @request.auth.teamId`

**Note**: Teams represent organizations/companies. Each owner creates a team, and all buildings and settings belong to a team. Only owners can create teams. Owners and admins can only view their own team (where the team's `id` matches the user's `teamId`). Only owners can update/delete their own team.

---

### Collection: `buildings`

**Fields:**
- `name` (Text, Required)
- `address` (Text, Required)
- `totalFloors` (Number, Default: 1)
- `totalRooms` (Number, Default: 0)
- `occupiedRooms` (Number, Default: 0)
- `ownerId` (Relation, Collection: `users`, Required)
- `teamId` (Relation, Collection: `teams`, Required)

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Only owners can create, update, or delete buildings. Owners and admins can view buildings, but only within their own team.

---

### Collection: `rooms`

**Fields:**
- `roomNumber` (Text, Required, Unique)
- `buildingId` (Relation, Collection: `buildings`, Required)
- `buildingName` (Text, Optional)
- `floor` (Number, Required, Default: 1)
- `status` (Select, Required, Options: `occupied`, `vacant`, `maintenance`, Default: `vacant`)
- `monthlyRent` (Number, Optional)
- `size` (Number, Optional) - Size in square meters
- `tenantId` (Relation, Collection: `tenants`, Nullable)
- `teamId` (Relation, Collection: `teams`, Required) - **IMPORTANT**: Add this field to enforce team isolation

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Owners and admins can view, create, and update rooms within their own team. Only owners can delete rooms. **CRITICAL**: The `teamId` field is required to prevent admins from accessing rooms belonging to other teams. Without this field, admins from different teams could access each other's data.

---

### Collection: `tenants`

**Fields:**
- `name` (Text, Required)
- `email` (Email, Required)
- `phone` (Text, Required)
- `roomId` (Relation, Collection: `rooms`, Required)
- `moveInDate` (Date, Required)
- `contractEndDate` (Date, Nullable)
- `monthlyRent` (Number, Required)
- `deposit` (Number, Required)
- `idCardNumber` (Text, Nullable)
- `emergencyContact` (Text, Nullable)
- `emergencyPhone` (Text, Nullable)
- `status` (Select, Required, Options: `active`, `inactive`, `expired`, Default: `active`)
- `teamId` (Relation, Collection: `teams`, Required) - **IMPORTANT**: Add this field to enforce team isolation

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Owners and admins can view, create, and update tenants within their own team. Only owners can delete tenants. **CRITICAL**: The `teamId` field is required to prevent admins from accessing tenants belonging to other teams. Without this field, admins from different teams could access each other's data.

---

### Collection: `reading_groups`

**Fields:**
- `roomId` (Relation, Collection: `rooms`, Required)
- `roomNumber` (Text, Optional)
- `tenantName` (Text, Optional)
- `readingDate` (Date, Required)
- `status` (Select, Required, Options: `incomplete`, `pending`, `billed`, `paid`, Default: `incomplete`)
- `water` (JSON, Nullable) - Stores water meter reading data
- `electric` (JSON, Nullable) - Stores electric meter reading data
- `teamId` (Relation, Collection: `teams`, Required) - **IMPORTANT**: Add this field to enforce team isolation

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Owners and admins can view, create, and update meter readings within their own team. Only owners can delete readings. **CRITICAL**: The `teamId` field is required to prevent admins from accessing readings belonging to other teams. Without this field, admins from different teams could access each other's data.

---

### Collection: `invoices`

**Fields:**
- `invoiceNumber` (Text, Nullable)
- `tenantId` (Relation, Collection: `tenants`, Nullable)
- `roomId` (Relation, Collection: `rooms`, Required)
- `tenantName` (Text, Optional)
- `roomNumber` (Text, Optional)
- `billingPeriod` (Text, Required)
- `issueDate` (Date, Required)
- `dueDate` (Date, Required)
- `status` (Select, Required, Options: `draft`, `sent`, `paid`, `pending`, `overdue`, Default: `draft`)
- `waterUsage` (Number, Default: 0)
- `waterRate` (Number, Default: 0)
- `waterAmount` (Number, Default: 0)
- `electricUsage` (Number, Default: 0)
- `electricRate` (Number, Default: 0)
- `electricAmount` (Number, Default: 0)
- `subtotal` (Number, Default: 0)
- `tax` (Number, Default: 0)
- `total` (Number, Default: 0)
- `paidDate` (Date, Nullable)
- `waterConsumption` (Number, Nullable)
- `electricConsumption` (Number, Nullable)
- `waterRatePerUnit` (Number, Nullable)
- `electricRatePerUnit` (Number, Nullable)
- `waterSubtotal` (Number, Nullable)
- `electricSubtotal` (Number, Nullable)
- `waterBillingMode` (Select, Options: `metered`, `fixed`, Nullable)
- `waterFixedFee` (Number, Nullable)
- `teamId` (Relation, Collection: `teams`, Required) - **IMPORTANT**: Add this field to enforce team isolation

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Owners and admins can view, create, and update invoices within their own team. Only owners can delete invoices. **CRITICAL**: The `teamId` field is required to prevent admins from accessing invoices belonging to other teams. Without this field, admins from different teams could access each other's data.

---

### Collection: `settings`

**Fields:**
- `teamId` (Relation, Collection: `teams`, Required)
- `waterRatePerUnit` (Number, Required, Default: 0)
- `waterBillingMode` (Select, Required, Options: `metered`, `fixed`, Default: `metered`)
- `waterFixedFee` (Number, Default: 0)
- `electricRatePerUnit` (Number, Required, Default: 0)
- `taxRate` (Number, Required, Default: 0)
- `currency` (Text, Required, Default: `THB`)
- `companyName` (Text, Required)
- `companyAddress` (Text, Required)
- `companyPhone` (Text, Required)
- `companyEmail` (Email, Required)
- `invoicePrefix` (Text, Required, Default: `INV`)
- `paymentTermsDays` (Number, Required, Default: 30)
- `defaultRoomRent` (Number, Default: 0)
- `defaultRoomSize` (Number, Default: 0)
- `bankName` (Text, Optional) - Bank name for payment instructions (e.g., "ธนาคารกรุงไทย")
- `bankAccountNumber` (Text, Optional) - Bank account number for payments (e.g., "878-0-51077-9")
- `lineId` (Text, Optional) - Line ID for contact (e.g., "@379zxxta")
- `latePaymentPenaltyPerDay` (Number, Optional, Default: 0) - Penalty amount per day for late payments
- `dueDateDayOfMonth` (Number, Optional, Default: 5) - Day of month when bills are due (1-31)
- `labelInvoice` (Text, Optional, Default: "ใบแจ้งหนี้") - Thai label for invoice title
- `labelRoomRent` (Text, Optional, Default: "ค่าเช่าห้อง") - Thai label for room rent
- `labelWater` (Text, Optional, Default: "ค่าน้ำประปา") - Thai label for water bill
- `labelElectricity` (Text, Optional, Default: "ค่าไฟฟ้า") - Thai label for electricity bill

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Important**: This collection should have **one record per team**. Each team has its own settings. Only owners can create settings, but owners and admins can update their team's settings. Only owners can delete settings.

---

### Collection: `admin_invitations`

**Fields:**
- `email` (Email, Required)
- `teamId` (Relation, Collection: `teams`, Required)
- `invitedBy` (Relation, Collection: `users`, Required)
- `invitedByName` (Text, Required)
- `status` (Select, Required, Options: `pending`, `accepted`, `expired`, Default: `pending`)
- `inviteCode` (Text, Required, Unique)
- `expiresAt` (Date, Required)
- `buildings` (JSON, Nullable) - Array of building IDs in the team this admin can access
- `message` (Text, Nullable)

**Access Rules:**
- **List/Search**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **View**: `@request.auth.id != "" && (@request.auth.role = "owner" || @request.auth.role = "admin") && teamId = @request.auth.teamId`
- **Create**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`
- **Update**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`
- **Delete**: `@request.auth.id != "" && @request.auth.role = "owner" && teamId = @request.auth.teamId`

**Note**: Only owners can create, update, or delete admin invitations. Owners and admins can view invitations for their team.

---

## ⚙️ Step 5: Create Your Team

Before creating buildings and settings, you need to create a team:

1. Go to **Collections** → **teams**
2. Click **New Record**
3. Enter your team/organization name (e.g., "My Property Management")
4. Click **Save**
5. **Copy the team ID** - you'll need it for the next steps

### Update Your User with Team

1. Go to **Collections** → **users**
2. Find your admin account
3. Set `teamId` to the team you just created
4. Click **Save**

---

## ⚙️ Step 6: Initialize Settings Record

After creating the `settings` collection and your team, you need to create the initial settings record:

1. Go to **Collections** → **settings**
2. Click **New Record**
3. Set `teamId` to your team ID
4. Fill in the following values (adjust as needed):

```
waterRatePerUnit: 15
waterBillingMode: metered
waterFixedFee: 0
electricRatePerUnit: 5
taxRate: 7
currency: THB
companyName: Your Company Name
companyAddress: Your Company Address
companyPhone: +66-2-123-4567
companyEmail: billing@example.com
invoicePrefix: INV
paymentTermsDays: 30
defaultRoomRent: 4500
defaultRoomSize: 20
bankName: ธนาคารกรุงไทย
bankAccountNumber: 878-0-51077-9
lineId: @379zxxta
latePaymentPenaltyPerDay: 50
dueDateDayOfMonth: 5
labelInvoice: ใบแจ้งหนี้
labelRoomRent: ค่าเช่าห้อง
labelWater: ค่าน้ำประปา
labelElectricity: ค่าไฟฟ้า
```

4. Click **Save**

---

## 🔐 Step 7: Configure Environment Variables

Make sure your frontend application has the correct PocketBase URL configured.

1. Check if you have a `.env` file in your project root
2. If not, create one based on `.env.example`
3. Ensure it contains:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

---

## 🧪 Step 8: Test Your Setup

1. **Verify PocketBase is accessible:**
   ```bash
   curl http://localhost:8090/api/health
   ```
   Should return: `{"message":"API is healthy.","code":200,"data":{}}`

2. **Test login from your frontend:**
   - Start your frontend application
   - Navigate to the login page
   - Try logging in with the admin account you created

3. **Verify collections are accessible:**
   - Log in to your frontend app
   - Try accessing different sections (buildings, rooms, tenants, etc.)
   - Verify you can create, read, update records

---

## 📚 Useful Docker Commands

### View logs
```bash
docker-compose logs -f pocketbase
```

### Stop PocketBase
```bash
docker-compose stop
```

### Start PocketBase
```bash
docker-compose start
```

### Restart PocketBase
```bash
docker-compose restart
```

### Stop and remove containers
```bash
docker-compose down
```

### Stop and remove containers + volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

---

## 🔧 Troubleshooting

### PocketBase not accessible
- Check if the container is running: `docker-compose ps`
- Check logs: `docker-compose logs pocketbase`
- Verify port 8090 is not in use by another application

### Can't create admin account
- Make sure you're accessing http://localhost:8090/_/
- Check if PocketBase is fully started (wait a few seconds)
- Check Docker logs for errors

### Collections not showing in frontend
- Verify all collections are created with correct names
- Check access rules are set correctly
- Verify your user has the `role` field set
- Check browser console for API errors

### CORS errors
- If running frontend on a different port, you may need to configure CORS in PocketBase
- Go to Settings → API → CORS and add your frontend URL

---

## ✅ Setup Complete!

Once you've completed all steps:
1. ✅ PocketBase is running in Docker
2. ✅ Admin account created
3. ✅ Users collection configured with `role` and `teamId` fields
4. ✅ Team created
5. ✅ All collections created
6. ✅ Settings record initialized with `teamId`
7. ✅ Environment variables configured

You're ready to use the Staykha application! 🎉

---

## 📖 Next Steps

- Start your frontend application
- Log in with your admin account
- Create your first building
- Add rooms to the building
- Add tenants
- Start managing meter readings and invoices

For more details, see the main [README.md](./README.md) file.

# PocketBase CORS Configuration Guide

## Problem

When using `credentials: "include"` in fetch requests, browsers require that the `Access-Control-Allow-Origin` header is **NOT** a wildcard (`*`), but must be the **specific origin**.

**Error you're seeing:**
```
Access to fetch at 'http://127.0.0.1:8090/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' 
header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Solution: Configure CORS in PocketBase

### Option 1: Via PocketBase Admin UI (Recommended)

1. **Open PocketBase Admin UI:**
   - Go to http://localhost:8090/_/
   - Log in with your admin account

2. **Navigate to Settings:**
   - Click **Settings** in the left sidebar
   - Go to **API Settings** or **CORS Settings**

3. **Configure Allowed Origins:**
   - Find the **"CORS"** or **"Allowed Origins"** section
   - Add your frontend URL: `http://localhost:5173`
   - If there's a list, add it there
   - If there's a text field, enter: `http://localhost:5173`
   - **Important:** Do NOT use wildcard `*` when credentials are included

4. **Save Settings:**
   - Click **Save** or **Apply**
   - Restart PocketBase if required

5. **Test:**
   - Try logging in from your frontend again
   - The CORS error should be resolved

### Option 2: Via Environment Variable (Docker)

If PocketBase supports environment variables for CORS:

1. **Edit `docker-compose.yml`:**
   ```yaml
   services:
     pocketbase:
       image: ghcr.io/muchobien/pocketbase:latest
       container_name: staykha-pocketbase
       restart: unless-stopped
       ports:
         - "8090:8090"
       volumes:
         - ./pb_data:/pb/pb_data
         - ./pb_migrations:/pb/pb_migrations
       environment:
         - PB_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY:-}
         - PB_CORS_ORIGINS=http://localhost:5173  # Add this line
   ```

2. **Restart PocketBase:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

**Note:** Not all PocketBase versions support this. If it doesn't work, use Option 1.

### Option 3: Remove Credentials (Quick Fix, Less Secure)

If you can't configure CORS in PocketBase, you can remove `credentials: "include"` as a temporary workaround:

1. **Edit `lib/pocketbase-api.ts`:**
   - Find `credentials: "include"` (should be in both `pocketbaseFetch` and `authFetch`)
   - Change to `credentials: "omit"` or remove the line entirely

2. **Note:** This is less secure because cookies won't be sent with requests. Authentication will rely solely on the Authorization header.

## Verify CORS is Working

After configuring CORS, you can verify it's working:

1. **Check Response Headers:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        http://127.0.0.1:8090/api/collections/users/auth-with-password \
        -v
   ```

2. **Look for:**
   ```
   < Access-Control-Allow-Origin: http://localhost:5173
   < Access-Control-Allow-Credentials: true
   ```

   (Should NOT be `Access-Control-Allow-Origin: *`)

## Troubleshooting

### Still seeing CORS errors?

1. **Clear browser cache** - CORS headers might be cached
2. **Check PocketBase logs:**
   ```bash
   docker-compose logs pocketbase
   ```
3. **Verify the origin is exactly correct:**
   - Must match exactly: `http://localhost:5173` (not `http://127.0.0.1:5173`)
   - No trailing slash
   - Case-sensitive

### Multiple Origins

If you need to allow multiple origins (e.g., development and production):
- Add each origin separately: `http://localhost:5173,https://yourdomain.com`
- Or configure multiple entries if PocketBase supports it

## References

- [PocketBase CORS Documentation](https://pocketbase.io/docs/api-authentication/)
- [MDN CORS with Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials)

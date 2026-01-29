# Fix: "Database connection unavailable" on Render

Your backend at **https://last-piece-4l3u.onrender.com** is running, but **MongoDB is not connected**. That is why login, products, and categories return **503**.

Follow these steps **in order**.

---

## Step 1: Get your MongoDB connection string from Atlas

1. Open **https://cloud.mongodb.com** and log in.
2. Select your project (e.g. **lastPiece**).
3. Click **Database** → **Connect** on your cluster.
4. Choose **"Drivers"** or **"Connect your application"**.
5. Copy the connection string. It looks like:
   ```text
   mongodb+srv://USERNAME:<password>@lastpiece.x0kqkhx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace **`<password>`** with the **real database user password** (the one you set for that user in Atlas).
7. **Important:** Add the database name **`/lastpiece`** before the `?`:
   ```text
   mongodb+srv://USERNAME:YOUR_REAL_PASSWORD@lastpiece.x0kqkhx.mongodb.net/lastpiece?retryWrites=true&w=majority
   ```
   If your DB name is different, use that name instead of `lastpiece`.
8. If the password contains special characters (e.g. `#`, `@`, `%`), **URL-encode** them (e.g. `#` → `%23`, `@` → `%40`).

---

## Step 2: Set environment variables on Render

1. Go to **https://dashboard.render.com**.
2. Open your **Web Service** (the one for last-piece backend).
3. Go to **Environment** (left sidebar).
4. Add or edit these variables. **Do not leave placeholders.**

| Key                    | Value                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`             | `production`                                                      |
| `MONGODB_URI`          | The full string from Step 1 (with real password and `/lastpiece`) |
| `JWT_SECRET`           | A long random string (at least 32 characters)                     |
| `REFRESH_TOKEN_SECRET` | Another long random string (different from JWT_SECRET)            |
| `FRONTEND_URL`         | `https://last-piece.netlify.app`                                  |

To generate secrets (run in terminal):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice and use the first output for `JWT_SECRET` and the second for `REFRESH_TOKEN_SECRET`.

5. Click **Save Changes**. Render will **redeploy** the service automatically.

---

## Step 3: Allow Render to reach MongoDB (Atlas Network Access)

1. In **MongoDB Atlas** go to **Network Access** (left sidebar).
2. Click **Add IP Address**.
3. Either:
   - Add **`0.0.0.0/0`** (allow from anywhere – needed for Render),
   - Or add the specific IPs Render gives you (if you use that option).
4. Confirm. Wait 1–2 minutes for the rule to apply.

---

## Step 4: Check Render logs after redeploy

1. On Render, open your service → **Logs**.
2. Look for one of:
   - **`MongoDB Connected: ...`** → DB is connected; try login and products again.
   - **`Connection failed`** / **`querySrv ENOTFOUND`** → `MONGODB_URI` is wrong or not set; double-check Step 1 and 2.
   - **`IP not whitelisted`** → Repeat Step 3 and wait a couple of minutes.

---

## Summary

- **503 "Database connection unavailable"** = backend is up, MongoDB is not connected.
- Fix = correct **MONGODB_URI** on Render (with real password and `/lastpiece`) + **Network Access** `0.0.0.0/0` in Atlas.
- After saving env vars, wait for Render to finish redeploying, then test:  
  **https://last-piece.netlify.app** (login and products).

If you still see 503 after doing all steps, copy the **exact** error line from Render **Logs** (no passwords) and use it to double-check the connection string and Atlas settings.

# Where to Copy Environment Variables

## Render (Backend)

**File to copy from:** `backend/RENDER_ENV_COPY.txt`

1. Open Render Dashboard → Your backend service → **Environment**
2. Add each variable: **Key** = left side, **Value** = right side (after `=`)
3. **Important:** Replace placeholder values:
   - `MONGODB_URI` → your real MongoDB Atlas connection string (with real password and `/lastpiece` before `?`)
   - `JWT_SECRET` and `REFRESH_TOKEN_SECRET` → generate strong random strings (32+ chars)
4. Save → Render will redeploy

---

## Netlify (Frontend)

**File to copy from:** `frontend/NETLIFY_ENV_COPY.txt`

1. Open Netlify Dashboard → Your site (last-piece) → **Site configuration** → **Environment variables**
2. Add each variable: **Key** = left side, **Value** = right side (after `=`)
3. Values are already set for production (Render API + Netlify URL). Change only if you use a different backend URL or Stripe key.
4. Save → Trigger a new deploy if needed

---

## Summary

| Platform    | Copy from this file             |
| ----------- | ------------------------------- |
| **Render**  | `backend/RENDER_ENV_COPY.txt`   |
| **Netlify** | `frontend/NETLIFY_ENV_COPY.txt` |

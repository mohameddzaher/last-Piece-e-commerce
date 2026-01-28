# Render Environment Variables - Copy This List

Use this file as reference when setting environment variables in Render Dashboard.

## Required Variables (Must Set)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5001` | Optional - Render sets this automatically |
| `MONGODB_URI` | `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/lastpiece?retryWrites=true&w=majority` | **REQUIRED** - Get from MongoDB Atlas |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-characters-long` | **REQUIRED** - Generate strong random string (32+ chars) |
| `REFRESH_TOKEN_SECRET` | `your-super-secret-refresh-token-secret-min-32-characters` | **REQUIRED** - Different from JWT_SECRET, 32+ chars |
| `FRONTEND_URL` | `https://last-piece.netlify.app` | **REQUIRED** - For CORS |

## Optional Variables (Set if Needed)

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_EXPIRE` | `7d` | Optional - Default: 7d |
| `JWT_REFRESH_EXPIRE` | `30d` | Optional - Default: 30d |
| `BCRYPT_ROUNDS` | `10` | Optional - Default: 10 |
| `LOG_LEVEL` | `info` | Optional - Default: debug in dev |

## Email Configuration (Optional - Only if using email)

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `SENDER_EMAIL` | `noreply@lastpiece.com` |
| `SENDER_NAME` | `Last Piece` |

## Payment Configuration (Optional - Only if using Stripe)

| Variable | Value |
|----------|-------|
| `STRIPE_PUBLIC_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `WEBHOOK_SECRET` | `whsec_...` |

## Admin Account (Optional - Only if using seed script)

| Variable | Value |
|----------|-------|
| `SUPER_ADMIN_EMAIL` | `admin@lastpiece.com` |
| `SUPER_ADMIN_PASSWORD` | `SecurePassword123!` |

---

## Quick Copy List for Render

Copy these variable names and set real values in Render:

```
NODE_ENV=production
MONGODB_URI=<your-real-atlas-connection-string>
JWT_SECRET=<generate-strong-random-32-chars>
REFRESH_TOKEN_SECRET=<generate-strong-random-32-chars>
FRONTEND_URL=https://last-piece.netlify.app
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

---

## How to Get MongoDB URI

1. Go to https://cloud.mongodb.com
2. Select your project → Database → Connect
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Add database name: `/lastpiece` before `?retryWrites`

Example format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lastpiece?retryWrites=true&w=majority
```

---

## How to Generate JWT Secrets

Use a strong random string generator or run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run twice to get two different secrets for JWT_SECRET and REFRESH_TOKEN_SECRET.

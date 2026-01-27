# 🔧 Netlify Deployment Troubleshooting

## Common Issue: "Publish directory not found"

If you see this error:
```
Your publish directory was not found at: /opt/build/repo/.next
```

### Solution Options:

#### Option 1: Manual Configuration (Recommended)
1. In Netlify dashboard, go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next` (note: full path from repo root)
   - **Functions directory**: Leave empty

3. Go to **Environment variables** and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
   ```

4. **Deploy settings**:
   - Make sure **Node version** is set to `18` in Environment variables:
     ```
     NODE_VERSION=18
     ```

#### Option 2: Using netlify.toml from Root
If the above doesn't work, move `netlify.toml` to project root:

```bash
# From project root
mv frontend/netlify.toml ./netlify.toml
```

Then update it:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "frontend/.next"

[build.environment]
  NODE_VERSION = "18"
```

#### Option 3: Enable Essential Next.js Plugin
Netlify should auto-detect Next.js and enable the Essential Next.js plugin. If it doesn't:

1. Go to **Plugins** in Netlify dashboard
2. Search for **Essential Next.js**
3. Click **Install**

## Verifying Successful Build

After deployment, check:

1. **Build logs** should show:
   ```
   ✓ Compiled successfully
   ✓ Generating static pages
   ✓ Collecting page data
   ```

2. **Site should be accessible** at your Netlify URL

3. **Test the site**:
   - Homepage loads
   - Products page works
   - Can navigate between pages

## Next.js on Netlify - What You Need to Know

### How it Works:
- Netlify uses the **Essential Next.js** plugin (auto-installed)
- This plugin wraps your Next.js app in Netlify Functions
- Static pages are served from CDN
- Dynamic pages use serverless functions

### Build Output:
- `.next/` directory contains the built app
- `.netlify/` directory contains generated functions
- Both are needed for deployment

### If Build Keeps Failing:

1. **Clear cache and retry**:
   - In Netlify: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

2. **Check package.json**:
   - Ensure `"next": "^14.0.0"` is in dependencies
   - Run `npm install` locally to verify

3. **Check environment variables**:
   - All `NEXT_PUBLIC_*` variables must be set before build
   - They are embedded at build time, not runtime

4. **Local build test**:
   ```bash
   cd frontend
   npm run build
   ```
   - Should complete without errors

## Common Errors & Solutions

### Error: "Module not found"
**Solution**: Make sure all imports use correct paths:
```javascript
// Good:
import Component from '@/components/Component'
import { api } from '@/utils/endpoints'

// Bad:
import Component from '../components/Component'
```

### Error: "API calls return 404"
**Solution**: Update `NEXT_PUBLIC_API_URL` environment variable with correct backend URL

### Error: "Build exceeds time limit"
**Solution**:
- Remove unnecessary dependencies
- Check for infinite loops in `getStaticProps`/`getServerSideProps`
- Reduce number of static pages generated

## Deployment Checklist

Before deploying:
- [ ] Run `npm run build` locally successfully
- [ ] All environment variables configured in Netlify
- [ ] Backend API is deployed and accessible
- [ ] netlify.toml is configured correctly
- [ ] Base directory set to `frontend`
- [ ] Node version set to 18

## Getting Help

If issues persist:
1. Check Netlify build logs (full output)
2. Check browser console for errors
3. Verify backend API is responding
4. Test locally with `npm run build && npm start`

## Manual Deploy (Alternative)

If automatic deploys fail, you can manually deploy:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# From project root
cd frontend
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

This bypasses auto-build and uploads your local build.

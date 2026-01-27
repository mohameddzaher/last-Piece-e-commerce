# Deployment Guide

## Production Checklist

- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] HTTPS/SSL certificates installed
- [ ] Email service configured
- [ ] Payment processing configured
- [ ] CDN setup (optional)
- [ ] Error monitoring (Sentry/DataDog)
- [ ] Analytics configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Database indexes created

## Deployment Platforms

### 1. Vercel (Frontend Recommended)

**Benefits:**
- Zero-configuration deployments
- Automatic SSL
- Global CDN
- Git integration
- Serverless functions

**Steps:**

1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Import the project:
   - Framework: Next.js
   - Root Directory: `frontend`
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
   ```
5. Click Deploy

**Custom Domain:**
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as shown

### 2. Render or Railway (Backend Recommended)

**Render Steps:**

1. Sign up at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   ```
   MONGODB_URI=<your_mongodb_atlas_uri>
   JWT_SECRET=<generate_strong_secret>
   NODE_ENV=production
   ```
6. Create and deploy

**Railway Steps:**

1. Sign up at [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repo
4. Add service: Node.js
5. Configure environment variables
6. Deploy

### 3. Docker Deployment

**Build Production Images:**

```bash
# Frontend
docker build -t lastpiece-frontend:latest -f frontend/Dockerfile frontend/
docker tag lastpiece-frontend:latest yourdockerusername/lastpiece-frontend:latest
docker push yourdockerusername/lastpiece-frontend:latest

# Backend
docker build -t lastpiece-backend:latest -f backend/Dockerfile backend/
docker tag lastpiece-backend:latest yourdockerusername/lastpiece-backend:latest
docker push yourdockerusername/lastpiece-backend:latest
```

**Deploy to AWS ECS, Google Cloud Run, or DigitalOcean:**

```bash
# Example: DigitalOcean App Platform
doctl apps create --spec app.yaml
```

### 4. AWS Deployment

**Frontend (S3 + CloudFront):**

```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync .next/ s3://your-bucket/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Backend (Elastic Beanstalk or EC2):**

```bash
# Create EB environment
eb init -p node.js last-piece
eb create last-piece-prod

# Deploy
eb deploy
```

### 5. MongoDB Atlas Setup

**Steps:**

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create organization and project
3. Build database cluster
4. Choose cloud provider and region
5. Configure security:
   - Add network access (IP whitelist)
   - Create database user
6. Get connection string
7. Update backend `MONGODB_URI`

**Backup Strategy:**

```
Settings → Backup & Restore → Enable Automatic Backup
```

## Environment Configuration

### Production (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lastpiece?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate_with: openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<generate_with: openssl rand -hex 32>

# Email (SendGrid recommended for production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid_api_key>

# Payments
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Frontend
FRONTEND_URL=https://yourdomain.com

# Logging & Monitoring
LOG_LEVEL=error
SENTRY_DSN=<your_sentry_dsn>
```

## Performance Optimization

### Frontend

1. **Image Optimization:**
```javascript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
}
```

2. **Code Splitting:** Next.js does this automatically

3. **Caching Headers:**
```javascript
// next.config.js
headers: async () => [
  {
    source: '/images/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ]
  }
]
```

4. **CDN Setup:**
   - Use Vercel's built-in CDN or
   - Configure Cloudflare:
     - Add domain
     - Set up cache rules
     - Enable compression

### Backend

1. **Database Indexes:** Already configured in models

2. **Caching:**
```javascript
// Example: Cache product list
app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  // ... query logic
});
```

3. **Compression:**
```javascript
import compression from 'compression';
app.use(compression());
```

## Security in Production

### SSL/HTTPS

All production deployments automatically include SSL:
- Vercel: Automatic
- Render: Automatic
- AWS: Use ACM certificates
- DigitalOcean: Let's Encrypt via App Platform

### Security Headers (Already configured)

```javascript
app.use(helmet()); // Sets:
// - Content-Security-Policy
// - X-Frame-Options
// - X-Content-Type-Options
// - Strict-Transport-Security
```

### Database Security

1. **Enable encryption at rest:**
   - MongoDB Atlas: Settings → Encryption
   - AWS: Enable encryption for RDS

2. **Network security:**
   - IP whitelist in MongoDB Atlas
   - VPC for AWS RDS
   - Security groups limiting access

3. **User permissions:**
   - Create minimal privilege database users
   - Rotate credentials regularly

### Application Security

1. **Rate Limiting:** Already configured
2. **CORS:** Configured to allow only frontend
3. **Input Validation:** Implemented in all endpoints
4. **Password Security:** Bcrypt with 10 rounds

## Monitoring & Logging

### Error Tracking (Sentry)

```bash
# Install
npm install @sentry/node

# Backend integration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Application Monitoring

**Datadog, New Relic, or CloudWatch:**

Monitor:
- API response times
- Database query performance
- Error rates
- User sessions
- Memory/CPU usage

### Logging

```javascript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## CI/CD Pipeline

The `.github/workflows/ci-cd.yml` includes:

1. **Testing**: Run all tests on PR/push
2. **Building**: Build Docker images
3. **Linting**: ESLint checks
4. **Deployment**: Auto-deploy to production on main branch

**Configure deployment secrets:**

1. Go to Settings → Secrets → Actions
2. Add:
   - `DEPLOY_KEY` - SSH key or API token
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub token
   - Other service credentials

## Backup & Recovery

### Database Backup

**MongoDB Atlas:**
- Automatic backups: Enabled by default (3-day retention)
- Manual snapshots: Take before major changes
- Restore: Atlas Console → Backup → Restore

**Custom Backup Script:**

```bash
#!/bin/bash
# backup.sh
mongodump --uri="$MONGODB_URI" --out=./backup-$(date +%Y%m%d)
# Upload to S3
aws s3 sync ./backup-* s3://your-backup-bucket/
```

### Application Code

- GitHub provides automatic backups
- Regular local backups: `git clone --mirror`

## Scaling Strategy

### Horizontal Scaling

1. **Backend**: Deploy multiple instances behind load balancer
2. **Frontend**: CDN automatically serves from multiple locations
3. **Database**: MongoDB sharding for large datasets

### Vertical Scaling

- Increase server CPU/memory
- Optimize queries and indexes
- Implement caching (Redis)

### Database Optimization

```javascript
// Add Redis caching
import redis from 'redis';
const client = redis.createClient();

// Cache product list
const getProducts = async (page) => {
  const key = `products:${page}`;
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await Product.find().skip(...).limit(...);
  await client.setex(key, 3600, JSON.stringify(data));
  return data;
};
```

## Post-Deployment Tasks

1. ✅ Verify all endpoints working
2. ✅ Test payment processing
3. ✅ Test email notifications
4. ✅ Monitor error rates
5. ✅ Performance testing
6. ✅ Security audit
7. ✅ Load testing
8. ✅ User acceptance testing

## Maintenance

### Regular Tasks

- **Weekly**: Check logs, monitor metrics
- **Monthly**: Security patches, dependency updates
- **Quarterly**: Full security audit, performance review
- **Annually**: Disaster recovery drill, infrastructure audit

### Update Strategy

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions (with caution)
npm install package@latest

# Test thoroughly before deploying
npm test
npm run lint
```

## Support & Incidents

### Incident Response

1. **Alert** → Page on-call engineer
2. **Investigate** → Check logs, metrics, health status
3. **Mitigate** → Implement quick fix if needed
4. **Resolve** → Deploy permanent fix
5. **Review** → Post-mortem, prevent recurrence

### Rollback Plan

```bash
# Quick rollback to previous version
git revert <commit_hash>
npm run build
npm run deploy
```

## Resources

- [Vercel Deployment](https://vercel.com/docs)
- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)
- [AWS Best Practices](https://aws.amazon.com/best-practices/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

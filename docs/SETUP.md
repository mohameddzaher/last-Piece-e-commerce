# Setup & Installation Guide

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **Git** for version control
- **Docker** (optional, for containerized development)

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/last-piece.git
cd last-piece
```

## 2. Install Dependencies

### Install root dependencies
```bash
npm install
```

This will install dependencies for both backend and frontend workspaces.

## 3. Setup Environment Variables

### Backend Configuration

Navigate to backend directory:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/lastpiece
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lastpiece?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars

# Bcrypt
BCRYPT_ROUNDS=10

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SENDER_EMAIL=noreply@lastpiece.com
SENDER_NAME=Last Piece

# Payment (Stripe)
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
WEBHOOK_SECRET=whsec_your_webhook_secret

# URLs
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Frontend Configuration

Navigate to frontend directory:
```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## 4. MongoDB Setup

### Option A: Local MongoDB

Install MongoDB locally from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

Start MongoDB:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Windows
mongod

# Linux
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/lastpiece?retryWrites=true&w=majority`
4. Update `MONGODB_URI` in backend `.env`

Verify connection:
```bash
mongosh "your_connection_string"
```

## 5. Run Application

### Option A: Using npm

From root directory:
```bash
npm run dev
```

This starts both frontend and backend in development mode.

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

### Option B: Using Docker Compose

```bash
npm run docker:up
```

**Docker Services:**
- MongoDB: localhost:27017
- Backend: localhost:5000
- Frontend: localhost:3000

Stop containers:
```bash
npm run docker:down
```

### Option C: Manual Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 6. Email Configuration

### Gmail Setup (for testing)

1. Enable 2-Step Verification in Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASS` environment variable

### Alternative Email Services

Replace SMTP configuration with your preferred service:
- **SendGrid**: `smtp.sendgrid.net:587`
- **AWS SES**: `email-smtp.region.amazonaws.com:587`
- **Mailgun**: `smtp.mailgun.org:587`

## 7. Stripe Setup (Optional)

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Update `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`

For webhook testing:
```bash
stripe listen --forward-to localhost:5000/api/webhook
```

## 8. First Run

### Create Super Admin User

The system will create a super admin on first run. Default credentials:
```
Email: admin@lastpiece.com
Password: SecurePassword123!
```

Change these immediately in production!

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Register test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

## 9. Development Scripts

### Backend
```bash
cd backend

# Start dev server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Seed database
npm run seed
```

### Frontend
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

### Root
```bash
# Install all dependencies
npm install

# Run dev servers for both
npm run dev

# Build both applications
npm run build

# Run tests for both
npm run test

# Lint both applications
npm run lint

# Docker commands
npm run docker:build
npm run docker:up
npm run docker:down
```

## 10. Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
# Check MongoDB status
mongo --version
# Start MongoDB
mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process on port
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
```bash
# Restart dev servers after changing .env
npm run dev
```

## 11. Next Steps

1. **Customize branding** - Update colors in `tailwind.config.js`
2. **Add products** - Use admin dashboard or API
3. **Setup payment** - Configure Stripe webhooks
4. **Setup email** - Test email delivery with your provider
5. **Deploy** - See deployment guide in docs

## Support

For issues or questions:
- Check existing issues: GitHub Issues
- Create new issue with details
- Contact: support@lastpiece.com

Happy coding! 🚀

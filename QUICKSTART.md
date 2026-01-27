# Last Piece - Quick Start Guide

## ✅ Project Status: RUNNING

Your Last Piece e-commerce platform is now running successfully!

### 📍 Access Points

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:3000 | ✅ Running |
| Backend API | http://localhost:5001/api | ✅ Running |
| API Health | http://localhost:5001/api/health | ✅ Ready |
| Database | mongodb://localhost:27017/lastpiece | ✅ Connected |

### 🚀 Development Commands

```bash
# Start development server (both frontend & backend)
npm run dev

# Start only backend
npm run dev --workspace=backend

# Start only frontend
npm run dev --workspace=frontend

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Docker commands
npm run docker:build   # Build Docker images
npm run docker:up      # Start with Docker Compose
npm run docker:down    # Stop Docker containers
```

### 🔧 Configuration

**Backend Environment (.env)**
- PORT=5001
- MONGODB_URI=mongodb://localhost:27017/lastpiece
- JWT_SECRET=your_jwt_secret_key_min_32_characters_long_here
- FRONTEND_URL=http://localhost:3000

**Frontend Environment (.env.local)**
- NEXT_PUBLIC_API_URL=http://localhost:5001/api
- NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

### 📝 Quick Test

Try these API endpoints:

```bash
# Get API status
curl http://localhost:5001/api/health

# Create a test user (register)
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'

# Get all products
curl http://localhost:5001/api/products

# Search products
curl "http://localhost:5001/api/products/search?q=unique"
```

### ⚠️ Warnings (Non-critical)

The following warnings can be safely ignored:

1. **Mongoose Index Warnings**: Duplicate schema indexes - these are optimization warnings
2. **MongoDB Driver Warnings**: Deprecated options - these don't affect functionality
3. **Reserved Schema Pathname**: `collection` field in database - working as designed

### 🛠️ Troubleshooting

**Port Already in Use**
```bash
# If port 5000 or 5001 is in use, kill the process
lsof -i :5001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

**MongoDB Not Running**
```bash
# Start MongoDB
brew services start mongodb-community@7.0

# Check status
brew services list | grep mongo
```

**Dependencies Issue**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 📚 Documentation

- [API Documentation](docs/API.md) - All endpoints and examples
- [Database Schema](docs/DATABASE.md) - Complete database design
- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Project Summary](PROJECT_SUMMARY.md) - Full project overview

### 🎯 Next Steps

1. **Test the Frontend**: Open http://localhost:3000
2. **Explore API Docs**: Check `docs/API.md` for all endpoints
3. **Create a Test Account**: Register at http://localhost:3000/register
4. **Browse Products**: View the product catalog
5. **Test Payment**: Integration ready for Stripe

### 🔐 Security Notes

- Always generate strong JWT_SECRET in production
- Enable HTTPS in production
- Use environment variables for sensitive data
- Configure CORS for production domains
- Set up rate limiting for API endpoints

### 💡 Tips

- Hot reload is enabled - changes to code update automatically
- Check browser console for frontend errors
- Check terminal for backend logs
- Use `rs` in backend terminal to manually restart

### 📞 Support

For issues or questions:
1. Check the [troubleshooting guide](docs/SETUP.md#troubleshooting)
2. Review [API documentation](docs/API.md)
3. Check error logs in the terminal

---

**Happy coding! 🚀**

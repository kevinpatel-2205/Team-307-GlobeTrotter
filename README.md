# GlobeTrotter - Travel Planning Web App

A modern, scalable travel planning application built with React and Node.js, featuring user authentication, responsive design, and AWS PostgreSQL integration.

## 🌟 Features

### Authentication System
- **User Registration** with optional avatar upload
- **Secure Login** with JWT tokens
- **Password Reset** (placeholder implementation)
- **Protected Routes** with automatic token validation
- **Responsive Design** using Material UI

### Backend Features
- **Express.js API** with PostgreSQL database
- **AWS RDS/Aurora PostgreSQL** support with SSL
- **JWT Authentication** with bcrypt password hashing
- **File Upload** handling with multer
- **Input Validation** and error handling
- **CORS and Security** middleware (helmet)

### Frontend Features
- **React 18** with functional components
- **Material UI** for responsive, modern design
- **React Router** for client-side routing
- **Axios** for API communication with interceptors
- **Vite** for fast development and building

## 🏗️ Architecture

```
GlobeTrotter/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Express server entry point
│   ├── db/                 # Database schema
│   ├── uploads/            # File upload directory
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── api/           # API client configuration
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # React entry point
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (AWS RDS/Aurora recommended)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd GlobeTrotter
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Create database schema
# Connect to your PostgreSQL database and run:
psql -h your-db-host -U your-username -d your-database -f db/schema.sql

# Start development server
npm run dev
```

The backend will run on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (default API URL should work)

# Start development server
npm run dev
```

The frontend will run on http://localhost:5173

## 🗄️ Database Setup

### AWS RDS/Aurora PostgreSQL

1. **Create RDS Instance**:
   - Choose PostgreSQL engine
   - Select appropriate instance size
   - Configure security groups for your application

2. **Connection String Format**:
   ```
   postgres://username:password@your-cluster.cluster-xxxxx.region.rds.amazonaws.com:5432/database_name
   ```

3. **SSL Configuration**:
   - Production: SSL is enabled by default
   - Development: SSL can be disabled in db config

4. **Run Schema**:
   ```bash
   psql "postgres://username:password@host:5432/dbname" -f backend/db/schema.sql
   ```

### Local PostgreSQL (Alternative)

```bash
# Install PostgreSQL locally
# Create database
createdb globetrotter

# Run schema
psql globetrotter -f backend/db/schema.sql

# Update .env with local connection
DATABASE_URL=postgres://username:password@localhost:5432/globetrotter
```

## 🔧 Configuration

### Backend Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development

# Database (AWS RDS/Aurora)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Security
JWT_SECRET=your-very-long-random-secret-key

# CORS
CORS_ORIGIN=http://localhost:5173

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# App Info
VITE_APP_NAME=GlobeTrotter
VITE_APP_VERSION=1.0.0
```

## 📱 API Endpoints

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration with optional avatar |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile (protected) |
| GET | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/logout` | User logout |

### Example API Usage

```javascript
// Signup
POST /api/auth/signup
Content-Type: multipart/form-data

{
  fullName: "John Doe",
  email: "john@example.com",
  password: "password123",
  avatar: <file>  // optional
}

// Login
POST /api/auth/login
Content-Type: application/json

{
  email: "john@example.com",
  password: "password123"
}

// Response
{
  message: "Login successful",
  token: "jwt-token-here",
  user: {
    id: 1,
    fullName: "John Doe",
    email: "john@example.com",
    avatarPath: "/uploads/avatar-123.jpg"
  }
}
```

## 🎨 Frontend Pages

### Login Page (`/login`)
- Email and password fields
- Form validation
- Error/success messages
- Forgot password link
- Signup link

### Signup Page (`/signup`)
- Full name, email, password, confirm password
- Optional avatar upload with preview
- Form validation
- Success redirect to login

### Dashboard Page (`/dashboard`)
- Welcome section with user info
- Quick action cards
- Travel statistics
- User profile information
- Logout functionality

### Forgot Password Page (`/forgot-password`)
- Email input for reset request
- Success/error messaging
- Back to login navigation

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Server and client-side validation
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Configured for specific origins
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet middleware

## 🚀 Deployment

### Backend Deployment

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Configure production database URL
   - Set strong JWT secret

2. **AWS/Heroku/DigitalOcean**:
   ```bash
   npm run prod
   ```

### Frontend Deployment

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify/Vercel/S3**:
   - Upload `dist/` folder
   - Configure environment variables

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Test API endpoints
curl http://localhost:5000/health

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'
```

### Frontend Testing
```bash
cd frontend

# Run development server
npm run dev

# Build and preview
npm run build
npm run preview
```

## 🔄 Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Make Changes**: Edit files and see live reload
4. **Test Features**: Use browser dev tools and network tab
5. **Check Logs**: Monitor console for errors

## 📈 Scalability Considerations

### Database
- **Connection Pooling**: Configured in db.js
- **RDS Proxy**: For high-concurrency applications
- **Read Replicas**: For read-heavy workloads
- **Indexing**: Email and timestamp indexes included

### Backend
- **Stateless Design**: JWT tokens for horizontal scaling
- **Error Handling**: Comprehensive error responses
- **Logging**: Morgan for request logging
- **Rate Limiting**: Can be added for production

### Frontend
- **Code Splitting**: Vite handles automatically
- **CDN Deployment**: Static files can be served from CDN
- **Caching**: Browser caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section below

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check DATABASE_URL format
   - Verify database is running
   - Check security group settings (AWS)

2. **CORS Errors**:
   - Verify CORS_ORIGIN in backend .env
   - Check frontend API base URL

3. **File Upload Issues**:
   - Ensure uploads directory exists
   - Check file size limits
   - Verify file type restrictions

4. **JWT Token Issues**:
   - Check JWT_SECRET is set
   - Verify token expiration settings
   - Clear localStorage if needed

### Development Tips

- Use browser dev tools Network tab to debug API calls
- Check backend console for detailed error messages
- Use React Developer Tools for component debugging
- Monitor database logs for query issues

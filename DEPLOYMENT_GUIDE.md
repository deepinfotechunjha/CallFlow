# Deployment Guide

This guide explains how to deploy your Call Management System with proper environment variable configuration.

## Environment Variables Setup

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory with:

```env
# Set this to your deployed backend URL
VITE_API_URL=https://your-backend-url.com
```

**For different environments:**
- **Development**: `VITE_API_URL=http://localhost:4000`
- **Production**: `VITE_API_URL=https://your-deployed-backend.com`

### Backend Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Database connection
DATABASE_URL="your-database-connection-string"

# JWT secret
JWT_SECRET="your-secure-jwt-secret"

# Frontend URL for CORS
FRONTEND_ORIGIN="https://your-frontend-url.com"

# Server port (optional)
PORT=4000

# Email configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
```

**For different environments:**
- **Development**: `FRONTEND_ORIGIN=http://localhost:5173`
- **Production**: `FRONTEND_ORIGIN=https://your-deployed-frontend.com`

## Deployment Steps

### 1. Backend Deployment (e.g., Render, Railway, Heroku)

1. Set environment variables in your hosting platform:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `FRONTEND_ORIGIN`: Your deployed frontend URL
   - `EMAIL_USER`: Gmail address for OTP emails
   - `EMAIL_PASS`: Gmail app password
   - `PORT`: Usually set automatically by the platform

2. Deploy the backend code

### 2. Frontend Deployment (e.g., Netlify, Vercel)

1. Set environment variables:
   - `VITE_API_URL`: Your deployed backend URL

2. Deploy the frontend code

### 3. Update CORS Configuration

Make sure your backend's `FRONTEND_ORIGIN` environment variable matches your deployed frontend URL exactly.

## Local Development

For local development, the system will automatically use localhost URLs if environment variables are not set:

- Frontend will connect to `http://localhost:4000`
- Backend will allow CORS from `http://localhost:5173`

## Testing the Setup

1. Check that the frontend can connect to the backend
2. Verify that WebSocket connections work
3. Test authentication and API calls
4. Ensure email functionality works (if configured)

## Troubleshooting

- **CORS errors**: Check that `FRONTEND_ORIGIN` matches your frontend URL exactly
- **API connection issues**: Verify `VITE_API_URL` is set correctly
- **WebSocket issues**: Ensure both HTTP and WebSocket protocols are supported by your hosting platform
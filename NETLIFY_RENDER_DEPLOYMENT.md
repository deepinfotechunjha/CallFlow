# Deployment Steps: Netlify + Render

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment
1. Push your code to GitHub (if not already done)
2. Make sure your `backend` folder has all the files

### Step 2: Create Render Account & Deploy
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `call-management-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables in Render
In the "Environment" section, add these variables:
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-secure-random-string
FRONTEND_ORIGIN=https://your-app-name.netlify.app
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Step 4: Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://call-management-backend.onrender.com`)

## Part 2: Deploy Frontend to Netlify

### Step 1: Prepare Frontend for Deployment
1. Update your frontend `.env` file with the Render backend URL:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 2: Create Netlify Account & Deploy
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Step 3: Set Environment Variables in Netlify
1. Go to Site settings → Environment variables
2. Add:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 4: Deploy Frontend
1. Click "Deploy site"
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://amazing-app-123456.netlify.app`)

## Part 3: Update Backend CORS

### Step 1: Update Backend Environment
1. Go back to your Render dashboard
2. Go to your backend service → Environment
3. Update `FRONTEND_ORIGIN` with your Netlify URL:
```
FRONTEND_ORIGIN=https://your-app-name.netlify.app
```

### Step 2: Redeploy Backend
1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait for redeployment

## Part 4: Test Your Deployment

1. Visit your Netlify URL
2. Try logging in
3. Test creating calls, user management, etc.
4. Check browser console for any errors

## Quick Reference

### Render Environment Variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_ORIGIN=https://your-netlify-url.netlify.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Netlify Environment Variables:
```
VITE_API_URL=https://your-render-url.onrender.com
```

## Troubleshooting

**CORS Error**: Make sure `FRONTEND_ORIGIN` in Render matches your Netlify URL exactly
**Build Fails**: Check build logs in Render/Netlify dashboard
**Database Issues**: Verify your `DATABASE_URL` is correct
**Email Not Working**: Check Gmail app password and settings

## Important Notes

- Render free tier may have cold starts (app sleeps after inactivity)
- Always use HTTPS URLs in production
- Keep your environment variables secure
- Test thoroughly after deployment
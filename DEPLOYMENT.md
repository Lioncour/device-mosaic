# Deployment Guide

## Quick Deploy to Railway

1. **Create a GitHub Repository**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/device-mosaic.git
   git push -u origin master
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect it's a Node.js app
   - The app will deploy automatically!

3. **Get Your URL**
   - Railway provides a URL like `your-app.railway.app`
   - Share this URL with your devices
   - Access host at: `https://your-app.railway.app/host`
   - Access clients at: `https://your-app.railway.app/client`

## Alternative: Render

1. **Create a GitHub Repository** (same as above)

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `node server.js`
     - **Environment**: Node
   - Click "Create Web Service"
   - Render will build and deploy your app

3. **Get Your URL**
   - Render provides a URL like `your-app.onrender.com`
   - Share this URL with your devices

## Environment Variables

Both platforms automatically set:
- `PORT` - The port your app should listen on
- `NODE_ENV` - Set to `production`

No additional configuration needed!

## Important Notes

- **GitHub Pages won't work** - This app requires a Node.js server with Socket.IO, which GitHub Pages doesn't support
- **HTTPS is required** - Both Railway and Render provide HTTPS automatically
- **WebSocket support** - Both platforms support WebSockets needed for Socket.IO

## Troubleshooting

If clients can't connect:
- Make sure you're using HTTPS (not HTTP)
- Check that the Socket.IO path is correct: `/api/socket`
- Verify the server is running and accessible


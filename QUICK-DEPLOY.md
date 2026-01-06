# Quick Deploy to Railway

## Option 1: Web Interface (Easiest - 2 minutes)

1. **Go to**: https://railway.app
2. **Sign in** with your GitHub account (Lioncour)
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select**: `Lioncour/device-mosaic`
5. **Wait**: Railway will automatically:
   - Detect it's a Node.js app
   - Install dependencies
   - Build and deploy
6. **Get URL**: Click on your project → Settings → Generate Domain
   - Your app will be at: `https://your-app.railway.app`
   - Host: `https://your-app.railway.app/host`
   - Clients: `https://your-app.railway.app/client`

## Option 2: CLI (After Browser Login)

If you've logged in via browser, run:
```powershell
railway init
railway link
railway up
railway domain
```

## Your Repository
- **GitHub**: https://github.com/Lioncour/device-mosaic
- **Ready to deploy**: ✅ All code pushed


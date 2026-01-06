# Deploy to Koyeb - Complete Guide

## Why Koyeb?
- ✅ **Free tier** with always-on (no sleep!)
- ✅ Easy GitHub integration
- ✅ Automatic HTTPS
- ✅ Great for Node.js apps
- ✅ Simple deployment

## Step-by-Step Deployment

### Step 1: Create Account
1. Go to: https://www.koyeb.com
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your **GitHub account** (Lioncour)
4. Verify your email if needed

### Step 2: Create App
1. In Koyeb dashboard, click **"Create App"** or **"New App"**
2. Select **"GitHub"** as source
3. Authorize Koyeb to access your GitHub if prompted

### Step 3: Select Repository
1. Find and select: **`Lioncour/device-mosaic`**
2. Click **"Next"** or **"Continue"**

### Step 4: Configure Build Settings
Koyeb will auto-detect Node.js, but verify:

- **Build Command**: `npm install && npm run build`
- **Run Command**: `node server.js`
- **Region**: Choose closest to you (e.g., `US East`)
- **Instance Type**: **Nano** (Free tier) or **Starter** (if you want more resources)

### Step 5: Environment Variables
Click **"Environment Variables"** or **"Secrets"**:
- `NODE_ENV` = `production` (optional, Koyeb may set this automatically)
- `PORT` - Koyeb sets this automatically, don't override

**No other variables needed!**

### Step 6: Deploy!
1. Review settings
2. Click **"Deploy"** or **"Create App"**
3. Koyeb will:
   - Clone your repo
   - Install dependencies
   - Build Next.js app
   - Start your server
4. Watch the deployment logs (takes 2-5 minutes)

### Step 7: Get Your URL
Once deployed:
- Koyeb automatically provides a URL like: `device-mosaic-xxxxx.koyeb.app`
- Or you can set a custom subdomain in settings
- Your app will be at:
  - **Host**: `https://your-app.koyeb.app/host`
  - **Client**: `https://your-app.koyeb.app/client`

## Koyeb Free Tier

### What You Get:
- ✅ **Always-on** (no sleep like Render!)
- ✅ **512 MB RAM**
- ✅ **0.5 vCPU**
- ✅ **Automatic HTTPS**
- ✅ **Custom domains** (optional)
- ✅ **Unlimited deploys**

### Limitations:
- ⚠️ Limited resources (may need to upgrade for heavy traffic)
- ⚠️ 1 app on free tier (can upgrade for more)

## Configuration Files

✅ **koyeb.toml** - Created for you:
- Build configuration
- Health check endpoint

✅ **package.json** - Already configured:
- Build: `npm run build`
- Start: `node server.js`

## Troubleshooting

### If deployment fails:
1. Check **"Logs"** tab for errors
2. Verify **Run Command** is: `node server.js`
3. Check **Build Command** is: `npm install && npm run build`
4. Make sure `server.js` exists in root directory

### If app doesn't start:
1. Check logs for port errors
2. Verify Koyeb sets `PORT` automatically
3. Check that Socket.IO connections are allowed

### Common Issues:
- **Port errors**: Koyeb sets PORT automatically via environment variable
- **Build failures**: Check Next.js build logs
- **Socket.IO**: Should work fine on Koyeb

## Advanced: Custom Domain

1. Go to your app settings
2. Click **"Domains"** or **"Custom Domain"**
3. Add your domain
4. Configure DNS as Koyeb instructs

## Monitoring

- **Logs**: Real-time logs in dashboard
- **Metrics**: CPU, memory usage
- **Health**: Automatic health checks

## Koyeb vs Other Platforms

| Feature | Koyeb Free | Render Free | Railway Paid |
|---------|-----------|-------------|-------------|
| Always-on | ✅ Yes | ❌ Sleeps | ✅ Yes |
| WebSocket | ✅ Yes | ✅ Yes | ✅ Yes |
| Cost | Free | Free | $5/month |
| Setup | Easy | Easy | Easy |

**Koyeb is great choice - free and always-on!**


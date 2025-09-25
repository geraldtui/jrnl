# GitHub Pages Deployment Guide

This guide will help you deploy your jrnl app to GitHub Pages for free hosting.

## 🚀 Quick Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 2. Configure GitHub Repository
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section
4. Under **Source**, select **GitHub Actions**

### 3. Add Environment Variables
1. In your repository settings, go to **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Add: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with your Google Client ID

### 4. Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your GitHub Pages URL to **Authorized JavaScript origins**:
   ```
   https://yourusername.github.io
   ```
5. If your repository isn't named exactly `jrnl-app`, also add:
   ```
   https://yourusername.github.io/your-repo-name
   ```

## 🔧 Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Build and deploy
npm run deploy
```

This will:
1. Build the static version of your app
2. Deploy it to the `gh-pages` branch
3. GitHub Pages will automatically serve it

## 📝 Important Notes

### Domain Configuration
- **Default URL**: `https://yourusername.github.io/repository-name`
- **Custom domain**: You can set up a custom domain in repository settings

### Environment Variables
- Only `NEXT_PUBLIC_*` variables work in static builds
- Your Google Client ID is safe to expose (it's meant to be public)
- Add the GitHub Pages URL to Google OAuth settings

### Limitations on GitHub Pages
- ❌ No server-side functionality
- ❌ No API routes
- ❌ No custom headers
- ✅ Client-side JavaScript works perfectly
- ✅ Google authentication works
- ✅ Google Drive integration works

## 🛠 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Ensure no server-side code is being used

### Authentication Issues
- Verify Google OAuth JavaScript origins include your GitHub Pages URL
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly

### Site Not Loading
- Wait a few minutes after deployment
- Check that GitHub Pages is enabled in repository settings
- Ensure the `gh-pages` branch exists

## 🎯 Alternative Hosting Options

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Add environment variable: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

## ✅ Advantages of This Setup

- 🆓 **Free hosting** with GitHub Pages
- 🔒 **No server secrets to manage**
- 🚀 **Works on any static hosting**
- ⚡ **Fast CDN delivery**
- 🔄 **Automatic deployments** with GitHub Actions

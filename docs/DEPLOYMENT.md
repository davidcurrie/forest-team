# Deployment Guide

Complete guide for deploying Forest Team to production.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Vercel Deployment](#vercel-deployment-recommended)
4. [Netlify Deployment](#netlify-deployment)
5. [GitHub Pages Deployment](#github-pages-deployment)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

### Build Process

Forest Team is a static Single Page Application (SPA) that needs to be built before deployment:

```bash
npm run build
```

This command:
1. **TypeScript Compilation** - Compiles `.tsx`/`.ts` to JavaScript
2. **Vite Build** - Bundles and optimizes all assets
3. **Code Splitting** - Creates multiple chunks for faster loading
4. **PWA Assets** - Generates service worker and manifest
5. **Output** - Creates production-ready files in `dist/` folder

**You don't need to build manually** - deployment platforms (Vercel, Netlify) will build automatically from your Git repository.

### What Gets Deployed

The `dist/` folder contains:
```
dist/
├── index.html              # App entry point
├── assets/
│   ├── index-*.js         # JavaScript bundles (code-split)
│   ├── MapPage-*.js       # Map page chunk
│   ├── schema-*.js        # Database chunk
│   └── *.css              # Stylesheets
├── sw.js                  # Service worker
├── workbox-*.js           # Workbox runtime
├── manifest.webmanifest   # PWA manifest
└── registerSW.js          # Service worker registration
```

### Requirements

- **HTTPS**: Required for PWA features (all platforms provide this)
- **No backend**: App is 100% client-side, no server needed
- **No environment variables**: Everything is configured in code
- **No database**: Uses browser IndexedDB for storage

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass: `npm test -- --run`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Code committed to Git
- [ ] Pushed to GitHub (or other Git host)

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment with zero configuration.

### Method 1: Web Dashboard (Easiest)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your `forest-team` repository
   - Click "Import"

3. **Configure Build Settings**

   Vercel auto-detects Vite projects, but verify:

   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

   Click "Deploy"

4. **Wait for Build**
   - Vercel builds your app (1-2 minutes)
   - Shows build logs in real-time
   - Provides preview URL when complete

5. **Access Your App**
   - URL format: `https://forest-team-xxx.vercel.app`
   - Click URL to test your deployed app
   - Install PWA on your phone to test

### Method 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd forest-team

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Answer prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? forest-team
# - Directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

### Continuous Deployment (Vercel)

Once connected, every push to `main` auto-deploys:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically builds and deploys!
```

**Pull Request Previews:**
- Each PR gets a unique preview URL
- Test changes before merging
- Automatic cleanup when PR is closed

### Vercel Configuration File (Optional)

Create `vercel.json` for advanced settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Not required** - Vercel works great without it!

## Netlify Deployment

Netlify is another excellent option with similar features.

### Method 1: Web Dashboard

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add new site" > "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify
   - Select `forest-team` repository

3. **Configure Build Settings**

   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

   Click "Deploy site"

4. **Wait for Build**
   - Netlify builds your app (1-2 minutes)
   - Shows build logs
   - Assigns random subdomain

5. **Access Your App**
   - URL format: `https://random-name-123.netlify.app`
   - Click "Change site name" to customize
   - Test PWA installation

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to project
cd forest-team

# Build the app
npm run build

# Login to Netlify
netlify login

# Deploy
netlify deploy

# Follow prompts:
# - Create new site
# - Choose team
# - Site name (optional)
# - Publish directory: dist

# Production deployment
netlify deploy --prod --dir=dist
```

### Continuous Deployment (Netlify)

Auto-deploy on push (like Vercel):

```bash
git push origin main
# Netlify auto-builds and deploys
```

### Netlify Configuration File (Optional)

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

## GitHub Pages Deployment

Free hosting on GitHub, but requires extra configuration.

### Important: Update Base Path

GitHub Pages serves from a subdirectory, so update `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/forest-team/', // Must match repo name
  plugins: [
    // ... rest of config
  ]
})
```

### Method 1: GitHub Actions (Recommended)

1. **Create Workflow File**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages (left sidebar)
   - Source: GitHub Actions
   - Save

3. **Push to Trigger Deployment**
```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

4. **Access Your App**
   - URL: `https://YOUR-USERNAME.github.io/forest-team/`
   - Wait 2-3 minutes for first deployment

### Method 2: Manual Deployment

```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Add deploy script to package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Deploy
npm run deploy
```

## Custom Domain Setup

### Vercel Custom Domain

1. Go to project settings in Vercel
2. Click "Domains"
3. Enter your domain (e.g., `forestteam.app`)
4. Vercel provides DNS records to add
5. Add records to your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
6. Wait for DNS propagation (5 minutes - 48 hours)
7. Vercel auto-provisions SSL certificate

### Netlify Custom Domain

1. Go to "Domain settings" in Netlify
2. Click "Add custom domain"
3. Enter your domain
4. Add DNS records at your registrar:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: YOUR-SITE.netlify.app
   ```
5. Netlify auto-provisions SSL

### GitHub Pages Custom Domain

1. Add `CNAME` file to `public/` folder:
   ```
   forestteam.app
   ```
2. Rebuild and deploy
3. In GitHub repo settings > Pages:
   - Enter custom domain
   - Check "Enforce HTTPS"
4. Add DNS records:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153

   Type: CNAME
   Name: www
   Value: YOUR-USERNAME.github.io
   ```

## Post-Deployment

### Verify Deployment

Test these on your live site:

- [ ] **App loads** - Check homepage appears
- [ ] **PWA install** - Verify install prompt on mobile
- [ ] **Offline mode** - Enable airplane mode, reload
- [ ] **File upload** - Upload test event
- [ ] **GPS tracking** - Test on mobile device
- [ ] **Service worker** - Check DevTools > Application > Service Workers
- [ ] **HTTPS** - Verify lock icon in address bar
- [ ] **Performance** - Run Lighthouse audit (score 90+)

### Lighthouse Audit

In Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Generate report"

**Expected Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- PWA: 100

### Monitor Deployment

**Vercel:**
- Dashboard shows all deployments
- Real-time build logs
- Performance analytics
- Error tracking

**Netlify:**
- Deploy log in dashboard
- Build notifications
- Form submissions (if added)
- Analytics

**GitHub Pages:**
- Actions tab shows workflows
- Check workflow runs for errors
- No built-in analytics

## Troubleshooting

### Build Fails on Platform

**"npm install failed"**
```bash
# Locally delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Commit new package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**"TypeScript errors"**
```bash
# Check locally first
npm run build

# Fix errors, then push
```

**"Out of memory"**
- Build platforms have memory limits
- Reduce bundle size or use larger plan

### PWA Not Installing

**"Add to Home Screen" not showing**
- Verify HTTPS is enabled (check for lock icon)
- Check manifest.webmanifest loads correctly
- Service worker must be registered
- iOS: Must use Safari browser

**Service worker not registering**
- Check console for errors
- Verify sw.js is accessible at `/sw.js`
- Clear cache and hard reload

### Routing Issues

**404 on page refresh**
- Need SPA fallback configuration
- Vercel/Netlify: Use config files above
- GitHub Pages: Should work with GitHub Actions setup

### Performance Issues

**Slow loading**
- Check bundle size: `npm run build`
- Verify code splitting is working
- Check network tab in DevTools
- Consider CDN (Vercel/Netlify provide this)

**Service worker caching old files**
- Update version in vite.config.ts
- Service worker will auto-update on next visit
- Force update: Unregister SW in DevTools

## Environment-Specific Notes

### Development
```bash
npm run dev
# http://localhost:5173
# No HTTPS (PWA features limited)
```

### Preview (Local)
```bash
npm run build
npm run preview
# http://localhost:4173
# Simulates production
```

### Production
- Always served over HTTPS
- Service worker active
- Optimized bundles
- PWA fully functional

## Deployment Comparison

| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| Ease of setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Free tier | Generous | Generous | Unlimited |
| Auto HTTPS | ✅ Yes | ✅ Yes | ✅ Yes |
| Custom domain | ✅ Free | ✅ Free | ✅ Free |
| Build minutes | 6,000/month | 300/month | Unlimited |
| Bandwidth | 100GB/month | 100GB/month | 100GB/month |
| Auto deploy | ✅ Yes | ✅ Yes | ✅ Yes (Actions) |
| Preview URLs | ✅ Yes | ✅ Yes | ❌ No |
| Analytics | ✅ Built-in | ✅ Built-in | ❌ No |
| Edge network | ✅ Global | ✅ Global | ✅ Global |
| Best for | **First choice** | **Also great** | **Free hosting** |

## Recommended: Vercel

For Forest Team, we recommend **Vercel** because:

1. ✅ Zero configuration required
2. ✅ Automatic Vite detection
3. ✅ Generous free tier
4. ✅ Global CDN
5. ✅ Preview deployments for PRs
6. ✅ Excellent performance
7. ✅ Simple custom domain setup

## Questions?

- Check build logs for specific errors
- Test locally with `npm run build && npm run preview`
- Ensure all tests pass before deploying
- Verify HTTPS is working on deployed site
- Check browser console for PWA errors

**Deployment should take less than 5 minutes from start to finish!** 🚀

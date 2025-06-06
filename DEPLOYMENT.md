# Vercel Deployment Guide

## Quick Deploy

1. **Login to Vercel CLI** (run this in your terminal):
   ```bash
   vercel login
   ```

2. **Deploy the project**:
   ```bash
   vercel --prod
   ```

## Environment Variables Setup

**CRITICAL**: After deployment, you MUST add these environment variables in the Vercel dashboard:

### Required Environment Variables:
- `VITE_OPENDOTA_API_KEY` = `39cf6bf8-4a26-4c6e-9ba6-bf41c1dab4b6`
- `VITE_STEAM_API_KEY` = `2CD6D956BC86564BBC1165747A511C38`
- `VITE_AUTH_MODE` = `development`
- `VITE_CACHE_TTL` = `300000`

### Optional Environment Variables:
- `VITE_OPENDOTA_API_URL` = `https://api.opendota.com/api`
- `VITE_STEAM_API_URL` = `https://api.steampowered.com`

### Steam OAuth Configuration (Production Only):
For production deployments using Steam authentication, set:
- `VITE_STEAM_RETURN_URL` = `https://your-production-url.vercel.app/auth/steam/callback`
- `VITE_STEAM_REALM` = `https://your-production-url.vercel.app`

**Note**: Branch/preview deployments automatically use development mode with dynamic URL detection to prevent cross-branch authentication issues.

## Steps to Add Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your deployed project
3. Navigate to Settings → Environment Variables
4. Add each variable with:
   - **Name**: Variable name (e.g., `VITE_OPENDOTA_API_KEY`)
   - **Value**: Variable value (e.g., `39cf6bf8-4a26-4c6e-9ba6-bf41c1dab4b6`)
   - **Environment**: Production, Preview, Development (select all)

## Deployment Configuration

The project includes:
- ✅ `vercel.json` - Deployment configuration
- ✅ Vite build optimized for Vercel
- ✅ Asset handling for Dota 2 resources
- ✅ SPA routing configuration
- ✅ Security headers

## Post-Deployment Testing

After deployment, test:
1. ✅ Hero icons loading correctly
2. ✅ API calls working with rate limit improvements
3. ✅ Match analysis functionality
4. ✅ Dashboard widgets displaying data
5. ✅ Asset loading from `/src/assets/`

## Production URLs Structure

Your app will be available at:
- Production: `https://your-project-name.vercel.app`
- Preview: `https://your-project-name-git-branch.vercel.app`

## Branch Deployment Isolation

**Fixed**: Branch deployments now properly isolate authentication and show correct branch code:

- **Production**: Uses configured Steam OAuth URLs for full authentication
- **Preview/Branch**: Auto-detects deployment URLs and uses development mode
- **Local Development**: Uses `localhost` URLs automatically

Each branch deployment is now independent and won't redirect to master branch code.

## Important Notes

- **Bundle Size**: ~2.8MB (normal for Ant Design + assets)
- **API Rate Limits**: 60,000 requests/hour with API key
- **Asset Loading**: All Dota 2 assets are local (no CDN dependencies)
- **Authentication**: Development mode (direct Account ID input) for branches
- **Branch Isolation**: Each deployment uses its own URL context for OAuth

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Ensure all dependencies are in `package.json`
4. Check for any missing assets in `/src/assets/`
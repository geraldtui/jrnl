# Client-Side Authentication Deployment Guide

## Google Cloud Console Configuration for Production

### Update OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins** (NOT redirect URIs):
   - `https://your-production-domain.com`
   - Remove any redirect URIs as they're not needed for client-side auth

### Environment Variables

Set **only one** environment variable:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Optional:
```bash
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_NAME=jrnl-data
```

## Platform-Specific Deployment

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
4. Deploy!

### Netlify
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add environment variable: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Static Hosting (GitHub Pages, etc.)
```bash
npm run build
npm run export
```
Then deploy the `out/` folder.

## Advantages

- ✅ **No server secrets to manage**
- ✅ **Works on any static hosting**
- ✅ **Single environment variable**
- ✅ **No server required**
- ✅ **Better security** (no server-side token storage)

## Security Notes

- Client IDs are safe to expose publicly
- All authentication happens in the user's browser
- No sensitive credentials stored on your servers
- Users can revoke access directly through Google account settings

# jrnl — Minimal Immutable Journalling with Google Drive Storage

A minimal personal journaling app that stores your data securely in your own Google Drive using client-side authentication - **no server secrets required!**

## Features

- 🔐 **Client-Side Authentication**: Direct Google sign-in in your browser
- ☁️ **Your Data, Your Control**: All journal entries are stored in your Google Drive
- 🔒 **No Server Secrets**: Authentication happens entirely client-side
- 📝 **Immutable Entries**: Journal entries cannot be edited or deleted (append-only)
- 📊 **Insights Dashboard**: Visualize your journaling patterns and reflections
- 🌙 **Dark Theme**: Beautiful dark interface with purple accents
- 📱 **Responsive Design**: Works on desktop and mobile
- ⚡ **Fast Entry**: Quickly capture thoughts with title, context, rating, and tags

## Prerequisites

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- A **Google account** for Drive storage
- A modern web browser

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure the OAuth consent screen if prompted (set to "Testing" for personal use)
   - Choose "Web application" as the application type
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Note**: No redirect URIs needed for client-side authentication
   - Copy the **Client ID** (you won't need the Client Secret!)
5. Add yourself as a test user in the OAuth consent screen

### 2. Environment Variables

1. Create a `.env.local` file in the root directory:

```bash
# Google Client ID (safe to expose publicly)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Google Drive folder name (optional, defaults to 'jrnl-data')
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_NAME=jrnl-data
```

**Important**: Only the Client ID is needed - no Client Secret required!

### 3. Installation and Development

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd jrnl-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) and sign in with Google to start journaling!

## How It Works

### Client-Side Authentication
- Users authenticate directly with Google in their browser using Google Identity Services
- No server-side secrets are stored or required
- Authentication tokens are handled securely in the browser
- Sessions are stored in localStorage for convenience

### Data Storage
- When you sign in with Google, the app requests permission to create and manage files in your Google Drive
- A folder called "jrnl-data" (configurable) is created in your Google Drive
- All journal entries are stored in a single JSON file within this folder
- The app only has access to files it creates, not your entire Google Drive

### Data Migration
- If you have existing journal data in localStorage, it will be automatically migrated to Google Drive on your first sign-in
- The local data remains as a backup until you manually clear it

## Development
   Navigate to [http://localhost:3000](http://localhost:3000) and sign in with Google to start journaling!

3. **Start journaling!**
   - Sign in with your Google account
   - Use the rich text editor to write and add journal entries
   - View your entry history in the "History" tab
   - Rate your entries and add tags for organization
   - Check the "Insights" tab to see patterns and trends over time

## Usage

### Create an Entry
1. Click "New Entry"
2. Fill in:
   - **Title**
   - **Date**
   - **Context** (optional)
   - **Rating** (optional)
   - **Tags** (optional)
3. Click "Save Entry" (your entry will be saved to Google Drive)

### Reflections
- Optional prompts help you capture what went well, what could improve, and what you learned
- Reflections are part of the entry at creation time (entries are immutable)

### Insights
1. Navigate to the "Insights" tab
2. See:
   - Total entries
   - Average rating over time
   - Common tags
   - Recent improvement themes
3. Use insights to identify patterns and areas for improvement

## Project Structure

\`\`\`
jrnl-app/
├── app/
│   ├── globals.css          # Global styles and theme configuration
│   ├── layout.tsx           # Root layout component
│   └── page.tsx            # Main application page
├── components/
│   ├── entry-list.tsx           # Entries list with search/sort/filter and rich text editor
│   ├── insights-dashboard.tsx   # Analytics and trends dashboard
│   └── rich-text-editor.tsx     # Minimal rich text editor for journal entries
├── components/ui/           # Reusable UI components (buttons, cards, etc.)
├── lib/
│   └── utils.ts            # Utility functions
└── README.md               # This file
\`\`\`

## Usage

### Create an Entry
1. Click "New Entry"
2. Fill in:
   - **Title**
   - **Date**
   - **Context** (optional)
   - **Rating** (optional)
   - **Tags** (optional)
3. Click "Save Entry"

### Reflections
- Optional prompts help you capture what went well, what could improve, and what you learned.
- Reflections are part of the entry at creation time in jrnl (entries are immutable).

### Insights
1. Navigate to the "Insights" tab
2. See:
   - Total entries
   - Average rating over time
   - Common tags
   - Recent improvement themes
3. Use the insights to identify patterns and areas for improvement

## Data Storage & Privacy

### Google Drive Integration
- **Complete data ownership**: Your journal data is stored in your own Google Drive
- **Secure authentication**: Direct authentication with Google using OAuth2
- **Minimal permissions**: App only has access to files it creates
- **Revokable access**: You can revoke access anytime in your Google account settings

### What Gets Stored
- All journal entries in a single JSON file in your Google Drive
- A "jrnl-data" folder is created to organize your data
- No data passes through third-party servers (except Google's secure infrastructure)

### Local Backup
- Authentication tokens stored temporarily in localStorage for convenience
- Original localStorage entries remain as backup during migration
- You can clear local data once you confirm Google Drive sync is working

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel dashboard
4. Update your Google OAuth JavaScript origins to include your production domain
5. Deploy!

### Other Platforms

Make sure to:
1. Set the `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable
2. Update Google OAuth JavaScript origins to include your production domain
3. No server-side configuration needed!

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Authentication**: Google Identity Services (client-side OAuth2)
- **Storage**: Google Drive API (direct client-side calls)
- **Styling**: Tailwind CSS with OKLCH colors
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono

## Customization

The app uses a dark theme with purple highlights. You can customize colors in `app/globals.css`:

```css
:root {
  --background: oklch(0.08 0.02 270);
  --foreground: oklch(0.95 0.01 270);
  --primary: oklch(0.65 0.25 270);
  /* ... other OKLCH color variables */
}
```

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The built files will be in `.next` and can be deployed anywhere that supports Next.js.

## Troubleshooting

### Authentication Issues
- Ensure your Google Client ID is correctly set in `.env.local`
- Check that your domain is added to Google OAuth JavaScript origins
- Make sure you're added as a test user in Google Cloud Console
- Try signing in with an incognito window to clear any cached auth state

### Dev server won't start
- Ensure Node.js version 18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check that the port isn't already in use

### Google Drive sync issues
- Check browser console for any API errors
- Verify Google Drive API is enabled in Google Cloud Console
- Ensure stable internet connection for Drive API calls

### Styling issues
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check browser console for any CSS errors

## Advantages of This Architecture

- ✅ **No server secrets to manage or secure**
- ✅ **Simpler deployment** - just set one environment variable
- ✅ **Better privacy** - authentication happens directly between user and Google
- ✅ **More secure** - no server-side token storage
- ✅ **Works on any static hosting** - no server required
- ✅ **Faster authentication** - no server roundtrips
- ✅ **Complete data ownership** - your data stays in your Google Drive

## Contributing

This is a personal journalling tool. Fork and adapt for your own needs!

## License

MIT License - feel free to use this code for your own projects!

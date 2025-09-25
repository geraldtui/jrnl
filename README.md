# jrnl — Minimal Immutable Journalling

jrnl is a minimalist personal journalling app for immutable entries. Capture brief thoughts, reflections, or notes with optional ratings and tags. Entries are append-only: once saved, they cannot be edited or deleted.

## Features

- **Fast entry**: Quickly capture title, context, date, rating, and tags
- **Immutable by design**: Entries cannot be edited or deleted
- **Reflection fields**: Optional prompts to capture learnings
- **Insights**: View trends and simple analytics over time
- **Private by default**: Stored locally in your browser
- **Dark UI**: Clean dark theme with subtle purple accents
- **Responsive**: Works on desktop and mobile

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- A modern web browser

## Installation

1. **Clone or download the project files**
   \`\`\`bash
   # If using git
   git clone <repository-url>
   cd jrnl-app

   # Or extract the downloaded ZIP file and navigate to the folder
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

## Development

1. **Start the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

3. **Start journaling!**
   - Use the rich text editor to write and add journal entries
   - View your entry history in the "History" tab
   - Rate your entries and add tags for organization
   - Check the "Insights" tab to see patterns and trends over time

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

## Data Storage

All data is stored locally in your browser's localStorage under the key `jrnl-entries`.
- ✅ Private by default
- ✅ No account or server
- ✅ Works offline after first load
- ⚠️ Tied to your current browser/device
- ⚠️ Clearing site data will remove entries

## Customization

The app uses a dark theme with purple highlights. You can customize colors in `app/globals.css`:

\`\`\`css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 263.4 70% 50.4%;
  /* ... other color variables */
}
\`\`\`

## Building for Production

To create a production build:

\`\`\`bash
npm run build
# or
yarn build
\`\`\`

The built files will be in `.next` and can be deployed anywhere that supports Next.js.

## Troubleshooting

### Dev server won't start
- Ensure Node.js version 18+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check that port 3000 is not already in use

### Data not persisting
- Ensure localStorage is enabled in your browser
- Check that you're not in private/incognito mode
- Verify browser storage isn't full

### Styling issues
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check browser console for any CSS errors

## Contributing

This is a personal journalling tool. Fork and adapt for your needs.

## License

This project is open source and available under the MIT License.

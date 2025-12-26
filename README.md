<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>Built with AI Studio</h1>
  <p>The fastest path from prompt to production with Gemini.</p>
  <a href="https://aistudio.google.com/apps">Start building</a>
</div>

## Deployment Instructions

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Building for Production

1. Create a production build:
```bash
npm run build
```

This will generate optimized files in the `dist` directory.

2. Preview the production build locally:
```bash
npm run preview
```

### Deployment Options

#### Vercel (Recommended)
1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com/) and create a new project
3. Import your repository
4. Vercel will automatically detect the Vite configuration and deploy your app

#### Netlify
1. Push your code to a GitHub repository
2. Go to [Netlify](https://netlify.com/) and create a new site
3. Connect your GitHub repository
4. Set the build command to `npm run build`
5. Set the publish directory to `dist`

#### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Upload the contents of the `dist` folder to your web server

### Environment Variables
If your app requires environment variables, create a `.env` file in the root directory:
```bash
# Example environment variables
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
```

Note: Variables prefixed with `VITE_` will be embedded in the client-side bundle.

### Troubleshooting

1. **Build fails**: Ensure all dependencies are installed with `npm install`
2. **Blank page after deployment**: Check that the `base` property in `vite.config.ts` matches your deployment path
3. **Routing issues**: For client-side routing, ensure your server is configured to fallback to `index.html`

### Project Structure
```
.
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── assets/         # Static assets
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── dist/               # Production build (generated)
├── node_modules/       # Dependencies (generated)
├── index.html          # Main HTML file
├── package.json        # Project dependencies and scripts
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
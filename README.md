# Forest Team

> A Progressive Web App for orienteering event officials to manage events, view georeferenced maps, and track GPS locations - even offline in remote forest locations.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](./TESTING.md)
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Features

### 📍 **GPS Tracking**
- High-accuracy GPS positioning (5-10m typical)
- Real-time position marker with accuracy circle
- Visual accuracy warnings (>50m threshold)
- Works offline - no network required
- Auto-centering on first fix

### 🗺️ **Map Support**
- Georeferenced JPEG maps with world files (.jgw)
- KMZ file support with embedded georeferencing
- Zoom and pan with touch gestures
- Accurate coordinate transformations
- Works with 1:15,000 orienteering maps

### 🎯 **Course Visualization**
- IOF-standard control symbols (circles, triangles, double circles)
- Multiple course overlay with distinct colors
- Auto-scaling line widths (0.35mm at 1:15,000)
- Start triangles rotate toward first control
- Interactive control popups with course information

### 📱 **Progressive Web App**
- Install to home screen (iOS/Android)
- Works completely offline
- Auto-updates when online
- Fast loading with code splitting
- 100MB+ storage capacity

### 🎨 **Outdoor-Friendly UI**
- High contrast colors for sunlight visibility
- Large touch targets (44x44 points)
- Minimal battery usage
- Works with gloves
- WCAG AA accessible

## Quick Start

### Installation

1. **Visit the app** in your mobile browser
2. **Add to Home Screen** when prompted
3. **Upload your first event**:
   - Map file (JPEG + .jgw or KMZ)
   - Course file (IOF XML from Condes or Purple Pen)
4. **View your map** with courses and GPS tracking

### Requirements

- **iOS**: Safari 13+ (iOS 13+)
- **Android**: Chrome 80+
- **Desktop**: Chrome, Firefox, or Edge (for testing)

### Supported File Formats

**Map Files:**
- JPEG + World File (`.jpg` + `.jgw`)
- KMZ (`.kmz`) with embedded KML and image

**Course Files:**
- IOF XML v3 (`.xml`) - exported from Condes or Purple Pen

## Usage Guide

### Uploading an Event

1. Navigate to **Upload** from the home page
2. Enter event name and date
3. Select map file:
   - **Option A**: Upload JPEG image and .jgw world file
   - **Option B**: Upload KMZ file
4. Select IOF XML course file
5. Click **Create Event**

The app will process your files and create a new event stored locally on your device.

### Viewing the Map

1. Select your event from the **Events** page
2. Use pinch-to-zoom and drag-to-pan to navigate
3. Toggle courses on/off using the course selector
4. Click controls to see which courses visit them
5. Enable GPS tracking with the GPS button (top-right)

### GPS Tracking

1. Click the **GPS toggle button** (top-right)
2. Grant location permissions when prompted
3. Your position appears as a blue circle
4. The accuracy circle shows GPS precision
5. Yellow/red warnings appear if accuracy >50m

**Note:** GPS works offline - it uses your device's GPS chip, not network location.

### Managing Events

- **View all events**: Click "View Events" from home
- **Share an event URL**: Click "Share" to copy the URL (Note: Recipient must upload the same files)
- **Delete an event**: Click "Delete" (with confirmation)
- **Storage usage**: Shown at the top of the events page

**Important:** Event data is stored locally on your device. "Sharing" a URL only works if the recipient has uploaded the same map and course files to their own device.

## Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/davidcurrie/forest-team.git
cd forest-team

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally

# Testing
npm test             # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── app/                    # Application shell
│   ├── App.tsx            # Home page
│   ├── Layout.tsx         # Root layout with PWA components
│   └── routes.tsx         # Route configuration
│
├── features/              # Feature modules
│   ├── map/              # Map display and navigation
│   ├── course/           # Course visualization
│   ├── gps/              # GPS tracking
│   ├── events/           # Event management
│   └── upload/           # File upload and processing
│
├── shared/               # Shared utilities
│   ├── components/       # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript types
│
├── store/               # State management (Zustand)
├── db/                  # IndexedDB (Dexie)
└── test/                # Test setup
```

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js
- **Storage**: IndexedDB (Dexie.js)
- **State**: Zustand
- **PWA**: Workbox (via vite-plugin-pwa)
- **Testing**: Vitest + React Testing Library

## Architecture

### Key Design Decisions

**Offline-First Architecture**
- All data stored in IndexedDB
- Service Worker caches app shell and assets
- GPS works without network (uses device GPS chip)
- No backend required

**Progressive Enhancement**
- Core functionality works without JavaScript
- Enhanced features for modern browsers
- Graceful degradation for older devices

**Performance Optimization**
- Route-based code splitting
- Lazy loading for heavy components
- Efficient rendering with React
- Minimal re-renders with proper state management

### Data Flow

```
User Action
    ↓
React Component
    ↓
Service/Hook
    ↓
IndexedDB (Dexie)
    ↓
Update UI
```

### Coordinate Systems

The app handles multiple coordinate reference systems:

- **WGS84** (lat/lng) - GPS and KMZ files
- **Projected coordinates** - Some world files (requires .prj file)
- **Web Mercator** - Map rendering

See [courseRenderer.ts](./src/features/course/services/courseRenderer.ts) for coordinate transformation logic.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

1. Update `vite.config.ts` with your base path:
   ```typescript
   export default defineConfig({
     base: '/forest-team/',
     // ...
   })
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Push dist/ folder to gh-pages branch
   ```

### Environment Variables

No environment variables required - the app is fully client-side.

### HTTPS Requirement

PWAs require HTTPS in production. All deployment platforms (Vercel, Netlify, GitHub Pages) provide HTTPS by default.

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| iOS Safari | 13+ | ✅ Full support |
| Android Chrome | 80+ | ✅ Full support |
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |
| IE 11 | - | ❌ Not supported |

## Performance

- **Load time**: <2.5s on 3G
- **Map rendering**: 60fps on modern devices
- **GPS updates**: 1-5 second intervals
- **Bundle size**: 656KB total (split into chunks)
- **Storage**: Up to 100MB+ per device

## Accessibility

- ✅ **WCAG AA** compliant
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ High contrast mode
- ✅ Touch target compliance (44x44px)
- ✅ Works with gloves

## Security

- **No backend** - All data stored locally on device
- **No authentication** - Single-user device-local storage
- **HTTPS only** - Required for PWA features
- **No tracking** - No analytics or external services
- **Privacy-first** - Your events never leave your device

## Troubleshooting

### GPS not working
- Check location permissions in browser settings
- Ensure you're not in Airplane Mode
- GPS may be less accurate indoors or in dense forest

### Map not displaying
- Verify world file has correct georeferencing
- Check console for errors
- Ensure map file is <20MB

### App not installing
- HTTPS is required (works automatically on deployment)
- Check browser compatibility
- Try adding to home screen manually

### Offline mode not working
- Ensure service worker is registered (check DevTools)
- Clear cache and reload if updating from old version
- Service worker requires HTTPS

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

```bash
# Run tests
npm test

# Coverage report
npm run test:coverage
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- **IOF** - International Orienteering Federation for XML format standards
- **Condes** - Course design software
- **Purple Pen** - Course design software
- **Leaflet.js** - Amazing mapping library
- **React** - UI framework
- **Vite** - Build tool

## Support

For issues, questions, or suggestions:
- 📧 Email: support@forestteam.app
- 🐛 Issues: [GitHub Issues](https://github.com/davidcurrie/forest-team/issues)
- 📖 Docs: [User Guide](./docs/USER_GUIDE.md)

## Roadmap

### Planned Features
- [ ] Route recording and playback
- [ ] Multiple event comparison
- [ ] Export to PDF
- [ ] Live event tracking
- [ ] Course statistics
- [ ] True event sharing (via backend or file export)

### Known Limitations
- **Sharing limitation**: "Share" only copies a URL - recipients must upload the same files separately (no data transfer)
- Projected coordinates require .prj file
- GPS accuracy varies (5-10m typical, can be >50m in dense forest)
- Map files limited by browser storage (~100MB+)
- No backend sync (device-local only)

---

Made with ❤️ for orienteering officials working in the forest

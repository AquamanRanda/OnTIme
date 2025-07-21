# Ontime Timer Dashboard

A modern, real-time dashboard for controlling and monitoring [Ontime](https://getontime.no) event timers and rundown management. Built with Next.js, TypeScript, and Tailwind CSS.

![Ontime Dashboard Preview](https://placehold.co/800x500/1f2937/white?text=Ontime+Dashboard)

## 🎯 Features

### ⏱️ Real-Time Timer Display
- **Live timer updates** via WebSocket connection
- **Progress visualization** with color-coded warnings
- **Multiple time formats** (elapsed, remaining, duration)
- **Timer state indicators** (running, paused, stopped)
- **Current and next event preview**

### 🎬 Rundown Management
- **Complete event list** with real-time status updates
- **Event status tracking** (upcoming, active, completed, skipped)
- **Custom fields display and editing** for all event properties
- **Visual event cards** with color-coded status indicators
- **Individual event controls** (start, visibility toggle)

### 🎮 Playback Control
- **Full transport controls** (play, pause, stop, previous, next)
- **Time adjustment tools** (add/subtract time)
- **Quick time buttons** (±10s, ±1min, ±5min)
- **Manual time input** for precise adjustments
- **Event reload and roll mode support**

### 🔌 Connection Management
- **Dual connectivity** (HTTP API + WebSocket)
- **Auto-reconnection** for dropped WebSocket connections
- **Connection status indicators** with fallback modes
- **Error handling** with user-friendly messages
- **Health monitoring** of Ontime server

### 🎨 Modern UI/UX
- **Dark theme** optimized for production environments
- **Responsive design** for various screen sizes
- **Real-time visual feedback** for all interactions
- **Intuitive control layout** for professional use
- **Accessibility features** with proper ARIA labels

## 🚀 Getting Started

### Prerequisites

1. **Ontime Server** running on `ontime.alpha.theesports.club`
2. **Node.js** (version 18 or higher)
3. **npm** or **yarn** package manager

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ontime-dashboard
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file to customize your Ontime server connection:

```bash
# Ontime server URL (default: https://ontime.alpha.theesports.club)
NEXT_PUBLIC_ONTIME_URL=https://ontime.alpha.theesports.club

# WebSocket URL (auto-generated from HTTP URL)
NEXT_PUBLIC_ONTIME_WS_URL=wss://ontime.alpha.theesports.club/ws

# Update intervals in milliseconds
NEXT_PUBLIC_TIMER_UPDATE_INTERVAL=100
NEXT_PUBLIC_DATA_REFRESH_INTERVAL=5000
```

### Server Configuration

The dashboard expects Ontime to be running with:
- **HTTP API enabled** (usually port 4001)
- **WebSocket enabled** in integration settings
- **CORS configured** if running on different domains

## 📡 API Integration

### Ontime API Endpoints Used

#### Project Data (HTTP)
```
GET /data/project     - Project settings and custom fields
GET /data/rundown     - Event list and properties
GET /data/runtime     - Current playback state
```

#### Playback Control (HTTP)
```
POST /playback/start           - Start current/loaded event
POST /playback/start-next      - Start next event
POST /playback/start-previous  - Start previous event
POST /playback/pause           - Pause playback
POST /playback/stop            - Stop playback
POST /playback/reload          - Reload current event
POST /playback/addtime         - Add time to running event
POST /playback/removetime      - Remove time from running event
```

#### Event Management (HTTP)
```
PATCH /events/{id}                    - Update event properties
PATCH /events/{id}/custom/{field}     - Update custom field values
```

#### Real-Time Updates (WebSocket)
```
wss://ontime.alpha.theesports.club/ws

Messages:
- ontime-poll          - Request full runtime state
- runtime             - Runtime data updates
- playback            - Playback state changes
- timer               - Timer updates
```

### Event Data Structure

Events contain comprehensive information:

```typescript
interface OntimeEvent {
  id: string;                    // Unique event identifier
  title: string;                 // Event title
  note?: string;                 // Optional note/description
  cue: string;                   // Cue number (max 8 chars)
  isPublic: boolean;             // Public visibility
  skip: boolean;                 // Skip flag
  colour?: string;               // Color (hex or CSS name)
  timeWarning?: number;          // Warning time (seconds)
  timeDanger?: number;           // Danger time (seconds)
  endAction: string;             // End action behavior
  timerType: string;             // Timer type
  duration?: number;             // Duration (seconds)
  timeStart?: number;            // Start time (seconds)
  timeEnd?: number;              // End time (seconds)
  custom?: Record<string, string>; // Custom fields
}
```

### Custom Fields

The dashboard automatically detects and displays all custom fields defined in your Ontime project:

- **Text fields** - Editable text inputs
- **Number fields** - Numeric inputs
- **Boolean fields** - Toggle switches
- **Option fields** - Dropdown selects

Custom fields are editable directly in the event cards with inline editing and auto-save functionality.

## 🏗️ Architecture

### Project Structure

```
src/
├── components/          # React components
│   ├── TimerDisplay.tsx    # Main timer component
│   ├── EventCard.tsx      # Event display and editing
│   └── ControlPanel.tsx   # Playback controls
├── hooks/              # React hooks
│   └── useOntime.ts       # Ontime API hooks
├── lib/                # Utilities and API
│   └── ontime-api.ts      # API client
├── types/              # TypeScript definitions
│   └── ontime.ts          # Ontime data types
└── app/                # Next.js app directory
    └── page.tsx           # Main dashboard page
```

### Data Flow

1. **Initial Load**: HTTP requests fetch project data and rundown
2. **WebSocket Connection**: Establishes real-time connection
3. **State Management**: TanStack Query manages caching and updates
4. **Real-Time Updates**: WebSocket messages update runtime data
5. **User Actions**: Control commands sent via HTTP API
6. **Auto-Reconnection**: Handles connection drops gracefully

### State Management

- **TanStack Query** for server state and caching
- **React hooks** for local component state
- **WebSocket integration** for real-time updates
- **Optimistic updates** for responsive UI

## 🔌 WebSocket vs HTTP

### WebSocket (Preferred)
- **Real-time updates** (< 100ms latency)
- **Efficient bandwidth** usage
- **Auto-reconnection** support
- **Bi-directional** communication

### HTTP Fallback
- **Polling-based** updates (1-second intervals)
- **Higher latency** but more reliable
- **Works through firewalls** and proxies
- **Automatic fallback** when WebSocket fails

## 🐛 Troubleshooting

### Common Issues

#### "Cannot Connect to Ontime"
- ✅ Ensure Ontime is running
- ✅ Check server is on `ontime.alpha.theesports.club`
- ✅ Verify API is enabled in Ontime settings
- ✅ Check firewall/antivirus blocking

#### WebSocket Connection Failed
- ✅ Enable WebSocket in Ontime integration settings
- ✅ Check browser developer tools for errors
- ✅ Verify server is accessible
- ✅ Try HTTP-only mode as fallback

#### Events Not Updating
- ✅ Check WebSocket connection status
- ✅ Verify Ontime project has events
- ✅ Check browser network tab for API errors
- ✅ Try refreshing the page

#### Custom Fields Not Showing
- ✅ Create custom fields in Ontime editor
- ✅ Ensure fields have proper labels
- ✅ Check project data is loading correctly
- ✅ Verify field permissions in Ontime

### Debug Mode

Enable debug logging by adding to console:
```javascript
localStorage.setItem('ontime-dashboard-debug', 'true');
```

## 🚀 Development

### Adding New Features

1. **API Integration**: Add new endpoints to `ontime-api.ts`
2. **Data Types**: Define TypeScript interfaces in `types/ontime.ts`
3. **React Hooks**: Create hooks in `hooks/useOntime.ts`
4. **Components**: Build UI components with proper TypeScript
5. **Styling**: Use Tailwind CSS for consistent design

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **React hooks** for state management
- **Error boundaries** for graceful failures

### Testing

```bash
npm run test        # Run unit tests
npm run test:watch  # Watch mode
npm run lint        # ESLint check
npm run type-check  # TypeScript check
```

## 📝 API Documentation

### Complete API Reference

For detailed API documentation, see the [Ontime API docs](https://docs.getontime.no/api).

### Implementation Choices

1. **HTTP over OSC**: HTTP provides better web integration and error handling
2. **WebSocket for real-time**: Low latency updates essential for timer accuracy
3. **TanStack Query**: Robust caching and state management
4. **Component-based**: Modular design for maintainability
5. **TypeScript**: Type safety prevents runtime errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Ontime](https://getontime.no) - Professional event timer software
- [Next.js](https://nextjs.org) - React framework
- [TanStack Query](https://tanstack.com/query) - Data fetching library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Lucide React](https://lucide.dev) - Beautiful icons

---

**Built with ❤️ for the live production community**

For support, documentation, or feature requests, please visit the [Ontime community](https://github.com/cpvalente/ontime).

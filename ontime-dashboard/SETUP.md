# Quick Setup Guide

## Prerequisites
- **Node.js 18+** installed
- **Ontime Server** running on `ontime.alpha.theesports.club`

## Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### 3. Ontime Configuration
In Ontime application:
1. Go to `Editor` → `Settings` → `Integrations`
2. Enable **HTTP API** (should be on by default)
3. Enable **WebSocket** for real-time updates
4. Ensure server is running on port **4001**

### 4. Verify Connection
- Dashboard should show "Connected" status in header
- Green connection indicator means full functionality
- Yellow means HTTP-only (no real-time updates)
- Red means no connection

## 🎯 Features Overview

### Timer Display
- **Real-time countdown** with progress bar
- **Color-coded warnings** (yellow/red for time remaining)
- **Current and next event** preview
- **Multiple time formats** (elapsed, remaining, total)

### Event Management
- **Complete rundown** with status indicators
- **Custom fields** editing (inline)
- **Event controls** (start, visibility toggle)
- **Status tracking** (upcoming/active/completed/skipped)

### Playback Control
- **Transport controls** (play, pause, stop, next, previous)
- **Time adjustment** (±10s, ±1min, ±5min buttons)
- **Manual time input** for precise adjustments
- **Event reload** and system controls

### Real-Time Updates
- **WebSocket connection** for <100ms latency
- **Automatic reconnection** if connection drops
- **HTTP fallback** if WebSocket fails
- **Connection status monitoring**

## 🔧 Configuration

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_ONTIME_URL=https://ontime.alpha.theesports.club
NEXT_PUBLIC_ONTIME_WS_URL=wss://ontime.alpha.theesports.club/ws
```

### Custom Ontime Server
If running Ontime on different host/port:
```env
NEXT_PUBLIC_ONTIME_URL=https://your-server.com:4001
NEXT_PUBLIC_ONTIME_WS_URL=wss://your-server.com:4001/ws
```

## 📱 Usage

### Basic Workflow
1. **Load Project**: Dashboard automatically loads your Ontime project
2. **Monitor Timer**: Main display shows current running event
3. **Control Playback**: Use transport controls to start/stop/pause
4. **Adjust Time**: Add/subtract time from running events
5. **Edit Fields**: Click edit icons to modify custom fields
6. **Navigate Events**: Start specific events from the rundown list

### Keyboard Shortcuts
- `Space`: Start/Stop (when dashboard focused)
- `N`: Next event
- `P`: Previous event
- `R`: Reload current event

## 🐛 Troubleshooting

### Connection Issues
1. **Check Ontime is running** on correct port
2. **Verify API enabled** in Ontime settings  
3. **Check firewall/antivirus** blocking connection
4. **Try different browser** or incognito mode

### No Events Showing
1. **Create events** in Ontime editor
2. **Refresh dashboard** (F5)
3. **Check project loaded** in Ontime
4. **Verify rundown not empty**

### WebSocket Not Connecting
1. **Enable WebSocket** in Ontime integration settings
2. **Check browser console** for errors
3. **Try HTTP-only mode** (dashboard still works)
4. **Restart Ontime** application

### Custom Fields Missing
1. **Create custom fields** in Ontime project settings
2. **Give fields proper labels** 
3. **Refresh project data** in dashboard
4. **Check field permissions** in Ontime

## 🚀 Production Build

```bash
# Build for production
npm run build

# Start production server  
npm start

# Or deploy to Vercel/Netlify/etc.
```

## 📞 Support

For issues:
- Check **browser console** for errors
- Enable **debug mode** in dashboard settings
- Review **Ontime logs** in application
- Visit [Ontime Community](https://github.com/cpvalente/ontime)

---

**Ready to go! 🎬** Your dashboard should now be connected to Ontime and showing real-time timer information. 
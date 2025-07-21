# 🔴 Real-Time Integration with Ontime

This document explains how the dashboard connects to your Ontime server for real-time updates and custom field display.

## 📡 API Endpoints

### HTTP API (Data Fetching)
- **Base URL**: `https://ontime.alpha.theesports.club`
- **Normalized Rundown**: `/data/rundown/normalised` - Gets events with custom fields
- **Runtime Data**: `/data/runtime` - Gets current state (fallback)
- **Playback Control**: `/playback/*` - Start/stop/control commands

### WebSocket API (Real-Time Updates)  
- **WebSocket URL**: `wss://ontime.alpha.theesports.club/ws`
- **Purpose**: Live timer updates, playback state changes
- **Update Frequency**: ~100ms for timer, instant for state changes

## 🎛️ Your Current Data Structure

Based on your live API data:

```json
{
  "rundown": {
    "421b5a": {
      "title": "1",
      "duration": 600000,
      "timerType": "count-down",
      "custom": {
        "Image_Test": "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      }
    },
    "21313f": {
      "title": "next",
      "custom": {
        "Image_Test": "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      }
    },
    "146dc4": {
      "title": "next bro",
      "custom": {
        "Image_Test": "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      }
    }
  },
  "order": ["421b5a", "21313f", "146dc4"]
}
```

## 🖼️ Custom Field Image Display

Your "Image_Test" custom field contains a beautiful landscape image that will display as:

- **Dashboard View**: Smaller preview with click-to-enlarge
- **Presentation View**: Large, prominent display (max-h-64)
- **Real-time Updates**: Images update when you change custom field values

## ⚡ Real-Time Features

### Timer Display
```
Current Time: 9:50 (live countdown)
Progress Bar: Visual representation with color coding
Status: Green → Yellow (5min) → Red (1min) → Overtime
```

### Connection Status
- **LIVE** (green, pulsing): WebSocket connected, receiving updates
- **OFFLINE** (red): Connection lost, using fallback data
- **Auto-reconnect**: Attempts reconnection every 5 seconds

### Playback States
- **LIVE** (red): Timer actively running
- **PAUSED** (yellow): Timer paused
- **STOPPED** (gray): No active timer
- **ROLL** (blue): Pre-roll mode

## 🚀 Usage

### Main Dashboard
```bash
http://localhost:3000
```
- Full control interface
- Event management
- Custom field editing
- Connection status

### Presentation View
```bash
http://localhost:3000/presentation
```
- Full-screen timer display
- Large custom field images
- Professional broadcast layout
- Real-time updates

## 🔧 Environment Configuration

Your `.env` file is configured for:
```env
NEXT_PUBLIC_ONTIME_URL=https://ontime.alpha.theesports.club
NEXT_PUBLIC_ONTIME_WS_URL=wss://ontime.alpha.theesports.club/ws
```

## 📊 Debug Information

In development mode, you'll see:
- Console logs for WebSocket connections
- Timer update notifications  
- Debug panel in presentation view
- Connection status indicators

## 🎯 Key Benefits

1. **Real-Time**: Timer updates every ~100ms via WebSocket
2. **Reliable**: HTTP fallback if WebSocket disconnects
3. **Visual**: Large image display for custom fields
4. **Professional**: Broadcast-ready presentation layout
5. **Responsive**: Automatic reconnection and error handling

Perfect for live events, broadcasts, and professional presentations! 🎬✨ 
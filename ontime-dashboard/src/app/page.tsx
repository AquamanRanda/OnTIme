'use client';

/**
 * Main Dashboard Page
 * Ontime Timer Dashboard with real-time updates
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { 
  useEventsWithStatus, 
  useProjectData,
  useConnectionStatus,
  useCustomFields
} from '../hooks/useOntime';
import { Loader2, Calendar, Settings2, AlertTriangle, Monitor } from 'lucide-react';

// Dynamic imports to prevent hydration issues
const TimerDisplay = dynamic(() => import('../components/TimerDisplay').then(mod => ({ default: mod.TimerDisplay })), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-400 animate-pulse">
      <div className="h-32 bg-gray-800 rounded"></div>
    </div>
  ),
});

const ControlPanel = dynamic(() => import('../components/ControlPanel').then(mod => ({ default: mod.ControlPanel })), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
      <div className="h-48 bg-gray-700 rounded"></div>
    </div>
  ),
});

const EventCard = dynamic(() => import('../components/EventCard').then(mod => ({ default: mod.EventCard })), {
  ssr: false,
});

const ConnectionStatus = dynamic(() => import('../components/ConnectionStatus').then(mod => ({ default: mod.ConnectionStatus })), {
  ssr: false,
});

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function DashboardContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const eventsWithStatus = useEventsWithStatus();
  const customFields = useCustomFields(); // Get custom fields from rundown
  const { data: projectData, isLoading: projectLoading, error: projectError } = useProjectData();
  const { isFullyConnected } = useConnectionStatus();

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug custom fields data
  useEffect(() => {
    if (customFields && customFields.length > 0) {
      console.log('🎯 Dashboard received custom fields from rundown:', {
        customFields,
        customFieldsCount: customFields.length,
        eventsWithStatus: eventsWithStatus.length
      });
    }
  }, [customFields, eventsWithStatus]);

  // Show loading state
  if (projectLoading || !isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading Ontime project data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure Ontime is running on ontime.alpha.theesports.club
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (projectError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Cannot Connect to Ontime
          </h2>
          <p className="text-gray-300 mb-4">
            Failed to connect to the Ontime server. Please check:
          </p>
          <ul className="text-sm text-gray-400 text-left space-y-1 mb-6">
            <li>• Ontime is running</li>
            <li>• Server is accessible at ontime.alpha.theesports.club</li>
            <li>• No firewall blocking the connection</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Safe defaults for project data
  const safeProjectData = projectData || {
    title: 'Ontime Dashboard',
    customFields: [],
    settings: {
      app: 'ontime',
      version: 'Unknown',
      serverPort: 4001,
      timeFormat: '24' as const,
      language: 'en'
    },
    rundown: []
  };

  // Safe array for events
  const safeEventsWithStatus = Array.isArray(eventsWithStatus) ? eventsWithStatus : [];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Ontime Dashboard
              </h1>
              <p className="text-sm text-gray-400">
                {safeProjectData.title || 'Timer Control & Rundown Management'}
              </p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Presentation View Button */}
            <button
              onClick={() => window.open('/presentation', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              title="Open Presentation View"
            >
              <Monitor className="w-4 h-4" />
              <span>Presentation</span>
            </button>

            {/* Connection Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isClient && isFullyConnected 
                ? 'bg-green-900/30 text-green-400' 
                : 'bg-red-900/30 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isClient && isFullyConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isClient && isFullyConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Project Info */}
        <div className="mt-3 text-sm text-gray-400">
          <span>Events: {safeEventsWithStatus.length}</span>
          {customFields && customFields.length > 0 && (
            <span className="ml-4">
              Custom Fields: {customFields.length}
            </span>
          )}
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="max-w-4xl">
            <h3 className="text-lg font-medium text-white mb-3">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Server:</span>
                <span className="ml-2 text-white">ontime.alpha.theesports.club</span>
              </div>
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="ml-2 text-white">{safeProjectData.settings?.version || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Time Format:</span>
                <span className="ml-2 text-white">
                  {safeProjectData.settings?.timeFormat === '12' ? '12-hour' : '24-hour'}
                </span>
              </div>
              {safeProjectData.publicUrl && (
                <div>
                  <span className="text-gray-400">Public URL:</span>
                  <span className="ml-2 text-blue-400">{safeProjectData.publicUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Timer & Controls */}
          <div className="xl:col-span-4 space-y-6">
            {/* Main Timer Display */}
            <TimerDisplay />
            
            {/* Control Panel */}
            <ControlPanel />
          </div>

          {/* Right Column - Events List */}
          <div className="xl:col-span-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Rundown Events
                </h2>
                <div className="text-sm text-gray-400">
                  {safeEventsWithStatus.length} events
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-4 max-h-screen overflow-y-auto">
                {safeEventsWithStatus.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No events in rundown</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Add events in the Ontime editor to see them here
                    </p>
                  </div>
                ) : (
                  safeEventsWithStatus.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      customFields={customFields} // Use custom fields from rundown
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Ontime Dashboard - Real-time timer control and rundown management
          </p>
          <p className="mt-1">
            Connect to your Ontime server at{' '}
            <code className="bg-gray-800 px-2 py-1 rounded">ontime.alpha.theesports.club</code>
          </p>
        </footer>
      </main>

      {/* Connection Status Debug Widget */}
      {isClient && <ConnectionStatus />}
    </div>
  );
}

export default function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

/**
 * Presentation View Component
 * Full-screen timer display with custom fields and images
 */

import React, { useState, useEffect } from 'react';
import { useWebSocketConnection, useCurrentAndNextEvents, useEventsWithStatus, useCustomFields } from '../hooks/useOntime';
import { OntimeAPI } from '../lib/ontime-api';
import { EventWithStatus, CustomField } from '../types/ontime';

interface PresentationViewProps {
  className?: string;
}

export function PresentationView({ className = '' }: PresentationViewProps) {
  const [isClient, setIsClient] = useState(false);
  const { runtimeData, isConnected } = useWebSocketConnection();
  const { currentEvent, nextEvent } = useCurrentAndNextEvents();
  const eventsWithStatus = useEventsWithStatus();
  const customFields = useCustomFields();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging for real-time data updates
  useEffect(() => {
    if (runtimeData?.timer) {
      console.log('⏱️ Timer update received:', {
        current: runtimeData.timer.current,
        duration: runtimeData.timer.duration,
        isRunning: runtimeData.timer.current > 0,
        timeRemaining: runtimeData.timer.duration - runtimeData.timer.current
      });
    }
  }, [runtimeData?.timer?.current]);

  useEffect(() => {
    console.log('🔗 WebSocket connection status:', {
      isConnected,
      hasRuntimeData: !!runtimeData,
      hasTimer: !!runtimeData?.timer,
      hasPlayback: !!runtimeData?.playback
    });
  }, [isConnected, runtimeData]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-4xl">Loading...</div>
      </div>
    );
  }

  const timer = runtimeData?.timer;
  const playback = runtimeData?.playback;

  // Find current and next events with full data
  const currentEventData = eventsWithStatus.find(e => e.id === currentEvent?.id);
  const nextEventData = eventsWithStatus.find(e => e.id === nextEvent?.id);

  // Format time display
  const formatTimeDisplay = (ms: number): string => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const sign = ms < 0 ? '-' : '';
    return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const timeRemaining = timer?.current && timer?.duration ? 
    timer.duration - timer.current : 0;
  
  const displayTime = timeRemaining > 0 ? formatTimeDisplay(timeRemaining) : "0:00";

  // Check if a custom field value is an image URL
  const isImageUrl = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    const imageHosts = /(images\.unsplash\.com|imgur\.com|cloudinary\.com|amazonaws\.com.*\.(jpg|jpeg|png|gif|webp))/i;
    return imageExtensions.test(value) || imageHosts.test(value) || value.startsWith('data:image/');
  };

  // Render custom fields for an event
  const renderEventCustomFields = (event: EventWithStatus | null, label: string) => {
    if (!event || !event.custom) return null;

    const eventCustomFields = customFields.filter(field => 
      event.custom && event.custom[field.id]
    );

    if (eventCustomFields.length === 0) return null;

    return (
      <div className="space-y-4">
        {eventCustomFields.map(field => {
          const value = event.custom![field.id];
          if (!value) return null;

          return (
            <div key={field.id} className="text-center">
              <div className="text-lg font-medium text-gray-300 mb-2">
                {field.label}
              </div>
              
              {isImageUrl(value) ? (
                <div className="flex justify-center">
                  <img
                    src={value}
                    alt={field.label}
                    className="max-w-full max-h-64 object-contain rounded-lg shadow-2xl border-4 border-gray-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="text-2xl text-white font-medium bg-gray-800 rounded-lg p-4">
                  {value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (!timer?.current || !timer?.duration) return 'text-gray-300';
    
    const remaining = timer.duration - timer.current;
    const warningTime = currentEventData?.timeWarning ? currentEventData.timeWarning * 1000 : 300000; // 5 min
    const dangerTime = currentEventData?.timeDanger ? currentEventData.timeDanger * 1000 : 60000; // 1 min
    
    if (remaining <= dangerTime) return 'text-red-400';
    if (remaining <= warningTime) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get playback state indicator
  const getPlaybackIndicator = () => {
    switch (playback?.state) {
      case 'start': return { text: 'LIVE', color: 'bg-red-600', pulse: true };
      case 'pause': return { text: 'PAUSED', color: 'bg-yellow-600', pulse: false };
      case 'roll': return { text: 'ROLL', color: 'bg-blue-600', pulse: false };
      default: return { text: 'STOPPED', color: 'bg-gray-600', pulse: false };
    }
  };

  const playbackStatus = getPlaybackIndicator();

  return (
    <div className={`min-h-screen bg-black text-white flex flex-col ${className}`}>
      {/* Header with playback status */}
      <div className="flex justify-between items-center p-8">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            TIME NOW
          </div>
          {/* Real-time connection indicator */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${playbackStatus.color} ${
          playbackStatus.pulse ? 'animate-pulse' : ''
        }`}>
          {playbackStatus.text}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {new Date().toLocaleTimeString()}
          </div>
          {/* Timer status indicator */}
          {timer && (
            <div className="text-xs text-gray-500">
              {timer.current > 0 ? '⏱️ RUNNING' : '⏸️ STOPPED'}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Current Event */}
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-r border-gray-800">
          <div className="text-center space-y-8 w-full max-w-2xl">
            {/* Current Event Title */}
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {currentEventData?.title || 'No Event'}
              </div>
              {currentEventData?.cue && (
                <div className="text-xl text-gray-400">
                  Cue: {currentEventData.cue}
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="space-y-4">
              <div className={`text-9xl font-bold font-mono ${getTimerColor()}`}>
                {displayTime}
              </div>
              
              {/* Progress Bar */}
              {timer?.duration && (
                <div className="w-full bg-gray-800 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-300 ${
                      timeRemaining <= (currentEventData?.timeDanger || 60) * 1000 ? 'bg-red-500' : 
                      timeRemaining <= (currentEventData?.timeWarning || 300) * 1000 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (timeRemaining / timer.duration) * 100))}%` 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Current Event Custom Fields */}
            {renderEventCustomFields(currentEventData || null, 'NOW')}

            {/* NOW indicator */}
            <div className="text-red-400 text-2xl font-bold">
              NOW
            </div>
          </div>
        </div>

        {/* Right Side - Next Event */}
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="text-center space-y-8 w-full max-w-2xl">
            {/* Next Event Title */}
            <div>
              <div className="text-3xl font-bold text-gray-300 mb-2">
                {nextEventData?.title || 'No Next Event'}
              </div>
              {nextEventData?.cue && (
                <div className="text-lg text-gray-500">
                  Cue: {nextEventData.cue}
                </div>
              )}
            </div>

            {/* Next Event Duration */}
            {nextEventData?.duration && (
              <div className="text-4xl font-mono text-gray-400">
                {OntimeAPI.formatDuration(nextEventData.duration)}
              </div>
            )}

            {/* Next Event Custom Fields */}
            {renderEventCustomFields(nextEventData || null, 'NEXT')}

            {/* NEXT indicator */}
            <div className="text-gray-400 text-2xl font-bold">
              NEXT
            </div>
          </div>
        </div>
      </div>

      {/* Footer with additional info */}
      <div className="flex justify-between items-center p-8 text-sm text-gray-500 border-t border-gray-800">
        <div>
          {currentEventData?.timerType?.toUpperCase() || 'NO TIMER'}
        </div>
        <div>
          Events: {eventsWithStatus.length} | Custom Fields: {customFields.length}
        </div>
        <div>
          {playback?.selectedEventId ? `Event ID: ${playback.selectedEventId}` : 'No Selection'}
        </div>
      </div>

      {/* Debug Panel (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-400 max-w-sm opacity-75 hover:opacity-100 transition-opacity">
          <div className="font-bold text-white mb-2">Debug Info</div>
          <div>WS: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Timer: {timer?.current || 0}ms / {timer?.duration || 0}ms</div>
          <div>Playback: {playback?.state || 'stopped'}</div>
          <div>Current: {currentEventData?.title || 'None'}</div>
          <div>Next: {nextEventData?.title || 'None'}</div>
          <div>Custom Fields: {customFields.length}</div>
        </div>
      )}
    </div>
  );
}
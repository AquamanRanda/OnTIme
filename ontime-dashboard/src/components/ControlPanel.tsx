/**
 * Control Panel Component
 * Main playback controls and system status
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  RotateCcw,
  Wifi,
  WifiOff,
  Settings,
  AlertCircle
} from 'lucide-react';
import { 
  useStartEvent, 
  usePlaybackActions, 
  useTimeControl,
  useWebSocketConnection,
  useConnectionStatus
} from '../hooks/useOntime';

interface ControlPanelProps {
  className?: string;
}

export function ControlPanel({ className = '' }: ControlPanelProps) {
  const [timeInput, setTimeInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const { 
    start, 
    startNext, 
    startPrevious, 
    isLoading: startLoading 
  } = useStartEvent();
  
  const { 
    pause, 
    stop, 
    reload, 
    isLoading: actionLoading 
  } = usePlaybackActions();
  
  const { 
    addTime, 
    removeTime, 
    isLoading: timeLoading 
  } = useTimeControl();
  
  const { 
    runtimeData, 
    connectionError 
  } = useWebSocketConnection();
  
  const { 
    isOnline, 
    isWebSocketConnected, 
    isFullyConnected 
  } = useConnectionStatus();

  const isLoading = startLoading || actionLoading || timeLoading;
  const playbackState = runtimeData?.playback?.state;

  // Handle time adjustment
  const handleTimeAdjustment = (seconds: number) => {
    if (seconds > 0) {
      addTime(seconds);
    } else {
      removeTime(Math.abs(seconds));
    }
  };

  // Handle manual time input
  const handleTimeInput = () => {
    const seconds = parseInt(timeInput);
    if (!isNaN(seconds) && seconds !== 0) {
      handleTimeAdjustment(seconds);
      setTimeInput('');
    }
  };

  // Get connection status styling
  const getConnectionStatus = () => {
    if (isFullyConnected) {
      return {
        icon: <Wifi className="w-5 h-5 text-green-400" />,
        text: 'Connected',
        bg: 'bg-green-900/20',
        border: 'border-green-400'
      };
    } else if (isOnline && !isWebSocketConnected) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
        text: 'HTTP Only',
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-400'
      };
    } else {
      return {
        icon: <WifiOff className="w-5 h-5 text-red-400" />,
        text: 'Disconnected',
        bg: 'bg-red-900/20',
        border: 'border-red-400'
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Playback Control</h2>
        
        {/* Connection Status */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${connectionStatus.bg} ${connectionStatus.border}`}>
          {connectionStatus.icon}
          <span className="text-sm font-medium text-white">{connectionStatus.text}</span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-red-900/20 border border-red-400 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{connectionError}</span>
          </div>
        </div>
      )}

      {/* Main Playback Controls */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {/* Previous */}
        <button
          onClick={startPrevious}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Start Previous Event"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Start */}
        <button
          onClick={start}
          disabled={isLoading || playbackState === 'start'}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Start/Resume"
        >
          <Play className="w-5 h-5" />
        </button>

        {/* Pause */}
        <button
          onClick={pause}
          disabled={isLoading || playbackState !== 'start'}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Pause"
        >
          <Pause className="w-5 h-5" />
        </button>

        {/* Stop */}
        <button
          onClick={stop}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Stop"
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Next */}
        <button
          onClick={startNext}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Start Next Event"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={reload}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          title="Reload Current Event"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Reload</span>
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      {/* Time Adjustment Controls */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-md font-medium text-white mb-3">Time Adjustment</h3>
        
        {/* Quick Time Buttons */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          {[-300, -60, -10, 10, 60, 300].map(seconds => (
            <button
              key={seconds}
              onClick={() => handleTimeAdjustment(seconds)}
              disabled={timeLoading}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                seconds < 0 
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600' 
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
              } disabled:cursor-not-allowed text-white`}
              title={`${seconds > 0 ? 'Add' : 'Remove'} ${Math.abs(seconds)} seconds`}
            >
              {seconds > 0 ? '+' : ''}{seconds}s
            </button>
          ))}
        </div>

        {/* Manual Time Input */}
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            placeholder="±seconds"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTimeInput();
              }
            }}
          />
          <button
            onClick={handleTimeInput}
            disabled={timeLoading || !timeInput}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors text-sm"
          >
            Apply
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Use positive values to add time, negative to subtract
        </p>
      </div>

      {/* Playback State Display */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="text-sm text-gray-400 mb-2">Current State</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Playback:</span>
            <span className={`ml-2 font-medium ${
              playbackState === 'start' ? 'text-green-400' :
              playbackState === 'pause' ? 'text-yellow-400' :
              playbackState === 'roll' ? 'text-blue-400' :
              'text-gray-400'
            }`}>
              {playbackState?.toUpperCase() || 'STOPPED'}
            </span>
          </div>
          
          <div>
            <span className="text-gray-500">Events:</span>
            <span className="ml-2 font-medium text-white">
              {runtimeData?.runtime?.numEvents || 0}
            </span>
          </div>
        </div>

        {runtimeData?.playback?.selectedEventId && (
          <div className="mt-2 text-xs">
            <span className="text-gray-500">Selected ID:</span>
            <span className="ml-2 font-mono text-gray-300">
              {runtimeData.playback.selectedEventId}
            </span>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="text-sm text-gray-400 mb-3">Connection Settings</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">HTTP API:</span>
              <span className={`font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WebSocket:</span>
              <span className={`font-medium ${isWebSocketConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isWebSocketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Update:</span>
              <span className="text-gray-300">
                {runtimeData?.runtime?.currentTime ? 
                  new Date().toLocaleTimeString() : 
                  'Never'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
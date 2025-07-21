/**
 * Timer Display Component
 * Shows current running timer with progress and formatting
 */

import React, { useEffect, useState } from 'react';
import { Clock, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useWebSocketConnection, useCurrentAndNextEvents } from '../hooks/useOntime';
import { OntimeAPI } from '../lib/ontime-api';

interface TimerDisplayProps {
  className?: string;
}

export function TimerDisplay({ className = '' }: TimerDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  const { runtimeData } = useWebSocketConnection();
  const { currentEvent, nextEvent } = useCurrentAndNextEvents();

  // Ensure client-side rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 border-2 border-gray-400 transition-colors duration-300 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Square className="w-6 h-6 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Loading...</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Timer</span>
          </div>
        </div>
        <div className="text-center">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono font-bold text-white">--:--</div>
              <div className="text-xs text-gray-400">ELAPSED</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-white">--:--</div>
              <div className="text-xs text-gray-400">REMAINING</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white">--:--</div>
              <div className="text-xs text-gray-400">DURATION</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timer = runtimeData?.timer;
  const playback = runtimeData?.playback;

  // Calculate progress percentage
  const progressPercent = timer?.duration ? 
    Math.max(0, Math.min(100, ((timer.duration - timer.current) / timer.duration) * 100)) : 0;

  // Format time display
  const currentTime = timer?.current ? OntimeAPI.formatTime(timer.current) : '00:00';
  const totalDuration = timer?.duration ? OntimeAPI.formatTime(timer.duration) : '00:00';
  const timeRemaining = timer?.current && timer?.duration ? 
    OntimeAPI.formatTime(timer.duration - timer.current) : '00:00';

  // Determine timer state styling
  const getTimerStateColor = () => {
    if (playback?.state === 'start') return 'text-green-400 border-green-400';
    if (playback?.state === 'pause') return 'text-yellow-400 border-yellow-400';
    return 'text-gray-400 border-gray-400';
  };

  const getProgressBarColor = () => {
    if (timer?.current && timer?.duration) {
      const remaining = timer.duration - timer.current;
      const warningTime = currentEvent?.timeWarning ? currentEvent.timeWarning * 1000 : 300000; // 5 min default
      const dangerTime = currentEvent?.timeDanger ? currentEvent.timeDanger * 1000 : 60000; // 1 min default
      
      if (remaining <= dangerTime) return 'bg-red-500';
      if (remaining <= warningTime) return 'bg-yellow-500';
    }
    return 'bg-blue-500';
  };

  const getTimerIcon = () => {
    switch (playback?.state) {
      case 'start': return <Play className="w-6 h-6 text-green-400" />;
      case 'pause': return <Pause className="w-6 h-6 text-yellow-400" />;
      case 'roll': return <RotateCcw className="w-6 h-6 text-blue-400" />;
      default: return <Square className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-6 border-2 transition-colors duration-300 ${getTimerStateColor()} ${className}`}>
      {/* Timer Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getTimerIcon()}
          <h2 className="text-lg font-semibold text-white">
            {playback?.state === 'start' ? 'Running' : 
             playback?.state === 'pause' ? 'Paused' : 
             playback?.state === 'roll' ? 'Roll Mode' : 'Stopped'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Timer</span>
        </div>
      </div>

      {/* Current Event Info */}
      {currentEvent && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white truncate">
              {currentEvent.title}
            </h3>
            {currentEvent.cue && (
              <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                {currentEvent.cue}
              </span>
            )}
          </div>
          
          {currentEvent.note && (
            <p className="text-sm text-gray-400 mb-4">{currentEvent.note}</p>
          )}
          
          {/* Timer Type Indicator */}
          <div className="text-xs text-gray-500 mb-2">
            Type: {currentEvent.timerType?.toUpperCase() || 'NONE'}
          </div>
        </div>
      )}

      {/* Main Timer Display */}
      <div className="text-center mb-6">
        {/* Progress Bar */}
        {timer?.duration && (
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Time Display */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-white">
              {currentTime}
            </div>
            <div className="text-xs text-gray-400">ELAPSED</div>
          </div>
          
          <div>
            <div className="text-3xl font-mono font-bold text-white">
              {timeRemaining}
            </div>
            <div className="text-xs text-gray-400">REMAINING</div>
          </div>
          
          <div>
            <div className="text-2xl font-mono font-bold text-white">
              {totalDuration}
            </div>
            <div className="text-xs text-gray-400">DURATION</div>
          </div>
        </div>
      </div>

      {/* Next Event Preview */}
      {nextEvent && (
        <div className="border-t border-gray-700 pt-4">
          <div className="text-sm text-gray-400 mb-2">Next:</div>
          <div className="flex items-center justify-between">
            <span className="text-white font-medium truncate">
              {nextEvent.title}
            </span>
            {nextEvent.cue && (
              <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-400">
                {nextEvent.cue}
              </span>
            )}
          </div>
          {nextEvent.duration && (
            <div className="text-xs text-gray-500 mt-1">
              Duration: {OntimeAPI.formatDuration(nextEvent.duration)}
            </div>
          )}
        </div>
      )}

      {/* Additional Timer Info */}
      {timer?.addedTime !== undefined && timer.addedTime !== 0 && (
        <div className="border-t border-gray-700 pt-2 mt-4">
          <div className="text-xs text-center">
            <span className="text-gray-400">Added Time: </span>
            <span className={`font-mono ${timer.addedTime > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {timer.addedTime > 0 ? '+' : ''}{OntimeAPI.formatTime(Math.abs(timer.addedTime))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 
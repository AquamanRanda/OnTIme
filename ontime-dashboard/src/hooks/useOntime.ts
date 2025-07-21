/**
 * React hooks for Ontime API data management
 * Uses TanStack Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import { ontimeAPI } from '../lib/ontime-api';
import { 
  OntimeEvent, 
  RuntimeData, 
  EventWithStatus,
  EventStatus,
  PlaybackCommand,
  CustomField
} from '../types/ontime';

// Query keys for TanStack Query
export const QUERY_KEYS = {
  PROJECT: ['project'],
  RUNDOWN: ['rundown'],
  RUNTIME: ['runtime'],
} as const;

// ========================================
// PROJECT DATA HOOKS
// ========================================

/**
 * Hook to fetch project data (settings, custom fields)
 */
export function useProjectData() {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECT,
    queryFn: () => ontimeAPI.getProjectData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Only fetch on mount and manual refetch
  });
}

/**
 * Hook to fetch rundown events with custom fields
 */
export function useRundown() {
  return useQuery({
    queryKey: QUERY_KEYS.RUNDOWN,
    queryFn: () => ontimeAPI.getOrderedRundown(), // Use normalized rundown with custom fields
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch normalized rundown (raw format)
 */
export function useNormalizedRundown() {
  return useQuery({
    queryKey: [...QUERY_KEYS.RUNDOWN, 'normalized'],
    queryFn: () => ontimeAPI.getNormalizedRundown(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch runtime data via HTTP (fallback)
 */
export function useRuntimeData() {
  return useQuery({
    queryKey: QUERY_KEYS.RUNTIME,
    queryFn: () => ontimeAPI.getRuntimeData(),
    refetchInterval: 1000, // Refetch every second as fallback
    staleTime: 500, // Consider data stale after 500ms
  });
}

// ========================================
// WEBSOCKET HOOKS
// ========================================

/**
 * Hook to manage WebSocket connection and real-time runtime data
 */
export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [runtimeData, setRuntimeData] = useState<RuntimeData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const queryClient = useQueryClient();

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Connect to WebSocket on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;

    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await ontimeAPI.connectWebSocket();
        setIsConnected(true);
        setConnectionError(null);
        
        // Subscribe to runtime updates
        unsubscribe = ontimeAPI.onRuntimeDataUpdate((data: RuntimeData) => {
          setRuntimeData(data);
          // Update the query cache
          queryClient.setQueryData(QUERY_KEYS.RUNTIME, data);
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionError('Failed to connect to Ontime server');
        setIsConnected(false);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      ontimeAPI.disconnectWebSocket();
      setIsConnected(false);
    };
  }, [queryClient, isClient]);

  // Monitor WebSocket connection status (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      const wsConnected = ontimeAPI.isWebSocketConnected;
      setIsConnected(wsConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  return {
    isConnected: isClient ? isConnected : false,
    runtimeData: isClient ? runtimeData : null,
    connectionError: isClient ? connectionError : null,
    reconnect: () => isClient ? ontimeAPI.connectWebSocket() : Promise.resolve(),
  };
}

// ========================================
// COMPUTED DATA HOOKS
// ========================================

/**
 * Hook to extract custom fields from rundown events
 */
export function useCustomFields() {
  const { data: rundown = [] } = useRundown();

  return useCallback((): CustomField[] => {
    if (!rundown || !Array.isArray(rundown)) {
      return [];
    }

    // Extract all unique custom field names from all events
    const customFieldsMap = new Map<string, CustomField>();
    
    rundown.forEach(event => {
      if (event.custom) {
        Object.keys(event.custom).forEach(fieldId => {
          if (!customFieldsMap.has(fieldId)) {
            // Create a custom field definition based on the field name and content
            const fieldValue = event.custom![fieldId];
            let fieldType: 'text' | 'number' | 'boolean' | 'option' = 'text';
            
            // Try to determine field type from the value
            if (fieldValue === 'true' || fieldValue === 'false') {
              fieldType = 'boolean';
            } else if (!isNaN(Number(fieldValue)) && fieldValue.trim() !== '') {
              fieldType = 'number';
            }
            
            customFieldsMap.set(fieldId, {
              id: fieldId,
              label: fieldId.replace(/_/g, ' '), // Convert underscore to space for display
              type: fieldType,
              colour: undefined,
              options: undefined
            });
          }
        });
      }
    });

    const customFields = Array.from(customFieldsMap.values());
    
    console.log('🎛️ Extracted custom fields:', {
      fieldCount: customFields.length,
      fields: customFields.map(f => ({ id: f.id, label: f.label, type: f.type }))
    });

    return customFields;
  }, [rundown])();
}

/**
 * Hook to get events with computed status based on runtime data
 */
export function useEventsWithStatus(): EventWithStatus[] {
  const { data: rundown = [] } = useRundown();
  const { runtimeData } = useWebSocketConnection();

  return useCallback((): EventWithStatus[] => {
    // Always return an array, even if rundown is not loaded yet
    if (!rundown || !Array.isArray(rundown)) {
      return [];
    }

    const currentEventId = runtimeData?.playback?.selectedEventId;
    const currentTime = runtimeData?.timer?.current;
    
    return rundown.map((event, index) => {
      let status: EventStatus = 'upcoming';
      let isRunning = false;
      let timeRemaining: number | undefined;

      // Determine event status
      if (event.skip) {
        status = 'skipped';
      } else if (currentEventId === event.id) {
        status = 'active';
        isRunning = runtimeData?.playback?.state === 'start';
        if (currentTime !== undefined && event.duration) {
          timeRemaining = event.duration * 1000 - currentTime; // Convert to ms
        }
      } else {
        // Simple logic: events before current are completed
        const currentIndex = rundown.findIndex(e => e.id === currentEventId);
        if (currentIndex !== -1 && index < currentIndex) {
          status = 'completed';
        }
      }

      return {
        ...event,
        status,
        isRunning,
        timeRemaining,
      };
    });
  }, [rundown, runtimeData])();
}

/**
 * Hook to get current and next events
 */
export function useCurrentAndNextEvents() {
  const { runtimeData } = useWebSocketConnection();
  
  return {
    currentEvent: runtimeData?.eventNow || null,
    nextEvent: runtimeData?.eventNext || null,
    publicCurrentEvent: runtimeData?.publicEventNow || null,
    publicNextEvent: runtimeData?.publicEventNext || null,
  };
}

// ========================================
// MUTATION HOOKS
// ========================================

/**
 * Hook to update event properties
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, updates }: { eventId: string; updates: Partial<OntimeEvent> }) => 
      ontimeAPI.updateEvent(eventId, updates),
    onSuccess: () => {
      // Invalidate rundown query to refetch data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUNDOWN });
    },
  });
}

/**
 * Hook to update custom fields
 */
export function useUpdateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, fieldName, value }: { eventId: string; fieldName: string; value: string }) => 
      ontimeAPI.updateCustomField(eventId, fieldName, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUNDOWN });
    },
  });
}

/**
 * Hook for playback control commands
 */
export function usePlaybackControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ command, payload }: { command: PlaybackCommand; payload?: Record<string, unknown> }) => 
      ontimeAPI.sendPlaybackCommand(command, payload),
    onSuccess: () => {
      // Runtime data will be updated via WebSocket, but trigger a refetch as backup
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUNTIME });
    },
  });
}

// ========================================
// SPECIFIC CONTROL HOOKS
// ========================================

/**
 * Hook for starting events
 */
export function useStartEvent() {
  const playbackControl = usePlaybackControl();

  return {
    start: () => playbackControl.mutate({ command: 'start' }),
    startById: (eventId: string) => 
      playbackControl.mutate({ command: 'start', payload: { eventId } }),
    startByIndex: (index: number) => 
      playbackControl.mutate({ command: 'start', payload: { eventIndex: index } }),
    startByCue: (cue: string) => 
      playbackControl.mutate({ command: 'start', payload: { eventCue: cue } }),
    startNext: () => playbackControl.mutate({ command: 'start-next' }),
    startPrevious: () => playbackControl.mutate({ command: 'start-previous' }),
    isLoading: playbackControl.isPending,
    error: playbackControl.error,
  };
}

/**
 * Hook for basic playback controls
 */
export function usePlaybackActions() {
  const playbackControl = usePlaybackControl();

  return {
    pause: () => playbackControl.mutate({ command: 'pause' }),
    stop: () => playbackControl.mutate({ command: 'stop' }),
    reload: () => playbackControl.mutate({ command: 'reload' }),
    isLoading: playbackControl.isPending,
    error: playbackControl.error,
  };
}

/**
 * Hook for time control
 */
export function useTimeControl() {
  const queryClient = useQueryClient();

  const addTimeMutation = useMutation({
    mutationFn: (seconds: number) => ontimeAPI.addTime(seconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUNTIME });
    },
  });

  const removeTimeMutation = useMutation({
    mutationFn: (seconds: number) => ontimeAPI.removeTime(seconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUNTIME });
    },
  });

  return {
    addTime: (seconds: number) => addTimeMutation.mutate(seconds),
    removeTime: (seconds: number) => removeTimeMutation.mutate(seconds),
    isLoading: addTimeMutation.isPending || removeTimeMutation.isPending,
    error: addTimeMutation.error || removeTimeMutation.error,
  };
}

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Hook to get connection status
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isConnected } = useWebSocketConnection();

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check API health (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const checkHealth = async () => {
      const healthy = await ontimeAPI.healthCheck();
      setIsOnline(healthy);
    };

    // Check immediately and then every 30 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [isClient]);

  return {
    isOnline: isClient ? isOnline : true,
    isWebSocketConnected: isClient ? isConnected : false,
    isFullyConnected: isClient ? (isOnline && isConnected) : false,
  };
} 
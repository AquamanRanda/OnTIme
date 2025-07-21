/**
 * Ontime API Layer
 * Handles HTTP and WebSocket communication with Ontime server
 */

import axios, { AxiosInstance } from 'axios';
import { 
  OntimeEvent, 
  ProjectData, 
  RuntimeData, 
  ApiResponse, 
  WebSocketMessage,
  PlaybackCommand,
  CustomField,
  NormalizedRundownResponse
} from '../types/ontime';

export class OntimeAPI {
  private httpClient: AxiosInstance;
  private websocket: WebSocket | null = null;
  private wsListeners: Set<(data: RuntimeData) => void> = new Set();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private baseUrl: string;
  private wsUrl: string;

  constructor(baseUrl?: string) {
    // Use environment variable, passed parameter, or default to localhost
    const serverUrl = baseUrl || 
                     process.env.NEXT_PUBLIC_ONTIME_URL || 
                     'https://ontime.alpha.theesports.club';
    
    // Use dedicated WebSocket URL from environment, or derive from HTTP URL                 
    const websocketUrl = process.env.NEXT_PUBLIC_ONTIME_WS_URL || 
                        serverUrl.replace('http', 'ws') + '/ws';
                     
    this.baseUrl = serverUrl;
    this.wsUrl = websocketUrl;
    
    // Log the configuration for debugging
    console.log('🔗 Ontime API configured:', {
      httpURL: serverUrl,
      websocketURL: this.wsUrl,
      httpSource: baseUrl ? 'parameter' : 
                 process.env.NEXT_PUBLIC_ONTIME_URL ? 'environment' : 'default',
      wsSource: process.env.NEXT_PUBLIC_ONTIME_WS_URL ? 'environment' : 'derived'
    });

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup axios interceptors for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ========================================
  // HTTP API METHODS
  // ========================================

  /**
   * Get project data (rundown, settings, custom fields)
   * HTTP GET /data/project
   */
  async getProjectData(): Promise<ProjectData> {
    try {
      console.log('🔍 Fetching project data...');
      const response = await this.httpClient.get('/data/project');
      
      const data = response.data;
      console.log('📊 Project data received:', {
        title: data.title,
        customFieldsCount: data.customFields?.length || 0,
        customFields: data.customFields?.map((f: CustomField) => ({ id: f.id, label: f.label, type: f.type })) || [],
        rundownLength: data.rundown?.length || 0,
        hasSettings: !!data.settings
      });
      
      return data;
    } catch (error) {
      console.error('💥 Failed to fetch project data:', error);
      throw error;
    }
  }

  /**
   * Get rundown events
   * HTTP GET /data/rundown
   */
  async getRundown(): Promise<OntimeEvent[]> {
    const response = await this.httpClient.get('/data/rundown');
    return response.data;
  }

  /**
   * Get normalized rundown with custom fields
   * HTTP GET /data/rundown/normalised
   */
  async getNormalizedRundown(): Promise<NormalizedRundownResponse> {
    try {
      console.log('🔍 Fetching normalized rundown...');
      const response = await this.httpClient.get('/data/rundown/normalised');
      
      const data = response.data;
      console.log('📊 Normalized rundown received:', {
        eventCount: data.order?.length || 0,
        events: data.order?.map((id: string) => ({
          id,
          title: data.rundown[id]?.title,
          customFields: Object.keys(data.rundown[id]?.custom || {})
        })) || [],
        totalCustomFields: data.order?.reduce((total: number, id: string) => {
          return total + Object.keys(data.rundown[id]?.custom || {}).length;
        }, 0) || 0
      });
      
      return data;
    } catch (error) {
      console.error('💥 Failed to fetch normalized rundown:', error);
      throw error;
    }
  }

  /**
   * Convert normalized rundown to ordered array
   */
  async getOrderedRundown(): Promise<OntimeEvent[]> {
    const normalized = await this.getNormalizedRundown();
    
    // Convert object to ordered array using the order field
    return normalized.order.map(id => normalized.rundown[id]).filter(Boolean);
  }

  /**
   * Get runtime data (current state)
   * HTTP GET /data/runtime
   */
  async getRuntimeData(): Promise<RuntimeData> {
    const response = await this.httpClient.get('/data/runtime');
    return response.data;
  }

  /**
   * Update an event field
   * HTTP PATCH /events/:eventId
   */
  async updateEvent(eventId: string, updates: Partial<OntimeEvent>): Promise<OntimeEvent> {
    const response = await this.httpClient.patch(`/events/${eventId}`, updates);
    return response.data;
  }

  /**
   * Update custom field for an event
   * HTTP PATCH /events/:eventId/custom/:fieldName
   */
  async updateCustomField(eventId: string, fieldName: string, value: string): Promise<ApiResponse> {
    const response = await this.httpClient.patch(`/events/${eventId}/custom/${fieldName}`, { value });
    return response.data;
  }

  // ========================================
  // PLAYBACK CONTROL (HTTP)
  // ========================================

  /**
   * Send playback command
   * HTTP POST /playback/:command
   */
  async sendPlaybackCommand(command: PlaybackCommand, payload?: Record<string, unknown>): Promise<ApiResponse> {
    const response = await this.httpClient.post(`/playback/${command}`, payload || {});
    return response.data;
  }

  /**
   * Start playback (current loaded event)
   */
  async start(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start');
  }

  /**
   * Start event by ID
   */
  async startEventById(eventId: string): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start', { eventId });
  }

  /**
   * Start event by index
   */
  async startEventByIndex(index: number): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start', { eventIndex: index });
  }

  /**
   * Start event by cue
   */
  async startEventByCue(cue: string): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start', { eventCue: cue });
  }

  /**
   * Pause playback
   */
  async pause(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('pause');
  }

  /**
   * Stop playback
   */
  async stop(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('stop');
  }

  /**
   * Reload current event
   */
  async reload(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('reload');
  }

  /**
   * Start next event
   */
  async startNext(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start-next');
  }

  /**
   * Start previous event
   */
  async startPrevious(): Promise<ApiResponse> {
    return this.sendPlaybackCommand('start-previous');
  }

  /**
   * Load event by ID
   */
  async loadEventById(eventId: string): Promise<ApiResponse> {
    return this.sendPlaybackCommand('load-next', { eventId });
  }

  /**
   * Add time to running event
   * HTTP POST /playback/addtime
   */
  async addTime(seconds: number): Promise<ApiResponse> {
    const response = await this.httpClient.post('/playback/addtime', { seconds });
    return response.data;
  }

  /**
   * Remove time from running event
   * HTTP POST /playback/removetime
   */
  async removeTime(seconds: number): Promise<ApiResponse> {
    const response = await this.httpClient.post('/playback/removetime', { seconds });
    return response.data;
  }

  // ========================================
  // WEBSOCKET METHODS
  // ========================================

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.wsUrl);

        this.websocket.onopen = () => {
          console.log('Connected to Ontime WebSocket');
          // Request initial data
          this.sendWebSocketMessage('ontime-poll', {});
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          this.websocket = null;
          // Auto-reconnect after 5 seconds
          this.scheduleReconnect();
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.wsListeners.clear();
  }

  /**
   * Subscribe to runtime data updates
   */
  onRuntimeDataUpdate(callback: (data: RuntimeData) => void): () => void {
    this.wsListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.wsListeners.delete(callback);
    };
  }

  /**
   * Send message via WebSocket
   */
  private sendWebSocketMessage(topic: string, payload: Record<string, unknown>): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = { topic, payload };
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    const { topic, payload } = message;

    // Debug logging to see actual data structure
    if (topic === 'poll' || topic === 'runtime') {
      console.log('📡 WebSocket runtime data received:', {
        topic,
        payloadKeys: Object.keys(payload || {}),
        playback: (payload as any)?.playback,
        timer: (payload as any)?.timer,
        eventNow: (payload as any)?.eventNow,
        eventNext: (payload as any)?.eventNext,
        selectedEventId: (payload as any)?.playback?.selectedEventId
      });
    }

    // Handle different message types
    switch (topic) {
      case 'poll':
      case 'runtime':
        // Broadcast runtime data to all listeners
        this.wsListeners.forEach(callback => callback(payload as RuntimeData));
        break;
      case 'playback':
        // Playback state updates
        console.log('🎮 Playback update:', payload);
        break;
      case 'timer':
        // Timer updates
        console.log('⏱️ Timer update:', payload);
        break;
      default:
        console.log('❓ Unknown WebSocket message:', topic, payload);
    }
  }

  /**
   * Schedule WebSocket reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectInterval) return;
    
    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect to WebSocket...');
      this.connectWebSocket().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, 5000);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Check if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get WebSocket connection status
   */
  get isWebSocketConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Format time in milliseconds to human readable string
   */
  static formatTime(ms: number): string {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const sign = ms < 0 ? '-' : '';
    
    if (hours > 0) {
      return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format duration in seconds to MM:SS
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Singleton instance - create with explicit environment variable check
const getServerUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_ONTIME_URL;
  const defaultUrl = 'https://ontime.alpha.theesports.club';
  
  console.log('🌐 Environment check:', {
    NEXT_PUBLIC_ONTIME_URL: envUrl,
    resolvedUrl: envUrl || defaultUrl,
    nodeEnv: process.env.NODE_ENV
  });
  
  return envUrl || defaultUrl;
};

export const ontimeAPI = new OntimeAPI(getServerUrl());

// Configuration for different environments
export const createOntimeAPI = (baseUrl: string) => new OntimeAPI(baseUrl); 
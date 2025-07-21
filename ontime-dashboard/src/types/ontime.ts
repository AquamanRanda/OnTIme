/**
 * Ontime API Type Definitions
 * Based on https://docs.getontime.no/api documentation
 */

// Event/Cue Properties (based on OSC API documentation)
export interface OntimeEvent {
  id: string;
  title: string;
  note?: string;
  cue: string; // Should be kept under 8 characters
  isPublic: boolean;
  skip: boolean;
  colour?: string; // Hex color or named CSS color
  timeWarning?: number; // In seconds
  timeDanger?: number; // In seconds
  endAction: 'none' | 'load-next' | 'play-next' | 'stop';
  timerType: 'count-down' | 'count-up' | 'clock' | 'none';
  duration?: number; // In seconds
  timeStart?: number; // In seconds  
  timeEnd?: number; // In seconds
  // Custom fields - dynamic object with string keys
  custom?: Record<string, string>;
}

// Runtime Data Types
export interface PlaybackState {
  state: 'start' | 'pause' | 'stop' | 'roll';
  selectedEventId: string | null;
  selectedEventIndex: number | null;
  loadedEventId: string | null;
  loadedEventIndex: number | null;
}

export interface TimerState {
  current: number; // Current time in milliseconds
  duration: number; // Total duration in milliseconds
  expectedFinish: number; // Expected finish timestamp
  startedAt?: number; // Started at timestamp
  addedTime?: number; // User added time in milliseconds
  secondaryTimer?: {
    current: number;
    duration: number;
  };
}

export interface MessageState {
  timer: {
    text: string;
    visible: boolean;
    blink: boolean;
    blackout: boolean;
    secondarySource: 'aux' | 'external' | null;
  };
  external: {
    text: string;
    visible: boolean;
  };
  lower: {
    text: string;
    visible: boolean;
  };
}

// Project Data
export interface ProjectData {
  title: string;
  description?: string;
  publicUrl?: string;
  publicInfo?: string;
  backstageUrl?: string;
  backstageInfo?: string;
  customFields: CustomField[];
  settings: ProjectSettings;
  rundown: OntimeEvent[];
}

// Normalized Rundown API Response
export interface NormalizedRundownResponse {
  rundown: Record<string, OntimeEvent>; // Object with event IDs as keys
  order: string[]; // Array of event IDs in order
  revision: number;
  totalDelay: number;
  totalDuration: number;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'option';
  colour?: string;
  options?: string[]; // For option type
}

export interface ProjectSettings {
  app: string;
  version: string;
  serverPort: number;
  editorKey?: string;
  operatorKey?: string;
  timeFormat: '12' | '24';
  language: string;
}

// Runtime Data (complete state from WebSocket/HTTP)
export interface RuntimeData {
  timer: TimerState;
  playback: PlaybackState;
  message: MessageState;
  runtime: {
    selectedEventId: string | null;
    numEvents: number;
    currentTime: number;
  };
  eventNow?: OntimeEvent | null;
  eventNext?: OntimeEvent | null;
  publicEventNow?: OntimeEvent | null;
  publicEventNext?: OntimeEvent | null;
}

// WebSocket Message Types
export interface WebSocketMessage {
  topic: string;
  payload: RuntimeData | PlaybackState | TimerState | Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T = Record<string, unknown>> {
  data?: T;
  message?: string;
  status: 'success' | 'error';
}

// Timer Control Commands
export type PlaybackCommand = 
  | 'start'
  | 'pause'
  | 'stop'
  | 'reload'
  | 'roll'
  | 'start-next'
  | 'start-previous'
  | 'load-next'
  | 'load-previous';

export interface PlaybackControl {
  command: PlaybackCommand;
  eventId?: string;
  eventIndex?: number;
  eventCue?: string;
}

// Auxiliary Timer
export interface AuxTimer {
  id: number;
  duration: number; // In seconds
  current: number; // In seconds
  direction: 'count-up' | 'count-down';
  state: 'start' | 'pause' | 'stop';
}

// Event Status (computed from runtime data)
export type EventStatus = 'completed' | 'active' | 'upcoming' | 'skipped';

export interface EventWithStatus extends OntimeEvent {
  status: EventStatus;
  isRunning?: boolean;
  timeRemaining?: number;
} 
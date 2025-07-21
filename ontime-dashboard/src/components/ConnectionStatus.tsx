/**
 * Connection Status Component
 * Displays detailed connection information for debugging
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ontimeAPI } from '../lib/ontime-api';

interface ConnectionInfo {
  serverUrl: string;
  httpStatus: 'connecting' | 'connected' | 'error';
  websocketStatus: 'connecting' | 'connected' | 'error';
  lastError?: string;
  projectTitle?: string;
  customFieldsCount?: number;
}

export function ConnectionStatus() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    serverUrl: 'https://ontime.alpha.theesports.club',
    httpStatus: 'connecting',
    websocketStatus: 'connecting'
  });
  const [isVisible, setIsVisible] = useState(false);

  const checkConnection = async () => {
    setConnectionInfo(prev => ({
      ...prev,
      httpStatus: 'connecting',
      lastError: undefined
    }));

    try {
      // Test HTTP connection
      const projectData = await ontimeAPI.getProjectData();
      setConnectionInfo(prev => ({
        ...prev,
        httpStatus: 'connected',
        projectTitle: projectData.title,
        customFieldsCount: projectData.customFields?.length || 0
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionInfo(prev => ({
        ...prev,
        httpStatus: 'error',
        lastError: errorMessage
      }));
    }

    // Check WebSocket status
    const wsConnected = ontimeAPI.isWebSocketConnected;
    setConnectionInfo(prev => ({
      ...prev,
      websocketStatus: wsConnected ? 'connected' : 'error'
    }));
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'border-green-400 bg-green-900/20';
      case 'error': return 'border-red-400 bg-red-900/20';
      case 'connecting': return 'border-yellow-400 bg-yellow-900/20';
      default: return 'border-gray-400 bg-gray-900/20';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 p-3 rounded-lg border-2 transition-colors ${getStatusColor(connectionInfo.httpStatus)}`}
        title="Show connection details"
      >
        {getStatusIcon(connectionInfo.httpStatus)}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Connection Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Server URL */}
        <div>
          <div className="text-gray-400 text-xs">Server URL</div>
          <div className="text-white font-mono text-xs break-all">
            {connectionInfo.serverUrl}
          </div>
        </div>

        {/* HTTP Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">HTTP API</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionInfo.httpStatus)}
            <span className={`text-xs ${
              connectionInfo.httpStatus === 'connected' ? 'text-green-400' :
              connectionInfo.httpStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {connectionInfo.httpStatus}
            </span>
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">WebSocket</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionInfo.websocketStatus)}
            <span className={`text-xs ${
              connectionInfo.websocketStatus === 'connected' ? 'text-green-400' :
              connectionInfo.websocketStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {connectionInfo.websocketStatus}
            </span>
          </div>
        </div>

        {/* Project Info */}
        {connectionInfo.httpStatus === 'connected' && (
          <div className="border-t border-gray-600 pt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Project</span>
              <span className="text-white text-xs">
                {connectionInfo.projectTitle || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Custom Fields</span>
              <span className={`text-xs ${
                (connectionInfo.customFieldsCount || 0) > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {connectionInfo.customFieldsCount || 0}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {connectionInfo.lastError && (
          <div className="border-t border-gray-600 pt-2">
            <div className="text-red-400 text-xs">
              {connectionInfo.lastError}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-600 pt-2">
          <button
            onClick={checkConnection}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
} 
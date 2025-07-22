/**
 * Event Card Component
 * Displays individual rundown events with controls and custom fields
 */

import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Edit3, 
  Eye, 
  EyeOff,
  SkipForward,
  Check,
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { EventWithStatus, CustomField } from '../types/ontime';
import { useStartEvent, useUpdateCustomField } from '../hooks/useOntime';
import { OntimeAPI } from '../lib/ontime-api';

interface EventCardProps {
  event: EventWithStatus;
  index: number;
  customFields?: CustomField[];
}

export function EventCard({ event, index, customFields = [] }: EventCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(event.custom || {});
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  
  const { startById, isLoading } = useStartEvent();
  const updateCustomField = useUpdateCustomField();

  // Handle saving custom field
  const handleFieldSave = async (fieldId: string, value: string) => {
    try {
      await updateCustomField.mutateAsync({ 
        eventId: event.id, 
        fieldName: fieldId, 
        value 
      });
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update custom field:', error);
      // Reset to original value on error
      setFieldValues(prev => ({
        ...prev,
        [fieldId]: event.custom?.[fieldId] || ''
      }));
    }
  };

  // Handle canceling custom field edit
  const handleFieldCancel = (fieldId: string) => {
    // Reset to original value
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: event.custom?.[fieldId] || ''
    }));
    setEditingField(null);
  };

  // Check if a value is an image URL
  const isImageUrl = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    
    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    if (imageExtensions.test(value)) return true;
    
    // Check for common image hosting domains
    const imageHosts = /(images\.unsplash\.com|imgur\.com|cloudinary\.com|amazonaws\.com.*\.(jpg|jpeg|png|gif|webp))/i;
    if (imageHosts.test(value)) return true;
    
    // Check if URL starts with data: (base64 images)
    if (value.startsWith('data:image/')) return true;
    
    return false;
  };

  // Update image state
  const updateImageState = (fieldId: string, state: 'loading' | 'loaded' | 'error') => {
    setImageStates(prev => ({
      ...prev,
      [fieldId]: state
    }));
  };

  // Render image for custom field
  const renderCustomFieldImage = (value: string, fieldLabel: string, fieldId: string) => {
    const imageState = imageStates[fieldId] || 'loading';
    
    return (
      <div className="mt-2">
        {imageState === 'loading' && (
          <div className="flex items-center justify-center h-32 bg-gray-700 rounded border border-gray-600">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400">Loading image...</span>
            </div>
          </div>
        )}
        
        <img
          src={value}
          alt={`${fieldLabel} image`}
          className={`max-w-full max-h-32 object-contain rounded border border-gray-600 cursor-pointer hover:border-blue-400 transition-colors ${
            imageState === 'loading' ? 'hidden' : 'block'
          }`}
          onError={() => {
            console.error('Failed to load image:', value);
            updateImageState(fieldId, 'error');
          }}
          onLoad={() => {
            updateImageState(fieldId, 'loaded');
          }}
          onClick={() => {
            // Open image in new tab for full view
            window.open(value, '_blank', 'noopener,noreferrer');
          }}
          title="Click to view full size"
        />
        
        {imageState === 'error' && (
          <div className="flex items-center justify-center h-32 bg-red-900/20 rounded border border-red-600/50">
            <div className="flex flex-col items-center space-y-2 text-center p-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <span className="text-xs text-red-400">Failed to load image</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(value).then(() => {
                    console.log('Image URL copied to clipboard');
                  });
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Copy URL to clipboard
              </button>
            </div>
          </div>
        )}
        
        {imageState === 'loaded' && (
          <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
            <span>Click image to view full size</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(value).then(() => {
                  console.log('Image URL copied to clipboard');
                  // You could add a toast notification here
                });
              }}
              className="text-blue-400 hover:text-blue-300"
              title="Copy image URL"
            >
              Copy URL
            </button>
          </div>
        )}
      </div>
    );
  };

  // Get status styling
  const getStatusStyling = () => {
    switch (event.status) {
      case 'active':
        return {
          border: 'border-green-400',
          bg: 'bg-green-900/20',
          indicator: 'bg-green-400',
          text: 'text-green-400'
        };
      case 'completed':
        return {
          border: 'border-gray-600',
          bg: 'bg-gray-900/50',
          indicator: 'bg-gray-600',
          text: 'text-gray-400'
        };
      case 'skipped':
        return {
          border: 'border-yellow-600',
          bg: 'bg-yellow-900/20',
          indicator: 'bg-yellow-600',
          text: 'text-yellow-400'
        };
      default: // upcoming
        return {
          border: 'border-gray-700',
          bg: 'bg-gray-800/50',
          indicator: 'bg-blue-400',
          text: 'text-blue-400'
        };
    }
  };

  const styling = getStatusStyling();

  // Get timer type icon
  const getTimerTypeIcon = () => {
    switch (event.timerType) {
      case 'count-down':
        return <Clock className="w-4 h-4" />;
      case 'count-up':
        return <Clock className="w-4 h-4 rotate-180" />;
      case 'clock':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-300 ${styling.border} ${styling.bg}`}>
      {/* Event Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Status Indicator */}
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${styling.indicator}`} />
          
          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-white truncate">
                {event.title}
              </h3>
              
              {/* Cue Number */}
              {event.cue && (
                <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded text-gray-300 flex-shrink-0">
                  {event.cue}
                </span>
              )}
              
              {/* Timer Type Icon */}
              {getTimerTypeIcon() && (
                <div className="text-gray-400 flex-shrink-0">
                  {getTimerTypeIcon()}
                </div>
              )}
            </div>
            
            {/* Status and Index */}
            <div className="flex items-center space-x-3 text-sm">
              <span className={`font-medium ${styling.text}`}>
                {event.status.toUpperCase()}
              </span>
              <span className="text-gray-500">#{index + 1}</span>
              {event.isRunning && (
                <span className="text-green-400 font-medium">RUNNING</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Visibility Toggle */}
          <button 
            className={`p-2 rounded-md transition-colors ${
              event.isPublic 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title={event.isPublic ? 'Public' : 'Private'}
          >
            {event.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          {/* Start/Play Button */}
          <button 
            onClick={() => startById(event.id)}
            disabled={isLoading || event.status === 'active'}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
            title="Start Event"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event Note */}
      {event.note && (
        <div className="mb-3">
          <p className="text-sm text-gray-300 italic">{event.note}</p>
        </div>
      )}

      {/* Timer Information */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-400 text-xs mb-1">DURATION</div>
          <div className="font-mono text-white">
            {event.duration ? OntimeAPI.formatDuration(event.duration) : '--:--'}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-xs mb-1">START</div>
          <div className="font-mono text-white">
            {event.timeStart ? OntimeAPI.formatTime(event.timeStart * 1000) : '--:--'}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-xs mb-1">END</div>
          <div className="font-mono text-white">
            {event.timeEnd ? OntimeAPI.formatTime(event.timeEnd * 1000) : '--:--'}
          </div>
        </div>
      </div>

      {/* Timer Progress for Active Events */}
      {event.status === 'active' && event.timeRemaining !== undefined && event.duration && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>REMAINING</span>
            <span className="font-mono">
              {OntimeAPI.formatTime(event.timeRemaining)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                event.timeRemaining <= 60000 ? 'bg-red-500' : 
                event.timeRemaining <= 300000 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ 
                width: `${Math.max(0, (event.timeRemaining / (event.duration * 1000)) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Warning/Danger Times */}
      {(event.timeWarning || event.timeDanger) && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          {event.timeWarning && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              <span>Warning: {OntimeAPI.formatDuration(event.timeWarning)}</span>
            </div>
          )}
          {event.timeDanger && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-3 h-3" />
              <span>Danger: {OntimeAPI.formatDuration(event.timeDanger)}</span>
            </div>
          )}
        </div>
      )}

      {/* Custom Fields */}
      {customFields && customFields.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Custom Fields</h4>
            <span className="text-xs text-gray-500">{customFields.length} fields</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customFields.map(field => {
              const currentValue = fieldValues[field.id] || event.custom?.[field.id] || '';
              const isEditing = editingField === field.id;
              
              // Get field type styling
              const getFieldTypeColor = () => {
                switch (field.type) {
                  case 'text': return 'text-blue-400 bg-blue-900/30';
                  case 'number': return 'text-green-400 bg-green-900/30';
                  case 'boolean': return 'text-purple-400 bg-purple-900/30';
                  case 'option': return 'text-yellow-400 bg-yellow-900/30';
                  default: return 'text-gray-400 bg-gray-900/30';
                }
              };

              // Check if current field contains image content
              const hasImageContent = currentValue && isImageUrl(currentValue);
              
              return (
                <div key={field.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  {/* Field Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-white">
                        {field.label}
                      </label>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getFieldTypeColor()}`}>
                          {field.type}
                        </span>
                        {/* Show image icon if field contains image */}
                        {hasImageContent && (
                          <span className="text-xs px-2 py-1 rounded-full text-pink-400 bg-pink-900/30 flex items-center space-x-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>image</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {field.colour && (
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-600"
                        style={{ backgroundColor: field.colour }}
                        title={`Field color: ${field.colour}`}
                      />
                    )}
                  </div>
                  
                  {/* Field Value */}
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      {field.type === 'option' && field.options ? (
                        <select
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.id]: e.target.value
                          }))}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldSave(field.id, fieldValues[field.id] || '');
                            } else if (e.key === 'Escape') {
                              handleFieldCancel(field.id);
                            }
                          }}
                          autoFocus
                        >
                          <option value="">Select an option...</option>
                          {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <select
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.id]: e.target.value
                          }))}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldSave(field.id, fieldValues[field.id] || '');
                            } else if (e.key === 'Escape') {
                              handleFieldCancel(field.id);
                            }
                          }}
                          autoFocus
                        >
                          <option value="">Select...</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.id]: e.target.value
                          }))}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400"
                          placeholder={
                            field.type === 'text' && field.label && field.label.toLowerCase().includes('image')
                            ? `Enter image URL for ${field.label.toLowerCase()}...`
                            : `Enter ${field.label?.toLowerCase() || 'value'}...`
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldSave(field.id, fieldValues[field.id] || '');
                            } else if (e.key === 'Escape') {
                              handleFieldCancel(field.id);
                            }
                          }}
                          onPaste={(e) => {
                            // Handle image URL pasting
                            const pastedData = e.clipboardData.getData('text');
                            if (pastedData && isImageUrl(pastedData)) {
                              console.log('📸 Image URL detected from paste:', pastedData);
                            }
                          }}
                          autoFocus
                        />
                      )}
                      
                      {/* Save/Cancel buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleFieldSave(field.id, fieldValues[field.id] || '')}
                          className="text-green-400 hover:text-green-300 p-1.5 hover:bg-green-900/30 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFieldCancel(field.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-900/30 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {currentValue ? (
                          <div className="text-sm text-white">
                            {field.type === 'boolean' ? (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                currentValue === 'true' 
                                  ? 'bg-green-900/50 text-green-400' 
                                  : 'bg-red-900/50 text-red-400'
                              }`}>
                                {currentValue === 'true' ? 'Yes' : 'No'}
                              </span>
                            ) : (
                              <div>
                                <span className="break-words">{currentValue}</span>
                                {/* Display image if the field contains an image URL */}
                                {isImageUrl(currentValue) && renderCustomFieldImage(currentValue, field.label, field.id)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <em className="text-gray-500 text-sm">Not set</em>
                        )}
                        
                        {/* Show available options for option fields */}
                        {field.type === 'option' && field.options && field.options.length > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            Options: {field.options.join(', ')}
                          </div>
                        )}
                        
                        {/* Show image field help for text fields that might contain images */}
                        {field.type === 'text' && (field.label && field.label.toLowerCase().includes('image') || hasImageContent) && (
                          <div className="mt-1 text-xs text-gray-400">
                            {hasImageContent ? (
                              <span className="text-green-400">✅ Valid image URL detected</span>
                            ) : (
                              <span>Supports: JPG, PNG, GIF, WebP, SVG • Paste image URL or upload link</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditingField(field.id);
                          setFieldValues(prev => ({ 
                            ...prev, 
                            [field.id]: currentValue 
                          }));
                        }}
                        className="text-gray-400 hover:text-gray-200 p-1.5 hover:bg-gray-700/50 rounded transition-colors ml-2"
                        title={`Edit ${field.label}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Summary of filled vs empty fields */}
          <div className="mt-3 text-xs text-gray-500">
            {(() => {
              const filledFields = customFields.filter(field => 
                event.custom?.[field.id] && event.custom[field.id].trim() !== ''
              ).length;
              return `${filledFields} of ${customFields.length} fields filled`;
            })()}
          </div>
        </div>
      )}

      {/* Show message if no custom fields are available */}
      {(!customFields || customFields.length === 0) && (
        <div className="border-t border-gray-700 pt-4">
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No custom fields configured</p>
            <p className="text-gray-600 text-xs mt-1">
              Add custom fields in your Ontime project to see them here
            </p>
          </div>
        </div>
      )}

      {/* Event Controls Footer */}
      <div className="border-t border-gray-700 pt-3 mt-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Type: {event.timerType?.toUpperCase() || 'NONE'}</span>
            {event.colour && (
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: event.colour }}
                />
                <span>{event.colour}</span>
              </div>
            )}
            <span>Action: {event.endAction?.toUpperCase() || 'NONE'}</span>
          </div>
          
          {event.skip && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <SkipForward className="w-3 h-3" />
              <span>SKIP</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
'use client';

/**
 * Presentation Page - Full Screen Timer Display
 * Shows current/next events with custom fields and large images
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PresentationView } from '../../components/PresentationView';

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

export default function PresentationPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PresentationView />
    </QueryClientProvider>
  );
} 
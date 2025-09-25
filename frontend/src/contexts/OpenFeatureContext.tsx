import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { EvaluationContext, Client } from '@openfeature/web-sdk';
import { openFeatureClient } from '../services/openfeature';

interface OpenFeatureContextType {
  client: Client;
  isReady: boolean;
  context: EvaluationContext;
  setContext: (context: EvaluationContext) => void;
}

const OpenFeatureContext = createContext<OpenFeatureContextType | undefined>(undefined);

interface OpenFeatureProviderProps {
  children: ReactNode;
  initialContext?: EvaluationContext;
}

export const OpenFeatureProvider: React.FC<OpenFeatureProviderProps> = ({
  children,
  initialContext = {}
}) => {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<EvaluationContext>(initialContext);

  useEffect(() => {
    const handleReady = () => {
      console.log('🔧 OpenFeature provider is ready');
      setIsReady(true);
    };

    const handleError = (error: any) => {
      console.error('🚨 OpenFeature provider error:', error);
    };

    // Listen for provider ready events
    openFeatureClient.addHandler('PROVIDER_READY', handleReady);
    openFeatureClient.addHandler('PROVIDER_ERROR', handleError);

    // Check if provider is already ready
    // Note: We'll rely on the event handlers to determine readiness

    // Set the context if provided
    if (Object.keys(initialContext).length > 0) {
      openFeatureClient.setContext(initialContext);
    }

    return () => {
      openFeatureClient.removeHandler('PROVIDER_READY', handleReady);
      openFeatureClient.removeHandler('PROVIDER_ERROR', handleError);
    };
  }, [initialContext]);

  // Update context when it changes
  useEffect(() => {
    if (Object.keys(context).length > 0) {
      openFeatureClient.setContext(context);
    }
  }, [context]);

  const value: OpenFeatureContextType = {
    client: openFeatureClient,
    isReady,
    context,
    setContext,
  };

  return (
    <OpenFeatureContext.Provider value={value}>
      {children}
    </OpenFeatureContext.Provider>
  );
};

// Hook to use OpenFeature context
export const useOpenFeature = (): OpenFeatureContextType => {
  const context = useContext(OpenFeatureContext);
  if (context === undefined) {
    throw new Error('useOpenFeature must be used within an OpenFeatureProvider');
  }
  return context;
};
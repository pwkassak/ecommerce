import { useState, useEffect } from 'react';
import { EvaluationContext, FlagValue } from '@openfeature/web-sdk';
import { useOpenFeature } from '../contexts/OpenFeatureContext';

// Hook for boolean feature flags
export const useFeatureFlag = (
  flagKey: string,
  defaultValue: boolean = false,
  context?: EvaluationContext
): boolean => {
  const { client, isReady } = useOpenFeature();
  const [flagValue, setFlagValue] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const evaluateFlag = async () => {
      try {
        const evaluation = await client.getBooleanValue(flagKey, defaultValue, context);
        setFlagValue(evaluation);

        // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
        console.log(`🔍 DEBUG_EXPERIMENT: OpenFeature flag '${flagKey}' evaluated to:`, evaluation);
      } catch (error) {
        console.error(`Error evaluating feature flag '${flagKey}':`, error);
        setFlagValue(defaultValue);
      }
    };

    evaluateFlag();

    // Listen for flag value changes
    const handleFlagChange = () => {
      evaluateFlag();
    };

    client.addHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);

    return () => {
      client.removeHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);
    };
  }, [client, isReady, flagKey, defaultValue, context]);

  return flagValue;
};

// Hook for string feature flags
export const useStringFeatureFlag = (
  flagKey: string,
  defaultValue: string = '',
  context?: EvaluationContext
): string => {
  const { client, isReady } = useOpenFeature();
  const [flagValue, setFlagValue] = useState<string>(defaultValue);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const evaluateFlag = async () => {
      try {
        const evaluation = await client.getStringValue(flagKey, defaultValue, context);
        setFlagValue(evaluation);

        // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
        console.log(`🔍 DEBUG_EXPERIMENT: OpenFeature string flag '${flagKey}' evaluated to:`, evaluation);
      } catch (error) {
        console.error(`Error evaluating string feature flag '${flagKey}':`, error);
        setFlagValue(defaultValue);
      }
    };

    evaluateFlag();

    // Listen for flag value changes
    const handleFlagChange = () => {
      evaluateFlag();
    };

    client.addHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);

    return () => {
      client.removeHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);
    };
  }, [client, isReady, flagKey, defaultValue, context]);

  return flagValue;
};

// Hook for number feature flags
export const useNumberFeatureFlag = (
  flagKey: string,
  defaultValue: number = 0,
  context?: EvaluationContext
): number => {
  const { client, isReady } = useOpenFeature();
  const [flagValue, setFlagValue] = useState<number>(defaultValue);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const evaluateFlag = async () => {
      try {
        const evaluation = await client.getNumberValue(flagKey, defaultValue, context);
        setFlagValue(evaluation);

        // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
        console.log(`🔍 DEBUG_EXPERIMENT: OpenFeature number flag '${flagKey}' evaluated to:`, evaluation);
      } catch (error) {
        console.error(`Error evaluating number feature flag '${flagKey}':`, error);
        setFlagValue(defaultValue);
      }
    };

    evaluateFlag();

    // Listen for flag value changes
    const handleFlagChange = () => {
      evaluateFlag();
    };

    client.addHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);

    return () => {
      client.removeHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);
    };
  }, [client, isReady, flagKey, defaultValue, context]);

  return flagValue;
};

// Hook for generic feature flag values
export const useFeatureValue = <T extends FlagValue>(
  flagKey: string,
  defaultValue: T,
  context?: EvaluationContext
): T => {
  const { client, isReady } = useOpenFeature();
  const [flagValue, setFlagValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const evaluateFlag = async () => {
      try {
        let evaluation: T;

        if (typeof defaultValue === 'boolean') {
          evaluation = await client.getBooleanValue(flagKey, defaultValue as boolean, context) as T;
        } else if (typeof defaultValue === 'string') {
          evaluation = await client.getStringValue(flagKey, defaultValue as string, context) as T;
        } else if (typeof defaultValue === 'number') {
          evaluation = await client.getNumberValue(flagKey, defaultValue as number, context) as T;
        } else {
          evaluation = await client.getObjectValue(flagKey, defaultValue as object, context) as T;
        }

        setFlagValue(evaluation);

        // TODO: REMOVE_DEBUG_LOGS - Remove after experiment debugging
        console.log(`🔍 DEBUG_EXPERIMENT: OpenFeature generic flag '${flagKey}' evaluated to:`, evaluation);
      } catch (error) {
        console.error(`Error evaluating feature value '${flagKey}':`, error);
        setFlagValue(defaultValue);
      }
    };

    evaluateFlag();

    // Listen for flag value changes
    const handleFlagChange = () => {
      evaluateFlag();
    };

    client.addHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);

    return () => {
      client.removeHandler('PROVIDER_CONFIGURATION_CHANGED', handleFlagChange);
    };
  }, [client, isReady, flagKey, defaultValue, context]);

  return flagValue;
};

// Backward compatibility alias for existing GrowthBook usage
export const useFeatureIsOn = (flagKey: string, defaultValue: boolean = false, context?: EvaluationContext): boolean => {
  return useFeatureFlag(flagKey, defaultValue, context);
};
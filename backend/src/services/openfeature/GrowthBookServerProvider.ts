import {
  Provider,
  ResolutionDetails,
  EvaluationContext,
  JsonValue,
  Logger,
  ErrorCode,
  StandardResolutionReasons,
} from '@openfeature/server-sdk';
import { GrowthBook, GrowthBookClient } from '@growthbook/growthbook';

/**
 * Custom OpenFeature provider for GrowthBook server-side SDK
 * Wraps GrowthBook evaluation to provide vendor-agnostic feature flag access
 */
export class GrowthBookServerProvider implements Provider {
  readonly runsOn = 'server' as const;
  readonly metadata = {
    name: 'GrowthBook Server Provider',
  } as const;

  constructor(private gbClient: GrowthBookClient) {}

  /**
   * Creates a request-scoped GrowthBook instance from OpenFeature evaluation context
   */
  private createScopedInstance(context: EvaluationContext): GrowthBook {
    // Convert OpenFeature context to GrowthBook attributes
    const attributes: Record<string, any> = {
      ...context,
    };

    // OpenFeature uses targetingKey as the primary identifier
    if (context.targetingKey) {
      attributes.id = context.targetingKey;
    }

    return this.gbClient.createScopedInstance({
      attributes,
      trackingCallback: undefined, // Suppress tracking on server-side
    });
  }

  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<boolean>> {
    try {
      const gb = this.createScopedInstance(context);
      const result = gb.evalFeature(flagKey);

      // Build flag metadata for frontend experiment tracking
      const flagMetadata: Record<string, any> = {};
      if (result.experimentResult && result.experiment && result.experiment.key) {
        flagMetadata.experimentId = result.experiment.key;
        flagMetadata.variationId = String(result.experimentResult.variationId ?? result.experimentResult.key ?? '');
        flagMetadata.experimentName = result.experiment.name;
        flagMetadata.inExperiment = result.experimentResult.inExperiment;
      }

      return {
        value: result.value ?? defaultValue,
        reason: result.source === 'experiment'
          ? StandardResolutionReasons.TARGETING_MATCH
          : StandardResolutionReasons.DEFAULT,
        flagMetadata: Object.keys(flagMetadata).length > 0 ? flagMetadata : undefined,
      };
    } catch (error) {
      logger.error(`Error evaluating boolean flag "${flagKey}":`, error);
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.GENERAL,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<string>> {
    try {
      const gb = this.createScopedInstance(context);
      const result = gb.evalFeature(flagKey);

      return {
        value: result.value ?? defaultValue,
        reason: result.source === 'experiment'
          ? StandardResolutionReasons.TARGETING_MATCH
          : StandardResolutionReasons.DEFAULT,
      };
    } catch (error) {
      logger.error(`Error evaluating string flag "${flagKey}":`, error);
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.GENERAL,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<number>> {
    try {
      const gb = this.createScopedInstance(context);
      const result = gb.evalFeature(flagKey);

      return {
        value: result.value ?? defaultValue,
        reason: result.source === 'experiment'
          ? StandardResolutionReasons.TARGETING_MATCH
          : StandardResolutionReasons.DEFAULT,
      };
    } catch (error) {
      logger.error(`Error evaluating number flag "${flagKey}":`, error);
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.GENERAL,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<T>> {
    try {
      const gb = this.createScopedInstance(context);
      const result = gb.evalFeature(flagKey);

      return {
        value: result.value ?? defaultValue,
        reason: result.source === 'experiment'
          ? StandardResolutionReasons.TARGETING_MATCH
          : StandardResolutionReasons.DEFAULT,
      };
    } catch (error) {
      logger.error(`Error evaluating object flag "${flagKey}":`, error);
      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode: ErrorCode.GENERAL,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

# OpenFeature Integration Plan

## Overview
Integrate OpenFeature as a vendor-agnostic abstraction layer for feature flags, wrapping the existing GrowthBook server-side implementation to enable easy switching between feature flag providers in the future.

## Current GrowthBook Integration (Server-Side)

**Backend Architecture:**
- `backend/src/services/featureFlags.ts`: Singleton `FeatureFlagService` using `GrowthBookClient`
- `backend/src/middleware/userContext.ts`: Creates request-scoped `GrowthBook` instances with user attributes
- `backend/src/routes/products.ts`: Evaluates `remove-quick-links` feature flag using `req.growthbook.evalFeature()`
- Tracking suppressed on server (`trackingCallback: undefined`)
- Returns experiment metadata to frontend in API responses

**Frontend Architecture:**
- No GrowthBook SDK installed
- `frontend/src/services/experimentTracking.ts`: Custom tracker for exposure events
- `frontend/src/hooks/useExperimentExposure.ts`: Visibility-based or immediate tracking
- `frontend/src/pages/HomePage.tsx`: Tracks exposures when experiments received

## OpenFeature Background

**What is OpenFeature:**
- Vendor-agnostic feature flag specification providing standardized SDK
- Acts as abstraction layer between application code and feature flag providers
- Enables switching providers without changing application code
- Supports evaluation context for user targeting
- Extensible via custom providers and hooks

**GrowthBook OpenFeature Provider Status:**
- **Client-side**: `@openfeature/growthbook-client-provider` exists
- **Server-side**: No official GrowthBook provider for Node.js server SDK exists yet
- **Solution**: Create custom OpenFeature provider wrapping GrowthBook Node.js SDK

## Integration Plan

### Phase 1: Install Dependencies
```bash
cd backend
npm install @openfeature/server-sdk
```

**Dependencies Added:**
- `@openfeature/server-sdk`: OpenFeature Node.js server SDK

### Phase 2: Create Custom GrowthBook Provider

**New File:** `backend/src/services/openfeature/GrowthBookServerProvider.ts`

Implement OpenFeature `Provider` interface:
- `runsOn: 'server'` property for runtime validation
- `metadata.name` property identifying the provider
- `resolveBooleanEvaluation()` method wrapping `GrowthBook.evalFeature()`
- `resolveStringEvaluation()` method for string flags
- `resolveNumberEvaluation()` method for numeric flags
- `resolveObjectEvaluation()` method for JSON flags
- Map OpenFeature `EvaluationContext` to GrowthBook attributes
- Maintain tracking suppression (no `trackingCallback`)
- Extract experiment metadata for frontend tracking

**Key Implementation Details:**
```typescript
import { Provider, ResolutionDetails, EvaluationContext } from '@openfeature/server-sdk';
import { GrowthBook, GrowthBookClient } from '@growthbook/growthbook';

class GrowthBookServerProvider implements Provider {
  readonly runsOn = 'server';
  readonly metadata = { name: 'GrowthBook Server Provider' };

  constructor(private gbClient: GrowthBookClient) {}

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext
  ): Promise<ResolutionDetails<boolean>> {
    // Create scoped GrowthBook instance
    // Evaluate feature
    // Return OpenFeature-compatible result
  }
}
```

**New File:** `backend/src/services/openfeature/index.ts`
- Export `GrowthBookServerProvider`
- Export initialization utilities

### Phase 3: Update Feature Flag Service

**Modify:** `backend/src/services/featureFlags.ts`

Changes:
- Keep existing `GrowthBookClient` initialization
- Remove `createScopedInstance()` method (handled by provider)
- Add method to create `GrowthBookServerProvider` instance
- Export provider for OpenFeature initialization

```typescript
// OLD:
createScopedInstance(attributes: Record<string, any>): GrowthBook {
  return this.gbClient.createScopedInstance({
    attributes,
    trackingCallback: undefined
  });
}

// NEW:
getProvider(): GrowthBookServerProvider {
  return new GrowthBookServerProvider(this.gbClient);
}
```

### Phase 4: Update Middleware

**Modify:** `backend/src/middleware/userContext.ts`

Changes:
- Import OpenFeature SDK
- Replace `req.growthbook` with `req.openFeatureClient`
- Create OpenFeature client with evaluation context
- Update TypeScript interface for Express Request

```typescript
// OLD:
req.growthbook = featureFlagService.createScopedInstance({
  anonymous_id: req.anonymousId,
  id: req.anonymousId
});

// NEW:
import { OpenFeature } from '@openfeature/server-sdk';

const client = OpenFeature.getClient();
await client.setContext({
  targetingKey: req.anonymousId,
  anonymous_id: req.anonymousId,
  id: req.anonymousId
});
req.openFeatureClient = client;
```

**TypeScript Interface Update:**
```typescript
declare module 'express-serve-static-core' {
  interface Request {
    anonymousId?: string;
    openFeatureClient?: Client;  // Changed from growthbook
  }
}
```

### Phase 5: Refactor Routes

**Modify:** `backend/src/routes/products.ts`

Changes:
- Replace `req.growthbook.evalFeature()` with OpenFeature API
- Use `getBooleanValue()` for simple boolean evaluation
- Use `getBooleanDetails()` to get experiment metadata
- Build experiment metadata object from OpenFeature response

```typescript
// OLD:
if (featured === 'true' && req.growthbook) {
  const result = req.growthbook.evalFeature('remove-quick-links');
  const shouldHideCategories = result.value;

  if (result.experimentResult && result.experiment && result.experiment.key) {
    experiments = {
      'remove-quick-links': {
        experiment_id: result.experiment.key,
        variation_id: String(result.experimentResult.variationId),
        value: shouldHideCategories
      }
    };
  }
}

// NEW:
if (featured === 'true' && req.openFeatureClient) {
  const details = await req.openFeatureClient.getBooleanDetails(
    'remove-quick-links',
    false
  );
  const shouldHideCategories = details.value;

  // Extract experiment metadata from details.flagMetadata or details.reason
  if (details.flagMetadata?.experimentId) {
    experiments = {
      'remove-quick-links': {
        experiment_id: details.flagMetadata.experimentId,
        variation_id: details.flagMetadata.variationId,
        value: shouldHideCategories
      }
    };
  }
}
```

### Phase 6: Update Main Server

**Modify:** `backend/src/index.ts`

Changes:
- Import OpenFeature
- Initialize OpenFeature with custom provider on startup
- Set provider before server starts listening

```typescript
import { OpenFeature } from '@openfeature/server-sdk';
import { featureFlagService } from './services/featureFlags.js';

app.listen(PORT, async () => {
  console.log(`🚀 CubeCraft API server running on port ${PORT}`);

  // Initialize feature flag service
  try {
    await featureFlagService.initialize();

    // Initialize OpenFeature with GrowthBook provider
    const provider = featureFlagService.getProvider();
    await OpenFeature.setProviderAndWait(provider);
    console.log('✅ OpenFeature initialized with GrowthBook provider');
  } catch (error) {
    console.error('Failed to initialize feature flags:', error);
  }
});
```

## Files Summary

### New Files (2)
1. `backend/src/services/openfeature/GrowthBookServerProvider.ts` - Custom OpenFeature provider
2. `backend/src/services/openfeature/index.ts` - Provider exports

### Modified Files (4)
1. `backend/src/services/featureFlags.ts` - Add provider getter method
2. `backend/src/middleware/userContext.ts` - Use OpenFeature client instead of GrowthBook
3. `backend/src/routes/products.ts` - Replace GrowthBook API with OpenFeature API
4. `backend/src/index.ts` - Initialize OpenFeature on startup

### Unchanged (Frontend)
- No frontend changes required
- Experiment tracking continues to work as-is
- API contract remains the same

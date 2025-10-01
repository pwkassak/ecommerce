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

## Implementation Architecture

This section explains how the OpenFeature implementation works now that it's complete.

### 1. Server Initialization (`backend/src/index.ts`)

**Lines 6, 65-71**: OpenFeature initialization on server startup
- Imports `OpenFeature` from `@openfeature/server-sdk`
- Calls `featureFlagService.initialize()` to load features from GrowthBook
- Calls `featureFlagService.getProvider()` to create custom provider instance
- Calls `OpenFeature.setProviderAndWait(provider)` to register provider globally
- **Why**: OpenFeature must be initialized once at startup with a provider before any feature evaluation can occur

### 2. Feature Flag Service (`backend/src/services/featureFlags.ts`)

**Lines 1-2**: Imports
- Imports `GrowthBookClient` from GrowthBook SDK
- Imports custom `GrowthBookServerProvider` from OpenFeature directory

**Lines 7-20**: `initialize()` method
- Creates `GrowthBookClient` instance with API host and client key
- Calls `gbClient.init()` to fetch features from GrowthBook API
- **Why**: `GrowthBookClient` must load feature definitions before evaluations can occur

**Lines 22-29**: `getProvider()` method
- Returns new instance of `GrowthBookServerProvider` wrapping the `GrowthBookClient`
- **Why**: Provides the custom provider to OpenFeature for registration

### 3. Custom OpenFeature Provider (`backend/src/services/openfeature/GrowthBookServerProvider.ts`)

**Lines 13-18**: Provider metadata
- `runsOn = 'server'`: Ensures provider is only used in server context
- `metadata.name`: Identifies provider as "GrowthBook Server Provider"
- **Why**: OpenFeature requires providers to declare their runtime environment

**Lines 20-23**: Constructor
- Accepts `GrowthBookClient` instance
- **Why**: Provider needs access to initialized GrowthBook client to evaluate features

**Lines 28-42**: `createScopedInstance()` private method
- Converts OpenFeature `EvaluationContext` to GrowthBook attributes format
- Maps `targetingKey` to `id` for GrowthBook compatibility
- Creates request-scoped `GrowthBook` instance with `trackingCallback: undefined`
- **Why**: Each request needs isolated evaluation context; tracking suppressed because frontend handles exposure events

**Lines 44-76**: `resolveBooleanEvaluation()` method
- Creates scoped GrowthBook instance from evaluation context
- Calls `gb.evalFeature(flagKey)` to evaluate feature flag
- Extracts experiment metadata from GrowthBook result
- Returns OpenFeature-compatible `ResolutionDetails` object with `flagMetadata`
- **Why**: Translates between OpenFeature API and GrowthBook SDK; preserves experiment metadata for frontend tracking

**Lines 78-157**: Other resolution methods (`resolveStringEvaluation`, `resolveNumberEvaluation`, `resolveObjectEvaluation`)
- Follow same pattern as boolean evaluation
- **Why**: OpenFeature spec requires providers to support all flag types

### 4. User Context Middleware (`backend/src/middleware/userContext.ts`)

**Lines 2**: Imports
- Imports `OpenFeature` and `Client` from OpenFeature SDK
- **Why**: Middleware creates OpenFeature clients for each request

**Lines 5-9**: TypeScript interface extension
- Extends Express `Request` to include `openFeatureClient` property
- **Why**: Attaches OpenFeature client to request object for use in route handlers

**Lines 23-40**: Middleware logic
- Extracts `anonymous_id` from request headers
- Calls `OpenFeature.getClient()` to get OpenFeature client instance
- Calls `client.setContext()` with user attributes (`targetingKey`, `anonymous_id`, `id`)
- Attaches client to `req.openFeatureClient`
- **Why**: Each request needs its own evaluation context based on the user making the request; context is set per-request to enable user-specific targeting

### 5. Route Handler (`backend/src/routes/products.ts`)

**Lines 43-77**: Feature flag evaluation
- Checks if `req.openFeatureClient` exists (user has anonymous ID)
- Calls `await req.openFeatureClient.getBooleanDetails('remove-quick-links', false)`
- Extracts `details.value` for boolean flag result
- Extracts `details.flagMetadata.experimentId` and `details.flagMetadata.variationId`
- Builds `experiments` object for API response to frontend
- Uses flag value to conditionally include categories in response
- **Why**: `getBooleanDetails()` returns both the flag value and metadata; metadata contains experiment info needed for frontend exposure tracking; async evaluation allows provider to perform I/O if needed

**Lines 79-95**: API response construction
- Includes `experiments` object in response when `featured === 'true'`
- **Why**: Frontend needs experiment metadata to track exposure events when content is viewed

### 6. Data Flow Summary

**Request Flow**:
1. Request arrives → `userContextMiddleware` (line 26 in index.ts)
2. Middleware extracts `anonymous_id` from headers
3. Middleware gets OpenFeature client and sets evaluation context
4. Middleware attaches client to `req.openFeatureClient`
5. Request reaches route handler (products.ts line 43)
6. Route calls `req.openFeatureClient.getBooleanDetails()`
7. OpenFeature SDK calls `GrowthBookServerProvider.resolveBooleanEvaluation()`
8. Provider creates scoped GrowthBook instance with user context
9. Provider evaluates flag and extracts experiment metadata
10. Provider returns result to OpenFeature SDK
11. Route handler uses flag value and builds experiment metadata
12. Response sent to frontend with experiments object

**Why This Architecture**:
- **Vendor Portability**: Route handlers use OpenFeature API, not GrowthBook API directly
- **Clean Separation**: Provider encapsulates all GrowthBook-specific logic
- **Preserved Tracking**: Experiment metadata flows through to frontend for proper exposure tracking
- **Per-Request Isolation**: Each request has its own evaluation context for accurate targeting

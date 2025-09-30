# Server-Side GrowthBook Implementation Plan

## Overview
Migrate from client-side to server-side feature flag evaluation using GrowthBook, with accurate exposure tracking on the frontend.

## Core Architecture
- **Backend**: Evaluates feature flags WITHOUT tracking, modifies API responses, includes experiment metadata
- **Frontend**: Tracks exposure events when content is actually visible
- **Analytics**: Events join on `anonymous_id` in ClickHouse

## Phase 1: Backend Feature Flag Service

### 1.1 Install Dependencies
```bash
cd backend
npm install --save @growthbook/growthbook
```

### 1.2 Create Feature Flag Service
**New File**: `backend/src/services/featureFlags.ts`
```typescript
import { GrowthBook } from '@growthbook/growthbook';

class FeatureFlagService {
  private gb: GrowthBook;

  async initialize() {
    this.gb = new GrowthBook({
      apiHost: "http://localhost:3100",
      clientKey: "sdk-0YSHIPiuOSzNPq",
      trackingCallback: null,  // SUPPRESS automatic tracking
      enableDevMode: true
    });
    await this.gb.loadFeatures();
  }

  evaluateFeatures(anonymousId: string) {
    this.gb.setAttributes({
      anonymous_id: anonymousId,
      id: anonymousId
    });

    return {
      'remove-quick-links': {
        experiment_id: 'remove-quick-links',
        variation_id: this.gb.isOn('remove-quick-links') ? 'true' : 'false',
        value: this.gb.isOn('remove-quick-links')
      }
    };
  }
}

export const featureFlagService = new FeatureFlagService();
```

## Phase 2: Backend Integration

### 2.1 Create User Context Middleware
**New File**: `backend/src/middleware/userContext.ts`
```typescript
export const userContextMiddleware = (req, res, next) => {
  req.anonymousId = req.headers['x-anonymous-id'] ||
                     req.cookies?.anonymous_id ||
                     null;
  next();
};
```

### 2.2 Update Main Server
**Modify**: `backend/src/index.ts`
```typescript
import { featureFlagService } from './services/featureFlags.js';
import { userContextMiddleware } from './middleware/userContext.js';

// Initialize feature flags
await featureFlagService.initialize();

// Add middleware
app.use(userContextMiddleware);
```

### 2.3 Update Product Routes
**Modify**: `backend/src/routes/products.ts`
```typescript
// In GET /api/products endpoint
const experiments = req.anonymousId ?
  featureFlagService.evaluateFeatures(req.anonymousId) : {};

const shouldHideCategories = experiments['remove-quick-links']?.value;

res.json({
  success: true,
  data: {
    products: featuredProducts,
    categories: shouldHideCategories ? [] : categoryData
  },
  experiments: experiments
});
```

## Phase 3: Frontend Exposure Tracking

### 3.1 Create Exposure Tracker
**New File**: `frontend/src/services/experimentTracking.ts`
```typescript
class ExperimentTracker {
  private trackedExperiments = new Set<string>();

  async trackExposure(experimentData) {
    const key = `${experimentData.experiment_id}-${experimentData.variation_id}`;

    if (this.trackedExperiments.has(key)) return;

    await fetch('/api/analytics/experiment-assignment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Anonymous-ID': localStorage.getItem('analytics_anonymous_id')
      },
      body: JSON.stringify({
        session_id: sessionStorage.getItem('analytics_session_id'),
        anonymous_id: localStorage.getItem('analytics_anonymous_id'),
        experiment_id: experimentData.experiment_id,
        variation_id: experimentData.variation_id
      })
    });

    this.trackedExperiments.add(key);
  }
}

export const experimentTracker = new ExperimentTracker();
```

### 3.2 Create Visibility Hook
**New File**: `frontend/src/hooks/useExperimentExposure.ts`
```typescript
import { useEffect, RefObject } from 'react';
import { experimentTracker } from '../services/experimentTracking';

export const useExperimentExposure = (
  elementRef: RefObject<HTMLElement>,
  experimentData: any
) => {
  useEffect(() => {
    if (!experimentData || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          experimentTracker.trackExposure(experimentData);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [experimentData]);
};
```

## Phase 4: Update Frontend Components

### 4.1 Update HomePage
**Modify**: `frontend/src/pages/HomePage.tsx`
```typescript
const HomePage = () => {
  const [data, setData] = useState(null);
  const categoriesRef = useRef(null);

  useEffect(() => {
    fetch('/api/products?featured=true', {
      headers: {
        'X-Anonymous-ID': localStorage.getItem('analytics_anonymous_id')
      }
    })
    .then(res => res.json())
    .then(setData);
  }, []);

  // Track exposure when visible
  useExperimentExposure(
    categoriesRef,
    data?.experiments?.['remove-quick-links']
  );

  return (
    <>
      {/* Featured products */}
      <section>
        {data?.data?.products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {/* Categories - rendered based on backend data */}
      {data?.data?.categories?.length > 0 && (
        <section ref={categoriesRef}>
          {data.data.categories.map(category => (
            <Link key={category.id} to={`/categories/${category.id}`}>
              {category.name}
            </Link>
          ))}
        </section>
      )}
    </>
  );
};
```

### 4.2 Clean Up App.tsx
**Modify**: `frontend/src/App.tsx`
- Remove `OpenFeatureProvider` wrapper
- Remove `GrowthBookProvider` wrapper
- Remove related imports

## Phase 5: Remove Old Frontend SDKs

### Files to Delete
- `frontend/src/services/openfeature.ts`
- `frontend/src/services/growthbook.ts`
- `frontend/src/contexts/OpenFeatureContext.tsx`
- `frontend/src/hooks/useOpenFeatureFlags.ts`

### Update package.json
Remove from `frontend/package.json`:
- `@growthbook/growthbook-react`
- `@openfeature/growthbook-client-provider`
- `@openfeature/react-sdk`
- `@openfeature/web-sdk`

## Files Summary

### New Files
- `backend/src/services/featureFlags.ts`
- `backend/src/middleware/userContext.ts`
- `frontend/src/services/experimentTracking.ts`
- `frontend/src/hooks/useExperimentExposure.ts`

### Modified Files
- `backend/package.json`
- `backend/src/index.ts`
- `backend/src/routes/products.ts`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/App.tsx`
- `frontend/package.json`

### Deleted Files
- `frontend/src/services/openfeature.ts`
- `frontend/src/services/growthbook.ts`
- `frontend/src/contexts/OpenFeatureContext.tsx`
- `frontend/src/hooks/useOpenFeatureFlags.ts`
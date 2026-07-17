# Global Location Foundation

The **Global Location Foundation** is a decoupled, robust, and highly secure location orchestration subsystem in JobNest V2. It handles browser geolocation permissions, live position tracking, client-side caching, and telemetry validation.

---

## 🏗️ Architecture & Component Design

The foundation is composed of the following key layers:

```
                  ┌──────────────────────┐
                  │      Root Layout     │
                  └──────────┬───────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │   LocationProvider       │ (Providers context state)
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │     MapProvider          │ (Local MapLibre wrapper)
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │   useCurrentLocation()   │ (React hook API)
                └──────────────────────────┘
```

### 1. `LocationProvider` (`providers/LocationProvider.tsx`)
The global state manager for location coordinates, tracking status, and telemetry verification. It manages:
- **Permission States**: Handles `"loading"`, `"prompt"`, `"granted"`, and `"denied"` browser permissions.
- **Accuracy Auditing**: Integrates accuracy validation (discarding or warning on high-margin GPS drift).
- **Anti-Spoofing checks**: Inspects velocity changes between successive coordinate updates to block impossible GPS jumps.
- **Offline Persistence**: Automatically caches the last successfully fetched location in `localStorage` to ensure immediate availability during poor or non-existent network conditions.

### 2. `MapProvider` (`providers/MapProvider.tsx`)
A global viewport and instance coordinator for MapLibre map configurations.
- Exposes helper actions like `flyTo` and `fitBounds` directly.
- Avoids multiple map re-initializations and keeps viewports synchronized.

### 3. `useCurrentLocation` Hook (`hooks/useCurrentLocation.ts`)
The single source of truth for component geolocation interaction. Re-exports properties from `LocationContext`:

```typescript
export interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permissionStatus: LocationPermissionStatus;
  isSpoofed: boolean;
  isOffline: boolean;
  batteryOptimized: boolean;
  errorMessage: string | null;
  locationSource: LocationSource;
  requestPermission: () => Promise<boolean>;
  updateLocation: (lat: number, lng: number, source: LocationSource) => void;
  refreshLocation: () => Promise<void>;
  toggleBatteryOptimization: () => void;
}
```

---

## 🔒 Security & GPS Telemetry Auditing

### Accuracy Checks
If a GPS update has a coordinate accuracy value exceeding `150` meters, it is flagged as poor/unreliable signal quality to prevent map drift and wrong routing allocations.

### Anti-Velocity Spoofing
JobNest calculates velocity between updates using the Haversine formula. If the calculated speed exceeds `150 m/s` (~540 km/h), the location is flagged as spoofed (`isSpoofed: true`), protecting the system against mock location tools.

---

## 🚀 Usage Guide

### wrapping Layout
The foundation is bundled inside `AppProviders` and wrapped at the root layout level (`app/layout.tsx`). Any page or component under the `/app` router has global access to this context.

### Accessing Geolocation inside Client Components
```typescript
"use client";

import { useCurrentLocation } from "@/hooks/useCurrentLocation";

export default function MyLocationWidget() {
  const { latitude, longitude, permissionStatus, requestPermission } = useCurrentLocation();

  return (
    <div>
      <p>Permission: {permissionStatus}</p>
      {latitude && longitude ? (
        <p>Your Coordinates: {latitude}, {longitude}</p>
      ) : (
        <button onClick={requestPermission}>Enable Location</button>
      )}
    </div>
  );
}
```

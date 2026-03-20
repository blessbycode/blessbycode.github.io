---
title: 'NgRx: The Complete Professional Guide'
published: 2026-02-28
draft: false
tags: ['ngrx', 'angular']
toc: true
description: 'Master state management in Angular 20 with NgRx — covering every concept, pattern, and real-world use case from first principles to production architecture.'
icons: ['angular-icon']
tech: 'angular'
---

## What Is NgRx and Why Does It Exist

Modern Angular applications grow complex fast. A flight booking dashboard needs to share passenger data between the search form, the seat selector, and the payment page. An analytics platform fetches chart data, filters it by date range, sorts it, and updates a sidebar summary — all from different components with no clean way to communicate.

NgRx solves this by providing a **single source of truth**: one central store that holds all application state, updated only through predictable, traceable operations. No more service-to-service injection chains. No more `@Input`/`@Output` prop-drilling through five component layers.

NgRx is built on three foundational ideas:

- **Single source of truth** — the entire application state lives in one object tree
- **State is read-only** — the only way to change state is to dispatch an action
- **Changes are made with pure functions** — reducers take current state and an action, return new state

The data flow is strictly **one-directional**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      NgRx Unidirectional Data Flow                      │
│                                                                         │
│   ┌─────────────┐    dispatch(action)    ┌──────────────────────────┐   │
│   │  Component  │ ──────────────────────►│        Action            │   │
│   │  (View)     │                        │  { type, payload }       │   │
│   └──────┬──────┘                        └────────────┬─────────────┘   │
│          │                                            │                 │
│    select(selector)                                   ▼                 │
│          │                               ┌──────────────────────────┐   │
│          │                               │        Reducer           │   │
│          │                               │  (currentState, action)  │   │
│          │                               │       => newState        │   │
│          │                               └────────────┬─────────────┘   │
│          │                                            │                 │
│   ┌──────┴──────┐                                     ▼                 │
│   │  Selectors  │◄──────────────────────  ┌──────────────────────────┐  │
│   │  (derived   │                         │     Store (AppState)     │  │
│   │   views)    │                         │   Single Source of Truth │  │
│   └─────────────┘                         └────────────┬─────────────┘  │
│                                                        │                │
│                                           ┌────────────▼─────────────┐  │
│                                           │         Effects          │  │
│                                           │  (HTTP, routing, cache)  │  │
│                                           └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

Without NgRx, you might manage state like this — services holding data, components reaching into each other:

```typescript
// ❌ Without NgRx — scattered, unpredictable, untestable
@Component({ ... })
export class BookingComponent {
  constructor(
    private flightService: FlightService,       // holds flight data
    private passengerService: PassengerService,  // holds passenger data
    private priceService: PriceService,          // depends on both above
    private seatService: SeatService,            // depends on flight
  ) {
    // Who owns the state? Which service is the truth?
    // What happens when two services are out of sync?
  }
}
```

With NgRx, everything flows through one predictable pipeline:

```typescript
// ✅ With NgRx — predictable, traceable, testable
@Component({ ... })
export class BookingComponent {
  constructor(private store: Store) {
    // All state in one place. Always consistent. Always traceable.
    this.store.dispatch(BookingActions.loadFlights({ origin: 'ABC', destination: 'XYZ' }));
  }
}
```

## The NgRx Ecosystem — All Packages Explained

NgRx is a suite of packages. You pick the ones you need.

| Package                 | Purpose                                    | When to Use                          |
| ----------------------- | ------------------------------------------ | ------------------------------------ |
| `@ngrx/store`           | Core store — Actions, Reducers, Selectors  | Always, it's the foundation          |
| `@ngrx/effects`         | Side effects — HTTP, routing, localStorage | Whenever you call APIs               |
| `@ngrx/entity`          | Normalized CRUD collections                | Any list/table feature               |
| `@ngrx/router-store`    | Sync Angular Router into Store             | When route params drive data loading |
| `@ngrx/component-store` | Local component-level state                | Complex standalone components        |
| `@ngrx/signals`         | Signal-based store (Angular 17+)           | New projects on Angular 17+          |
| `@ngrx/operators`       | RxJS operators for Effects                 | Always with Effects                  |
| `@ngrx/store-devtools`  | Browser DevTools integration               | Development and debugging            |
| `@ngrx/schematics`      | CLI code generation                        | Speeding up boilerplate              |

```bash
# Install the full NgRx suite
ng add @ngrx/store@latest
ng add @ngrx/effects@latest
ng add @ngrx/entity@latest
ng add @ngrx/store-devtools@latest
ng add @ngrx/router-store@latest
ng add @ngrx/component-store@latest
ng add @ngrx/signals@latest
ng add @ngrx/schematics@latest
```

## Core Concepts — The Four Building Blocks

Every NgRx application — from a simple login form to a multi-tenant SaaS dashboard — is assembled from exactly four primitives. Mastering these is all you need.

```
┌──────────────────────────────────────────────────────────────────┐
│                 The Four NgRx Primitives                         │
│                                                                  │
│  ┌────────────┐   ┌────────────┐   ┌─────────┐   ┌──────────┐  │
│  │  ACTIONS   │   │  REDUCERS  │   │  STORE  │   │SELECTORS │  │
│  │            │   │            │   │         │   │          │  │
│  │ Describe   │   │ Describe   │   │  Holds  │   │ Derive   │  │
│  │   WHAT     │──►│   HOW      │──►│  state  │──►│  views   │  │
│  │ happened   │   │  state     │   │  tree   │   │  of state│  │
│  │            │   │  changes   │   │         │   │          │  │
│  └────────────┘   └────────────┘   └─────────┘   └──────────┘  │
│                                                                  │
│  + EFFECTS — Handle side effects triggered by actions            │
└──────────────────────────────────────────────────────────────────┘
```

| Concept      | Analogy                                                           | Key Rule                                     |
| ------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| **Action**   | A newspaper headline — "User Logged In"                           | Only describes _what_ happened, never _how_  |
| **Reducer**  | A bank ledger — takes current balance + transaction = new balance | Must be pure: no side effects, no mutation   |
| **Store**    | A database — single source of truth                               | Read-only; changed only via actions          |
| **Selector** | A SQL view — computed query over tables                           | Memoized; recomputes only when inputs change |
| **Effect**   | A bank teller — reacts to transactions, calls other systems       | Lives outside the reducer; handles async     |

## Actions — Describing Events in Your Application

An **Action** is an event descriptor. It tells the store _what happened_. Reducers and Effects listen for actions and respond accordingly.

In NgRx v15+, `createActionGroup` is the canonical way to define actions. It co-locates related actions, auto-generates camelCase creators, and provides excellent TypeScript inference.

### Action Type Naming Convention

```
[Source] Event Name
 └────┘  └────────┘
 WHERE   WHAT HAPPENED
```

| Example Type String                         | Source                       | Event                    |
| ------------------------------------------- | ---------------------------- | ------------------------ |
| `[Flight Search Page] Search Flights`       | Flight Search Page component | User initiated a search  |
| `[Flights API] Load Flights Success`        | HTTP effect for flights      | API call succeeded       |
| `[Booking Effects] Confirm Booking Failure` | Booking Effects class        | Confirmation failed      |
| `[Auth Guard] Session Expired`              | Route guard                  | Session timeout detected |

### Basic Action with createAction

```typescript
// src/app/store/flights/flights.actions.ts

import { createAction, props } from '@ngrx/store';

// Simple action — no payload needed
export const clearFlightSearch = createAction('[Flight Search] Clear Search');

// Action with typed payload
export const selectFlight = createAction(
  '[Flight Search] Select Flight',
  props<{ flightId: string }>(), // TypeScript enforces this payload shape
);

// Action with complex payload
export const setPassengerCount = createAction(
  '[Flight Search] Set Passenger Count',
  props<{ adults: number; children: number; infants: number }>(),
);
```

### Action Groups — The Modern NgRx v15+ Approach

```typescript
// src/app/store/flights/flights.actions.ts

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Flight, FlightSearchParams, SeatMap } from '../../models/flight.model';

export const FlightActions = createActionGroup({
  source: 'Flights', // becomes the prefix: [Flights]
  events: {
    // ── Search ─────────────────────────────────────────────────────
    // emptyProps() for actions carrying no data
    'Load Flights': props<{ params: FlightSearchParams }>(),
    'Load Flights Success': props<{ flights: Flight[] }>(),
    'Load Flights Failure': props<{ error: string }>(),

    // ── Selection ──────────────────────────────────────────────────
    'Select Flight': props<{ flightId: string }>(),
    'Deselect Flight': emptyProps(),

    // ── Seat Map ───────────────────────────────────────────────────
    'Load Seat Map': props<{ flightId: string }>(),
    'Load Seat Map Success': props<{ seatMap: SeatMap }>(),
    'Load Seat Map Failure': props<{ error: string }>(),
    'Select Seat': props<{ seatNumber: string; passengerId: string }>(),
    'Deselect Seat': props<{ passengerId: string }>(),

    // ── Booking ────────────────────────────────────────────────────
    'Confirm Booking': emptyProps(),
    'Confirm Booking Success': props<{ bookingReference: string }>(),
    'Confirm Booking Failure': props<{ error: string }>(),
  },
});

// NgRx auto-generates camelCase creators from the event names:
// FlightActions.loadFlights({ params })
// FlightActions.loadFlightsSuccess({ flights })
// FlightActions.selectFlight({ flightId })
// FlightActions.confirmBookingSuccess({ bookingReference })
```

```typescript
// src/app/store/analytics/analytics.actions.ts
// Real-world example: analytics dashboard with multiple data sources

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  MetricCard,
  ChartDataset,
  DateRange,
  ReportFilter,
  ExportFormat,
} from '../../models/analytics.model';

export const AnalyticsActions = createActionGroup({
  source: 'Analytics',
  events: {
    // Dashboard initialization
    'Initialize Dashboard': props<{ userId: string }>(),
    'Initialize Dashboard Success': props<{ metrics: MetricCard[] }>(),
    'Initialize Dashboard Failure': props<{ error: string }>(),

    // Date range controls
    'Set Date Range': props<{ range: DateRange }>(),
    'Set Comparison Period': props<{ enabled: boolean }>(),

    // Chart data
    'Load Revenue Chart': props<{
      range: DateRange;
      granularity: 'day' | 'week' | 'month';
    }>(),
    'Load Revenue Chart Success': props<{ dataset: ChartDataset }>(),
    'Load Revenue Chart Failure': props<{ error: string }>(),

    'Load User Growth Chart': props<{ range: DateRange }>(),
    'Load User Growth Chart Success': props<{ dataset: ChartDataset }>(),
    'Load User Growth Chart Failure': props<{ error: string }>(),

    // Filters
    'Apply Filter': props<{ filter: ReportFilter }>(),
    'Remove Filter': props<{ filterId: string }>(),
    'Clear All Filters': emptyProps(),

    // Export
    'Export Report': props<{ format: ExportFormat; filters: ReportFilter[] }>(),
    'Export Report Success': props<{ downloadUrl: string }>(),
    'Export Report Failure': props<{ error: string }>(),
  },
});
```

## Reducers — Pure State Transition Functions

A **Reducer** takes the current state and an action, and returns **new** state. It is a pure function — no HTTP calls, no random values, no mutation of the original state object.

```typescript
(previousState, action) => nextState;
```

The `on()` handler inside `createReducer` uses Immer under the hood in NgRx v8+, making the spread syntax the standard for immutable updates.

### Comparison: Right vs Wrong Reducer Patterns

| Pattern                | Code                                                                | Correct? |
| ---------------------- | ------------------------------------------------------------------- | -------- |
| Return new object      | `return { ...state, loading: true }`                                | ✅       |
| Mutate directly        | `state.loading = true; return state`                                | ❌       |
| New array on add       | `items: [...state.items, newItem]`                                  | ✅       |
| Push to existing array | `state.items.push(newItem)`                                         | ❌       |
| Map for updates        | `items: state.items.map(i => i.id === id ? {...i, ...changes} : i)` | ✅       |
| Modify in-place        | `state.items.find(i => i.id === id).name = name`                    | ❌       |

### Flight Booking Reducer

```typescript
// src/app/store/flights/flights.reducer.ts

import { createReducer, on } from '@ngrx/store';
import { FlightActions } from './flights.actions';
import { Flight, SeatMap, SeatSelection } from '../../models/flight.model';

// Define the exact shape of this state slice
export interface FlightsState {
  // Search results
  availableFlights: Flight[];
  searchLoading: boolean;
  searchError: string | null;

  // Selection
  selectedFlightId: string | null;

  // Seat map
  seatMap: SeatMap | null;
  seatMapLoading: boolean;
  seatSelections: SeatSelection[]; // { passengerId, seatNumber }[]

  // Booking
  bookingReference: string | null;
  bookingLoading: boolean;
  bookingError: string | null;
}

export const initialState: FlightsState = {
  availableFlights: [],
  searchLoading: false,
  searchError: null,
  selectedFlightId: null,
  seatMap: null,
  seatMapLoading: false,
  seatSelections: [],
  bookingReference: null,
  bookingLoading: false,
  bookingError: null,
};

export const flightsReducer = createReducer(
  initialState,

  // ── Search handlers ─────────────────────────────────────────────
  on(FlightActions.loadFlights, (state) => ({
    ...state,
    searchLoading: true,
    searchError: null,
    availableFlights: [], // clear previous results
    selectedFlightId: null, // clear previous selection
  })),

  on(FlightActions.loadFlightsSuccess, (state, { flights }) => ({
    ...state,
    availableFlights: flights,
    searchLoading: false,
  })),

  on(FlightActions.loadFlightsFailure, (state, { error }) => ({
    ...state,
    searchLoading: false,
    searchError: error,
  })),

  // ── Selection handlers ──────────────────────────────────────────
  on(FlightActions.selectFlight, (state, { flightId }) => ({
    ...state,
    selectedFlightId: flightId,
    seatMap: null, // clear old seat map
    seatSelections: [], // clear previous seat selections
  })),

  on(FlightActions.deselectFlight, (state) => ({
    ...state,
    selectedFlightId: null,
    seatMap: null,
    seatSelections: [],
  })),

  // ── Seat map handlers ───────────────────────────────────────────
  on(FlightActions.loadSeatMap, (state) => ({
    ...state,
    seatMapLoading: true,
  })),

  on(FlightActions.loadSeatMapSuccess, (state, { seatMap }) => ({
    ...state,
    seatMap,
    seatMapLoading: false,
  })),

  on(FlightActions.loadSeatMapFailure, (state, { error }) => ({
    ...state,
    seatMapLoading: false,
    searchError: error,
  })),

  // Add or replace seat selection for a passenger
  on(FlightActions.selectSeat, (state, { seatNumber, passengerId }) => {
    // Remove any previous selection for this passenger
    const withoutPassenger = state.seatSelections.filter(
      (s) => s.passengerId !== passengerId,
    );
    return {
      ...state,
      // Add the new selection
      seatSelections: [...withoutPassenger, { seatNumber, passengerId }],
    };
  }),

  on(FlightActions.deselectSeat, (state, { passengerId }) => ({
    ...state,
    seatSelections: state.seatSelections.filter(
      (s) => s.passengerId !== passengerId,
    ),
  })),

  // ── Booking handlers ────────────────────────────────────────────
  on(FlightActions.confirmBooking, (state) => ({
    ...state,
    bookingLoading: true,
    bookingError: null,
  })),

  on(FlightActions.confirmBookingSuccess, (state, { bookingReference }) => ({
    ...state,
    bookingLoading: false,
    bookingReference,
  })),

  on(FlightActions.confirmBookingFailure, (state, { error }) => ({
    ...state,
    bookingLoading: false,
    bookingError: error,
  })),
);
```

### Analytics Dashboard Reducer

```typescript
// src/app/store/analytics/analytics.reducer.ts

import { createReducer, on } from '@ngrx/store';
import { AnalyticsActions } from './analytics.actions';
import {
  MetricCard,
  ChartDataset,
  DateRange,
  ReportFilter,
} from '../../models/analytics.model';

export interface AnalyticsState {
  metrics: MetricCard[];
  metricsLoading: boolean;

  revenueChart: ChartDataset | null;
  revenueChartLoading: boolean;

  userGrowthChart: ChartDataset | null;
  userGrowthChartLoading: boolean;

  dateRange: DateRange;
  comparisonEnabled: boolean;

  activeFilters: ReportFilter[];
  exportLoading: boolean;
  exportUrl: string | null;

  error: string | null;
}

export const initialState: AnalyticsState = {
  metrics: [],
  metricsLoading: false,
  revenueChart: null,
  revenueChartLoading: false,
  userGrowthChart: null,
  userGrowthChartLoading: false,
  dateRange: { start: new Date(), end: new Date() },
  comparisonEnabled: false,
  activeFilters: [],
  exportLoading: false,
  exportUrl: null,
  error: null,
};

export const analyticsReducer = createReducer(
  initialState,

  on(AnalyticsActions.initializeDashboard, (state) => ({
    ...state,
    metricsLoading: true,
    error: null,
  })),

  on(AnalyticsActions.initializeDashboardSuccess, (state, { metrics }) => ({
    ...state,
    metrics,
    metricsLoading: false,
  })),

  on(AnalyticsActions.initializeDashboardFailure, (state, { error }) => ({
    ...state,
    metricsLoading: false,
    error,
  })),

  // Date range change — triggers new chart loads via Effects
  on(AnalyticsActions.setDateRange, (state, { range }) => ({
    ...state,
    dateRange: range,
    // Clear old chart data when range changes (stale data looks bad)
    revenueChart: null,
    userGrowthChart: null,
  })),

  on(AnalyticsActions.setComparisonPeriod, (state, { enabled }) => ({
    ...state,
    comparisonEnabled: enabled,
  })),

  on(AnalyticsActions.loadRevenueChart, (state) => ({
    ...state,
    revenueChartLoading: true,
  })),

  on(AnalyticsActions.loadRevenueChartSuccess, (state, { dataset }) => ({
    ...state,
    revenueChart: dataset,
    revenueChartLoading: false,
  })),

  on(AnalyticsActions.loadRevenueChartFailure, (state, { error }) => ({
    ...state,
    revenueChartLoading: false,
    error,
  })),

  on(AnalyticsActions.loadUserGrowthChartSuccess, (state, { dataset }) => ({
    ...state,
    userGrowthChart: dataset,
    userGrowthChartLoading: false,
  })),

  // Filter management — add unique filters only
  on(AnalyticsActions.applyFilter, (state, { filter }) => ({
    ...state,
    activeFilters: [
      ...state.activeFilters.filter((f) => f.id !== filter.id), // remove old
      filter, // add new/updated
    ],
  })),

  on(AnalyticsActions.removeFilter, (state, { filterId }) => ({
    ...state,
    activeFilters: state.activeFilters.filter((f) => f.id !== filterId),
  })),

  on(AnalyticsActions.clearAllFilters, (state) => ({
    ...state,
    activeFilters: [],
  })),

  on(AnalyticsActions.exportReport, (state) => ({
    ...state,
    exportLoading: true,
    exportUrl: null,
  })),

  on(AnalyticsActions.exportReportSuccess, (state, { downloadUrl }) => ({
    ...state,
    exportLoading: false,
    exportUrl: downloadUrl,
  })),

  on(AnalyticsActions.exportReportFailure, (state, { error }) => ({
    ...state,
    exportLoading: false,
    error,
  })),
);
```

## Selectors — Deriving Efficient State Views

**Selectors** are memoized pure functions that derive data from the store. They recompute only when their inputs change, making them highly efficient even for complex derivations.

```
Store State
    │
    ├── createFeatureSelector()  ──► selects an entire feature slice
    │                                (e.g., 'flights' → FlightsState)
    │
    └── createSelector()  ──────────► derives computed data
                                      from one or more selectors
```

The memoization behaviour:

```
First call:   selectExpensiveFlights(state) → computes → caches result
Second call:  selectExpensiveFlights(state) → state unchanged → returns cached result ✓
Third call:   selectExpensiveFlights(newState) → input changed → recomputes → caches
```

### Flight Selectors

```typescript
// src/app/store/flights/flights.selectors.ts

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FlightsState } from './flights.reducer';
import { Flight } from '../../models/flight.model';

// Step 1: Feature selector — selects the entire 'flights' state slice
export const selectFlightsState =
  createFeatureSelector<FlightsState>('flights');

// Step 2: Atomic selectors — each selects one field
export const selectAvailableFlights = createSelector(
  selectFlightsState,
  (state) => state.availableFlights,
);

export const selectSearchLoading = createSelector(
  selectFlightsState,
  (state) => state.searchLoading,
);

export const selectSearchError = createSelector(
  selectFlightsState,
  (state) => state.searchError,
);

export const selectSelectedFlightId = createSelector(
  selectFlightsState,
  (state) => state.selectedFlightId,
);

export const selectSeatMap = createSelector(
  selectFlightsState,
  (state) => state.seatMap,
);

export const selectSeatSelections = createSelector(
  selectFlightsState,
  (state) => state.seatSelections,
);

export const selectBookingLoading = createSelector(
  selectFlightsState,
  (state) => state.bookingLoading,
);

export const selectBookingReference = createSelector(
  selectFlightsState,
  (state) => state.bookingReference,
);

// Step 3: Derived selectors — combine atomic selectors for complex computation
// Finds the selected flight object (O(n) scan, but memoized so runs once per change)
export const selectSelectedFlight = createSelector(
  selectAvailableFlights,
  selectSelectedFlightId,
  (flights, selectedId) =>
    selectedId ? (flights.find((f) => f.id === selectedId) ?? null) : null,
);

// Compute flight count without exposing the whole array
export const selectFlightCount = createSelector(
  selectAvailableFlights,
  (flights) => flights.length,
);

// Sort flights by price — derived, never stored
export const selectFlightsSortedByPrice = createSelector(
  selectAvailableFlights,
  (flights) => [...flights].sort((a, b) => a.price - b.price),
);

// Filter by class — parameterized selector factory
export const selectFlightsByClass = (
  cabinClass: 'economy' | 'business' | 'first',
) =>
  createSelector(selectAvailableFlights, (flights) =>
    flights.filter((f) => f.availableClasses.includes(cabinClass)),
  );

// Check if all passengers have selected seats
export const selectAllSeatsSelected = createSelector(
  selectSeatSelections,
  selectFlightsState,
  (selections, state) => {
    // This would compare against passenger count stored elsewhere
    return selections.length > 0;
  },
);

// Compose a rich ViewModel for the booking summary component
// One selector, one subscription — minimal change detection overhead
export const selectBookingSummaryViewModel = createSelector(
  selectSelectedFlight,
  selectSeatSelections,
  selectBookingLoading,
  selectBookingReference,
  selectFlightsState,
  (flight, seats, loading, reference, state) => ({
    flight,
    seats,
    loading,
    reference,
    bookingError: state.bookingError,
    canConfirm: !!flight && seats.length > 0 && !loading,
    isConfirmed: !!reference,
  }),
);
```

### Analytics Selectors with Complex Derivation

```typescript
// src/app/store/analytics/analytics.selectors.ts

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalyticsState } from './analytics.reducer';

export const selectAnalyticsState =
  createFeatureSelector<AnalyticsState>('analytics');

// Atomic selectors
export const selectMetrics = createSelector(
  selectAnalyticsState,
  (state) => state.metrics,
);

export const selectMetricsLoading = createSelector(
  selectAnalyticsState,
  (state) => state.metricsLoading,
);

export const selectRevenueChart = createSelector(
  selectAnalyticsState,
  (state) => state.revenueChart,
);

export const selectDateRange = createSelector(
  selectAnalyticsState,
  (state) => state.dateRange,
);

export const selectActiveFilters = createSelector(
  selectAnalyticsState,
  (state) => state.activeFilters,
);

export const selectComparisonEnabled = createSelector(
  selectAnalyticsState,
  (state) => state.comparisonEnabled,
);

// Derived: count active filters (used for badge on filter button)
export const selectActiveFilterCount = createSelector(
  selectActiveFilters,
  (filters) => filters.length,
);

// Derived: check if export is loading
export const selectExportLoading = createSelector(
  selectAnalyticsState,
  (state) => state.exportLoading,
);

// Derived: metrics above/below benchmark
export const selectMetricsByHealth = createSelector(
  selectMetrics,
  (metrics) => ({
    healthy: metrics.filter((m) => m.changePercent >= 0),
    declining: metrics.filter((m) => m.changePercent < 0),
  }),
);

// Full dashboard ViewModel — one select in the component
export const selectDashboardViewModel = createSelector(
  selectMetrics,
  selectMetricsLoading,
  selectRevenueChart,
  selectDateRange,
  selectActiveFilters,
  selectComparisonEnabled,
  selectExportLoading,
  selectAnalyticsState,
  (
    metrics,
    metricsLoading,
    revenueChart,
    dateRange,
    filters,
    comparison,
    exportLoading,
    state,
  ) => ({
    metrics,
    metricsLoading,
    revenueChart,
    dateRange,
    filters,
    comparison,
    exportLoading,
    exportUrl: state.exportUrl,
    userGrowthChart: state.userGrowthChart,
    userGrowthLoading: state.userGrowthChartLoading,
    hasFilters: filters.length > 0,
    error: state.error,
  }),
);
```

## Effects — Side Effects Done Right

**Effects** listen to the action stream, perform side effects (API calls, browser storage, navigation), and dispatch new actions in response. They are what keep reducers pure.

```
┌────────────────────────────────────────────────────────────────────┐
│                     Effect Lifecycle                               │
│                                                                    │
│  Actions$ stream                                                   │
│      │                                                             │
│      ├── ofType(FlightActions.loadFlights)  ← filter by type      │
│      │                                                             │
│      ▼                                                             │
│  flightService.search(params)  ← side effect (HTTP)               │
│      │                                                             │
│    ┌─┴──────────────────────┐                                      │
│    │                        │                                      │
│  success                 failure                                   │
│    │                        │                                      │
│    ▼                        ▼                                      │
│  dispatch(               dispatch(                                 │
│    loadFlightsSuccess      loadFlightsFailure                      │
│  )                       )                                         │
└────────────────────────────────────────────────────────────────────┘
```

### Choosing the Right RxJS Operator

This is the single most important decision in Effects.

| Operator     | Behaviour                                                       | Use When                                               |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------ |
| `switchMap`  | Cancels the previous inner observable when a new action arrives | Search, autocomplete, any cancellable request          |
| `exhaustMap` | Ignores new actions while an inner observable is active         | Payment, login, form submit — prevent double execution |
| `concatMap`  | Queues actions, executes one after another in order             | Audit logging, sequential uploads, ordered ops         |
| `mergeMap`   | Runs all actions in parallel, no cancellation                   | Independent parallel requests                          |

```
Should I cancel the previous request?
  YES → switchMap   (search: cancel old result when user types again)
  NO  →
       Can there be concurrent requests?
         NO, one at a time  → exhaustMap  (payment: ignore extra clicks)
         YES, but ordered   → concatMap   (queue: first in, first out)
         YES, unordered     → mergeMap    (parallel: fire all, collect all)
```

### Flight Booking Effects

```typescript
// src/app/store/flights/flights.effects.ts

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  catchError,
  exhaustMap,
  map,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { FlightActions } from './flights.actions';
import { FlightService } from '../../services/flight.service';
import { BookingService } from '../../services/booking.service';
import { SeatService } from '../../services/seat.service';
import {
  selectSeatSelections,
  selectSelectedFlightId,
} from './flights.selectors';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class FlightsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private flightService = inject(FlightService);
  private bookingService = inject(BookingService);
  private seatService = inject(SeatService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  // ── Search ──────────────────────────────────────────────────────
  // switchMap: user can change search params mid-request — cancel old one
  loadFlights$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FlightActions.loadFlights),
      switchMap(
        (
          { params }, // cancel in-flight on new search
        ) =>
          this.flightService.search(params).pipe(
            map((flights) => FlightActions.loadFlightsSuccess({ flights })),
            catchError((error) =>
              of(FlightActions.loadFlightsFailure({ error: error.message })),
            ),
          ),
      ),
    ),
  );

  // ── Seat Map ─────────────────────────────────────────────────────
  // When a flight is selected, automatically load its seat map
  loadSeatMapOnSelect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FlightActions.selectFlight),
      switchMap(({ flightId }) =>
        this.seatService.getSeatMap(flightId).pipe(
          map((seatMap) => FlightActions.loadSeatMapSuccess({ seatMap })),
          catchError((error) =>
            of(FlightActions.loadSeatMapFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  );

  // ── Booking ──────────────────────────────────────────────────────
  // exhaustMap: prevent double-booking if user clicks "Confirm" twice
  confirmBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FlightActions.confirmBooking),
      // withLatestFrom pulls the latest store values without creating a new subscription
      withLatestFrom(
        this.store.select(selectSelectedFlightId),
        this.store.select(selectSeatSelections),
      ),
      exhaustMap(
        (
          [, flightId, seatSelections], // ignore extra clicks
        ) =>
          this.bookingService
            .confirm({ flightId: flightId!, seatSelections })
            .pipe(
              map(({ bookingReference }) =>
                FlightActions.confirmBookingSuccess({ bookingReference }),
              ),
              catchError((error) =>
                of(
                  FlightActions.confirmBookingFailure({ error: error.message }),
                ),
              ),
            ),
      ),
    ),
  );

  // ── Non-dispatching Effects ──────────────────────────────────────
  // { dispatch: false } — this effect must NOT dispatch another action
  // (it would cause an infinite loop if it did)

  navigateToConfirmation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FlightActions.confirmBookingSuccess),
        tap(({ bookingReference }) => {
          this.router.navigate(['/bookings/confirmation', bookingReference]);
        }),
      ),
    { dispatch: false },
  );

  showBookingError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FlightActions.confirmBookingFailure),
        tap(({ error }) => this.notify.error(`Booking failed: ${error}`)),
      ),
    { dispatch: false },
  );

  showSearchError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FlightActions.loadFlightsFailure),
        tap(({ error }) => this.notify.error(`Search failed: ${error}`)),
      ),
    { dispatch: false },
  );
}
```

### Analytics Effects with Complex Patterns

```typescript
// src/app/store/analytics/analytics.effects.ts

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, forkJoin } from 'rxjs';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { AnalyticsActions } from './analytics.actions';
import { AnalyticsService } from '../../services/analytics.service';
import { ExportService } from '../../services/export.service';
import { selectDateRange, selectActiveFilters } from './analytics.selectors';

@Injectable()
export class AnalyticsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private analyticsService = inject(AnalyticsService);
  private exportService = inject(ExportService);

  // Initialize dashboard: load all metrics on entry
  initializeDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.initializeDashboard),
      switchMap(({ userId }) =>
        this.analyticsService.getMetrics(userId).pipe(
          map((metrics) =>
            AnalyticsActions.initializeDashboardSuccess({ metrics }),
          ),
          catchError((error) =>
            of(
              AnalyticsActions.initializeDashboardFailure({
                error: error.message,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // When date range changes, reload ALL charts in parallel (mergeMap)
  // mergeMap fires both requests simultaneously — neither depends on the other
  reloadChartsOnDateChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.setDateRange),
      mergeMap(({ range }) => [
        // Dispatch both load actions simultaneously
        AnalyticsActions.loadRevenueChart({ range, granularity: 'day' }),
        AnalyticsActions.loadUserGrowthChart({ range }),
      ]),
    ),
  );

  // Load revenue chart data
  loadRevenueChart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadRevenueChart),
      switchMap(({ range, granularity }) =>
        this.analyticsService.getRevenueChart(range, granularity).pipe(
          map((dataset) =>
            AnalyticsActions.loadRevenueChartSuccess({ dataset }),
          ),
          catchError((error) =>
            of(
              AnalyticsActions.loadRevenueChartFailure({
                error: error.message,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // Load user growth chart
  loadUserGrowthChart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadUserGrowthChart),
      switchMap(({ range }) =>
        this.analyticsService.getUserGrowthChart(range).pipe(
          map((dataset) =>
            AnalyticsActions.loadUserGrowthChartSuccess({ dataset }),
          ),
          catchError((error) =>
            of(
              AnalyticsActions.loadUserGrowthChartFailure({
                error: error.message,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // Export report — exhaustMap prevents double-export on rapid clicks
  exportReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.exportReport),
      withLatestFrom(this.store.select(selectDateRange)),
      exhaustMap(([{ format, filters }, dateRange]) =>
        this.exportService.export({ format, filters, dateRange }).pipe(
          map(({ downloadUrl }) =>
            AnalyticsActions.exportReportSuccess({ downloadUrl }),
          ),
          catchError((error) =>
            of(AnalyticsActions.exportReportFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  );

  // Auto-download when export URL is ready (non-dispatching)
  triggerDownload$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnalyticsActions.exportReportSuccess),
        tap(({ downloadUrl }) => {
          // Trigger browser download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.click();
        }),
      ),
    { dispatch: false },
  );
}
```

## Store Configuration — Angular 20 Standalone Setup

Angular 20 uses the standalone API exclusively. No more `NgModule`. Everything is configured in `app.config.ts`.

### Application Configuration

```typescript
// src/app/app.config.ts

import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Root-level reducers (always loaded)
import { authReducer } from './store/auth/auth.reducer';
import { uiReducer } from './store/ui/ui.reducer';

// Root-level effects
import { AuthEffects } from './store/auth/auth.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router with component input binding (route params as @Input)
    provideRouter(routes, withComponentInputBinding()),

    // HTTP client with interceptors
    provideHttpClient(withInterceptors([authInterceptor])),

    // NgRx Store — root reducers only
    provideStore({
      auth: authReducer,
      ui: uiReducer,
    }),

    // Root effects
    provideEffects([AuthEffects]),

    // DevTools — only in development mode
    provideStoreDevtools({
      maxAge: 50, // how many past states to retain
      logOnly: !isDevMode(), // production: no time travel
      autoPause: true, // pause when DevTools tab is not focused
      name: 'Flight Booking App',
    }),

    // Sync router state into the NgRx store
    provideRouterStore(),
  ],
};
```

### Route-Level Lazy Feature State

```typescript
// src/app/app.routes.ts
// Feature states are only registered when their route is visited

import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { flightsReducer } from './store/flights/flights.reducer';
import { FlightsEffects } from './store/flights/flights.effects';
import { analyticsReducer } from './store/analytics/analytics.reducer';
import { AnalyticsEffects } from './store/analytics/analytics.effects';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'flights',
    pathMatch: 'full',
  },
  {
    path: 'flights',
    // Lazily loaded component
    loadComponent: () =>
      import('./features/flights/flight-search.component').then(
        (m) => m.FlightSearchComponent,
      ),
    // Feature state registered only when /flights is visited
    providers: [
      provideState('flights', flightsReducer),
      provideEffects([FlightsEffects]),
    ],
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analytics/analytics-dashboard.component').then(
        (m) => m.AnalyticsDashboardComponent,
      ),
    providers: [
      provideState('analytics', analyticsReducer),
      provideEffects([AnalyticsEffects]),
    ],
  },
  {
    path: 'bookings/confirmation/:ref',
    loadComponent: () =>
      import('./features/bookings/booking-confirmation.component').then(
        (m) => m.BookingConfirmationComponent,
      ),
  },
];
```

## Angular 20 Components with NgRx — Modern Control Flow

Angular 20 uses the `@if`, `@for`, `@switch`, and `@defer` block syntax introduced in Angular 17 and now standard. All templates in this guide use this syntax exclusively.

### Flight Search Component

```typescript
// src/app/features/flights/flight-search.component.ts

import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FlightActions } from '../../store/flights/flights.actions';
import {
  selectAvailableFlights,
  selectSearchLoading,
  selectSearchError,
  selectSelectedFlight,
  selectFlightCount,
  selectFlightsSortedByPrice,
} from '../../store/flights/flights.selectors';
import { FlightSearchParams } from '../../models/flight.model';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],

  // OnPush: component only re-renders when a new value is emitted from the store
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="flight-search-page">
      <!-- Search Form -->
      <section class="search-form">
        <h1>Find Your Flight</h1>

        <div class="form-row">
          <input
            [(ngModel)]="searchParams.origin"
            placeholder="From (e.g. ABC)"
          />
          <input
            [(ngModel)]="searchParams.destination"
            placeholder="To (e.g. XYZ)"
          />
          <input type="date" [(ngModel)]="searchParams.departureDate" />
          <button (click)="onSearch()" [disabled]="loading()">
            @if (loading()) {
              Searching...
            } @else {
              Search Flights
            }
          </button>
        </div>
      </section>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <div
            class="spinner"
            role="status"
            aria-label="Searching for flights"
          ></div>
          <p>Finding the best flights for you...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-banner" role="alert">
          <span class="error-icon">⚠</span>
          <p>{{ error() }}</p>
          <button (click)="onSearch()">Try Again</button>
        </div>
      }

      <!-- Results -->
      @if (!loading() && !error()) {
        @if (flightCount() > 0) {
          <section class="results">
            <h2>{{ flightCount() }} flights found</h2>

            <!-- Flight cards — @for replaces *ngFor -->
            @for (flight of sortedFlights(); track flight.id) {
              <div
                class="flight-card"
                [class.selected]="selectedFlight()?.id === flight.id"
                (click)="onSelectFlight(flight.id)"
              >
                <div class="flight-route">
                  <span class="origin">{{ flight.origin }}</span>
                  <span class="arrow">→</span>
                  <span class="destination">{{ flight.destination }}</span>
                </div>

                <div class="flight-times">
                  <span>{{ flight.departureTime | date: 'shortTime' }}</span>
                  <span class="duration">{{ flight.duration }}</span>
                  <span>{{ flight.arrivalTime | date: 'shortTime' }}</span>
                </div>

                <!-- Cabin class badges — @switch replaces ngSwitch -->
                <div class="badges">
                  @for (
                    cabinClass of flight.availableClasses;
                    track cabinClass
                  ) {
                    <span class="badge badge-{{ cabinClass }}">{{
                      cabinClass
                    }}</span>
                  }
                </div>

                <div class="price-row">
                  <span class="price"
                    >from {{ flight.price | currency: 'INR' }}</span
                  >
                  <span class="airline">{{ flight.airline }}</span>
                </div>

                <!-- Availability indicator -->
                @switch (flight.availabilityStatus) {
                  @case ('high') {
                    <span class="availability green">Seats available</span>
                  }
                  @case ('low') {
                    <span class="availability amber"
                      >Only {{ flight.seatsLeft }} left!</span
                    >
                  }
                  @case ('sold-out') {
                    <span class="availability red">Sold out</span>
                  }
                }
              </div>
            } @empty {
              <!-- @empty runs when the @for array is empty -->
              <div class="no-results">
                <p>
                  No flights match your search. Try different dates or airports.
                </p>
              </div>
            }
          </section>
        } @else if (hasSearched()) {
          <!-- Shown after a search returns zero results -->
          <div class="empty-state">
            <h3>No flights found</h3>
            <p>Try adjusting your search criteria.</p>
          </div>
        }
      }

      <!-- Defer: only load seat selector when a flight is selected -->
      <!-- @defer lazy-loads the component when condition is true -->
      @defer (when selectedFlight() !== null) {
        <app-seat-selector [flight]="selectedFlight()!" />
      } @placeholder {
        <!-- Shown while the deferred block hasn't loaded yet -->
        <p class="seat-hint">Select a flight above to choose your seats.</p>
      } @loading (minimum 200ms) {
        <div class="seat-skeleton">Loading seat map...</div>
      }
    </div>
  `,
})
export class FlightSearchComponent implements OnInit {
  private store = inject(Store);

  // Signals from store selectors (Angular 20: store.selectSignal())
  flights = this.store.selectSignal(selectAvailableFlights);
  loading = this.store.selectSignal(selectSearchLoading);
  error = this.store.selectSignal(selectSearchError);
  selectedFlight = this.store.selectSignal(selectSelectedFlight);
  flightCount = this.store.selectSignal(selectFlightCount);
  sortedFlights = this.store.selectSignal(selectFlightsSortedByPrice);

  hasSearched = this.store.selectSignal(
    // Inline derived: did we ever complete a search?
    selectSearchLoading, // placeholder — in real app, use a separate flag
  );

  searchParams: FlightSearchParams = {
    origin: '',
    destination: '',
    departureDate: '',
    passengers: 1,
  };

  ngOnInit(): void {
    // Could restore previous search params from store here
  }

  onSearch(): void {
    this.store.dispatch(
      FlightActions.loadFlights({ params: this.searchParams }),
    );
  }

  onSelectFlight(flightId: string): void {
    this.store.dispatch(FlightActions.selectFlight({ flightId }));
  }
}
```

### Analytics Dashboard Component

```typescript
// src/app/features/analytics/analytics-dashboard.component.ts

import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrencyPipe, PercentPipe, DecimalPipe } from '@angular/common';
import { AnalyticsActions } from '../../store/analytics/analytics.actions';
import {
  selectDashboardViewModel,
  selectMetricsByHealth,
  selectActiveFilterCount,
} from '../../store/analytics/analytics.selectors';
import { MetricCardComponent } from './components/metric-card.component';
import { RevenueChartComponent } from './components/revenue-chart.component';
import { FilterPanelComponent } from './components/filter-panel.component';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    PercentPipe,
    DecimalPipe,
    MetricCardComponent,
    RevenueChartComponent,
    FilterPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="dashboard">
      <!-- Dashboard Header -->
      <header class="dashboard-header">
        <h1>Analytics Dashboard</h1>

        <div class="header-actions">
          <!-- Filter button with active count badge -->
          <button class="filter-btn" (click)="toggleFilters()">
            Filters
            @if (filterCount() > 0) {
              <span class="badge">{{ filterCount() }}</span>
            }
          </button>

          <!-- Export dropdown -->
          <div class="export-menu">
            @if (vm().exportLoading) {
              <button disabled>Exporting...</button>
            } @else {
              <button (click)="exportAs('csv')">Export CSV</button>
              <button (click)="exportAs('pdf')">Export PDF</button>
              <button (click)="exportAs('xlsx')">Export Excel</button>
            }
          </div>

          @if (vm().exportUrl) {
            <a [href]="vm().exportUrl" class="download-ready">
              ↓ Download Ready
            </a>
          }
        </div>
      </header>

      <!-- Filter Panel — deferred until user opens it -->
      @defer (when showFilters) {
        <app-filter-panel
          [filters]="vm().filters"
          (filterApplied)="onFilterApplied($event)"
          (filterRemoved)="onFilterRemoved($event)"
          (cleared)="onClearFilters()"
        />
      }

      <!-- Global Error Banner -->
      @if (vm().error) {
        <div class="error-alert" role="alert">
          <strong>Error:</strong> {{ vm().error }}
        </div>
      }

      <!-- Metric Cards Grid -->
      <section class="metrics-grid">
        @if (vm().metricsLoading) {
          <!-- Skeleton placeholders during load -->
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="metric-skeleton"></div>
          }
        } @else {
          @for (metric of vm().metrics; track metric.id) {
            <app-metric-card
              [metric]="metric"
              [showComparison]="vm().comparison"
            />
          } @empty {
            <p class="no-data">No metrics available for this period.</p>
          }
        }
      </section>

      <!-- Charts Section -->
      <section class="charts">
        <!-- Revenue Chart -->
        <div class="chart-container">
          <h2>Revenue</h2>

          @if (vm().revenueChart) {
            <app-revenue-chart
              [dataset]="vm().revenueChart!"
              [showComparison]="vm().comparison"
            />
          } @else if (!vm().metricsLoading) {
            <div class="chart-empty">
              <p>Select a date range to view revenue data.</p>
            </div>
          }
        </div>

        <!-- User Growth Chart -->
        <div class="chart-container">
          <h2>User Growth</h2>

          @if (vm().userGrowthLoading) {
            <div class="chart-loading">Loading chart...</div>
          } @else if (vm().userGrowthChart) {
            <!-- Deferred: only render chart library once data is ready -->
            @defer (on immediate) {
              <!-- Heavy chart component loaded lazily -->
              <app-user-growth-chart [dataset]="vm().userGrowthChart!" />
            } @loading {
              <div class="chart-loading">Preparing chart...</div>
            }
          }
        </div>
      </section>

      <!-- Health Summary -->
      <section class="health-summary">
        <h2>Metric Health</h2>

        <div class="health-columns">
          <div class="health-column healthy">
            <h3>Trending Up ({{ healthMetrics().healthy.length }})</h3>
            @for (metric of healthMetrics().healthy; track metric.id) {
              <div class="metric-row">
                <span>{{ metric.label }}</span>
                <span class="change positive"
                  >+{{ metric.changePercent | number: '1.1-1' }}%</span
                >
              </div>
            }
          </div>

          <div class="health-column declining">
            <h3>Needs Attention ({{ healthMetrics().declining.length }})</h3>
            @for (metric of healthMetrics().declining; track metric.id) {
              <div class="metric-row">
                <span>{{ metric.label }}</span>
                <span class="change negative"
                  >{{ metric.changePercent | number: '1.1-1' }}%</span
                >
              </div>
            } @empty {
              <p class="all-good">All metrics are healthy 🎉</p>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AnalyticsDashboardComponent implements OnInit {
  private store = inject(Store);

  // selectSignal returns a Signal — no async pipe needed in template
  vm = this.store.selectSignal(selectDashboardViewModel);
  healthMetrics = this.store.selectSignal(selectMetricsByHealth);
  filterCount = this.store.selectSignal(selectActiveFilterCount);

  showFilters = false;

  ngOnInit(): void {
    this.store.dispatch(
      AnalyticsActions.initializeDashboard({ userId: 'current' }),
    );
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onFilterApplied(filter: any): void {
    this.store.dispatch(AnalyticsActions.applyFilter({ filter }));
  }

  onFilterRemoved(filterId: string): void {
    this.store.dispatch(AnalyticsActions.removeFilter({ filterId }));
  }

  onClearFilters(): void {
    this.store.dispatch(AnalyticsActions.clearAllFilters());
  }

  exportAs(format: 'csv' | 'pdf' | 'xlsx'): void {
    this.store.dispatch(
      AnalyticsActions.exportReport({
        format,
        filters: this.vm().filters,
      }),
    );
  }
}
```

## NgRx Entity — Normalized Collection Management

**NgRx Entity** solves the performance and boilerplate problems with large collections. Instead of storing products, users, or bookings as plain arrays, it normalizes them into a dictionary for O(1) lookups.

```
Plain Array (what you'd normally do):
  products = [
    { id: '1', name: 'MacBook Pro' },
    { id: '2', name: 'iPad Air' },
  ]
  Finding product by id: products.find(p => p.id === id)  → O(n)

Entity State (what NgRx Entity does):
  ids      = ['1', '2']
  entities = { '1': { id: '1', name: 'MacBook Pro' }, '2': { id: '2', name: 'iPad Air' } }
  Finding product by id: entities[id]  → O(1) instant lookup
```

### Available Adapter Methods

| Method                                      | Description                           | Equivalent                       |
| ------------------------------------------- | ------------------------------------- | -------------------------------- |
| `adapter.setAll(items, state)`              | Replace entire collection             | `state.items = items`            |
| `adapter.setMany(items, state)`             | Add/update multiple without replacing | Upsert batch                     |
| `adapter.addOne(item, state)`               | Add one entity                        | `items.push(item)`               |
| `adapter.addMany(items, state)`             | Add multiple entities                 | `items.push(...items)`           |
| `adapter.updateOne({ id, changes }, state)` | Partial update of one                 | `items.map(find + spread)`       |
| `adapter.updateMany(updates, state)`        | Partial update of multiple            | Map + spread                     |
| `adapter.upsertOne(item, state)`            | Add if not exists, update if exists   | Combined add/update              |
| `adapter.removeOne(id, state)`              | Remove by ID                          | `items.filter(i => i.id !== id)` |
| `adapter.removeMany(ids, state)`            | Remove multiple by IDs                | `items.filter(...)`              |
| `adapter.removeAll(state)`                  | Clear the collection                  | `items = []`                     |
| `adapter.map(mapFn, state)`                 | Transform all entities                | `items.map(fn)`                  |

### E-Commerce Product Catalog

```typescript
// src/app/models/product.model.ts

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null; // original price before discount
  category: string;
  tags: string[];
  stock: number;
  imageUrls: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  tags?: string[];
}
```

```typescript
// src/app/store/catalog/catalog.reducer.ts

import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { CatalogActions } from './catalog.actions';
import { Product } from '../../models/product.model';

// Create the adapter — tell it how to identify and sort entities
export const adapter: EntityAdapter<Product> = createEntityAdapter<Product>({
  selectId: (product) => product.id, // which field is the unique key
  sortComparer: (a, b) => a.name.localeCompare(b.name), // default sort
});

// EntityState<Product> provides { ids: string[], entities: { [id]: Product } }
export interface CatalogState extends EntityState<Product> {
  selectedProductId: string | null;
  filters: {
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    inStockOnly: boolean;
    searchQuery: string;
  };
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
  };
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialState: CatalogState = adapter.getInitialState({
  selectedProductId: null,
  filters: {
    category: null,
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    searchQuery: '',
  },
  pagination: {
    currentPage: 1,
    pageSize: 24,
    totalCount: 0,
  },
  loading: false,
  saving: false,
  error: null,
});

export const catalogReducer = createReducer(
  initialState,

  on(CatalogActions.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  // adapter.setAll — replaces entire collection in one operation
  on(CatalogActions.loadProductsSuccess, (state, { products, totalCount }) =>
    adapter.setAll(products, {
      ...state,
      loading: false,
      pagination: { ...state.pagination, totalCount },
    }),
  ),

  on(CatalogActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // adapter.addOne — single insert
  on(CatalogActions.createProductSuccess, (state, { product }) =>
    adapter.addOne(product, {
      ...state,
      saving: false,
      pagination: {
        ...state.pagination,
        totalCount: state.pagination.totalCount + 1,
      },
    }),
  ),

  // adapter.updateOne — partial update (only the changed fields)
  on(CatalogActions.updateProductSuccess, (state, { id, changes }) =>
    adapter.updateOne(
      { id, changes }, // changes is Partial<Product>
      { ...state, saving: false },
    ),
  ),

  // adapter.upsertMany — bulk add/update for imports
  on(CatalogActions.importProductsSuccess, (state, { products }) =>
    adapter.upsertMany(products, {
      ...state,
      saving: false,
    }),
  ),

  // adapter.removeOne — delete by ID
  on(CatalogActions.deleteProductSuccess, (state, { id }) =>
    adapter.removeOne(id, {
      ...state,
      pagination: {
        ...state.pagination,
        totalCount: Math.max(0, state.pagination.totalCount - 1),
      },
    }),
  ),

  // adapter.map — transform all entities (e.g., apply a sale discount)
  on(CatalogActions.applyDiscountToAll, (state, { discountPercent }) =>
    adapter.map(
      (product) => ({
        ...product,
        compareAtPrice: product.price, // save original as compareAtPrice
        price:
          Math.round(product.price * (1 - discountPercent / 100) * 100) / 100,
      }),
      state,
    ),
  ),

  on(CatalogActions.selectProduct, (state, { id }) => ({
    ...state,
    selectedProductId: id,
  })),

  on(CatalogActions.setFilter, (state, { filter }) => ({
    ...state,
    filters: { ...state.filters, ...filter },
    pagination: { ...state.pagination, currentPage: 1 }, // reset page on filter change
  })),

  on(CatalogActions.clearFilters, (state) => ({
    ...state,
    filters: initialState.filters,
    pagination: { ...state.pagination, currentPage: 1 },
  })),

  on(CatalogActions.changePage, (state, { page }) => ({
    ...state,
    pagination: { ...state.pagination, currentPage: page },
  })),
);

// Export the adapter's built-in selectors
// These understand the { ids, entities } structure
export const {
  selectIds, // returns the IDs array
  selectEntities, // returns the entities dictionary
  selectAll, // returns all entities as a flat array
  selectTotal, // returns the total count
} = adapter.getSelectors();
```

### Entity Selectors

```typescript
// src/app/store/catalog/catalog.selectors.ts

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CatalogState, selectAll, selectEntities } from './catalog.reducer';

export const selectCatalogState =
  createFeatureSelector<CatalogState>('catalog');

// Use adapter's built-in selectors
export const selectAllProducts = createSelector(selectCatalogState, selectAll);
export const selectProductEntities = createSelector(
  selectCatalogState,
  selectEntities,
);

// Custom field selectors
export const selectFilters = createSelector(
  selectCatalogState,
  (state) => state.filters,
);

export const selectPagination = createSelector(
  selectCatalogState,
  (state) => state.pagination,
);

export const selectCatalogLoading = createSelector(
  selectCatalogState,
  (state) => state.loading,
);

export const selectSelectedProductId = createSelector(
  selectCatalogState,
  (state) => state.selectedProductId,
);

// O(1) dictionary lookup — instant regardless of catalog size
export const selectSelectedProduct = createSelector(
  selectProductEntities,
  selectSelectedProductId,
  (entities, id) => (id ? (entities[id] ?? null) : null),
);

// Find any product by ID (used in product detail page)
export const selectProductById = (id: string) =>
  createSelector(selectProductEntities, (entities) => entities[id] ?? null);

// Filtered products — computed from raw collection + current filters
export const selectFilteredProducts = createSelector(
  selectAllProducts,
  selectFilters,
  (products, filters) => {
    return products.filter((p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.minPrice !== null && p.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
      if (filters.inStockOnly && p.stock === 0) return false;
      if (
        filters.searchQuery &&
        !p.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  },
);

// Products on sale (have a compareAtPrice higher than current price)
export const selectProductsOnSale = createSelector(
  selectAllProducts,
  (products) =>
    products.filter(
      (p) => p.compareAtPrice !== null && p.compareAtPrice > p.price,
    ),
);

// Category list derived from catalog (no duplicates)
export const selectCategories = createSelector(selectAllProducts, (products) =>
  [...new Set(products.map((p) => p.category))].sort(),
);

// Full catalog ViewModel
export const selectCatalogViewModel = createSelector(
  selectFilteredProducts,
  selectCatalogLoading,
  selectFilters,
  selectPagination,
  selectCategories,
  (products, loading, filters, pagination, categories) => ({
    products,
    loading,
    filters,
    pagination,
    categories,
    totalFiltered: products.length,
    hasActiveFilters: !!(
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.inStockOnly ||
      filters.searchQuery
    ),
  }),
);
```

### Product Catalog Component (Angular 20)

```typescript
// src/app/features/catalog/product-catalog.component.ts

import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrencyPipe } from '@angular/common';
import { CatalogActions } from '../../store/catalog/catalog.actions';
import {
  selectCatalogViewModel,
  selectProductById,
} from '../../store/catalog/catalog.selectors';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="catalog-page">
      <!-- Filter Sidebar -->
      <aside class="filters">
        <h2>
          Filters
          @if (vm().hasActiveFilters) {
            <button class="clear-btn" (click)="clearFilters()">
              Clear all
            </button>
          }
        </h2>

        <!-- Category filter -->
        <div class="filter-group">
          <h3>Category</h3>
          @for (category of vm().categories; track category) {
            <label>
              <input
                type="radio"
                name="category"
                [value]="category"
                [checked]="vm().filters.category === category"
                (change)="setFilter({ category })"
              />
              {{ category }}
            </label>
          }
        </div>

        <!-- In-stock toggle -->
        <label class="toggle">
          <input
            type="checkbox"
            [checked]="vm().filters.inStockOnly"
            (change)="setFilter({ inStockOnly: $event.target.checked })"
          />
          In stock only
        </label>
      </aside>

      <!-- Main Content -->
      <main class="catalog-main">
        <!-- Results header -->
        <div class="results-header">
          <p>{{ vm().totalFiltered }} products</p>
          <span
            >Page {{ vm().pagination.currentPage }} of
            {{ Math.ceil(vm().totalFiltered / vm().pagination.pageSize) }}
          </span>
        </div>

        <!-- Loading -->
        @if (vm().loading) {
          <div class="product-grid">
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
              <div class="product-skeleton"></div>
            }
          </div>
        } @else {
          <div class="product-grid">
            @for (product of vm().products; track product.id) {
              <article class="product-card">
                <!-- Product image -->
                <div class="product-image">
                  @if (product.imageUrls.length > 0) {
                    <img
                      [src]="product.imageUrls[0]"
                      [alt]="product.name"
                      loading="lazy"
                    />
                  } @else {
                    <div class="image-placeholder">No image</div>
                  }

                  <!-- Sale badge -->
                  @if (
                    product.compareAtPrice &&
                    product.compareAtPrice > product.price
                  ) {
                    <span class="sale-badge">
                      {{
                        getSalePercent(product.price, product.compareAtPrice)
                      }}% OFF
                    </span>
                  }
                </div>

                <!-- Product info -->
                <div class="product-info">
                  <h3>{{ product.name }}</h3>
                  <p class="category">{{ product.category }}</p>

                  <!-- Rating stars -->
                  <div class="rating">
                    @for (star of getStars(product.rating); track $index) {
                      <span [class]="star">★</span>
                    }
                    <span class="review-count"
                      >({{ product.reviewCount }})</span
                    >
                  </div>

                  <!-- Price display -->
                  <div class="price-display">
                    <span class="current-price">{{
                      product.price | currency
                    }}</span>
                    @if (product.compareAtPrice) {
                      <span class="original-price">{{
                        product.compareAtPrice | currency
                      }}</span>
                    }
                  </div>

                  <!-- Stock status -->
                  @switch (true) {
                    @case (product.stock === 0) {
                      <span class="stock out">Out of stock</span>
                    }
                    @case (product.stock <= 5) {
                      <span class="stock low"
                        >Only {{ product.stock }} left</span
                      >
                    }
                    @default {
                      <span class="stock in">In stock</span>
                    }
                  }

                  <!-- Tags -->
                  @if (product.tags.length > 0) {
                    <div class="tags">
                      @for (tag of product.tags.slice(0, 3); track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                      @if (product.tags.length > 3) {
                        <span class="tag-more"
                          >+{{ product.tags.length - 3 }}</span
                        >
                      }
                    </div>
                  }
                </div>

                <button
                  class="add-to-cart-btn"
                  [disabled]="product.stock === 0"
                  (click)="selectProduct(product.id)"
                >
                  View Product
                </button>
              </article>
            } @empty {
              <div class="empty-catalog">
                <h3>No products found</h3>
                <p>Try adjusting your filters.</p>
                <button (click)="clearFilters()">Clear Filters</button>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (vm().pagination.totalCount > vm().pagination.pageSize) {
            <nav class="pagination">
              <button
                [disabled]="vm().pagination.currentPage === 1"
                (click)="changePage(vm().pagination.currentPage - 1)"
              >
                ← Previous
              </button>

              @for (
                page of getPageNumbers(
                  vm().pagination.currentPage,
                  Math.ceil(
                    vm().pagination.totalCount / vm().pagination.pageSize
                  )
                );
                track page
              ) {
                <button
                  [class.active]="page === vm().pagination.currentPage"
                  (click)="changePage(page)"
                >
                  {{ page }}
                </button>
              }

              <button
                [disabled]="
                  vm().pagination.currentPage ===
                  Math.ceil(
                    vm().pagination.totalCount / vm().pagination.pageSize
                  )
                "
                (click)="changePage(vm().pagination.currentPage + 1)"
              >
                Next →
              </button>
            </nav>
          }
        }
      </main>
    </div>
  `,
})
export class ProductCatalogComponent implements OnInit {
  private store = inject(Store);

  vm = this.store.selectSignal(selectCatalogViewModel);
  Math = Math; // expose Math for template use

  ngOnInit(): void {
    this.store.dispatch(CatalogActions.loadProducts({ page: 1, pageSize: 24 }));
  }

  selectProduct(id: string): void {
    this.store.dispatch(CatalogActions.selectProduct({ id }));
  }

  setFilter(partial: Partial<any>): void {
    this.store.dispatch(CatalogActions.setFilter({ filter: partial }));
  }

  clearFilters(): void {
    this.store.dispatch(CatalogActions.clearFilters());
  }

  changePage(page: number): void {
    this.store.dispatch(CatalogActions.changePage({ page }));
    this.store.dispatch(CatalogActions.loadProducts({ page, pageSize: 24 }));
  }

  getSalePercent(price: number, compareAt: number): number {
    return Math.round(((compareAt - price) / compareAt) * 100);
  }

  getStars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) =>
      i < Math.floor(rating) ? 'star filled' : 'star',
    );
  }

  getPageNumbers(current: number, total: number): number[] {
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
```

## NgRx Component Store — Local State for Complex Components

Use **Component Store** when a component needs its own complex state that doesn't belong in the global store. Classic use case: a multi-step form wizard, a data table with client-side filtering and pagination, or a rich text editor.

| Use Global Store                      | Use Component Store                              |
| ------------------------------------- | ------------------------------------------------ |
| State shared across multiple routes   | State only needed in one component tree          |
| Data that should survive navigation   | Data that resets when component is destroyed     |
| Auth, user profile, cart              | Table pagination, form wizard steps, modal state |
| Needs DevTools time-travel            | Local, ephemeral state                           |
| Multiple components update same state | One component owns and manages all state         |

```typescript
// src/app/features/bookings/booking-wizard.store.ts
// Multi-step booking wizard — complex local state

import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, EMPTY } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { BookingService } from '../../services/booking.service';
import {
  Passenger,
  FlightClass,
  MealPreference,
} from '../../models/booking.model';

export type WizardStep =
  | 'passengers'
  | 'seats'
  | 'extras'
  | 'payment'
  | 'confirmation';

export interface BookingWizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  passengers: Passenger[];
  selectedClass: FlightClass;
  mealPreferences: Record<string, MealPreference>; // passengerId -> preference
  addons: string[]; // selected addon IDs
  paymentMethod: string | null;
  submitting: boolean;
  confirmationCode: string | null;
  error: string | null;
}

@Injectable()
export class BookingWizardStore extends ComponentStore<BookingWizardState> {
  private bookingService = inject(BookingService);

  constructor() {
    super({
      currentStep: 'passengers',
      completedSteps: [],
      passengers: [],
      selectedClass: 'economy',
      mealPreferences: {},
      addons: [],
      paymentMethod: null,
      submitting: false,
      confirmationCode: null,
      error: null,
    });
  }

  // ── Selectors ───────────────────────────────────────────────────

  readonly currentStep$ = this.select((s) => s.currentStep);
  readonly completedSteps$ = this.select((s) => s.completedSteps);
  readonly passengers$ = this.select((s) => s.passengers);
  readonly passengerCount$ = this.select((s) => s.passengers.length);
  readonly selectedClass$ = this.select((s) => s.selectedClass);
  readonly submitting$ = this.select((s) => s.submitting);
  readonly confirmationCode$ = this.select((s) => s.confirmationCode);
  readonly error$ = this.select((s) => s.error);

  // Derived: can the user proceed to the next step?
  readonly canProceed$ = this.select(
    this.currentStep$,
    this.passengers$,
    this.select((s) => s.paymentMethod),
    (step, passengers, paymentMethod) => {
      switch (step) {
        case 'passengers':
          return (
            passengers.length > 0 &&
            passengers.every((p) => p.name && p.passport)
          );
        case 'seats':
          return true; // seat selection is optional
        case 'extras':
          return true; // extras are optional
        case 'payment':
          return !!paymentMethod;
        default:
          return false;
      }
    },
  );

  // Step progress percentage for the progress bar
  readonly progressPercent$ = this.select(this.completedSteps$, (completed) => {
    const steps: WizardStep[] = ['passengers', 'seats', 'extras', 'payment'];
    return (completed.length / steps.length) * 100;
  });

  // Full ViewModel for the wizard component
  readonly viewModel$ = this.select(
    this.currentStep$,
    this.completedSteps$,
    this.passengers$,
    this.canProceed$,
    this.progressPercent$,
    this.submitting$,
    this.error$,
    (step, completed, passengers, canProceed, progress, submitting, error) => ({
      step,
      completed,
      passengers,
      canProceed,
      progress,
      submitting,
      error,
    }),
  );

  // ── Updaters (synchronous) ─────────────────────────────────────

  readonly setStep = this.updater((state, step: WizardStep) => ({
    ...state,
    currentStep: step,
  }));

  readonly addPassenger = this.updater((state, passenger: Passenger) => ({
    ...state,
    passengers: [...state.passengers, passenger],
  }));

  readonly updatePassenger = this.updater(
    (
      state,
      { index, changes }: { index: number; changes: Partial<Passenger> },
    ) => ({
      ...state,
      passengers: state.passengers.map((p, i) =>
        i === index ? { ...p, ...changes } : p,
      ),
    }),
  );

  readonly removePassenger = this.updater((state, index: number) => ({
    ...state,
    passengers: state.passengers.filter((_, i) => i !== index),
  }));

  readonly setClass = this.updater((state, selectedClass: FlightClass) => ({
    ...state,
    selectedClass,
  }));

  readonly setMealPreference = this.updater(
    (
      state,
      {
        passengerId,
        preference,
      }: { passengerId: string; preference: MealPreference },
    ) => ({
      ...state,
      mealPreferences: { ...state.mealPreferences, [passengerId]: preference },
    }),
  );

  readonly toggleAddon = this.updater((state, addonId: string) => ({
    ...state,
    addons: state.addons.includes(addonId)
      ? state.addons.filter((id) => id !== addonId)
      : [...state.addons, addonId],
  }));

  readonly setPaymentMethod = this.updater((state, paymentMethod: string) => ({
    ...state,
    paymentMethod,
  }));

  readonly completeStep = this.updater((state, step: WizardStep) => ({
    ...state,
    completedSteps: state.completedSteps.includes(step)
      ? state.completedSteps
      : [...state.completedSteps, step],
  }));

  // ── Effects (asynchronous) ──────────────────────────────────────

  readonly submitBooking = this.effect<{ flightId: string }>(
    (trigger$: Observable<{ flightId: string }>) =>
      trigger$.pipe(
        tap(() => this.patchState({ submitting: true, error: null })),
        switchMap(({ flightId }) =>
          this.bookingService
            .submit({
              flightId,
              passengers: this.get((s) => s.passengers),
              cabinClass: this.get((s) => s.selectedClass),
              addons: this.get((s) => s.addons),
            })
            .pipe(
              tap(({ confirmationCode }) => {
                this.patchState({
                  confirmationCode,
                  submitting: false,
                  currentStep: 'confirmation',
                });
              }),
              catchError((error) => {
                this.patchState({ submitting: false, error: error.message });
                return EMPTY;
              }),
            ),
        ),
      ),
  );
}
```

```typescript
// src/app/features/bookings/booking-wizard.component.ts

import {
  Component,
  OnInit,
  Input,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BookingWizardStore } from './booking-wizard.store';

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [AsyncPipe],
  // ComponentStore must be provided here — it lives only as long as this component
  providers: [BookingWizardStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wizard" *ngIf="store.viewModel$ | async as vm">
      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="vm.progress"></div>
      </div>

      <!-- Step Indicators -->
      <nav class="step-nav">
        @for (step of steps; track step.id) {
          <div
            class="step-indicator"
            [class.active]="vm.step === step.id"
            [class.completed]="vm.completed.includes(step.id)"
          >
            @if (vm.completed.includes(step.id)) {
              <span class="checkmark">✓</span>
            } @else {
              <span class="step-number">{{ $index + 1 }}</span>
            }
            <span class="step-label">{{ step.label }}</span>
          </div>
        }
      </nav>

      <!-- Error Message -->
      @if (vm.error) {
        <div class="error-banner">{{ vm.error }}</div>
      }

      <!-- Step Content -->
      @switch (vm.step) {
        @case ('passengers') {
          <section class="step-content">
            <h2>Passenger Details</h2>
            @for (passenger of vm.passengers; track $index) {
              <div class="passenger-form">
                <h3>Passenger {{ $index + 1 }}</h3>
                <!-- Form fields would go here -->
                <button (click)="removePassenger($index)">Remove</button>
              </div>
            } @empty {
              <p>No passengers added yet. Add at least one passenger.</p>
            }
            <button (click)="addPassenger()">+ Add Passenger</button>
          </section>
        }

        @case ('seats') {
          <section class="step-content">
            <h2>Seat Selection</h2>
            <p>Choose your seats (optional)</p>
            <!-- Seat map component would go here -->
          </section>
        }

        @case ('extras') {
          <section class="step-content">
            <h2>Add Extras</h2>
            @for (addon of availableAddons; track addon.id) {
              <label class="addon-item">
                <input type="checkbox" (change)="toggleAddon(addon.id)" />
                <span>{{ addon.name }}</span>
                <span class="addon-price">+{{ addon.price }}</span>
              </label>
            }
          </section>
        }

        @case ('payment') {
          <section class="step-content">
            <h2>Payment</h2>
            <!-- Payment form would go here -->
          </section>
        }

        @case ('confirmation') {
          <section class="confirmation">
            <h2>Booking Confirmed! 🎉</h2>
            <p>
              Reference: <strong>{{ store.confirmationCode$ | async }}</strong>
            </p>
          </section>
        }
      }

      <!-- Navigation Buttons -->
      @if (vm.step !== 'confirmation') {
        <div class="wizard-actions">
          @if (vm.step !== 'passengers') {
            <button (click)="goBack(vm.step)">← Back</button>
          }
          <button
            class="next-btn"
            [disabled]="!vm.canProceed || vm.submitting"
            (click)="goNext(vm.step)"
          >
            @if (vm.submitting) {
              Processing...
            } @else if (vm.step === 'payment') {
              Confirm Booking
            } @else {
              Continue →
            }
          </button>
        </div>
      }
    </div>
  `,
})
export class BookingWizardComponent {
  @Input() flightId!: string;

  store = inject(BookingWizardStore);

  steps = [
    { id: 'passengers', label: 'Passengers' },
    { id: 'seats', label: 'Seats' },
    { id: 'extras', label: 'Extras' },
    { id: 'payment', label: 'Payment' },
  ];

  availableAddons = [
    { id: 'extra-baggage', name: 'Extra Baggage (20kg)', price: '₹1,500' },
    { id: 'meal', name: 'Premium Meal', price: '₹500' },
    { id: 'lounge', name: 'Airport Lounge Access', price: '₹2,000' },
  ];

  addPassenger(): void {
    this.store.addPassenger({ name: '', passport: '', dob: '' } as any);
  }

  removePassenger(index: number): void {
    this.store.removePassenger(index);
  }

  toggleAddon(addonId: string): void {
    this.store.toggleAddon(addonId);
  }

  goNext(currentStep: any): void {
    const order = ['passengers', 'seats', 'extras', 'payment'];
    const index = order.indexOf(currentStep);
    if (currentStep === 'payment') {
      this.store.submitBooking({ flightId: this.flightId });
    } else {
      this.store.completeStep(currentStep);
      this.store.setStep(order[index + 1] as any);
    }
  }

  goBack(currentStep: any): void {
    const order = ['passengers', 'seats', 'extras', 'payment'];
    const index = order.indexOf(currentStep);
    this.store.setStep(order[index - 1] as any);
  }
}
```

## NgRx Signal Store — The Angular 20 Native Approach

**Signal Store** (`@ngrx/signals`) is the recommended approach for new Angular 17+ projects. It replaces RxJS Observables with Angular Signals, resulting in cleaner, more readable code with zero async pipe boilerplate.

### Comparison: Classic Store vs Signal Store

| Aspect                 | Classic Store (`@ngrx/store`)                    | Signal Store (`@ngrx/signals`)                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------ |
| State access           | `Observable<T>` + `async` pipe                   | `Signal<T>` — read directly in template          |
| Component subscription | `store.select(selector)` → Observable            | `store.selectSignal(selector)` → Signal          |
| Template reading       | `{{ value$ \| async }}`                          | `{{ value() }}`                                  |
| Change detection       | Requires `async` pipe or manual subscribe        | Automatic via Signals                            |
| Boilerplate            | Higher (actions + reducer + selectors + effects) | Lower (state + computed + methods)               |
| DevTools support       | Full time-travel debugging                       | Partial (improving)                              |
| Best for               | Large apps, complex async, team standards        | Feature slices, new projects, simplicity         |
| RxJS interop           | Native                                           | Via `rxMethod` from `@ngrx/signals/rxjs-interop` |

### Authentication Signal Store

```typescript
// src/app/store/auth/auth.signal-store.ts

import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  User,
  LoginCredentials,
  RegisterPayload,
} from '../../models/auth.model';

interface AuthState {
  user: User | null;
  token: string | null;
  loginLoading: boolean;
  registerLoading: boolean;
  error: string | null;
}

export const AuthSignalStore = signalStore(
  { providedIn: 'root' }, // singleton — available globally

  withState<AuthState>({
    user: null,
    token: null,
    loginLoading: false,
    registerLoading: false,
    error: null,
  }),

  // withComputed creates derived signals
  withComputed(({ user, token }) => ({
    // Signal derived from user — automatically updates when user changes
    isAuthenticated: computed(() => !!user() && !!token()),

    // User display name
    displayName: computed(() => user()?.name ?? 'Guest'),

    // Role check
    isAdmin: computed(() => user()?.role === 'admin'),

    // Initials for avatar
    initials: computed(() => {
      const name = user()?.name ?? '';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }),
  })),

  withMethods(
    (store, authService = inject(AuthService), router = inject(Router)) => ({
      // rxMethod bridges RxJS operations into the Signal Store world
      login: rxMethod<LoginCredentials>(
        pipe(
          tap(() => patchState(store, { loginLoading: true, error: null })),
          switchMap((credentials) =>
            authService.login(credentials).pipe(
              tapResponse({
                next: ({ user, token }) => {
                  patchState(store, { user, token, loginLoading: false });
                  // Store token for HTTP interceptor
                  localStorage.setItem('auth_token', token);
                  router.navigate(['/dashboard']);
                },
                error: (error: Error) => {
                  patchState(store, {
                    loginLoading: false,
                    error: error.message,
                  });
                },
              }),
            ),
          ),
        ),
      ),

      register: rxMethod<RegisterPayload>(
        pipe(
          tap(() => patchState(store, { registerLoading: true, error: null })),
          switchMap((payload) =>
            authService.register(payload).pipe(
              tapResponse({
                next: ({ user, token }) => {
                  patchState(store, { user, token, registerLoading: false });
                  localStorage.setItem('auth_token', token);
                  router.navigate(['/onboarding']);
                },
                error: (error: Error) => {
                  patchState(store, {
                    registerLoading: false,
                    error: error.message,
                  });
                },
              }),
            ),
          ),
        ),
      ),

      // Synchronous method — no rxMethod needed
      logout(): void {
        patchState(store, { user: null, token: null, error: null });
        localStorage.removeItem('auth_token');
        router.navigate(['/login']);
      },

      // Restore session from localStorage on app start
      restoreSession: rxMethod<void>(
        pipe(
          switchMap(() => {
            const token = localStorage.getItem('auth_token');
            if (!token) return []; // no token — do nothing

            return authService.validateToken(token).pipe(
              tapResponse({
                next: (user) => patchState(store, { user, token }),
                error: () => {
                  localStorage.removeItem('auth_token'); // token expired
                },
              }),
            );
          }),
        ),
      ),
    }),
  ),
);
```

```typescript
// src/app/features/auth/login.component.ts

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthSignalStore } from '../../store/auth/auth.signal-store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>

        <!-- Error display — read signal directly, no async pipe -->
        @if (auth.error()) {
          <div class="error-alert" role="alert">
            {{ auth.error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
            />
          </div>

          <!-- Button state driven by signal — no Observable -->
          <button
            type="submit"
            class="submit-btn"
            [disabled]="auth.loginLoading()"
          >
            @if (auth.loginLoading()) {
              <span class="spinner"></span>
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="register-link">
          Don't have an account?
          <a routerLink="/register">Create one</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthSignalStore);

  email = '';
  password = '';

  onSubmit(): void {
    this.auth.login({ email: this.email, password: this.password });
  }
}
```

### Signal Store with Entities

```typescript
// src/app/store/notifications/notifications.signal-store.ts

import {
  signalStore,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {
  withEntities,
  setAllEntities,
  addEntity,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

export const NotificationsStore = signalStore(
  { providedIn: 'root' },

  // withEntities manages the normalized { ids, entities } structure
  withEntities<Notification>(),

  withComputed(({ entities }) => ({
    // Unread count — shown in header badge
    unreadCount: computed(() => entities().filter((n) => !n.isRead).length),

    // Only unread notifications for the dropdown
    unreadNotifications: computed(() =>
      entities()
        .filter((n) => !n.isRead)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    ),

    // Has any notifications at all
    hasNotifications: computed(() => entities().length > 0),
  })),

  withMethods((store, service = inject(NotificationService)) => ({
    loadNotifications: rxMethod<void>(
      pipe(
        switchMap(() =>
          service.getAll().pipe(
            tapResponse({
              // setAllEntities replaces the entire collection
              next: (notifications) =>
                patchState(store, setAllEntities(notifications)),
              error: (err: Error) => console.error(err),
            }),
          ),
        ),
      ),
    ),

    // Mark one notification as read
    markAsRead(id: string): void {
      // updateEntity performs partial update — only changes isRead
      patchState(store, updateEntity({ id, changes: { isRead: true } }));
      // Also call API in background (fire and forget for simplicity)
      service.markRead(id).subscribe();
    },

    // Mark all as read
    markAllAsRead(): void {
      const updates = store.ids().map((id) => ({
        id: id as string,
        changes: { isRead: true },
      }));
      // updateEntities (plural) — batch update
      updates.forEach((u) => patchState(store, updateEntity(u)));
      service.markAllRead().subscribe();
    },

    // Remove dismissed notification
    dismiss(id: string): void {
      patchState(store, removeEntity(id));
    },

    // Add real-time notification (from WebSocket)
    addRealTimeNotification(notification: Notification): void {
      patchState(store, addEntity(notification));
    },
  })),
);
```

## Router Store — URL as Application State

When route parameters drive data loading, connecting the router to the store eliminates the need for `ActivatedRoute` injection in every component.

```typescript
// src/app/store/router/router.selectors.ts

import { createFeatureSelector } from '@ngrx/store';
import { RouterReducerState, getRouterSelectors } from '@ngrx/router-store';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

// getRouterSelectors returns pre-built selectors for all router state
export const {
  selectCurrentRoute,
  selectFragment,
  selectQueryParams,
  selectQueryParam, // factory: selectQueryParam('tab')
  selectRouteParams,
  selectRouteParam, // factory: selectRouteParam('id')
  selectRouteData,
  selectUrl,
  selectTitle,
} = getRouterSelectors(selectRouter);
```

```typescript
// src/app/store/catalog/catalog.effects.ts
// Load product when user navigates to /catalog/:productId

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { of } from 'rxjs';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { CatalogActions } from './catalog.actions';
import { ProductService } from '../../services/product.service';
import { selectRouteParam } from '../router/router.selectors';

@Injectable()
export class CatalogRouterEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private productService = inject(ProductService);

  // Automatically load product detail when route param changes
  loadProductOnNavigation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATED), // fires on every route change
      withLatestFrom(this.store.select(selectRouteParam('productId'))),
      // Only proceed if we have a productId param
      filter(([, productId]) => !!productId),
      switchMap(([, productId]) =>
        this.productService.getById(productId!).pipe(
          map((product) =>
            CatalogActions.loadProductDetailSuccess({ product }),
          ),
          catchError((error) =>
            of(
              CatalogActions.loadProductDetailFailure({ error: error.message }),
            ),
          ),
        ),
      ),
    ),
  );
}
```

```typescript
// src/app/features/catalog/product-detail.component.ts
// No ActivatedRoute injection needed — router state comes from the store

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrencyPipe } from '@angular/common';
import {
  selectSelectedProduct,
  selectCatalogLoading,
} from '../../store/catalog/catalog.selectors';
import { CatalogActions } from '../../store/catalog/catalog.actions';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="loading">Loading product...</div>
    } @else if (product()) {
      <article class="product-detail">
        <div class="product-gallery">
          @for (image of product()!.imageUrls; track $index) {
            <img
              [src]="image"
              [alt]="product()!.name"
              [class.active]="activeImageIndex === $index"
              (click)="activeImageIndex = $index"
            />
          }
        </div>

        <div class="product-info">
          <h1>{{ product()!.name }}</h1>
          <p class="sku">SKU: {{ product()!.sku }}</p>

          <div class="price-block">
            <span class="price">{{ product()!.price | currency }}</span>
            @if (product()!.compareAtPrice) {
              <span class="compare-price">{{
                product()!.compareAtPrice | currency
              }}</span>
              <span class="savings">
                Save
                {{ product()!.compareAtPrice! - product()!.price | currency }}
              </span>
            }
          </div>

          <p class="description">{{ product()!.description }}</p>

          <!-- Stock status -->
          @if (product()!.stock === 0) {
            <p class="out-of-stock">This item is currently out of stock.</p>
          } @else if (product()!.stock <= 3) {
            <p class="low-stock">
              Only {{ product()!.stock }} left — order soon!
            </p>
          } @else {
            <p class="in-stock">In stock and ready to ship.</p>
          }

          <button
            class="add-to-cart"
            [disabled]="product()!.stock === 0"
            (click)="addToCart()"
          >
            Add to Cart
          </button>
        </div>
      </article>
    } @else {
      <div class="not-found">
        <h2>Product not found</h2>
        <a href="/catalog">← Back to catalog</a>
      </div>
    }
  `,
})
export class ProductDetailComponent {
  private store = inject(Store);

  product = this.store.selectSignal(selectSelectedProduct);
  loading = this.store.selectSignal(selectCatalogLoading);

  activeImageIndex = 0;

  addToCart(): void {
    const product = this.product();
    if (product) {
      // Dispatch to cart store
      // this.store.dispatch(CartActions.addItem({ ... }))
    }
  }
}
```

## Meta-Reducers — Application-Wide Middleware

A **Meta-Reducer** wraps every reducer. It intercepts every action before your reducers run, making it perfect for cross-cutting concerns.

| Meta-Reducer Use Case | What It Does                                               |
| --------------------- | ---------------------------------------------------------- |
| Logger                | Prints every action + state diff to console in development |
| Hydration             | Saves state to `localStorage`, restores on page load       |
| Undo/Redo             | Keeps a history stack of states                            |
| Analytics             | Sends action names to your analytics platform              |
| Feature flags         | Blocks certain actions based on feature flag state         |

```typescript
// src/app/store/meta-reducers/logger.meta-reducer.ts

import { ActionReducer, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

// Logs every action and state transition to the console
export function loggerMetaReducer<S, A extends { type: string }>(
  reducer: ActionReducer<S, A>,
): ActionReducer<S, A> {
  return (state, action) => {
    const newState = reducer(state, action);

    if (isDevMode() && !action.type.startsWith('@ngrx')) {
      // Ignore internal NgRx actions — only log application actions
      console.group(
        `%c▶ ${action.type}`,
        'color: #6366f1; font-weight: bold; font-family: monospace',
      );
      console.log('%c  prev state', 'color: #94a3b8', state);
      console.log('%c  action    ', 'color: #60a5fa', action);
      console.log('%c  next state', 'color: #34d399', newState);
      console.groupEnd();
    }

    return newState;
  };
}
```

```typescript
// src/app/store/meta-reducers/hydration.meta-reducer.ts

import { ActionReducer, INIT, UPDATE } from '@ngrx/store';

const HYDRATION_KEY = 'ngrx_state';

// Persist and restore a subset of application state across page reloads
export function hydrationMetaReducer<S>(
  reducer: ActionReducer<S>,
): ActionReducer<S> {
  return (state, action) => {
    // On app init or state update, attempt to restore persisted state
    if (action.type === INIT || action.type === UPDATE) {
      const persisted = localStorage.getItem(HYDRATION_KEY);
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          // Merge persisted state with the default initial state
          // This handles cases where new state fields were added after last save
          return { ...reducer(undefined, action), ...parsed };
        } catch {
          // JSON was malformed (e.g., browser storage was corrupted)
          localStorage.removeItem(HYDRATION_KEY);
        }
      }
    }

    const newState = reducer(state, action);

    // Only persist selected slices — persisting everything is wasteful
    const toPersist = {
      auth: (newState as any).auth, // keep login state
      ui: (newState as any).ui, // keep theme/preferences
      // ⛔ Do NOT persist cart here if you use a cart API
      // ⛔ Do NOT persist flights — those are stale after browser reload
    };

    localStorage.setItem(HYDRATION_KEY, JSON.stringify(toPersist));

    return newState;
  };
}
```

```typescript
// src/app/store/meta-reducers/index.ts

import { MetaReducer, isDevMode } from '@ngrx/store';
import { loggerMetaReducer } from './logger.meta-reducer';
import { hydrationMetaReducer } from './hydration.meta-reducer';

// Production: only hydration
// Development: hydration + logger
export const metaReducers: MetaReducer[] = isDevMode()
  ? [loggerMetaReducer, hydrationMetaReducer]
  : [hydrationMetaReducer];
```

```typescript
// Register in app.config.ts
provideStore(
  { auth: authReducer, ui: uiReducer },
  { metaReducers }  // ← applied to every reducer in the app
),
```

## The Facade Pattern — Decoupling Components from NgRx

A **Facade** is a service that sits between components and the NgRx store. Components only know about the Facade — they have zero NgRx imports. This makes components simpler, more portable, and easier to test.

```
Without Facade:                     With Facade:
Component                           Component
  │ imports Store                     │ imports CatalogFacade
  │ imports Actions                   │
  │ imports Selectors                 ▼
  ▼                               CatalogFacade
NgRx Store                           │ imports Store
                                     │ imports Actions
                                     │ imports Selectors
                                     ▼
                                 NgRx Store
```

```typescript
// src/app/features/catalog/catalog.facade.ts

import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CatalogActions } from '../../store/catalog/catalog.actions';
import {
  selectCatalogViewModel,
  selectSelectedProduct,
  selectProductById,
  selectProductsOnSale,
  selectCategories,
} from '../../store/catalog/catalog.selectors';
import { Product } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private store = inject(Store);

  // ── Public Observables (the component's API surface) ────────────
  vm$ = this.store.select(selectCatalogViewModel);
  selectedProduct$ = this.store.select(selectSelectedProduct);
  onSaleProducts$ = this.store.select(selectProductsOnSale);
  categories$ = this.store.select(selectCategories);

  // Signal variants for Angular 20 components
  vm = this.store.selectSignal(selectCatalogViewModel);
  selectedProduct = this.store.selectSignal(selectSelectedProduct);

  // ── Public Methods (readable domain language) ───────────────────

  /** Load the first page of products */
  loadCatalog(): void {
    this.store.dispatch(CatalogActions.loadProducts({ page: 1, pageSize: 24 }));
  }

  /** Load a specific page */
  goToPage(page: number): void {
    this.store.dispatch(CatalogActions.changePage({ page }));
    this.store.dispatch(CatalogActions.loadProducts({ page, pageSize: 24 }));
  }

  /** View a product's details */
  viewProduct(id: string): void {
    this.store.dispatch(CatalogActions.selectProduct({ id }));
  }

  /** Filter by category */
  filterByCategory(category: string | null): void {
    this.store.dispatch(CatalogActions.setFilter({ filter: { category } }));
  }

  /** Set price range */
  setPriceRange(min: number | null, max: number | null): void {
    this.store.dispatch(
      CatalogActions.setFilter({ filter: { minPrice: min, maxPrice: max } }),
    );
  }

  /** Toggle in-stock filter */
  toggleInStockOnly(inStockOnly: boolean): void {
    this.store.dispatch(CatalogActions.setFilter({ filter: { inStockOnly } }));
  }

  /** Search products by name */
  search(query: string): void {
    this.store.dispatch(
      CatalogActions.setFilter({ filter: { searchQuery: query } }),
    );
  }

  /** Reset all filters */
  resetFilters(): void {
    this.store.dispatch(CatalogActions.clearFilters());
  }

  /** Parameterized selector — return an Observable for any product ID */
  getProductById$(id: string) {
    return this.store.select(selectProductById(id));
  }
}
```

```typescript
// Component that uses the Facade — zero NgRx imports
// src/app/features/catalog/catalog-page.component.ts

import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CatalogFacade } from './catalog.facade';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-catalog-filters
      [categories]="facade.vm().categories"
      (categorySelected)="facade.filterByCategory($event)"
      (priceRangeSet)="facade.setPriceRange($event.min, $event.max)"
      (inStockToggled)="facade.toggleInStockOnly($event)"
      (cleared)="facade.resetFilters()"
    />

    @if (facade.vm().loading) {
      <app-product-grid-skeleton />
    } @else {
      <app-product-grid
        [products]="facade.vm().products"
        (productSelected)="facade.viewProduct($event)"
      />

      <app-pagination
        [pagination]="facade.vm().pagination"
        (pageChanged)="facade.goToPage($event)"
      />
    }
  `,
})
export class CatalogPageComponent implements OnInit {
  // The component only knows about the Facade — never imports Store, Actions, or Selectors
  facade = inject(CatalogFacade);

  ngOnInit(): void {
    this.facade.loadCatalog();
  }
}
```

## Testing NgRx — Comprehensive Unit Tests

Every layer of NgRx should be tested independently. Here is a full test suite for each layer using the flight booking domain.

### Testing Reducers (Pure Functions — Easiest)

```typescript
// src/app/store/flights/flights.reducer.spec.ts

import { flightsReducer, initialState } from './flights.reducer';
import { FlightActions } from './flights.actions';
import { Flight } from '../../models/flight.model';

describe('FlightsReducer', () => {
  const mockFlight: Flight = {
    id: 'FL001',
    origin: 'ABC',
    destination: 'XYZ',
    airline: 'IndiGo',
    departureTime: '2025-06-01T06:00:00',
    arrivalTime: '2025-06-01T08:15:00',
    duration: '2h 15m',
    price: 4500,
    availableClasses: ['economy', 'business'],
    availabilityStatus: 'high',
    seatsLeft: 45,
  };

  it('should return the initial state on unknown action', () => {
    const state = flightsReducer(undefined, { type: '@@INIT' } as any);
    expect(state).toEqual(initialState);
  });

  describe('loadFlights', () => {
    it('should set searchLoading=true and clear previous results', () => {
      // Arrange: start with some existing flights in state
      const stateWithFlights = {
        ...initialState,
        availableFlights: [mockFlight],
        selectedFlightId: 'FL001',
      };

      const action = FlightActions.loadFlights({
        params: {
          origin: 'ABC',
          destination: 'XYZ',
          departureDate: '2025-06-01',
          passengers: 1,
        },
      });

      const state = flightsReducer(stateWithFlights, action);

      expect(state.searchLoading).toBe(true);
      expect(state.searchError).toBeNull();
      expect(state.availableFlights).toEqual([]); // cleared
      expect(state.selectedFlightId).toBeNull(); // cleared
    });
  });

  describe('loadFlightsSuccess', () => {
    it('should populate flights and stop loading', () => {
      const loadingState = { ...initialState, searchLoading: true };
      const flights = [mockFlight];

      const state = flightsReducer(
        loadingState,
        FlightActions.loadFlightsSuccess({ flights }),
      );

      expect(state.availableFlights).toEqual(flights);
      expect(state.searchLoading).toBe(false);
    });
  });

  describe('loadFlightsFailure', () => {
    it('should set error and stop loading', () => {
      const loadingState = { ...initialState, searchLoading: true };
      const error = 'Network timeout';

      const state = flightsReducer(
        loadingState,
        FlightActions.loadFlightsFailure({ error }),
      );

      expect(state.searchError).toBe(error);
      expect(state.searchLoading).toBe(false);
    });
  });

  describe('selectFlight', () => {
    it('should set selectedFlightId and clear previous seat selections', () => {
      const stateWithSeats = {
        ...initialState,
        selectedFlightId: 'FL000',
        seatSelections: [{ passengerId: 'P1', seatNumber: '12A' }],
      };

      const state = flightsReducer(
        stateWithSeats,
        FlightActions.selectFlight({ flightId: 'FL001' }),
      );

      expect(state.selectedFlightId).toBe('FL001');
      expect(state.seatSelections).toEqual([]); // cleared on new selection
    });
  });

  describe('selectSeat', () => {
    it('should replace previous selection for same passenger', () => {
      const stateWithSelection = {
        ...initialState,
        seatSelections: [{ passengerId: 'P1', seatNumber: '12A' }],
      };

      const state = flightsReducer(
        stateWithSelection,
        FlightActions.selectSeat({ passengerId: 'P1', seatNumber: '15B' }),
      );

      // Only one selection for P1 — the old one was replaced
      expect(state.seatSelections.length).toBe(1);
      expect(state.seatSelections[0].seatNumber).toBe('15B');
    });

    it('should add new selection for different passenger', () => {
      const stateWithP1 = {
        ...initialState,
        seatSelections: [{ passengerId: 'P1', seatNumber: '12A' }],
      };

      const state = flightsReducer(
        stateWithP1,
        FlightActions.selectSeat({ passengerId: 'P2', seatNumber: '12B' }),
      );

      expect(state.seatSelections.length).toBe(2);
    });
  });
});
```

### Testing Selectors (Projection Functions)

```typescript
// src/app/store/flights/flights.selectors.spec.ts

import {
  selectAvailableFlights,
  selectSelectedFlight,
  selectBookingSummaryViewModel,
  selectFlightsSortedByPrice,
} from './flights.selectors';
import { FlightsState, initialState } from './flights.reducer';
import { Flight } from '../../models/flight.model';

describe('FlightsSelectors', () => {
  const flight1: Flight = {
    id: 'FL001',
    origin: 'ABC',
    destination: 'XYZ',
    price: 4500,
    airline: 'IndiGo',
    departureTime: '',
    arrivalTime: '',
    duration: '2h',
    availableClasses: ['economy'],
    availabilityStatus: 'high',
    seatsLeft: 40,
  };

  const flight2: Flight = {
    id: 'FL002',
    origin: 'ABC',
    destination: 'XYZ',
    price: 3200,
    airline: 'SpiceJet',
    departureTime: '',
    arrivalTime: '',
    duration: '2h',
    availableClasses: ['economy'],
    availabilityStatus: 'low',
    seatsLeft: 3,
  };

  const mockState: FlightsState = {
    ...initialState,
    availableFlights: [flight1, flight2],
    selectedFlightId: 'FL001',
  };

  it('should select available flights', () => {
    // Call .projector() to test the projection function directly (no store needed)
    const result = selectAvailableFlights.projector(mockState);
    expect(result).toEqual([flight1, flight2]);
  });

  it('should select the flight matching selectedFlightId', () => {
    const result = selectSelectedFlight.projector(
      [flight1, flight2], // selectAvailableFlights input
      'FL001', // selectSelectedFlightId input
    );
    expect(result).toEqual(flight1);
  });

  it('should return null when no flight is selected', () => {
    const result = selectSelectedFlight.projector([flight1, flight2], null);
    expect(result).toBeNull();
  });

  it('should sort flights by price ascending', () => {
    const sorted = selectFlightsSortedByPrice.projector([flight1, flight2]);
    expect(sorted[0].price).toBe(3200); // SpiceJet is cheaper
    expect(sorted[1].price).toBe(4500);
  });

  it('should compute correct booking ViewModel', () => {
    const vm = selectBookingSummaryViewModel.projector(
      flight1, // selectedFlight
      [{ passengerId: 'P1', seatNumber: '12A' }], // seatSelections
      false, // bookingLoading
      null, // bookingReference
      mockState, // full state
    );

    expect(vm.flight).toEqual(flight1);
    expect(vm.seats.length).toBe(1);
    expect(vm.canConfirm).toBe(true); // has flight + seat + not loading
    expect(vm.isConfirmed).toBe(false); // no reference yet
  });
});
```

### Testing Effects (Async — Use provideMockActions)

```typescript
// src/app/store/flights/flights.effects.spec.ts

import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { FlightsEffects } from './flights.effects';
import { FlightService } from '../../services/flight.service';
import { FlightActions } from './flights.actions';
import { Flight } from '../../models/flight.model';

describe('FlightsEffects', () => {
  let actions$: Observable<Action>;
  let effects: FlightsEffects;
  let flightService: jasmine.SpyObj<FlightService>;
  let router: jasmine.SpyObj<Router>;

  const mockFlights: Flight[] = [
    {
      id: 'FL001',
      origin: 'ABC',
      destination: 'XYZ',
      price: 4500,
      airline: 'IndiGo',
      departureTime: '',
      arrivalTime: '',
      duration: '2h',
      availableClasses: ['economy'],
      availabilityStatus: 'high',
      seatsLeft: 40,
    },
  ];

  beforeEach(() => {
    const flightServiceSpy = jasmine.createSpyObj('FlightService', ['search']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        FlightsEffects,
        // provideMockActions injects a controllable actions stream
        provideMockActions(() => actions$),
        // provideMockStore gives us a controllable store
        provideMockStore(),
        { provide: FlightService, useValue: flightServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    effects = TestBed.inject(FlightsEffects);
    flightService = TestBed.inject(
      FlightService,
    ) as jasmine.SpyObj<FlightService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('loadFlights$', () => {
    const searchParams = {
      origin: 'ABC',
      destination: 'XYZ',
      departureDate: '2025-06-01',
      passengers: 1,
    };

    it('should dispatch loadFlightsSuccess when API succeeds', (done) => {
      flightService.search.and.returnValue(of(mockFlights));

      actions$ = of(FlightActions.loadFlights({ params: searchParams }));

      effects.loadFlights$.subscribe((action) => {
        expect(action).toEqual(
          FlightActions.loadFlightsSuccess({ flights: mockFlights }),
        );
        done();
      });
    });

    it('should dispatch loadFlightsFailure when API throws', (done) => {
      flightService.search.and.returnValue(
        throwError(() => new Error('Connection refused')),
      );

      actions$ = of(FlightActions.loadFlights({ params: searchParams }));

      effects.loadFlights$.subscribe((action) => {
        expect(action).toEqual(
          FlightActions.loadFlightsFailure({ error: 'Connection refused' }),
        );
        done();
      });
    });
  });

  describe('navigateToConfirmation$', () => {
    it('should navigate to confirmation page on booking success', (done) => {
      actions$ = of(
        FlightActions.confirmBookingSuccess({
          bookingReference: 'BK-2024-001',
        }),
      );

      effects.navigateToConfirmation$.subscribe(() => {
        expect(router.navigate).toHaveBeenCalledWith([
          '/bookings/confirmation',
          'BK-2024-001',
        ]);
        done();
      });
    });
  });
});
```

### Testing Components with MockStore

```typescript
// src/app/features/flights/flight-search.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { FlightSearchComponent } from './flight-search.component';
import { FlightActions } from '../../store/flights/flights.actions';
import {
  selectAvailableFlights,
  selectSearchLoading,
  selectSearchError,
} from '../../store/flights/flights.selectors';
import { Flight } from '../../models/flight.model';

describe('FlightSearchComponent', () => {
  let component: FlightSearchComponent;
  let fixture: ComponentFixture<FlightSearchComponent>;
  let store: MockStore;

  const initialState = {
    flights: {
      availableFlights: [],
      searchLoading: false,
      searchError: null,
      selectedFlightId: null,
      seatMap: null,
      seatMapLoading: false,
      seatSelections: [],
      bookingReference: null,
      bookingLoading: false,
      bookingError: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSearchComponent], // standalone component
      providers: [
        // provideMockStore replaces the real Store
        provideMockStore({ initialState }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(FlightSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the search form', () => {
    const form = fixture.nativeElement.querySelector('.search-form');
    expect(form).toBeTruthy();
  });

  it('should dispatch loadFlights when search button is clicked', () => {
    const dispatchSpy = spyOn(store, 'dispatch');

    component.searchParams = {
      origin: 'ABC',
      destination: 'XYZ',
      departureDate: '2025-06-01',
      passengers: 1,
    };

    component.onSearch();

    expect(dispatchSpy).toHaveBeenCalledWith(
      FlightActions.loadFlights({ params: component.searchParams }),
    );
  });

  it('should show loading spinner when loading is true', () => {
    // Override the selector to return true
    store.overrideSelector(selectSearchLoading, true);
    store.refreshState(); // trigger change detection
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.loading-container');
    expect(spinner).toBeTruthy();
  });

  it('should render flight cards when flights are available', () => {
    const mockFlights: Flight[] = [
      {
        id: 'FL001',
        origin: 'ABC',
        destination: 'XYZ',
        price: 4500,
        airline: 'IndiGo',
        departureTime: '2025-06-01T06:00',
        arrivalTime: '2025-06-01T08:15',
        duration: '2h 15m',
        availableClasses: ['economy'],
        availabilityStatus: 'high',
        seatsLeft: 40,
      },
    ];

    store.overrideSelector(selectAvailableFlights, mockFlights);
    store.overrideSelector(selectSearchLoading, false);
    store.refreshState();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.flight-card');
    expect(cards.length).toBe(1);
  });

  it('should dispatch selectFlight when a flight card is clicked', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    component.onSelectFlight('FL001');

    expect(dispatchSpy).toHaveBeenCalledWith(
      FlightActions.selectFlight({ flightId: 'FL001' }),
    );
  });
});
```

## Enterprise Architecture — Full Project Structure

A production NgRx application follows a clear, scalable folder structure that scales to dozens of features.

```
src/
├── app/
│   │
│   ├── core/                              # App-wide singletons
│   │   ├── models/                        # TypeScript interfaces
│   │   │   ├── flight.model.ts
│   │   │   ├── booking.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── api.model.ts              # generic API response types
│   │   ├── services/                      # HTTP + domain services
│   │   │   ├── flight.service.ts
│   │   │   ├── booking.service.ts
│   │   │   └── auth.service.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   └── guards/
│   │       └── auth.guard.ts
│   │
│   ├── store/                             # Global NgRx state
│   │   ├── index.ts                       # AppState interface
│   │   ├── meta-reducers/
│   │   │   ├── logger.meta-reducer.ts
│   │   │   └── hydration.meta-reducer.ts
│   │   ├── auth/
│   │   │   ├── auth.actions.ts
│   │   │   ├── auth.reducer.ts
│   │   │   ├── auth.effects.ts
│   │   │   ├── auth.selectors.ts
│   │   │   └── auth.signal-store.ts       # Signal Store variant
│   │   └── ui/
│   │       ├── ui.actions.ts
│   │       ├── ui.reducer.ts
│   │       └── ui.selectors.ts
│   │
│   ├── features/
│   │   ├── flights/                       # Flight search feature
│   │   │   ├── store/                     # Feature-level NgRx
│   │   │   │   ├── flights.actions.ts
│   │   │   │   ├── flights.reducer.ts
│   │   │   │   ├── flights.effects.ts
│   │   │   │   ├── flights.selectors.ts
│   │   │   │   └── flights.facade.ts
│   │   │   ├── components/
│   │   │   │   ├── flight-search/
│   │   │   │   │   ├── flight-search.component.ts
│   │   │   │   │   └── flight-search.component.spec.ts
│   │   │   │   ├── flight-card/
│   │   │   │   └── seat-selector/
│   │   │   └── flights.routes.ts
│   │   │
│   │   ├── catalog/                       # E-commerce catalog
│   │   │   ├── store/
│   │   │   │   ├── catalog.actions.ts
│   │   │   │   ├── catalog.reducer.ts    # Uses NgRx Entity
│   │   │   │   ├── catalog.effects.ts
│   │   │   │   ├── catalog.selectors.ts
│   │   │   │   └── catalog.facade.ts
│   │   │   └── components/
│   │   │
│   │   ├── analytics/                     # Dashboard
│   │   │   ├── store/
│   │   │   │   ├── analytics.actions.ts
│   │   │   │   ├── analytics.reducer.ts
│   │   │   │   ├── analytics.effects.ts
│   │   │   │   └── analytics.selectors.ts
│   │   │   └── components/
│   │   │
│   │   └── bookings/                      # Booking wizard
│   │       ├── booking-wizard.store.ts    # ComponentStore
│   │       └── components/
│   │
│   ├── app.config.ts                      # provideStore, provideEffects
│   ├── app.routes.ts                      # lazy feature routes
│   └── app.component.ts
```

### AppState Interface

```typescript
// src/app/store/index.ts

import { AuthState } from './auth/auth.reducer';
import { UiState } from './ui/ui.reducer';
import { RouterReducerState } from '@ngrx/router-store';

// The complete shape of the NgRx store.
// Feature states (flights, catalog, analytics) are added lazily
// via provideState() on their routes — they don't appear here.
export interface AppState {
  auth: AuthState;
  ui: UiState;
  router: RouterReducerState;
}
```

## Performance Optimization Reference

| Optimization              | How                                                                 | Impact                                           |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `OnPush` change detection | `changeDetection: ChangeDetectionStrategy.OnPush` on all components | High — skips change detection unless store emits |
| `trackBy` in `@for`       | `@for (item of items; track item.id)`                               | High — prevents full list re-render on change    |
| Granular selectors        | Select only what the component needs                                | Medium — fewer re-renders per action             |
| ViewModel selectors       | One `createSelector` combining all fields                           | Medium — one subscription instead of many        |
| `NgRx Entity`             | Normalized dictionary instead of arrays                             | High — O(1) lookups vs O(n) for large lists      |
| Lazy feature states       | `provideState()` on routes                                          | High — smaller initial bundle                    |
| `distinctUntilChanged`    | Built into all selectors automatically                              | Medium — prevents downstream work on same value  |
| `@defer` blocks           | Lazy-load heavy components until needed                             | High — keeps initial render fast                 |
| `selectSignal`            | Use signals instead of Observables                                  | Medium — no async pipe overhead                  |

```typescript
// Applying all optimizations together

@Component({
  // 1. OnPush — only re-render when store emits new reference
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 2. @for with track — prevents full DOM re-creation on every change -->
    @for (booking of vm().bookings; track booking.id) {
      <!-- 3. @defer — heavy component only loaded when it scrolls into view -->
      @defer (on viewport) {
        <app-booking-detail [booking]="booking" />
      } @placeholder {
        <div class="booking-placeholder"></div>
      }
    }
  `,
})
export class BookingsListComponent {
  private store = inject(Store);

  // 4. ViewModel selector — one subscription covers all component data needs
  // 5. selectSignal — no async pipe needed
  vm = this.store.selectSignal(selectBookingsViewModel);
}
```

## Common Mistakes and How to Avoid Them

### Mutating State in a Reducer

```typescript
// ❌ WRONG — mutates original state, breaks time-travel debugging
on(CatalogActions.addTag, (state, { tag }) => {
  state.filters.tags.push(tag);  // mutation!
  return state;
}),

// ✅ CORRECT — new array, new filters object, new state object
on(CatalogActions.addTag, (state, { tag }) => ({
  ...state,
  filters: {
    ...state.filters,
    tags: [...state.filters.tags, tag],
  },
})),
```

### Using switchMap for Non-Cancellable Operations

```typescript
// ❌ WRONG for payment — if user clicks twice, first payment is cancelled!
processPayment$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CheckoutActions.processPayment),
    switchMap(({ payment }) =>           // cancels previous on new click
      this.paymentService.charge(payment).pipe(...)
    )
  )
);

// ✅ CORRECT — exhaustMap ignores second click while first is processing
processPayment$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CheckoutActions.processPayment),
    exhaustMap(({ payment }) =>          // ignores clicks during processing
      this.paymentService.charge(payment).pipe(...)
    )
  )
);
```

### Missing dispatch: false on Navigation/Side-Effect-Only Effects

```typescript
// ❌ WRONG — tap returns original action, NgRx re-dispatches it → infinite loop!
navigateAfterLogin$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => this.router.navigate(['/dashboard'])),
    ),
  // Missing { dispatch: false }
);

// ✅ CORRECT
navigateAfterLogin$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => this.router.navigate(['/dashboard'])),
    ),
  { dispatch: false }, // ← mandatory for non-dispatching effects
);
```

### Defining Selectors Inside Components

```typescript
// ❌ WRONG — new selector created on every change detection cycle
// Memoization is lost because it's a new function object each run
get cheapFlights$() {
  return this.store.select(
    createSelector(selectAvailableFlights, (f) => f.filter((x) => x.price < 5000))
  );
}

// ✅ CORRECT — define once in selectors.ts file, reuse everywhere
// flights.selectors.ts:
export const selectBudgetFlights = createSelector(
  selectAvailableFlights,
  (flights) => flights.filter((f) => f.price < 5000)
);

// component.ts:
budgetFlights = this.store.selectSignal(selectBudgetFlights);
```

### Overloading the Global Store with Local UI State

```typescript
// ❌ WRONG — accordion open/close state does NOT belong in NgRx
on(UIActions.toggleAccordion, (state, { id }) => ({
  ...state,
  openAccordions: state.openAccordions.includes(id)
    ? state.openAccordions.filter(a => a !== id)
    : [...state.openAccordions, id]
})),

// ✅ CORRECT — local UI state belongs in the component
@Component({ ... })
export class FaqComponent {
  openItems = new Set<string>();  // local state, no NgRx needed

  toggle(id: string): void {
    this.openItems.has(id) ? this.openItems.delete(id) : this.openItems.add(id);
  }
}
```

## NgRx DevTools — Debugging and Time Travel

NgRx integrates with the **Redux DevTools** browser extension (Chrome and Firefox). Install the extension and you gain full visibility into every state change.

```
Redux DevTools Panel Layout:

┌────────────────────────────────────────────────────────────────┐
│  Action Log                  │  State Inspector               │
│  ──────────────────────────  │  ───────────────────────────── │
│  ✓ @ngrx/store/init          │  ▼ flights                     │
│  ✓ [Flights] Load Flights    │    availableFlights: [ ... ]   │
│  ✓ [Flights] Load Success ◄  │    searchLoading: false        │
│  ✓ [Flights] Select Flight   │    selectedFlightId: "FL001"   │
│  ✓ [Flights] Load Seat Map   │  ▼ auth                        │
│                              │    user: { name: "Arjun" }     │
│  [Jump] [Skip] [Pin]         │    token: "eyJ..."             │
│                              │                                │
│  ◀ ▶  Time Travel Controls   │  Diff  │  State  │  Raw        │
└────────────────────────────────────────────────────────────────┘
```

Key capabilities:

| Feature                 | What It Does                     | How to Use                          |
| ----------------------- | -------------------------------- | ----------------------------------- |
| **Time travel**         | Jump to any past state           | Click any action in the log         |
| **Diff view**           | Shows exactly what changed       | Click an action → select "Diff" tab |
| **Action replay**       | Replay all actions from init     | Hit the play button                 |
| **State import/export** | Save and share bug reproductions | Menu → Export/Import                |
| **Action skip**         | Remove one action and see effect | Click "Skip" on any action          |

## Migration Guide — Upgrading NgRx Versions

| Migration | Key Change                                      | Auto-Migration                |
| --------- | ----------------------------------------------- | ----------------------------- |
| v13 → v14 | `Store.select` accepts `MemoizedSelector` only  | `ng update @ngrx/store`       |
| v14 → v15 | `createActionGroup` introduced                  | Manual — group your actions   |
| v15 → v16 | `provideStore` / standalone API                 | `ng update @ngrx/store`       |
| v16 → v17 | `@ngrx/signals` released (Signal Store)         | Additive — no breaking change |
| v17 → v18 | `withEntities` for Signal Store                 | Additive — no breaking change |
| v18 → v19 | Performance improvements, `selectSignal` stable | `ng update @ngrx/store`       |

### Migrating from Individual Actions to createActionGroup

```typescript
// Before (v14 and earlier) — verbose, disconnected
export const loadBookings = createAction('[Bookings] Load Bookings');
export const loadBookingsSuccess = createAction(
  '[Bookings] Load Bookings Success',
  props<{ bookings: Booking[] }>(),
);
export const loadBookingsFailure = createAction(
  '[Bookings] Load Bookings Failure',
  props<{ error: string }>(),
);

// After (v15+) — grouped, co-located, auto-inferred names
export const BookingActions = createActionGroup({
  source: 'Bookings',
  events: {
    'Load Bookings': emptyProps(),
    'Load Bookings Success': props<{ bookings: Booking[] }>(),
    'Load Bookings Failure': props<{ error: string }>(),
  },
});

// Dispatch call changes:
// Before: this.store.dispatch(loadBookings())
// After:  this.store.dispatch(BookingActions.loadBookings())
```

## NgRx Schematics — Generate Boilerplate Instantly

```bash
# Generate a complete feature with all files
ng generate @ngrx/schematics:feature store/catalog \
  --module app.module.ts \
  --api \       # adds API loading effect
  --entity      # uses EntityAdapter

# Individual file generation
ng generate @ngrx/schematics:action-group catalog      # actions file
ng generate @ngrx/schematics:reducer catalog           # reducer file
ng generate @ngrx/schematics:effect catalog --api      # effects with API boilerplate
ng generate @ngrx/schematics:selector catalog          # selectors file
ng generate @ngrx/schematics:component-store catalog   # ComponentStore service
ng generate @ngrx/schematics:signal-store catalog      # Signal Store
```

Set NgRx as the default collection so you can skip `@ngrx/schematics:`:

```json
// angular.json
{
  "cli": {
    "defaultCollection": "@ngrx/schematics"
  }
}
```

## Decision Framework — Choosing the Right Tool

```
Is the state needed by more than one feature/route?
│
├── YES ──────────────────────────────────────────────────────────►  Global Store (@ngrx/store)
│                                                                      + Effects for async
│                                                                      + Entity for collections
│
└── NO
    │
    Is it a complex component (filtering, pagination, async)?
    │
    ├── YES, RxJS-heavy ──────────────────────────────────────────►  ComponentStore
    │
    ├── YES, Angular 17+ Signals ─────────────────────────────────►  Signal Store (@ngrx/signals)
    │
    └── NO, simple ─────────────────────────────────────────────────►  Component class properties
```

### When to Use Each Store Type

| Scenario                         | Recommended Approach                  |
| -------------------------------- | ------------------------------------- |
| User authentication & profile    | Global Store (Signal Store)           |
| Shopping cart                    | Global Store (NgRx Entity)            |
| Real-time notifications          | Global Signal Store with withEntities |
| Analytics dashboard              | Global Store + Effects                |
| Multi-step booking wizard        | Component Store                       |
| Product catalog with filters     | Global Store + NgRx Entity            |
| Data table with client-side sort | Component Store                       |
| Simple toggle/open state         | Component class property — no NgRx    |
| Form state                       | Angular Reactive Forms — no NgRx      |
| Route-driven data loading        | Global Store + Router Store           |

## Conclusion

You now command the complete NgRx toolkit. The path forward:

**Foundation** — Build a feature using Store, Actions, Reducers, and Selectors. Connect the DevTools and explore every state transition. The moment you click "jump to state" in DevTools and see your UI time-travel, NgRx will click.

**Async mastery** — Add Effects and spend time choosing the right operator. The `switchMap` vs `exhaustMap` vs `concatMap` decision is where most bugs live. Know it cold.

**Scale** — Introduce NgRx Entity for every collection feature. Adopt the Facade pattern for every feature boundary. Your components will become beautifully thin.

**Modern path** — Start new features with Signal Store. The reduced boilerplate and native Signals integration represent the clear direction of Angular state management.

The core insight that separates NgRx professionals from beginners: **the constraints are the feature**. Immutable state, pure reducers, and unidirectional flow aren't bureaucracy — they are what make it possible for a team of ten developers to work on the same codebase for three years and still understand every state transition by reading the action log.

:::important

- _NgRx Documentation: https://ngrx.io/docs_
- _NgRx GitHub: https://github.com/ngrx/platform_
- _Angular Signals Guide: https://angular.dev/guide/signals_
  :::

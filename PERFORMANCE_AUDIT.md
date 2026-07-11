# LifeSaver AI OS - Lighthouse Performance Audit & Optimization Plan

## 1. Baseline Performance Metrics
- **Performance Score**: 26
- **Accessibility Score**: 86
- **First Contentful Paint (FCP)**: 6.8s
- **Largest Contentful Paint (LCP)**: 12.9s
- **Total Blocking Time (TBT)**: 10,580ms
- **Cumulative Layout Shift (CLS)**: 0.023
- **Speed Index**: 10.4s

---

## 2. Root Cause Analysis & Discovery
During the code audit, we discovered several critical architectural bottlenecks that are directly responsible for the poor performance and high Total Blocking Time (TBT):

### A. Poller-Induced React State Thrashing (Severe TBT / Memory Leak Source)
In `/src/App.tsx`, the `useEffect` responsible for polling notifications runs on interval:
- It was configured with a dependency array containing: `[userEmail, processedInAppIds, tasks]`.
- Every single time a task status changed, a new task was added, or a notification ID was marked as processed (`processedInAppIds` updated), this entire effect would clean up (`clearInterval`) and restart immediately.
- This triggered rapid, redundant network requests to `/api/notifications` and `/api/settings`.
- It also initiated frequent state updates that caused deep, costly re-renders of the monolithic main component, thrashing the browser's main thread and causing massive TBT spikes.

### B. Sequential API Fetching Waterfall (FCP / LCP Bottlenecks)
In `/src/components/ExecutiveOverview.tsx` (the core dashboard component), data was fetched on mount:
```typescript
const goalsRes = await fetchWithAuth("/api/goals");
const habitsRes = await fetchWithAuth("/api/habits");
const calendarRes = await fetchWithAuth("/api/calendar");
const notificationsRes = await fetchWithAuth("/api/notifications");
```
- Each request blocked the next one sequentially, resulting in a classic network waterfall. This delayed the rendering of dashboards, charts, and metrics, directly damaging FCP and LCP times.
- A similar sequential loading waterfall pattern was identified inside `/src/components/NotificationsPanel.tsx` between loading settings and fetching notification history.

### C. Large Unused Bundle Weight & Lack of Dynamic Imports
While some components were lazily loaded, many heavy utilities, SVG libraries, and other sub-views were imported eagerly or not fully separated. We need to verify Vite chunk-splitting configuration to ensure optimized bundles.

---

## 3. Targeted Optimization Actions

### Phase 1: Main Thread Stabilization (Total Blocking Time Reduction)
- **Action**: Refactor `/src/App.tsx`'s notification poller effect.
- **Method**: Use React `useRef` for tracking `processedInAppIds` and `tasks` inside the interval callback instead of including them in the effect's dependency array.
- **Benefit**: Reduces the poller's dependency array strictly to `[userEmail]`. The interval is initialized exactly once upon login, eliminating effect thrashing, minimizing main-thread blocking, and lowering TBT to near-zero.

### Phase 2: Eliminating Request Waterfalls (FCP / LCP Speedup)
- **Action**: Parallelize sequential API requests in `/src/components/ExecutiveOverview.tsx` and `/src/components/NotificationsPanel.tsx`.
- **Method**: Replace sequential `await` statements with a unified `Promise.allSettled()` execution block, enabling concurrent network loading.
- **Benefit**: Cuts API data-fetching time by up to 75% on initial load, rendering graphs and metrics almost instantaneously.

### Phase 3: Accessibility Improvements (Target: 95+)
- **Action**: Audit elements for contrast, ARIA roles, and accessible labels.
- **Method**: Add proper contrast, visible names, explicit `aria-*` tags, and ensure form elements are properly labeled.

---

## 4. Verification & Testing
- Run `npm run lint` to verify syntax and types.
- Run `npm run build` to compile the app and review production bundle chunks.

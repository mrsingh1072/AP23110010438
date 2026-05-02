# Campus Notifications Design

## Architecture Overview

The application is a Vite + React frontend with two routes and a focused API layer.

- `notification_app_fe/src/App.tsx` owns the router shell, theme, and persistent bearer token state.
- `notification_app_fe/src/components` contains reusable UI blocks for navigation, filtering, notification cards, and status states.
- `notification_app_fe/src/pages` contains the two required views: all notifications and priority notifications.
- `notification_app_fe/src/services/api.ts` centralizes all API communication and response normalization for the campus endpoint.
- `notification_app_fe/src/utils/prioritySort.ts` contains the reusable ranking and timestamp sorting logic.
- `notification_app_fe/src/hooks` contains the local persistence hooks for the bearer token and viewed-notification state.

## Component Hierarchy

- `App`
  - `ThemeProvider`
  - `BrowserRouter`
  - `Navbar`
  - `Routes`
    - `AllNotifications`
      - `FilterBar`
      - `NotificationCard`
      - `LoadingState`
      - `EmptyState`
      - `ErrorState`
    - `PriorityNotifications`
      - top N controls
      - `NotificationCard`
      - `LoadingState`
      - `EmptyState`
      - `ErrorState`

## API Flow

1. The user pastes a bearer token into the navbar.
2. `fetchNotificationPage()` requests `GET http://20.207.122.201/evaluation-service/notifications` with `limit`, `page`, and `notification_type` query parameters.
3. `fetchAllCampusNotifications()` iterates through pages to gather the full list for priority ranking.
4. Responses are normalized into the expected notification shape before they reach the UI.
5. Errors are surfaced to the page state so the user sees a loading or failure message instead of silent failure.

## Priority Flow

1. `selectTopPriority()` sorts by Placement > Result > Event.
2. Ties are resolved by latest timestamp first.
3. The priority page lets the user change N at runtime and re-renders instantly.

## Viewed-State Flow

1. Clicking a notification marks it as viewed in local storage.
2. Viewed cards are rendered differently from new cards.
3. The `NEW` badge disappears after the first click.

## Error Handling

- Missing tokens are handled with a visible informational alert.
- Invalid limit or page values are clamped to safe ranges.
- Empty API responses show an empty state.
- Request failures show a retryable error state.

# Specification

## Summary
**Goal:** Fix the blank/empty screen that occurs when navigating to the "Order Tracking" (متابعة الطلبات) tab, ensuring the Orders view renders reliably and remains interactive.

**Planned changes:**
- Reproduce and identify the exact runtime error/UI lock-up causing the blank screen when opening the Order Tracking tab.
- Implement a frontend fix so the Orders view consistently renders after tab navigation without uncaught console exceptions.
- Harden reminder-related code paths in Order Tracking by adding defensive error handling (try/catch + logging) around Notification creation and any storage access used during reminder checks.
- Ensure that if an Orders-tab runtime error still occurs, the existing global error boundary fallback displays instead of a blank screen.

**User-visible outcome:** Users can click the "Order Tracking" tab from a fresh load and consistently see the Order Tracking UI (even when Notifications are blocked/unsupported), without the app turning into a blank screen.

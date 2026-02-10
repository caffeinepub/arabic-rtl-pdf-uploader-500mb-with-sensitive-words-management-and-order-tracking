# Specification

## Summary
**Goal:** Restyle the existing RTL single-page app UI to match the provided WhatsApp screenshot’s layout and visual styling, without changing features or navigation.

**Planned changes:**
- Restyle the global app shell (page background, compact top bar/header, and centered content container with generous whitespace) to match the screenshot while keeping RTL enabled at the root.
- Update the existing tab navigation to a pill/segmented style (rounded tabs, subtle border, clear active state) while preserving destinations, keyboard accessibility, and behavior; apply styles via wrappers/className only (no edits to `frontend/src/components/ui` sources).
- Restyle the PDF Upload screen to include a prominent upload card with a large dashed drop-zone, centered icon + brief instructions + primary CTA button; keep all current PDF validation and upload/scan behaviors; keep scan results in a separate, clearly delineated section/card.
- Align card styling across PDF Upload, Sensitive Words, and Order Tracking (consistent padding, soft border/radius/shadow, consistent spacing) while maintaining RTL readability and responsive layout.

**User-visible outcome:** The app visually matches the provided screenshot with a cleaner centered layout, pill-style tabs, and a modern upload drop-zone card—while all existing functionality across PDF Upload, Sensitive Words, and Order Tracking remains unchanged.

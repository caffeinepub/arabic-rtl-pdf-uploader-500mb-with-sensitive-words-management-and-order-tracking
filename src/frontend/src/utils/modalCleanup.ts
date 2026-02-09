/**
 * Defensive cleanup utility for modal/dialog side effects.
 * Restores document/body styles and attributes that modal libraries
 * may leave behind, preventing blank/locked screens in Chrome.
 */
export function cleanupModalSideEffects(): void {
  try {
    // Guard: Ensure document and body exist
    if (typeof document === 'undefined' || !document.body) {
      console.warn('[modalCleanup] Document or body not available');
      return;
    }

    // Restore body overflow
    try {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    } catch (error) {
      console.error('[modalCleanup] Error restoring body overflow:', error);
    }
    
    // Restore pointer events
    try {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    } catch (error) {
      console.error('[modalCleanup] Error restoring pointer events:', error);
    }
    
    // Remove aria-hidden if set
    try {
      if (document.body.getAttribute('aria-hidden') === 'true') {
        document.body.removeAttribute('aria-hidden');
      }
    } catch (error) {
      console.error('[modalCleanup] Error removing aria-hidden:', error);
    }
    
    // Restore document element overflow
    try {
      if (document.documentElement && document.documentElement.style.overflow === 'hidden') {
        document.documentElement.style.overflow = '';
      }
    } catch (error) {
      console.error('[modalCleanup] Error restoring documentElement overflow:', error);
    }
    
    // Remove any data-scroll-locked attributes
    try {
      document.body.removeAttribute('data-scroll-locked');
      if (document.documentElement) {
        document.documentElement.removeAttribute('data-scroll-locked');
      }
    } catch (error) {
      console.error('[modalCleanup] Error removing scroll-locked attributes:', error);
    }
    
    // Restore any padding-right that was added for scrollbar compensation
    try {
      if (document.body.style.paddingRight) {
        document.body.style.paddingRight = '';
      }
    } catch (error) {
      console.error('[modalCleanup] Error restoring padding-right:', error);
    }
  } catch (error) {
    console.error('[modalCleanup] Critical error in cleanupModalSideEffects:', error);
    // Don't throw - cleanup failure should not break the app
  }
}

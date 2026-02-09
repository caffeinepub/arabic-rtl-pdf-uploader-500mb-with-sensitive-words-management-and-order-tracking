import { useEffect, useState } from 'react';
import { SchroedingkOrder } from '../../backend';

interface OrderWithId extends SchroedingkOrder {
  id: number;
}

const ACKNOWLEDGED_KEY = 'acknowledgedReminders';

export function useReminderScheduler(orders: OrderWithId[]) {
  const [dueReminder, setDueReminder] = useState<OrderWithId | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      try {
        const now = new Date();
        const acknowledged = getAcknowledgedReminders();

        for (const order of orders) {
          if (!order.reminderDate) continue;

          const reminderKey = `${order.id}-${order.reminderDate}`;
          if (acknowledged.has(reminderKey)) continue;

          try {
            const reminderTime = new Date(order.reminderDate);
            
            // Validate date
            if (isNaN(reminderTime.getTime())) {
              console.warn(`[ReminderScheduler] Invalid reminder date for order ${order.id}:`, order.reminderDate);
              continue;
            }
            
            if (reminderTime <= now) {
              setDueReminder(order);
              
              // Trigger browser notification if permitted - with defensive guards
              try {
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  if (Notification.permission === 'granted') {
                    // Guard: Ensure Notification constructor is available
                    if (typeof Notification === 'function') {
                      new Notification('تذكير بطلب', {
                        body: `رقم الطلب: ${order.orderNumber}\nالكتاب: ${order.bookTitle}`,
                        icon: '/favicon.ico',
                        tag: reminderKey,
                      });
                    }
                  }
                }
              } catch (notificationError) {
                console.error('[ReminderScheduler] Error creating notification:', notificationError);
                // Continue execution - notification failure should not break reminder display
              }
              
              break;
            }
          } catch (dateError) {
            console.error('[ReminderScheduler] Error parsing reminder date for order', order.id, ':', dateError);
            // Continue to next order
          }
        }
      } catch (error) {
        console.error('[ReminderScheduler] Error in checkReminders:', error);
        // Don't throw - keep the interval running
      }
    };

    // Check immediately - wrapped in try/catch
    try {
      checkReminders();
    } catch (error) {
      console.error('[ReminderScheduler] Error in initial reminder check:', error);
    }

    // Check every minute
    const interval = setInterval(() => {
      try {
        checkReminders();
      } catch (error) {
        console.error('[ReminderScheduler] Error in interval reminder check:', error);
      }
    }, 60000);

    return () => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.error('[ReminderScheduler] Error clearing interval:', error);
      }
    };
  }, [orders]);

  const dismissReminder = () => {
    try {
      if (dueReminder) {
        const reminderKey = `${dueReminder.id}-${dueReminder.reminderDate}`;
        acknowledgeReminder(reminderKey);
        setDueReminder(null);
      }
    } catch (error) {
      console.error('[ReminderScheduler] Error dismissing reminder:', error);
      // Still clear the reminder from UI even if acknowledgment fails
      setDueReminder(null);
    }
  };

  return { dueReminder, dismissReminder };
}

function getAcknowledgedReminders(): Set<string> {
  try {
    // Guard: Check if localStorage is available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('[ReminderScheduler] localStorage not available');
      return new Set();
    }
    
    const stored = localStorage.getItem(ACKNOWLEDGED_KEY);
    if (!stored) {
      return new Set();
    }
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch (error) {
    console.error('[ReminderScheduler] Error reading acknowledged reminders:', error);
    return new Set();
  }
}

function acknowledgeReminder(key: string) {
  try {
    // Guard: Check if localStorage is available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('[ReminderScheduler] localStorage not available for acknowledgment');
      return;
    }
    
    const acknowledged = getAcknowledgedReminders();
    acknowledged.add(key);
    localStorage.setItem(ACKNOWLEDGED_KEY, JSON.stringify([...acknowledged]));
  } catch (error) {
    console.error('[ReminderScheduler] Failed to acknowledge reminder:', error);
    // Don't throw - acknowledgment failure should not break the app
  }
}

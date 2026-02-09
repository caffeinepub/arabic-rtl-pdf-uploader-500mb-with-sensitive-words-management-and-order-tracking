import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { SchroedingkOrder } from '../../backend';
import { cleanupModalSideEffects } from '../../utils/modalCleanup';

interface ReminderDialogProps {
  order: SchroedingkOrder & { id: number };
  onDismiss: () => void;
  notificationsEnabled: boolean;
}

export default function ReminderDialog({ order, onDismiss, notificationsEnabled }: ReminderDialogProps) {
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupModalSideEffects();
    };
  }, []);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDismiss = () => {
    onDismiss();
    // Ensure cleanup after dismiss
    setTimeout(() => cleanupModalSideEffects(), 150);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleDismiss();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Bell className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-center text-xl">تذكير بطلب</DialogTitle>
          <DialogDescription className="text-center">
            حان موعد التذكير بالطلب التالي
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">رقم الطلب:</span>
              <p className="font-semibold text-lg">{order.orderNumber}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">عنوان الكتاب:</span>
              <p className="font-semibold">{order.bookTitle}</p>
            </div>
            {order.transferEntity && (
              <div>
                <span className="text-sm text-muted-foreground">جهة التحويل:</span>
                <p>{order.transferEntity}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <span className="text-sm text-muted-foreground">ملاحظات:</span>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">موعد التذكير:</span>
              <p className="text-sm">{formatDate(order.reminderDate)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full">
            تم الاطلاع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

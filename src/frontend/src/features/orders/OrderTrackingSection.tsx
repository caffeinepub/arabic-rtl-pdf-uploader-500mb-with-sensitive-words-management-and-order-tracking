import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Plus, Edit2, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SchroedingkOrder } from '../../backend';
import ReminderDialog from '../../components/reminders/ReminderDialog';
import { useReminderScheduler } from './useReminderScheduler';
import { cleanupModalSideEffects } from '../../utils/modalCleanup';

interface OrderWithId extends SchroedingkOrder {
  id: number;
}

export default function OrderTrackingSection() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithId | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [formData, setFormData] = useState<SchroedingkOrder>({
    orderNumber: '',
    bookTitle: '',
    transferEntity: '',
    transferDate: '',
    reminderDate: '',
    notes: '',
  });

  const { data: ordersArray = [], isLoading } = useGetAllOrders();
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();

  // Convert orders array to array with IDs
  const orders: OrderWithId[] = ordersArray.map((order, index) => ({
    ...order,
    id: index,
  }));

  const { dueReminder, dismissReminder } = useReminderScheduler(orders);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        cleanupModalSideEffects();
      } catch (error) {
        console.error('[OrderTracking] Cleanup error on unmount:', error);
      }
    };
  }, []);

  // Check notification permission with defensive guards
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setNotificationsEnabled(true);
        }
      }
    } catch (error) {
      console.error('[OrderTracking] Error checking notification permission:', error);
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      // Guard: Check if Notification API exists
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[OrderTracking] Notification API not available');
        toast.error('المتصفح لا يدعم الإشعارات');
        return;
      }

      // Guard: Check if requestPermission exists
      if (typeof Notification.requestPermission !== 'function') {
        console.warn('[OrderTracking] Notification.requestPermission not available');
        toast.error('المتصفح لا يدعم طلب إذن الإشعارات');
        return;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('تم تفعيل الإشعارات');
      } else if (permission === 'denied') {
        console.log('[OrderTracking] Notification permission denied by user');
        toast.error('تم رفض إذن الإشعارات');
      } else {
        console.log('[OrderTracking] Notification permission dismissed');
        toast.info('لم يتم منح إذن الإشعارات');
      }
    } catch (error) {
      console.error('[OrderTracking] Error requesting notification permission:', error);
      toast.error('حدث خطأ أثناء طلب إذن الإشعارات');
    }
  };

  const resetForm = () => {
    setFormData({
      orderNumber: '',
      bookTitle: '',
      transferEntity: '',
      transferDate: '',
      reminderDate: '',
      notes: '',
    });
    setEditingOrder(null);
  };

  const handleOpenForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (order: OrderWithId) => {
    setFormData(order);
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    resetForm();
    // Ensure cleanup after close
    setTimeout(() => {
      try {
        cleanupModalSideEffects();
      } catch (error) {
        console.error('[OrderTracking] Cleanup error after form close:', error);
      }
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderNumber.trim() || !formData.bookTitle.trim()) {
      toast.error('يرجى إدخال رقم الطلب وعنوان الكتاب');
      return;
    }

    try {
      if (editingOrder) {
        await updateMutation.mutateAsync({ id: BigInt(editingOrder.id), order: formData });
        toast.success('تم تحديث الطلب بنجاح');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('تم إضافة الطلب بنجاح');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(editingOrder ? 'فشل تحديث الطلب' : 'فشل إضافة الطلب');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;

    try {
      await deleteMutation.mutateAsync(BigInt(deletingId));
      toast.success('تم حذف الطلب بنجاح');
      setDeletingId(null);
      // Ensure cleanup after delete
      setTimeout(() => {
        try {
          cleanupModalSideEffects();
        } catch (error) {
          console.error('[OrderTracking] Cleanup error after delete:', error);
        }
      }, 150);
    } catch (error) {
      toast.error('فشل حذف الطلب');
      console.error(error);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
    // Ensure cleanup after cancel
    setTimeout(() => {
      try {
        cleanupModalSideEffects();
      } catch (error) {
        console.error('[OrderTracking] Cleanup error after cancel delete:', error);
      }
    }, 150);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                متابعة الطلبات
              </CardTitle>
              <CardDescription>
                إدارة طلبات الكتب مع نظام تذكير تلقائي
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  onClick={requestNotificationPermission}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  تفعيل الإشعارات
                </Button>
              )}
              <Button onClick={handleOpenForm} className="gap-2">
                <Plus className="w-4 h-4" />
                طلب جديد
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notificationsEnabled && (
            <div className="mb-4 p-3 bg-accent/50 rounded-lg flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-accent-foreground" />
              <span>الإشعارات مفعلة - سيتم تنبيهك عند حلول موعد التذكير</span>
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طلبات محفوظة</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">عنوان الكتاب</TableHead>
                    <TableHead className="text-right">جهة التحويل</TableHead>
                    <TableHead className="text-right">تاريخ التحويل</TableHead>
                    <TableHead className="text-right">تاريخ التذكير</TableHead>
                    <TableHead className="text-left w-[100px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.bookTitle}</TableCell>
                      <TableCell>{order.transferEntity || '-'}</TableCell>
                      <TableCell>{formatDate(order.transferDate)}</TableCell>
                      <TableCell>{formatDate(order.reminderDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(order)}
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(order.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'تعديل الطلب' : 'طلب جديد'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? 'تحديث معلومات الطلب' : 'إضافة طلب جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">رقم الطلب *</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="أدخل رقم الطلب"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookTitle">عنوان الكتاب *</Label>
              <Input
                id="bookTitle"
                value={formData.bookTitle}
                onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                placeholder="أدخل عنوان الكتاب"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferEntity">جهة التحويل</Label>
              <Input
                id="transferEntity"
                value={formData.transferEntity}
                onChange={(e) => setFormData({ ...formData, transferEntity: e.target.value })}
                placeholder="أدخل جهة التحويل"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferDate">تاريخ التحويل</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDate">تاريخ التذكير</Label>
                <Input
                  id="reminderDate"
                  type="datetime-local"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'جاري الحفظ...'
                  : editingOrder
                  ? 'تحديث'
                  : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => {
        if (!open) {
          handleCancelDelete();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={deleteMutation.isPending}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reminder Dialog */}
      {dueReminder && (
        <ReminderDialog
          order={dueReminder}
          onDismiss={dismissReminder}
          notificationsEnabled={notificationsEnabled}
        />
      )}
    </div>
  );
}

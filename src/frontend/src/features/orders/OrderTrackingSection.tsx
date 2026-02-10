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

  const orders: OrderWithId[] = ordersArray.map((order, index) => ({
    ...order,
    id: index,
  }));

  const { dueReminder, dismissReminder } = useReminderScheduler(orders);

  useEffect(() => {
    return () => {
      try {
        cleanupModalSideEffects();
      } catch (error) {
        console.error('[OrderTracking] Cleanup error on unmount:', error);
      }
    };
  }, []);

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
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[OrderTracking] Notification API not available');
        toast.error('Browser does not support notifications');
        return;
      }

      if (typeof Notification.requestPermission !== 'function') {
        console.warn('[OrderTracking] Notification.requestPermission not available');
        toast.error('Browser does not support notification permission request');
        return;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notifications enabled');
      } else if (permission === 'denied') {
        console.log('[OrderTracking] Notification permission denied by user');
        toast.error('Notification permission denied');
      } else {
        console.log('[OrderTracking] Notification permission dismissed');
        toast.info('Notification permission not granted');
      }
    } catch (error) {
      console.error('[OrderTracking] Error requesting notification permission:', error);
      toast.error('Error requesting notification permission');
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
      toast.error('Please enter order number and book title');
      return;
    }

    try {
      if (editingOrder) {
        await updateMutation.mutateAsync({ id: BigInt(editingOrder.id), order: formData });
        toast.success('Order updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Order added successfully');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(editingOrder ? 'Failed to update order' : 'Failed to add order');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;

    try {
      await deleteMutation.mutateAsync(BigInt(deletingId));
      toast.success('Order deleted successfully');
      setDeletingId(null);
      setTimeout(() => {
        try {
          cleanupModalSideEffects();
        } catch (error) {
          console.error('[OrderTracking] Cleanup error after delete:', error);
        }
      }, 150);
    } catch (error) {
      toast.error('Failed to delete order');
      console.error(error);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
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
      return date.toLocaleDateString('en-US', {
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
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <ClipboardList className="w-5 h-5" />
                Order Tracking
              </CardTitle>
              <CardDescription className="text-sm">
                Manage book orders with automatic reminder system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  onClick={requestNotificationPermission}
                  size="sm"
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Enable Notifications</span>
                </Button>
              )}
              <Button onClick={handleOpenForm} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Order</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notificationsEnabled && (
            <div className="mb-4 p-3 bg-accent/50 rounded-lg flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-accent-foreground" />
              <span>Notifications enabled - you will be alerted when reminders are due</span>
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No saved orders</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Order Number</TableHead>
                      <TableHead className="text-right">Book Title</TableHead>
                      <TableHead className="text-right">Transfer Entity</TableHead>
                      <TableHead className="text-right">Transfer Date</TableHead>
                      <TableHead className="text-right">Reminder Date</TableHead>
                      <TableHead className="text-left w-[100px]">Actions</TableHead>
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
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(order.id)}
                              title="Delete"
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
            <DialogTitle>{editingOrder ? 'Edit Order' : 'New Order'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? 'Update order information' : 'Add a new order to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number *</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="Enter order number"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookTitle">Book Title *</Label>
              <Input
                id="bookTitle"
                value={formData.bookTitle}
                onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                placeholder="Enter book title"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferEntity">Transfer Entity</Label>
              <Input
                id="transferEntity"
                value={formData.transferEntity}
                onChange={(e) => setFormData({ ...formData, transferEntity: e.target.value })}
                placeholder="Enter transfer entity"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferDate">Transfer Date</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDate">Reminder Date</Label>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingOrder
                  ? 'Update'
                  : 'Add'}
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
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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


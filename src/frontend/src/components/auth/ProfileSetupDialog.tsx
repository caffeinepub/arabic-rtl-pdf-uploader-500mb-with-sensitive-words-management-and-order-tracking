import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { cleanupModalSideEffects } from '../../utils/modalCleanup';

interface ProfileSetupDialogProps {
  open: boolean;
}

export default function ProfileSetupDialog({ open }: ProfileSetupDialogProps) {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  // Cleanup on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (!open) {
        cleanupModalSideEffects();
      }
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success('تم حفظ الملف الشخصي بنجاح');
      // Ensure cleanup after successful save
      setTimeout(() => cleanupModalSideEffects(), 150);
    } catch (error) {
      toast.error('فشل حفظ الملف الشخصي');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // Defensive cleanup on any close attempt
      cleanupModalSideEffects();
    }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">إعداد الملف الشخصي</DialogTitle>
          <DialogDescription className="text-center">
            يرجى إدخال اسمك لإكمال إعداد حسابك
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              autoFocus
              disabled={saveProfile.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim()}
          >
            {saveProfile.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

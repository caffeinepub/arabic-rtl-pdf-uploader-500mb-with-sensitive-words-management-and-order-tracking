import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllSensitiveWords, useSaveSensitiveWord, useUpdateSensitiveWord, useRemoveSensitiveWord } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SensitiveWordsSection() {
  const [inputText, setInputText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<{ id: bigint; word: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const { data: words = [], isLoading } = useGetAllSensitiveWords();
  const saveMutation = useSaveSensitiveWord();
  const updateMutation = useUpdateSensitiveWord();
  const removeMutation = useRemoveSensitiveWord();

  const handleAdd = async () => {
    if (!inputText.trim()) {
      toast.error('يرجى إدخال كلمة أو أكثر');
      return;
    }

    const wordsToAdd = inputText
      .split(/[\n,،]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (wordsToAdd.length === 0) {
      toast.error('يرجى إدخال كلمة صحيحة');
      return;
    }

    try {
      for (const word of wordsToAdd) {
        await saveMutation.mutateAsync(word);
      }
      toast.success(`تم إضافة ${wordsToAdd.length} كلمة بنجاح`);
      setInputText('');
    } catch (error) {
      toast.error('فشل إضافة الكلمات');
      console.error(error);
    }
  };

  const handleEdit = (id: bigint, word: string) => {
    setEditingWord({ id, word });
    setEditValue(word);
  };

  const handleUpdate = async () => {
    if (!editingWord || !editValue.trim()) {
      toast.error('يرجى إدخال كلمة صحيحة');
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingWord.id, word: editValue.trim() });
      toast.success('تم تحديث الكلمة بنجاح');
      setEditingWord(null);
      setEditValue('');
    } catch (error) {
      toast.error('فشل تحديث الكلمة');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await removeMutation.mutateAsync(deletingId);
      toast.success('تم حذف الكلمة بنجاح');
      setDeletingId(null);
    } catch (error) {
      toast.error('فشل حذف الكلمة');
      console.error(error);
    }
  };

  const maskWord = (word: string): string => {
    return '•'.repeat(Math.min(word.length, 10));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            الكلمات الحساسة
          </CardTitle>
          <CardDescription>
            إدارة الكلمات والعبارات الحساسة مع إمكانية الإضافة والتعديل والحذف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="words-input">إضافة كلمات حساسة</Label>
            <Textarea
              id="words-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="أدخل كلمة أو أكثر (افصل بينها بفاصلة أو سطر جديد)"
              rows={4}
              disabled={saveMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              يمكنك إدخال كلمة واحدة أو عدة كلمات مفصولة بفاصلة (،) أو سطر جديد
            </p>
          </div>

          <Button
            onClick={handleAdd}
            disabled={saveMutation.isPending || !inputText.trim()}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {saveMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة الكلمات الحساسة</CardTitle>
              <CardDescription>
                {words.length} كلمة محفوظة
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="visibility-toggle" className="cursor-pointer">
                {isVisible ? 'إخفاء' : 'إظهار'}
              </Label>
              <Switch
                id="visibility-toggle"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
              {isVisible ? (
                <Eye className="w-4 h-4 text-muted-foreground" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : words.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد كلمات حساسة محفوظة</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الكلمة</TableHead>
                    <TableHead className="text-left w-[100px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.map(([id, word]) => (
                    <TableRow key={id.toString()}>
                      <TableCell className="font-medium">
                        {isVisible ? word : maskWord(word)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-start">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(id, word)}
                            disabled={updateMutation.isPending || removeMutation.isPending}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(id)}
                            disabled={updateMutation.isPending || removeMutation.isPending}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingWord} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الكلمة</DialogTitle>
            <DialogDescription>
              قم بتعديل الكلمة الحساسة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-word">الكلمة</Label>
              <Input
                id="edit-word"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingWord(null)}
              disabled={updateMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editValue.trim()}
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الكلمة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

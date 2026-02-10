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
      toast.error('Please enter at least one word');
      return;
    }

    const wordsToAdd = inputText
      .split(/[\n,،]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (wordsToAdd.length === 0) {
      toast.error('Please enter valid words');
      return;
    }

    try {
      for (const word of wordsToAdd) {
        await saveMutation.mutateAsync(word);
      }
      toast.success(`Added ${wordsToAdd.length} word(s) successfully`);
      setInputText('');
    } catch (error) {
      toast.error('Failed to add words');
      console.error(error);
    }
  };

  const handleEdit = (id: bigint, word: string) => {
    setEditingWord({ id, word });
    setEditValue(word);
  };

  const handleUpdate = async () => {
    if (!editingWord || !editValue.trim()) {
      toast.error('Please enter a valid word');
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingWord.id, word: editValue.trim() });
      toast.success('Word updated successfully');
      setEditingWord(null);
      setEditValue('');
    } catch (error) {
      toast.error('Failed to update word');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await removeMutation.mutateAsync(deletingId);
      toast.success('Word deleted successfully');
      setDeletingId(null);
    } catch (error) {
      toast.error('Failed to delete word');
      console.error(error);
    }
  };

  const maskWord = (word: string): string => {
    return '•'.repeat(Math.min(word.length, 10));
  };

  return (
    <div className="space-y-6">
      {/* Add Words Card */}
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="w-5 h-5" />
            Sensitive Words
          </CardTitle>
          <CardDescription className="text-sm">
            Manage sensitive words and phrases with add, edit, and delete capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="words-input">Add Sensitive Words</Label>
            <Textarea
              id="words-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter one or more words (separate with comma or new line)"
              rows={4}
              disabled={saveMutation.isPending}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              You can enter a single word or multiple words separated by comma (,) or new line
            </p>
          </div>

          <Button
            onClick={handleAdd}
            disabled={saveMutation.isPending || !inputText.trim()}
            className="gap-2"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            {saveMutation.isPending ? 'Adding...' : 'Add Words'}
          </Button>
        </CardContent>
      </Card>

      {/* Words List Card */}
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Saved Words</CardTitle>
              <CardDescription className="text-sm">
                {words.length} word(s) saved
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="visibility-toggle" className="text-sm cursor-pointer">
                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Label>
              <Switch
                id="visibility-toggle"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : words.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No saved words</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[60px]">#</TableHead>
                      <TableHead className="text-right">Word/Phrase</TableHead>
                      <TableHead className="text-left w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {words.map(([id, word], index) => (
                      <TableRow key={id.toString()}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {isVisible ? word : maskWord(word)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(id, word)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingId(id)}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingWord} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Word</DialogTitle>
            <DialogDescription>
              Update the sensitive word or phrase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-word">Word/Phrase</Label>
              <Input
                id="edit-word"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter word or phrase"
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
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editValue.trim()}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this word? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


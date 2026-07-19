import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newsletter } from '@/api/entities';
import { MobileSheetSelect } from '@/components/MobileSheetSelect';
import { Mail, Sparkles, Trash2, Plus } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Newsletters() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isAIDialogOpen = searchParams.get('action') === 'ai';
  const isEditDialogOpen = searchParams.get('action') === 'add' || !!searchParams.get('edit');
  const [editing, setEditing] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [formData, setFormData] = useState({ subject: '', content: '', status: 'Draft' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await Newsletter.list('-created_date');
    setNewsletters(data);
    setLoading(false);
  }

  function generateWithAI() {
    toast({
      title: 'AI generation coming soon',
      description: 'Connect an LLM API key via a Supabase Edge Function to enable AI-written newsletters. For now, use "Write" to draft one manually.',
    });
  }

  function openAdd() {
    setEditing(null);
    setFormData({ subject: '', content: '', status: 'Draft' });
    setSearchParams({ action: 'add' });
  }

  function openEdit(n) {
    setEditing(n);
    setFormData({ subject: n.subject || '', content: n.content || '', status: n.status || 'Draft' });
    setSearchParams({ edit: n.id });
  }

  async function save() {
    if (editing) {
      await Newsletter.update(editing.id, formData);
      setNewsletters((prev) => prev.map((n) => (n.id === editing.id ? { ...n, ...formData } : n)));
      toast({ title: 'Newsletter updated' });
    } else {
      const created = await Newsletter.create(formData);
      setNewsletters((prev) => [created, ...prev]);
      toast({ title: 'Newsletter created' });
    }
    setSearchParams({}, { replace: true });
  }

  async function updateStatus(n, status) {
    const updates = { status };
    if (status === 'Sent' && !n.recipient_count) {
      updates.recipient_count = 0;
      updates.open_rate = 0;
    }
    await Newsletter.update(n.id, updates);
    setNewsletters((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updates } : x)));
    if (status === 'Sent') toast({ title: 'Newsletter marked as sent!' });
  }

  async function remove(id) {
    await Newsletter.delete(id);
    setNewsletters((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Email Newsletters" description="Write and track email campaigns that keep customers coming back.">
        <Button onClick={() => setSearchParams({ action: 'ai' })} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Generate with AI
        </Button>
        <Button variant="outline" onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Write
        </Button>
      </PageHeader>

      {newsletters.length === 0 ? (
        <EmptyState icon={Mail} title="No newsletters yet" description="Write your first email newsletter to get started.">
          <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Write
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {newsletters.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-stone-200/80 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-900 truncate">{n.subject}</h3>
                      {n.ai_generated && (
                        <span className="bg-teal-50 text-teal-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">{n.content}</p>
                    {n.status === 'Sent' && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                        <span>{n.recipient_count} recipients</span>
                        <span>{n.open_rate}% open rate</span>
                      </div>
                    )}
                  </div>
                </div>
                <StatusBadge status={n.status} />
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-stone-100">
                <Select value={n.status} onValueChange={(v) => updateStatus(n, v)}>
                  <SelectTrigger className="h-8 text-xs border-0 px-2 w-auto min-w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs" onClick={() => openEdit(n)}>Edit</Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(n.id)}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isAIDialogOpen} onOpenChange={(open) => { if (!open) setSearchParams({}, { replace: true }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" /> Generate Newsletter with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>What's the newsletter about?</Label>
              <Textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Summer menu launch, customer appreciation month, holiday specials..."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>Cancel</Button>
            <Button onClick={generateWithAI} disabled={!aiTopic.trim()} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Sparkles className="w-4 h-4" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setSearchParams({}, { replace: true }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Newsletter' : 'Write Newsletter'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Subject</Label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="mt-1.5" placeholder="Email subject line" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="mt-1.5" />
            </div>
            <div>
              <Label>Status</Label>
              <MobileSheetSelect
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
                options={['Draft', 'Scheduled', 'Sent']}
                triggerClassName="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>Cancel</Button>
            <Button onClick={save} disabled={!formData.subject.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

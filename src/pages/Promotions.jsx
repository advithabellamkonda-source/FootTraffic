import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Promotion } from '@/api/entities';
import { invokeLLM } from '@/api/ai';
import { MobileSheetSelect } from '@/components/MobileSheetSelect';
import { Plus, Tag, Trash2, Sparkles, TrendingUp, Users } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge, AILoading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const DISCOUNT_TYPES = ['Percentage', 'Fixed Amount', 'Buy One Get One', 'Free Item'];

export default function Promotions() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isDialogOpen = searchParams.get('action') === 'add' || !!searchParams.get('edit');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', discount_type: 'Percentage', discount_value: '', target_segment: '', status: 'Draft' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await Promotion.list('-created_date');
    setPromos(data);
    setLoading(false);
  }

  async function suggestWithAI() {
    setAiLoading(true);
    try {
      const result = await invokeLLM({
        prompt: `You are a marketing expert for a small local business. Based on current local neighborhood trends, seasonal events, and community happenings, suggest ONE compelling promotion that would drive foot traffic and customer loyalty. Consider what's trending locally and seasonally right now.`,
        jsonSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            discount_type: { type: 'string', enum: DISCOUNT_TYPES },
            discount_value: { type: 'string' },
            target_segment: { type: 'string' },
          },
          required: ['title', 'description', 'discount_type', 'discount_value'],
        },
        grounding: true,
      });

      const promo = await Promotion.create({
        ...result,
        status: 'Draft',
        ai_generated: true,
      });

      setPromos((prev) => [promo, ...prev]);
      toast({ title: 'Promotion suggested!', description: 'AI generated this based on local neighborhood trends.' });
    } catch (e) {
      toast({ title: 'Failed to generate', description: e.message, variant: 'destructive' });
    }
    setAiLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setFormData({ title: '', description: '', discount_type: 'Percentage', discount_value: '', target_segment: '', status: 'Draft' });
    setSearchParams({ action: 'add' });
  }

  function openEdit(p) {
    setEditing(p);
    setFormData({
      title: p.title || '', description: p.description || '', discount_type: p.discount_type || 'Percentage',
      discount_value: p.discount_value || '', target_segment: p.target_segment || '', status: p.status || 'Draft',
    });
    setSearchParams({ edit: p.id });
  }

  async function save() {
    if (editing) {
      await Promotion.update(editing.id, formData);
      setPromos((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...formData } : p)));
      toast({ title: 'Promotion updated' });
    } else {
      const created = await Promotion.create(formData);
      setPromos((prev) => [created, ...prev]);
      toast({ title: 'Promotion created' });
    }
    setSearchParams({}, { replace: true });
  }

  async function updateStatus(p, status) {
    await Promotion.update(p.id, { status });
    setPromos((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
  }

  async function remove(id) {
    await Promotion.delete(id);
    setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Promotions" description="AI-suggested promotions based on local neighborhood trends and seasonal events.">
        <Button onClick={suggestWithAI} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Suggest with AI
        </Button>
        <Button variant="outline" onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </PageHeader>

      {aiLoading && (
        <div className="bg-white rounded-2xl border border-stone-200/80 mb-6">
          <AILoading message="Analyzing local neighborhood trends..." />
        </div>
      )}

      {promos.length === 0 && !aiLoading ? (
        <EmptyState icon={Tag} title="No promotions yet" description="Let AI suggest promotions based on what's trending in your neighborhood.">
          <Button onClick={suggestWithAI} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Sparkles className="w-4 h-4" /> Suggest with AI
          </Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200/80 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <StatusBadge status={p.status} />
                {p.ai_generated && (
                  <span className="bg-teal-50 text-teal-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-stone-900 text-base">{p.title}</h3>
              <p className="text-sm text-stone-500 mt-1 flex-1 line-clamp-3">{p.description}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-600">{p.discount_type}: <span className="font-medium text-stone-900">{p.discount_value}</span></span>
                </div>
                {p.target_segment && (
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-600">{p.target_segment}</span>
                  </div>
                )}
                {p.redemptions > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-600">{p.redemptions} redemptions · ${p.revenue_generated} revenue</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-stone-100">
                <Select value={p.status} onValueChange={(v) => updateStatus(p, v)}>
                  <SelectTrigger className="h-8 text-xs border-0 px-2 w-auto min-w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs" onClick={() => openEdit(p)}>Edit</Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(p.id)}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setSearchParams({}, { replace: true }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1.5" placeholder="Summer Flash Sale" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <MobileSheetSelect
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  options={DISCOUNT_TYPES}
                  triggerClassName="mt-1.5"
                />
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="mt-1.5" placeholder="20% off" />
              </div>
            </div>
            <div>
              <Label>Target Segment</Label>
              <Input value={formData.target_segment} onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })} className="mt-1.5" placeholder="New customers, Gold members..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>Cancel</Button>
            <Button onClick={save} disabled={!formData.title.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Partnership } from '@/api/entities';
import { invokeLLM } from '@/api/ai';
import { Building2, Sparkles, Trash2, Plus } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, AILoading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Partnerships() {
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ partner_name: '', partner_type: '', mutual_benefit: '', notes: '' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await Partnership.list('-created_date');
    setPartnerships(data);
    setLoading(false);
  }

  async function suggestWithAI() {
    setAiLoading(true);
    try {
      const result = await invokeLLM({
        prompt: `You are a business consultant for a small local business. Suggest 3 local business partnership opportunities. Consider complementary businesses that share a similar customer base and could create mutual value through cross-promotion, joint events, or bundled offers.`,
        jsonSchema: {
          type: 'object',
          properties: {
            partnerships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  partner_name: { type: 'string' },
                  partner_type: { type: 'string' },
                  mutual_benefit: { type: 'string' },
                },
                required: ['partner_name', 'partner_type', 'mutual_benefit'],
              },
            },
          },
          required: ['partnerships'],
        },
        grounding: true,
      });

      const created = await Partnership.bulkCreate(
        result.partnerships.map((p) => ({ ...p, suggested_by_ai: true, status: 'Suggested' }))
      );
      setPartnerships((prev) => [...created, ...prev]);
      toast({ title: 'Partnerships suggested!', description: 'AI found complementary local businesses for you.' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setAiLoading(false);
  }

  async function save() {
    const created = await Partnership.create({ ...formData, status: 'Suggested', suggested_by_ai: false });
    setPartnerships((prev) => [created, ...prev]);
    setShowDialog(false);
    setFormData({ partner_name: '', partner_type: '', mutual_benefit: '', notes: '' });
    toast({ title: 'Partnership added' });
  }

  async function updateStatus(p, status) {
    await Partnership.update(p.id, { status });
    setPartnerships((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
  }

  async function remove(id) {
    await Partnership.delete(id);
    setPartnerships((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Partnerships" description="AI-suggested local business partnerships to grow your customer base together.">
        <Button onClick={suggestWithAI} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Suggest with AI
        </Button>
        <Button variant="outline" onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </PageHeader>

      {aiLoading && (
        <div className="bg-white rounded-2xl border border-stone-200/80 mb-6">
          <AILoading message="Finding local partnership opportunities..." />
        </div>
      )}

      {partnerships.length === 0 && !aiLoading ? (
        <EmptyState icon={Building2} title="No partnerships yet" description="Let AI suggest complementary local businesses for cross-promotion.">
          <Button onClick={suggestWithAI} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Sparkles className="w-4 h-4" /> Suggest with AI
          </Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {partnerships.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200/80 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                {p.suggested_by_ai && (
                  <span className="bg-teal-50 text-teal-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-stone-900">{p.partner_name}</h3>
              <p className="text-xs text-teal-600 font-medium mt-0.5">{p.partner_type}</p>
              <p className="text-sm text-stone-500 mt-2 flex-1">{p.mutual_benefit}</p>
              {p.notes && <p className="text-xs text-stone-400 mt-2 italic">{p.notes}</p>}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-stone-100">
                <Select value={p.status} onValueChange={(v) => updateStatus(p, v)}>
                  <SelectTrigger className="h-8 text-xs border-0 px-2 w-auto min-w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suggested">Suggested</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(p.id)}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partnership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Partner Name</Label>
              <Input value={formData.partner_name} onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })} className="mt-1.5" placeholder="Sunrise Yoga Studio" />
            </div>
            <div>
              <Label>Partner Type</Label>
              <Input value={formData.partner_type} onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })} className="mt-1.5" placeholder="Fitness, Retail, Food..." />
            </div>
            <div>
              <Label>Mutual Benefit</Label>
              <Textarea value={formData.mutual_benefit} onChange={(e) => setFormData({ ...formData, mutual_benefit: e.target.value })} rows={3} className="mt-1.5" placeholder="How both businesses benefit..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={!formData.partner_name.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

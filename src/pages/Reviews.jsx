import { useState, useEffect } from 'react';
import { Review } from '@/api/entities';
import { Star, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { MobileSheetSelect } from '@/components/MobileSheetSelect';
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const FILTERS = ['Pending', 'Responded', 'All'];
const PLATFORMS = ['Google', 'Yelp', 'Facebook', 'Instagram'];

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({ customer_name: '', platform: 'Google', rating: 5, content: '' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await Review.list('-created_date');
    setReviews(data);
    setLoading(false);
  }

  function generateResponse() {
    toast({
      title: 'AI generation coming soon',
      description: 'Connect an LLM API key via a Supabase Edge Function to enable AI-written replies. For now, use "Write Response" to reply manually.',
    });
  }

  function startEdit(review) {
    setEditingId(review.id);
    setEditText(review.response || '');
  }

  async function saveEdit(review) {
    await Review.update(review.id, { response: editText, status: 'Responded' });
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, response: editText, status: 'Responded' } : r)));
    setEditingId(null);
    toast({ title: 'Response saved' });
  }

  async function addReview() {
    const created = await Review.create(formData);
    setReviews((prev) => [created, ...prev]);
    setFormData({ customer_name: '', platform: 'Google', rating: 5, content: '' });
    setAddOpen(false);
    toast({ title: 'Review added' });
  }

  const filtered = filter === 'All' ? reviews : reviews.filter((r) => r.status === filter);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Reviews" description="Track customer reviews and respond quickly.">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-sm font-semibold text-stone-900">{avgRating}</span>
            <span className="text-xs text-stone-400">avg rating</span>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Review
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reviews found" description="Add a customer review to start tracking and responding.">
          <Button onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Review
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-stone-200/80 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600">
                    {review.customer_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">{review.customer_name}</p>
                    <p className="text-xs text-stone-400">{review.platform} · {review.date || 'Recently'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn('w-4 h-4', i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-stone-200')}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-stone-700 mb-3">{review.content}</p>

              <div className="mt-3 pt-3 border-t border-stone-100">
                {editingId === review.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => saveEdit(review)} className="bg-teal-600 hover:bg-teal-700 text-white">Save Response</Button>
                    </div>
                  </div>
                ) : review.response ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Your Response</span>
                      <StatusBadge status="Responded" />
                    </div>
                    <p className="text-sm text-stone-600 italic bg-stone-50 rounded-lg p-3">{review.response}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => startEdit(review)}>
                        Edit response
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => startEdit(review)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                      Write Response
                    </Button>
                    <Button size="sm" variant="outline" onClick={generateResponse} className="gap-2">
                      <Sparkles className="w-4 h-4" /> Generate with AI
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Customer Name</Label>
              <Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="mt-1.5" placeholder="Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform</Label>
                <MobileSheetSelect
                  value={formData.platform}
                  onValueChange={(v) => setFormData({ ...formData, platform: v })}
                  options={PLATFORMS}
                  triggerClassName="mt-1.5"
                />
              </div>
              <div>
                <Label>Rating</Label>
                <MobileSheetSelect
                  value={String(formData.rating)}
                  onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) })}
                  options={['1', '2', '3', '4', '5']}
                  triggerClassName="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Review Text</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addReview} disabled={!formData.customer_name.trim() || !formData.content.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

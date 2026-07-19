import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Post } from '@/api/entities';
import { MobileSheetSelect } from '@/components/MobileSheetSelect';
import { Plus, Sparkles, Instagram, Trash2, Calendar, ImageIcon } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STATUSES = ['All', 'Draft', 'Scheduled', 'Published'];
const POST_TYPES = ['Promotion', 'Product', 'Story', 'Educational', 'Community'];

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isAIDialogOpen = searchParams.get('action') === 'ai';
  const isEditDialogOpen = searchParams.get('action') === 'add' || !!searchParams.get('edit');
  const [editingPost, setEditingPost] = useState(null);
  const [filter, setFilter] = useState('All');
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState('Promotion');
  const [formData, setFormData] = useState({ caption: '', hashtags: '', status: 'Draft', post_type: 'Promotion', image_url: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    const handler = () => loadPosts();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function loadPosts() {
    const data = await Post.list('-created_date');
    setPosts(data);
    setLoading(false);
  }

  function generateWithAI() {
    toast({
      title: 'AI generation coming soon',
      description: 'Connect an LLM API key via a Supabase Edge Function to enable AI-written posts. For now, use "Add Post" to write one manually.',
    });
  }

  function openAdd() {
    setEditingPost(null);
    setFormData({ caption: '', hashtags: '', status: 'Draft', post_type: 'Promotion', image_url: '' });
    setSearchParams({ action: 'add' });
  }

  function openEdit(post) {
    setEditingPost(post);
    setFormData({
      caption: post.caption || '',
      hashtags: post.hashtags || '',
      status: post.status || 'Draft',
      post_type: post.post_type || 'Promotion',
      image_url: post.image_url || '',
    });
    setSearchParams({ edit: post.id });
  }

  async function saveEdit() {
    if (editingPost) {
      await Post.update(editingPost.id, formData);
      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, ...formData } : p)));
      toast({ title: 'Post updated' });
    } else {
      const created = await Post.create(formData);
      setPosts((prev) => [created, ...prev]);
      toast({ title: 'Post added' });
    }
    setSearchParams({}, { replace: true });
  }

  async function updateStatus(post, status) {
    await Post.update(post.id, { status });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status } : p)));
  }

  async function deletePost(id) {
    await Post.delete(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: 'Post deleted' });
  }

  const filtered = filter === 'All' ? posts : posts.filter((p) => p.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Social Posts" description="Plan and track your Instagram posts in one place.">
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Post
          </Button>
          <Button onClick={() => setSearchParams({ action: 'ai' })} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              filter === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title="No posts yet"
          description="Add your first Instagram post to start planning your content."
        >
          <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Post
          </Button>
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col">
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                {post.image_url ? (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-stone-300 m-auto mt-[calc(50%-16px)]" />
                )}
                {post.ai_generated && (
                  <span className="absolute top-2 right-2 bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={post.status} />
                  <span className="text-xs text-stone-400">{post.post_type}</span>
                </div>
                <p className="text-sm text-stone-700 line-clamp-3 mb-2">{post.caption}</p>
                {post.hashtags && <p className="text-xs text-teal-600 line-clamp-1 mb-3">{post.hashtags}</p>}
                <div className="flex items-center gap-1 mt-auto pt-3 border-t border-stone-100">
                  <Select value={post.status} onValueChange={(v) => updateStatus(post, v)}>
                    <SelectTrigger className="h-8 text-xs border-0 px-2 w-auto min-w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="ml-auto h-8 w-8 p-0" onClick={() => openEdit(post)}>
                    <Calendar className="w-4 h-4 text-stone-500" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deletePost(post.id)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isAIDialogOpen} onOpenChange={(open) => { if (!open) setSearchParams({}, { replace: true }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" /> Generate Post with AI
            </DialogTitle>
            <DialogDescription>Tell us what your post is about and AI will create the caption, hashtags, and image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>What's the post about?</Label>
              <Textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., 20% off all coffee this Friday, new summer menu launch, customer spotlight..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label>Post type</Label>
              <MobileSheetSelect
                value={aiType}
                onValueChange={setAiType}
                options={POST_TYPES}
                triggerClassName="mt-1.5"
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
            <DialogTitle>{editingPost ? 'Edit Post' : 'Add Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Caption</Label>
              <Textarea value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} rows={4} className="mt-1.5" />
            </div>
            <div>
              <Label>Hashtags</Label>
              <Input value={formData.hashtags} onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <MobileSheetSelect
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                  options={['Draft', 'Scheduled', 'Published']}
                  triggerClassName="mt-1.5"
                />
              </div>
              <div>
                <Label>Type</Label>
                <MobileSheetSelect
                  value={formData.post_type}
                  onValueChange={(v) => setFormData({ ...formData, post_type: v })}
                  options={POST_TYPES}
                  triggerClassName="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!formData.caption.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

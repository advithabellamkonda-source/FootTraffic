import { useState, useEffect } from 'react';
import { AdCampaign } from '@/api/entities';
import { invokeLLM } from '@/api/ai';
import { DollarSign, TrendingUp, MousePointerClick, Target, Sparkles, Plus, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, LoadingSpinner, StatCard, EmptyState, AILoading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const PLATFORMS = ['Meta Ads', 'Google Ads', 'Instagram Ads', 'TikTok Ads'];

export default function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [bestTimes, setBestTimes] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ campaign_name: '', platform: 'Meta Ads', spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, status: 'Active' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await AdCampaign.list('-created_date');
    setCampaigns(data);
    setLoading(false);
  }

  async function suggestBestTimes() {
    setAiLoading(true);
    try {
      const result = await invokeLLM({
        prompt: `Based on current social media engagement data and best practices for small local businesses, what are the best times to post on Instagram? Consider day of week, time of day, and audience behavior.`,
        jsonSchema: {
          type: 'object',
          properties: {
            best_times: {
              type: 'array',
              items: {
                type: 'object',
                properties: { day: { type: 'string' }, time: { type: 'string' }, reason: { type: 'string' } },
                required: ['day', 'time', 'reason'],
              },
            },
            tips: { type: 'array', items: { type: 'string' } },
          },
          required: ['best_times', 'tips'],
        },
        grounding: true,
      });
      setBestTimes(result);
      toast({ title: 'Best times analyzed!' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
    setAiLoading(false);
  }

  async function saveCampaign() {
    const created = await AdCampaign.create(formData);
    setCampaigns((prev) => [created, ...prev]);
    setShowDialog(false);
    setFormData({ campaign_name: '', platform: 'Meta Ads', spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, status: 'Active' });
    toast({ title: 'Campaign added' });
  }

  async function remove(id) {
    await AdCampaign.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
  const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  const chartData = campaigns.map((c) => ({
    name: c.campaign_name?.length > 12 ? c.campaign_name.substring(0, 12) + '…' : c.campaign_name,
    spend: c.spend || 0,
    revenue: c.revenue || 0,
  }));

  return (
    <div>
      <PageHeader title="Analytics" description="Measure your return on advertising spend.">
        <Button onClick={suggestBestTimes} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Best Times to Post
        </Button>
        <Button variant="outline" onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Campaign
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Ad Spend" value={`$${totalSpend.toLocaleString()}`} accent="rose" />
        <StatCard icon={TrendingUp} label="Revenue Generated" value={`$${totalRevenue.toLocaleString()}`} accent="teal" />
        <StatCard icon={Target} label="Return on Ad Spend" value={`${roas}x`} accent="violet" />
        <StatCard icon={MousePointerClick} label="Click-Through Rate" value={`${ctr}%`} accent="amber" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 mb-6">
          <h3 className="font-semibold text-stone-900 mb-4">Spend vs Revenue by Campaign</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a8a29e" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="spend" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Spend ($)" />
              <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {aiLoading && (
        <div className="bg-white rounded-2xl border border-stone-200/80 mb-6">
          <AILoading message="Analyzing best posting times..." />
        </div>
      )}

      {bestTimes && !aiLoading && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-stone-900">Best Times to Post</h3>
            <span className="bg-teal-50 text-teal-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {bestTimes.best_times?.map((bt, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-stone-900">{bt.day}</span>
                  <span className="text-xs text-teal-600 font-medium">{bt.time}</span>
                </div>
                <p className="text-xs text-stone-500">{bt.reason}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {bestTimes.tips?.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No ad campaigns yet" description="Add your ad campaigns to track return on ad spend.">
          <Button onClick={() => setShowDialog(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Campaign
          </Button>
        </EmptyState>
      ) : (
        <>
        <div className="hidden md:block bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-4 py-3">Campaign</th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-4 py-3 hidden sm:table-cell">Platform</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3">Spend</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3">Revenue</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3">ROAS</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cRoas = c.spend > 0 ? (c.revenue / c.spend).toFixed(1) : '0.0';
                  return (
                    <tr key={c.id} className="border-b border-stone-100">
                      <td className="px-4 py-3 text-sm font-medium text-stone-900">{c.campaign_name}</td>
                      <td className="px-4 py-3 text-sm text-stone-600 hidden sm:table-cell">{c.platform}</td>
                      <td className="px-4 py-3 text-right text-sm text-stone-600">${(c.spend || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-stone-600">${(c.revenue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${parseFloat(cRoas) >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>{cRoas}x</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => remove(c.id)}>
                          <span className="text-rose-500 text-xs">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="md:hidden space-y-3 mt-4">
          {campaigns.map((c) => {
            const cRoas = c.spend > 0 ? (c.revenue / c.spend).toFixed(1) : '0.0';
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-stone-200/80 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-stone-900">{c.campaign_name}</p>
                    <p className="text-xs text-stone-400">{c.platform}</p>
                  </div>
                  <span className={`text-sm font-semibold ${parseFloat(cRoas) >= 1 ? 'text-emerald-600' : 'text-rose-500'}`}>{cRoas}x</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                  <div className="bg-stone-50 rounded-lg py-2 px-3">
                    <p className="text-[10px] text-stone-400 uppercase">Spend</p>
                    <p className="text-sm font-semibold text-stone-900">${(c.spend || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg py-2 px-3">
                    <p className="text-[10px] text-stone-400 uppercase">Revenue</p>
                    <p className="text-sm font-semibold text-stone-900">${(c.revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-rose-500" onClick={() => remove(c.id)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ad Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Campaign Name</Label>
              <Input value={formData.campaign_name} onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })} className="mt-1.5" placeholder="Summer Sale Promo" />
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Spend ($)</Label>
                <Input type="number" value={formData.spend} onChange={(e) => setFormData({ ...formData, spend: parseFloat(e.target.value) || 0 })} className="mt-1.5" />
              </div>
              <div>
                <Label>Revenue ($)</Label>
                <Input type="number" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Impressions</Label>
                <Input type="number" value={formData.impressions} onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              </div>
              <div>
                <Label>Clicks</Label>
                <Input type="number" value={formData.clicks} onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              </div>
              <div>
                <Label>Conversions</Label>
                <Input type="number" value={formData.conversions} onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveCampaign} disabled={!formData.campaign_name.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">Add Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

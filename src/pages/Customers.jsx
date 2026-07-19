import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Customer } from '@/api/entities';
import { Plus, Users, Trash2, Search, Star, TrendingUp, Gift } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

function getTierForPoints(points) {
  if (points >= 1000) return 'Platinum';
  if (points >= 500) return 'Gold';
  if (points >= 200) return 'Silver';
  return 'Bronze';
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const isDialogOpen = searchParams.get('action') === 'add' || !!searchParams.get('edit');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', loyalty_points: 0, tier: 'Bronze', notes: '', favorite_items: '' });
  const { toast } = useToast();

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  async function load() {
    const data = await Customer.list('-loyalty_points');
    setCustomers(data);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setFormData({ name: '', email: '', phone: '', loyalty_points: 0, tier: 'Bronze', notes: '', favorite_items: '' });
    setSearchParams({ action: 'add' });
  }

  function openEdit(c) {
    setEditing(c);
    setFormData({
      name: c.name || '', email: c.email || '', phone: c.phone || '',
      loyalty_points: c.loyalty_points || 0, tier: c.tier || 'Bronze',
      notes: c.notes || '', favorite_items: c.favorite_items || '',
    });
    setSearchParams({ edit: c.id });
  }

  async function save() {
    const tier = getTierForPoints(formData.loyalty_points || 0);
    const data = { ...formData, tier };
    if (editing) {
      await Customer.update(editing.id, data);
      setCustomers((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
      toast({ title: 'Customer updated' });
    } else {
      const created = await Customer.create(data);
      setCustomers((prev) => [created, ...prev]);
      toast({ title: 'Customer added' });
    }
    setSearchParams({}, { replace: true });
  }

  async function addPoints(c, pts) {
    const newPoints = (c.loyalty_points || 0) + pts;
    const tier = getTierForPoints(newPoints);
    await Customer.update(c.id, { loyalty_points: newPoints, tier });
    setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, loyalty_points: newPoints, tier } : x)));
    toast({ title: `+${pts} points added to ${c.name}` });
  }

  async function remove(id) {
    await Customer.delete(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0);
  const goldCount = customers.filter((c) => c.tier === 'Gold' || c.tier === 'Platinum').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Customers & Loyalty" description="Track customers, reward loyalty, and grow repeat business.">
        <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1"><Users className="w-4 h-4" /> Total Customers</div>
          <p className="text-xl font-bold text-stone-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1"><Star className="w-4 h-4" /> Gold+ Members</div>
          <p className="text-xl font-bold text-stone-900">{goldCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium mb-1"><Gift className="w-4 h-4" /> Points Issued</div>
          <p className="text-xl font-bold text-stone-900">{totalPoints.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Add your first customer to start tracking loyalty points.">
          <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </EmptyState>
      ) : (
        <>
        <div className="hidden md:block bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-4 py-3">Tier</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3">Points</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3 hidden sm:table-cell">Visits</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3 hidden md:table-cell">Spent</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-semibold">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">{c.name}</p>
                          <p className="text-xs text-stone-400">{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.tier} /></td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">{(c.loyalty_points || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-stone-600 hidden sm:table-cell">{c.total_visits || 0}</td>
                    <td className="px-4 py-3 text-right text-sm text-stone-600 hidden md:table-cell">${(c.total_spent || 0).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-teal-600 hover:bg-teal-50" onClick={() => addPoints(c, 50)}>
                          +50 pts
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                          <TrendingUp className="w-4 h-4 text-stone-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => remove(c.id)}>
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="md:hidden space-y-3 mt-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-stone-200/80 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-semibold">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-xs text-stone-400">{c.email || 'No email'}</p>
                  </div>
                </div>
                <StatusBadge status={c.tier} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-stone-50 rounded-lg py-2 text-center">
                  <p className="text-sm font-semibold text-stone-900">{(c.loyalty_points || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">Points</p>
                </div>
                <div className="bg-stone-50 rounded-lg py-2 text-center">
                  <p className="text-sm font-semibold text-stone-900">{c.total_visits || 0}</p>
                  <p className="text-[10px] text-stone-400">Visits</p>
                </div>
                <div className="bg-stone-50 rounded-lg py-2 text-center">
                  <p className="text-sm font-semibold text-stone-900">${(c.total_spent || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-stone-400">Spent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-teal-600 border-teal-200" onClick={() => addPoints(c, 50)}>+50 pts</Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                  <TrendingUp className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => remove(c.id)}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setSearchParams({}, { replace: true }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1.5" placeholder="Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1.5" placeholder="jane@email.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5" placeholder="(555) 123-4567" />
              </div>
            </div>
            <div>
              <Label>Loyalty Points</Label>
              <Input type="number" value={formData.loyalty_points} onChange={(e) => setFormData({ ...formData, loyalty_points: parseInt(e.target.value) || 0 })} className="mt-1.5" />
              <p className="text-xs text-stone-400 mt-1">Tier auto-calculates: Bronze (0+), Silver (200+), Gold (500+), Platinum (1000+)</p>
            </div>
            <div>
              <Label>Favorite Items</Label>
              <Input value={formData.favorite_items} onChange={(e) => setFormData({ ...formData, favorite_items: e.target.value })} className="mt-1.5" placeholder="Latte, croissant..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>Cancel</Button>
            <Button onClick={save} disabled={!formData.name.trim()} className="bg-teal-600 hover:bg-teal-700 text-white">{editing ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

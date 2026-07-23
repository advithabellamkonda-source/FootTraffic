import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Mail, CreditCard, User, Trash2, AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import { PageHeader, LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const OWNED_TABLES = ['customers', 'posts', 'newsletters', 'reviews', 'promotions', 'ad_campaigns', 'partnerships'];

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="text-sm px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-center"
    >
      {label}
    </Link>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleLogout() {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await Promise.all(OWNED_TABLES.map((t) => supabase.from(t).delete().not('id', 'is', null)));
      if (user?.id) {
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      toast({ title: 'Account data deleted', description: 'Your data has been removed and you have been signed out.' });
    } catch (e) {
      // Continue to sign out regardless of partial cleanup failures.
    }
    await logout();
    setDeleting(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, subscription and preferences." />

      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-bold">
            {profile?.business_name?.charAt(0)?.toUpperCase() || profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-lg">{profile?.business_name || profile?.full_name || 'User'}</h3>
            <p className="text-sm text-stone-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email || 'No email'}
            </p>
            <p className="text-xs text-teal-600 mt-1 font-medium uppercase tracking-wide">{profile?.role || 'user'}</p>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-stone-900">Current Plan</p>
            <p className="text-xs text-stone-500 mt-0.5">Starter · $10/month</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/pricing">
              <CreditCard className="w-4 h-4" /> Upgrade Plan
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 mb-6">
        <h3 className="font-semibold text-stone-900 mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickLink to="/promotions" label="Promotions" />
          <QuickLink to="/analytics" label="Analytics" />
          <QuickLink to="/partnerships" label="Partnerships" />
          <QuickLink to="/newsletters" label="Newsletters" />
          <QuickLink to="/posts" label="Social Posts" />
          <QuickLink to="/pricing" label="Plans" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 mb-6">
        <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" /> Account
        </h3>
        <Button variant="outline" onClick={handleLogout} disabled={logoutLoading} className="w-full sm:w-auto gap-2">
          {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign Out
        </Button>
      </div>

      <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-5">
        <h3 className="font-semibold text-rose-700 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Deleting your account removes all your business data and signs you out. This action cannot be undone.
        </p>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete Account
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete all your business data and sign you out. To confirm, type <span className="font-semibold text-rose-600">DELETE</span> below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setConfirmText(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim().toUpperCase() !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, trend, accent = 'teal' }) {
  const accents = {
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', accents[accent])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-stone-900 tracking-tight">{value}</p>
      <p className="text-sm text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-stone-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-stone-400" />
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-500 mt-1 max-w-sm">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    Draft: 'bg-stone-100 text-stone-600',
    Scheduled: 'bg-blue-50 text-blue-600',
    Published: 'bg-emerald-50 text-emerald-600',
    Sent: 'bg-emerald-50 text-emerald-600',
    Active: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Responded: 'bg-emerald-50 text-emerald-600',
    Expired: 'bg-stone-100 text-stone-500',
    Suggested: 'bg-blue-50 text-blue-600',
    Contacted: 'bg-amber-50 text-amber-600',
    Declined: 'bg-rose-50 text-rose-600',
    Paused: 'bg-stone-100 text-stone-600',
    Completed: 'bg-stone-100 text-stone-500',
    Bronze: 'bg-amber-50 text-amber-700',
    Silver: 'bg-stone-100 text-stone-600',
    Gold: 'bg-yellow-50 text-yellow-700',
    Platinum: 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', styles[status] || 'bg-stone-100 text-stone-600')}>
      {status}
    </span>
  );
}

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-sm text-stone-500 mt-3">{message}</p>
    </div>
  );
}

export function AILoading({ message = 'AI is working its magic...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
        <Sparkles className="w-5 h-5 text-teal-500 absolute inset-0 m-auto" />
      </div>
      <p className="text-sm font-medium text-stone-700 mt-4">{message}</p>
      <p className="text-xs text-stone-400 mt-1">This usually takes a few seconds</p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Customer, Promotion, Review, AdCampaign, Post } from '@/api/entities';
import { Users, Tag, Star, TrendingUp, Sparkles, ArrowRight, Instagram, MessageSquare, Mail } from 'lucide-react';
import { StatCard, PageHeader, LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    async function load() {
      const [customers, promotions, reviews, campaigns, posts] = await Promise.all([
        Customer.list(),
        Promotion.list(),
        Review.list(),
        AdCampaign.list(),
        Post.list('-created_date', 3),
      ]);
      const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
      const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
      setStats({
        customers: customers.length,
        activePromotions: promotions.filter((p) => p.status === 'Active').length,
        pendingReviews: reviews.filter((r) => r.status === 'Pending').length,
        roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0.0',
        totalSpend,
        totalRevenue,
      });
      setRecentPosts(posts);
      setPendingReviews(reviews.filter((r) => r.status === 'Pending').slice(0, 3));
    }
    load();
    const handler = () => load();
    window.addEventListener('pulltorefresh', handler);
    return () => window.removeEventListener('pulltorefresh', handler);
  }, []);

  if (!stats) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Home" description="Your business at a glance." />

      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 sm:p-6 text-white mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-100">Starter Plan · $10/mo</span>
            </div>
            <h2 className="text-xl font-bold">Welcome back! Here's what needs your attention.</h2>
            <p className="text-sm text-teal-100 mt-1">
              {stats.pendingReviews} review{stats.pendingReviews !== 1 ? 's' : ''} need responses · {stats.activePromotions} active promotion{stats.activePromotions !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-white text-teal-700 hover:bg-teal-50 font-semibold">
              <Link to="/posts">Create Post</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Customers" value={stats.customers} accent="teal" />
        <StatCard icon={Tag} label="Active Promotions" value={stats.activePromotions} accent="amber" />
        <StatCard icon={Star} label="Pending Reviews" value={stats.pendingReviews} accent="rose" />
        <StatCard icon={TrendingUp} label="Return on Ad Spend" value={`${stats.roas}x`} accent="violet" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QuickAction icon={Instagram} title="Create Post" desc="Plan your Instagram posts" to="/posts" accent="teal" />
        <QuickAction icon={Tag} title="Add Promotion" desc="Drive foot traffic" to="/promotions" accent="amber" />
        <QuickAction icon={MessageSquare} title="Respond to Reviews" desc="Reply to customers" to="/reviews" accent="rose" />
        <QuickAction icon={Mail} title="Write Newsletter" desc="Email campaigns" to="/newsletters" accent="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Recent Posts</h3>
            <Link to="/posts" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Instagram className="w-4 h-4 text-stone-400 m-auto mt-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">{post.caption}</p>
                    <p className="text-xs text-stone-400">{post.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Pending Reviews</h3>
            <Link to="/reviews" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingReviews.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No pending reviews 🎉</p>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <div key={review.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex-shrink-0 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">
                      {review.customer_name} — {review.rating}★
                    </p>
                    <p className="text-xs text-stone-400 truncate">{review.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, to, accent }) {
  const accents = {
    teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  };
  return (
    <Link to={to} className="group bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${accents[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-semibold text-stone-900 text-sm">{title}</p>
      <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
    </Link>
  );
}

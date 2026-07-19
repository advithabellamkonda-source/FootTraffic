import { Sparkles, Zap, Crown, Check } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    price: 10,
    icon: Sparkles,
    description: 'Get started with AI-powered marketing essentials.',
    features: [
      '50 AI-generated posts per month',
      'Customer tracking & loyalty program',
      'Basic analytics dashboard',
      'Email newsletter creation',
      'Social media scheduling',
    ],
    cta: 'Current Plan',
    current: true,
  },
  {
    name: 'Growth',
    price: 17,
    icon: Zap,
    description: 'Smarter marketing with AI strategies and local insights.',
    features: [
      'Everything in Starter',
      'Personalized marketing strategies',
      'AI customer review responses',
      'Promotional campaign ideas',
      'Analytics showing what works',
      'Local event & trend suggestions',
    ],
    cta: 'Start 14-Day Free Trial',
    recommended: true,
  },
  {
    name: 'Premium',
    price: 25,
    icon: Crown,
    description: 'Fully automated marketing with advanced AI tools.',
    features: [
      'Everything in Growth',
      'Automated posts (AI schedules & posts)',
      'Competitor analysis',
      'AI customer engagement tools',
      'Unlimited AI posts',
      'Priority support',
    ],
    cta: 'Start 14-Day Free Trial',
  },
];

export default function Pricing() {
  const { toast } = useToast();

  function handleUpgrade(planName) {
    toast({
      title: `Starting your free trial of ${planName}...`,
      description: 'This is a demo — payment integration is coming soon!',
    });
  }

  return (
    <div>
      <PageHeader title="Plans & Pricing" description="Affordable pricing that grows with your business. Upgrade or downgrade anytime." />

      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white mb-6 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">2-Week Free Trial</p>
          <p className="text-xs text-teal-100">Try any plan free for 14 days. No credit card required — cancel anytime.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'bg-white rounded-2xl border p-6 flex flex-col relative',
              plan.recommended ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-stone-200/80'
            )}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </span>
            )}
            <div className="flex items-center gap-3 mb-1">
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center',
                  plan.recommended ? 'bg-teal-50 text-teal-600' : 'bg-stone-100 text-stone-600'
                )}
              >
                <plan.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mt-3">{plan.name}</h3>
            <p className="text-xs text-stone-400 mt-0.5">{plan.description}</p>
            <div className="mt-4 mb-5">
              <span className="text-4xl font-bold text-stone-900">${plan.price}</span>
              <span className="text-stone-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                  <Check className={cn('w-4 h-4 mt-0.5 flex-shrink-0', plan.recommended ? 'text-teal-500' : 'text-stone-400')} />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.current ? (
              <Button disabled className="w-full bg-stone-100 text-stone-500 cursor-default">
                Current Plan
              </Button>
            ) : (
              <Button
                onClick={() => handleUpgrade(plan.name)}
                className={cn(
                  'w-full gap-2',
                  plan.recommended
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                )}
              >
                {plan.cta}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-stone-50 rounded-2xl border border-stone-200/80 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h3 className="font-semibold text-stone-900 text-sm">All plans include</h3>
        </div>
        <p className="text-sm text-stone-500">
          No setup fees · Cancel anytime · Designed for small businesses · Easy-to-use interface for everyone
        </p>
      </div>
    </div>
  );
}

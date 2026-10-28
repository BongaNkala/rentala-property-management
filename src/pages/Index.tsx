import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2, FileText, BellRing, Receipt, LineChart, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_TIERS, monthlyFee, tierFor } from '@/lib/pricing';

const features = [
  { icon: FileText, title: 'Invoices that go out the same day', body: 'Create a rent invoice with your business details, then email, text or print it.' },
  { icon: BellRing, title: 'Arrears you can act on', body: 'See who is behind, by how many days, and send a reminder in one tap.' },
  { icon: Receipt, title: 'Bills and vendors', body: 'Keep plumbers and suppliers in a list and see what is due and what is cleared.' },
  { icon: LineChart, title: 'Income, arrears and expenses', body: 'One view of how each property is performing, without a spreadsheet.' },
  { icon: Building2, title: 'Properties and tenants', body: 'Units, occupancy, leases and rent for every property you manage.' },
  { icon: ShieldCheck, title: 'Applicant screening', body: 'Track applicants and your decision for each unit.' },
];

const Index = () => {
  const { user, loading } = useAuth();
  const [leases, setLeases] = useState(35);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const tier = tierFor(leases);
  const fee = monthlyFee(leases);

  return (
    <div className="min-h-screen text-white">
      <header className="flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="text-2xl font-black">Rentala</div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="bg-white/5 text-white border-white/20">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
            <Link to="/signup">Create free account</Link>
          </Button>
        </div>
      </header>

      <section className="px-6 lg:px-16 pt-16 pb-20 max-w-5xl">
        <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6">
          Know who has paid, who hasn't and what is still owed.
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl">
          Rentala is rental management for independent landlords and small letting agents in South Africa.
          Free for your first 20 leases.
        </p>
        <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
          <Link to="/signup">Create free account</Link>
        </Button>
      </section>

      <section className="px-6 lg:px-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <Card key={f.title} className="glass-panel p-6">
              <f.icon className="w-8 h-8 text-[hsl(var(--accent))] mb-4" />
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-white/80">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="px-6 lg:px-16 pb-24">
        <h2 className="text-4xl font-black mb-2">Pay per active lease</h2>
        <p className="text-white/80 mb-8">Your first 20 leases are free. After that, one monthly fee per active lease, ex VAT.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="glass-panel p-2 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/70">
                  <th className="p-3">Plan</th>
                  <th className="p-3">Active leases</th>
                  <th className="p-3">Per lease a month</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TIERS.map(t => (
                  <tr key={t.name} className={t.name === tier.name ? 'bg-white/10' : ''}>
                    <td className="p-3 font-bold">{t.name}</td>
                    <td className="p-3">{t.max === null ? `${t.min}+` : `${t.min} to ${t.max}`}</td>
                    <td className="p-3">{t.rate === 0 ? 'Free' : `R${t.rate.toFixed(2)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="glass-panel p-6">
            <label htmlFor="leases" className="block text-white/80 mb-2">How many active leases do you manage?</label>
            <Input
              id="leases"
              type="number"
              min={1}
              value={leases}
              onChange={e => setLeases(Math.max(1, Number(e.target.value) || 1))}
              className="bg-white/10 border-white/20 text-white mb-6"
            />
            <div className="text-5xl font-black mb-1">
              {fee === 0 ? 'Free' : `R${fee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-white/70">
              {fee === 0 ? 'You are inside the free plan.' : `a month ex VAT on the ${tier.name} plan`}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, AlertTriangle, Plus, FileText, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    pendingIssues: 0,
  });
  const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
  const [hasData, setHasData] = useState(false);
  const [metrics, setMetrics] = useState({ collectionRate: 0, occupancy: 0, averageRent: 0, arrears: 0 });
  const [chart, setChart] = useState({
    months: [] as string[],
    revenue: [] as number[],
    types: { residential: 0, commercial: 0, mixed: 0 },
    occupancyNames: [] as string[],
    occupancy: [] as number[],
  });

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (data) setUserProfile(data);
  };

  const fetchStats = async () => {
    if (!user) return;

    const [propertiesRes, tenantsRes, paymentsRes, maintenanceRes, invoicesRes] = await Promise.all([
      supabase.from('properties').select('id, name, type, units').eq('user_id', user.id),
      supabase.from('tenants').select('property_id, rent').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('payments').select('amount, payment_date').eq('user_id', user.id).eq('status', 'completed'),
      supabase.from('maintenance').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('invoices').select('amount, status, due_date').eq('user_id', user.id),
    ]);

    const properties = propertiesRes.data || [];
    const activeTenants = tenantsRes.data || [];
    const payments = paymentsRes.data || [];

    // Revenue for each of the last six months, from real payments
    const now = new Date();
    const months: string[] = [];
    const revenue: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(d.toLocaleString('en-ZA', { month: 'short' }));
      revenue.push(
        payments
          .filter(p => String(p.payment_date).startsWith(key))
          .reduce((sum, p) => sum + Number(p.amount), 0)
      );
    }
    const thisMonthRevenue = revenue[revenue.length - 1] || 0;

    const types = { residential: 0, commercial: 0, mixed: 0 };
    properties.forEach(p => {
      if (p.type in types) types[p.type as keyof typeof types] += 1;
    });

    const occupancyNames = properties.map(p => p.name);
    const occupancy = properties.map(p => {
      const occ = activeTenants.filter(t => t.property_id === p.id).length;
      return p.units > 0 ? Math.min(100, Math.round((occ / p.units) * 100)) : 0;
    });

    // Metrics from real invoices and tenants
    const todayStr = new Date().toISOString().slice(0, 10);
    const invoices = invoicesRes.data || [];
    const due = invoices.filter(i => i.due_date <= todayStr);
    const dueTotal = due.reduce((sum, i) => sum + Number(i.amount), 0);
    const paidTotal = due.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
    const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
    const rents = activeTenants.map(t => Number(t.rent) || 0);
    setMetrics({
      collectionRate: dueTotal > 0 ? Math.round((paidTotal / dueTotal) * 100) : 0,
      occupancy: totalUnits > 0 ? Math.min(100, Math.round((activeTenants.length / totalUnits) * 100)) : 0,
      averageRent: rents.length ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length) : 0,
      arrears: dueTotal - paidTotal,
    });

    setHasData(properties.length > 0 || payments.length > 0);
    setChart({ months, revenue, types, occupancyNames, occupancy });
    setStats({
      totalProperties: properties.length,
      totalTenants: activeTenants.length,
      monthlyRevenue: thisMonthRevenue,
      pendingIssues: maintenanceRes.count || 0,
    });
  };

  // Empty chart data when no properties exist
  const revenueData = {
    labels: chart.months,
    datasets: [
      {
        label: 'Revenue',
        data: chart.revenue,
        borderColor: 'hsl(221, 76%, 58%)',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const propertyTypeData = {
    labels: ['Residential', 'Commercial', 'Mixed Use'],
    datasets: [
      {
        data: [chart.types.residential, chart.types.commercial, chart.types.mixed],
        backgroundColor: [
          'hsl(221, 76%, 58%)',
          'hsl(192, 92%, 60%)',
          'hsl(280, 90%, 38%)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const occupancyData = {
    labels: chart.occupancyNames,
    datasets: [
      {
        label: 'Occupancy Rate (%)',
        data: chart.occupancy,
        backgroundColor: 'hsl(192, 92%, 60%)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: { size: 12, weight: '600' as const },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== undefined) {
              if (context.dataset.label === 'Revenue') {
                label += 'R' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y + (context.dataset.label === 'Occupancy Rate (%)' ? '%' : '');
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-white/80">Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}! Here's what's happening with your properties today.</p>
        </div>

        {/* Getting Started Banner - Show when no data */}
        {stats.totalProperties === 0 && (
          <Card className="glass-panel p-8 border-2 border-[hsl(var(--primary))]/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to Rentala! 🎉</h3>
                <p className="text-white/80 mb-4">Start managing your properties by adding your first property. It only takes a minute!</p>
                <Link to="/properties">
                  <Button className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Property
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: DollarSign, label: 'Monthly Revenue', value: `R${stats.monthlyRevenue.toLocaleString()}`, delay: 1 },
            { icon: Building2, label: 'Total Properties', value: stats.totalProperties, delay: 2 },
            { icon: Users, label: 'Active Tenants', value: stats.totalTenants, delay: 3 },
            { icon: AlertTriangle, label: 'Pending Issues', value: stats.pendingIssues, delay: 4 },
          ].map((stat, idx) => (
            <Card key={idx} className={`glass-panel p-6 border-t-4 ${
              idx === 0 ? 'border-t-[hsl(var(--success))]' :
              idx === 1 ? 'border-t-[hsl(var(--info))]' :
              idx === 2 ? 'border-t-[hsl(var(--primary))]' :
              'border-t-[hsl(var(--warning))]'
            } animate-fade-in`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center ${
                  idx === 0 ? 'from-[hsl(var(--success))] to-[#34d399]' :
                  idx === 1 ? 'from-[#3b82f6] to-[#60a5fa]' :
                  idx === 2 ? 'from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))]' :
                  'from-[hsl(var(--warning))] to-[#fbbf24]'
                }`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-white/90 font-medium mb-3">{stat.label}</div>
              <div className="text-sm text-white/70">
                {idx === 0 ? (stats.monthlyRevenue > 0 ? 'Payments received this month' : 'No payments recorded this month') :
                 idx === 1 ? (stats.totalProperties > 0 ? 'In your portfolio' : 'Add your first property to get started') :
                 idx === 2 ? (stats.totalTenants > 0 ? 'With an active lease' : 'Add tenants to your properties') :
                 (stats.pendingIssues > 0 ? 'Maintenance requests waiting' : 'No pending maintenance requests')}
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 - Only show if there's data */}
        {hasData ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
                <div className="h-[280px]">
                  <Line data={revenueData} options={chartOptions} />
                </div>
              </Card>

              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-6">Property Types Distribution</h3>
                <div className="h-[280px] flex items-center justify-center">
                  <Doughnut data={propertyTypeData} options={{ ...chartOptions, scales: undefined }} />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-6">Occupancy by property</h3>
                <div className="h-[280px]">
                  <Bar data={occupancyData} options={chartOptions} />
                </div>
              </Card>

              <Card className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-6">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Collection rate', value: `${metrics.collectionRate}%` },
                    { label: 'Occupancy', value: `${metrics.occupancy}%` },
                    { label: 'Average rent', value: `R${metrics.averageRent.toLocaleString('en-ZA')}` },
                    { label: 'In arrears', value: `R${metrics.arrears.toLocaleString('en-ZA')}` },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-2">{metric.value}</div>
                      <div className="text-sm text-white/80">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="glass-panel p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-xl font-bold text-white">No Data Available</h3>
              <p className="text-white/60 max-w-md">
                Start adding properties and tenants to see your financial analytics and performance metrics here.
              </p>
              <Link to="/properties">
                <Button className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link to="/properties">
              <Button className="w-full h-auto flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-semibold">Add Property</span>
              </Button>
            </Link>
            <Link to="/tenants">
              <Button className="w-full h-auto flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white">
                <Users className="w-6 h-6" />
                <span className="text-sm font-semibold">Add Tenant</span>
              </Button>
            </Link>
            <Link to="/payments">
              <Button className="w-full h-auto flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white">
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-semibold">Record Payment</span>
              </Button>
            </Link>
            <Link to="/maintenance">
              <Button className="w-full h-auto flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-sm font-semibold">New Request</span>
              </Button>
            </Link>
            <Link to="/reports">
              <Button className="w-full h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--accent))]/10 hover:from-[hsl(var(--primary))]/30 hover:to-[hsl(var(--accent))]/20 border border-[hsl(var(--primary))]/30 text-white">
                <Printer className="w-6 h-6" />
                <span className="text-sm font-semibold">Print Report</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

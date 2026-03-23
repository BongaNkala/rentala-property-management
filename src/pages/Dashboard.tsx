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

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const [propertiesRes, tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('tenants').select('*', { count: 'exact' }).eq('user_id', user.id).eq('status', 'active'),
      supabase.from('payments').select('amount').eq('user_id', user.id).eq('status', 'completed'),
      supabase.from('maintenance').select('*', { count: 'exact' }).eq('user_id', user.id).eq('status', 'pending'),
    ]);

    const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    setStats({
      totalProperties: propertiesRes.count || 0,
      totalTenants: tenantsRes.count || 0,
      monthlyRevenue: totalRevenue,
      pendingIssues: maintenanceRes.count || 0,
    });
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [185000, 195000, 210000, 225000, 235000, 245600],
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
        data: [5, 2, 1],
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
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Occupancy Rate (%)',
        data: [85, 88, 90, 89, 91, 92],
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
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
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
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to Rentala! í¾‰</h3>
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
            { icon: DollarSign, label: 'Monthly Revenue', value: `R${stats.monthlyRevenue.toLocaleString()}`, trend: '+12.5%', positive: true, delay: 1 },
            { icon: Building2, label: 'Total Properties', value: stats.totalProperties, trend: '+8.2%', positive: true, delay: 2 },
            { icon: Users, label: 'Active Tenants', value: stats.totalTenants, trend: '+15.3%', positive: true, delay: 3 },
            { icon: AlertTriangle, label: 'Pending Issues', value: stats.pendingIssues, trend: '-3.1%', positive: false, delay: 4 },
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
                <div className={`flex items-center gap-1 text-sm font-bold ${stat.positive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                  {stat.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.trend}
                </div>
              </div>
              <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-white/90 font-medium mb-3">{stat.label}</div>
              <div className="text-sm text-white/70">
                {idx === 0 ? '+R24,560 from last month' :
                 idx === 1 ? '+2 properties this quarter' :
                 idx === 2 ? '92% occupancy rate' :
                 '2 awaiting attention'}
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
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

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-6">Occupancy Rate Trend</h3>
            <div className="h-[280px]">
              <Bar data={occupancyData} options={chartOptions} />
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-6">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Collection Rate', value: '98.2%', trend: '+2.1%', positive: true },
                { label: 'Tenant Retention', value: '94.5%', trend: '+1.8%', positive: true },
                { label: 'Average Rent', value: 'R7,850', trend: '+5.2%', positive: true },
                { label: 'Maintenance Cost', value: 'R12,400', trend: '-8.3%', positive: false },
              ].map((metric, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                  <div className="text-2xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-sm text-white/80 mb-2">{metric.label}</div>
                  <div className={`text-xs font-bold ${metric.positive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {metric.positive ? 'â†‘' : 'â†“'} {metric.trend}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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

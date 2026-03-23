import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, TrendingUp, TrendingDown, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  property_id: string;
  name: string;
  email: string;
  phone: string;
  rent: number;
  lease_start: string;
  lease_end: string;
  status: 'active' | 'inactive' | 'pending';
  properties?: { name: string };
}

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    email: '',
    phone: '',
    rent: 0,
    lease_start: '',
    lease_end: '',
    status: 'active' as const,
  });

  useEffect(() => {
    if (user) {
      fetchTenants();
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('id, name').eq('user_id', user.id);
    setProperties(data || []);
  };

  const fetchTenants = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tenants')
      .select('*, properties(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTenants(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const tenantData = { ...formData, user_id: user.id };

    if (editingTenant) {
      const { error } = await supabase.from('tenants').update(tenantData).eq('id', editingTenant.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Tenant updated successfully!' });
        fetchTenants();
        handleCloseModal();
      }
    } else {
      const { error } = await supabase.from('tenants').insert([tenantData]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Tenant added successfully!' });
        fetchTenants();
        handleCloseModal();
      }
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      property_id: tenant.property_id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      rent: tenant.rent,
      lease_start: tenant.lease_start,
      lease_end: tenant.lease_end,
      status: tenant.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Tenant deleted successfully!' });
      fetchTenants();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTenant(null);
    setFormData({
      property_id: '',
      name: '',
      email: '',
      phone: '',
      rent: 0,
      lease_start: '',
      lease_end: '',
      status: 'active',
    });
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    totalRent: tenants.filter(t => t.status === 'active').reduce((sum, t) => sum + Number(t.rent), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tenant Management</h1>
          <p className="text-white/80">Manage all tenants and their rental information</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users, label: 'Total Tenants', value: stats.total, trend: '+5.2%', positive: true },
            { icon: CheckCircle2, label: 'Active Tenants', value: stats.active, trend: '+2.1%', positive: true },
            { icon: Clock, label: 'Pending Applications', value: stats.pending, trend: '-1.3%', positive: false },
            { icon: DollarSign, label: 'Total Rent Collected', value: `R${stats.totalRent.toLocaleString()}`, trend: '+8.5%', positive: true },
          ].map((stat, idx) => (
            <Card key={idx} className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary-light))] to-[hsl(var(--accent))] flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${stat.positive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                  {stat.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.trend}
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-white/90 font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'pending'].map(status => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant={filterStatus === status ? 'default' : 'outline'}
                className={filterStatus === status ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {/* Tenants Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-bold text-white mb-2">No tenants found</h3>
            <p className="text-white/60">Add your first tenant to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map(tenant => (
              <Card key={tenant.id} className="glass-panel p-6 hover:scale-105 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    tenant.status === 'active' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                    tenant.status === 'pending' ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]' :
                    'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
                  }`}>
                    {tenant.status}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{tenant.name}</h3>
                <p className="text-white/70 text-sm mb-1">{tenant.email}</p>
                <p className="text-white/70 text-sm mb-4">{tenant.phone}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="text-white/80">Property: <span className="font-bold text-white">{tenant.properties?.name}</span></div>
                  <div className="text-white/80">Rent: <span className="font-bold text-white">R{tenant.rent.toLocaleString()}/mo</span></div>
                  <div className="text-white/80">Lease: <span className="font-bold text-white">{format(new Date(tenant.lease_start), 'MMM dd, yyyy')} - {format(new Date(tenant.lease_end), 'MMM dd, yyyy')}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(tenant)} variant="outline" className="flex-1 bg-white/5 text-white border-white/20">
                    Edit
                  </Button>
                  <Button onClick={() => handleDelete(tenant.id)} variant="outline" className="flex-1 bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="glass-panel border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={formData.property_id} onValueChange={(value) => setFormData({...formData, property_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Rent (R) *</Label>
                <Input type="number" value={formData.rent} onChange={(e) => setFormData({...formData, rent: Number(e.target.value)})} required className="bg-white/5 border-white/20 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lease Start *</Label>
                  <Input type="date" value={formData.lease_start} onChange={(e) => setFormData({...formData, lease_start: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Lease End *</Label>
                  <Input type="date" value={formData.lease_end} onChange={(e) => setFormData({...formData, lease_end: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'pending') => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} className="bg-white/5 text-white border-white/20">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
                  {editingTenant ? 'Update' : 'Add'} Tenant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tenants;

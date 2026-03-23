import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, Clock, AlertCircle, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Payment {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'card' | 'eft';
  reference?: string;
  notes?: string;
  status: 'completed' | 'pending' | 'overdue';
  tenants?: { name: string };
  properties?: { name: string };
}

const Payments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    amount: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'bank_transfer' as const,
    reference: '',
    notes: '',
    status: 'completed' as const,
  });

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchTenants();
      fetchProperties();
    }
  }, [user]);

  const fetchTenants = async () => {
    if (!user) return;
    const { data } = await supabase.from('tenants').select('id, name').eq('user_id', user.id);
    setTenants(data || []);
  };

  const fetchProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('id, name').eq('user_id', user.id);
    setProperties(data || []);
  };

  const fetchPayments = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, tenants(name), properties(name)')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const paymentData = { ...formData, user_id: user.id };

    if (editingPayment) {
      const { error } = await supabase.from('payments').update(paymentData).eq('id', editingPayment.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Payment updated successfully!' });
        fetchPayments();
        handleCloseModal();
      }
    } else {
      const { error } = await supabase.from('payments').insert([paymentData]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Payment recorded successfully!' });
        fetchPayments();
        handleCloseModal();
      }
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      tenant_id: payment.tenant_id,
      property_id: payment.property_id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      reference: payment.reference || '',
      notes: payment.notes || '',
      status: payment.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment deleted successfully!' });
      fetchPayments();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setFormData({
      tenant_id: '',
      property_id: '',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'bank_transfer',
      reference: '',
      notes: '',
      status: 'completed',
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalCollected: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0),
    collectionRate: payments.length > 0 ? Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100) : 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Payments Management</h1>
          <p className="text-white/80">Track and manage all rental payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: DollarSign, label: 'Total Collected', value: `R${stats.totalCollected.toLocaleString()}`, trend: '+12.5%', positive: true },
            { icon: Clock, label: 'Pending Payments', value: `R${stats.pending.toLocaleString()}`, trend: '-5.2%', positive: false },
            { icon: AlertCircle, label: 'Overdue Payments', value: `R${stats.overdue.toLocaleString()}`, trend: '+8.3%', positive: false },
            { icon: Percent, label: 'Collection Rate', value: `${stats.collectionRate}%`, trend: '+3.1%', positive: true },
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
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'completed', 'overdue'].map(status => (
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
            Record Payment
          </Button>
        </div>

        {/* Payments Table */}
        <Card className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-bold text-white mb-2">No payments found</h3>
                <p className="text-white/60">Record your first payment to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/90 font-bold">Tenant</TableHead>
                    <TableHead className="text-white/90 font-bold">Property</TableHead>
                    <TableHead className="text-white/90 font-bold">Amount</TableHead>
                    <TableHead className="text-white/90 font-bold">Date</TableHead>
                    <TableHead className="text-white/90 font-bold">Method</TableHead>
                    <TableHead className="text-white/90 font-bold">Status</TableHead>
                    <TableHead className="text-white/90 font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map(payment => (
                    <TableRow key={payment.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{payment.tenants?.name}</TableCell>
                      <TableCell className="text-white/80">{payment.properties?.name}</TableCell>
                      <TableCell className="text-white font-bold">R{payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-white/80">{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-white/80 capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payment.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                          payment.status === 'pending' ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]' :
                          'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
                        }`}>
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(payment)} size="sm" variant="outline" className="bg-white/5 text-white border-white/20">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(payment.id)} size="sm" variant="outline" className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="glass-panel border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingPayment ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant *</Label>
                <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (R) *</Label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} required className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input type="date" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} required className="bg-white/5 border-white/20 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={formData.payment_method} onValueChange={(value: 'bank_transfer' | 'cash' | 'card' | 'eft') => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="eft">EFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(value: 'completed' | 'pending' | 'overdue') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="bg-white/5 border-white/20 text-white" placeholder="TXN123456" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-white/5 border-white/20 text-white" rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} className="bg-white/5 text-white border-white/20">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
                  {editingPayment ? 'Update' : 'Record'} Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Payments;

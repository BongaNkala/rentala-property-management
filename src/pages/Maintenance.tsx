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
import { Wrench, Plus, Search, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Maintenance {
  id: string;
  property_id: string;
  issue: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_date?: string;
  cost?: number;
  properties?: { name: string };
}

const MaintenancePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);

  const [formData, setFormData] = useState({
    property_id: '',
    issue: '',
    description: '',
    priority: 'medium' as const,
    status: 'pending' as const,
    due_date: '',
    cost: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMaintenance();
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    if (!user) return;
    const { data } = await supabase.from('properties').select('id, name').eq('user_id', user.id);
    setProperties(data || []);
  };

  const fetchMaintenance = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance')
      .select('*, properties(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMaintenanceList(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const maintenanceData = { ...formData, user_id: user.id };

    if (editingMaintenance) {
      const { error } = await supabase.from('maintenance').update(maintenanceData).eq('id', editingMaintenance.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Maintenance updated successfully!' });
        fetchMaintenance();
        handleCloseModal();
      }
    } else {
      const { error } = await supabase.from('maintenance').insert([maintenanceData]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Maintenance request created successfully!' });
        fetchMaintenance();
        handleCloseModal();
      }
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      property_id: maintenance.property_id,
      issue: maintenance.issue,
      description: maintenance.description || '',
      priority: maintenance.priority,
      status: maintenance.status,
      due_date: maintenance.due_date || '',
      cost: maintenance.cost || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance request?')) return;
    const { error } = await supabase.from('maintenance').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Maintenance request deleted successfully!' });
      fetchMaintenance();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMaintenance(null);
    setFormData({
      property_id: '',
      issue: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
      cost: 0,
    });
  };

  const filteredMaintenance = maintenanceList.filter(maintenance => {
    const matchesSearch = maintenance.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maintenance.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || maintenance.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: maintenanceList.length,
    pending: maintenanceList.filter(m => m.status === 'pending').length,
    inProgress: maintenanceList.filter(m => m.status === 'in_progress').length,
    completed: maintenanceList.filter(m => m.status === 'completed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Maintenance Management</h1>
          <p className="text-white/80">Track and manage property maintenance requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Wrench, label: 'Total Requests', value: stats.total, color: 'primary' },
            { icon: Clock, label: 'Pending', value: stats.pending, color: 'warning' },
            { icon: AlertTriangle, label: 'In Progress', value: stats.inProgress, color: 'info' },
            { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'success' },
          ].map((stat, idx) => (
            <Card key={idx} className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center ${
                  stat.color === 'primary' ? 'from-[hsl(var(--primary-light))] to-[hsl(var(--accent))]' :
                  stat.color === 'warning' ? 'from-[hsl(var(--warning))] to-[#fbbf24]' :
                  stat.color === 'info' ? 'from-[#3b82f6] to-[#60a5fa]' :
                  'from-[hsl(var(--success))] to-[#34d399]'
                }`}>
                  <stat.icon className="w-6 h-6 text-white" />
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
              placeholder="Search maintenance requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'in_progress', 'completed'].map(status => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant={filterStatus === status ? 'default' : 'outline'}
                className={filterStatus === status ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </div>

        {/* Maintenance Table */}
        <Card className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
              </div>
            ) : filteredMaintenance.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-bold text-white mb-2">No maintenance requests found</h3>
                <p className="text-white/60">Create your first maintenance request to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/90 font-bold">Property</TableHead>
                    <TableHead className="text-white/90 font-bold">Issue</TableHead>
                    <TableHead className="text-white/90 font-bold">Priority</TableHead>
                    <TableHead className="text-white/90 font-bold">Status</TableHead>
                    <TableHead className="text-white/90 font-bold">Due Date</TableHead>
                    <TableHead className="text-white/90 font-bold">Cost</TableHead>
                    <TableHead className="text-white/90 font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map(maintenance => (
                    <TableRow key={maintenance.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{maintenance.properties?.name}</TableCell>
                      <TableCell className="text-white/90">{maintenance.issue}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          maintenance.priority === 'high' ? 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]' :
                          maintenance.priority === 'medium' ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]' :
                          'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
                        }`}>
                          {maintenance.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          maintenance.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                          maintenance.status === 'in_progress' ? 'bg-[hsl(var(--info))]/20 text-[hsl(var(--info))]' :
                          maintenance.status === 'cancelled' ? 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]' :
                          'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]'
                        }`}>
                          {maintenance.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/80">
                        {maintenance.due_date ? format(new Date(maintenance.due_date), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-white font-bold">
                        {maintenance.cost ? `R${maintenance.cost.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(maintenance)} size="sm" variant="outline" className="bg-white/5 text-white border-white/20">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(maintenance.id)} size="sm" variant="outline" className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
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
              <DialogTitle className="text-2xl font-bold">{editingMaintenance ? 'Edit Maintenance Request' : 'Create Maintenance Request'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label>Issue *</Label>
                <Input value={formData.issue} onChange={(e) => setFormData({...formData, issue: e.target.value})} required className="bg-white/5 border-white/20 text-white" placeholder="e.g., Broken faucet" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/20 text-white" rows={3} placeholder="Detailed description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Cost (R)</Label>
                  <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})} className="bg-white/5 border-white/20 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} className="bg-white/5 text-white border-white/20">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
                  {editingMaintenance ? 'Update' : 'Create'} Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MaintenancePage;

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Plus, Search, Home, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PropertyType = 'residential' | 'commercial' | 'mixed';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  type: PropertyType;
  units: number;
  description: string | null;
}

const emptyForm = {
  name: '',
  address: '',
  city: '',
  province: '',
  type: 'residential' as PropertyType,
  units: 1,
  description: '',
};

const typeLabels: Record<PropertyType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  mixed: 'Mixed use',
};

const Properties = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [occupied, setOccupied] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | PropertyType>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [propsRes, tenantsRes] = await Promise.all([
      supabase.from('properties').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('tenants').select('property_id').eq('user_id', user.id).eq('status', 'active'),
    ]);

    if (propsRes.error) {
      toast({ title: 'Error', description: propsRes.error.message, variant: 'destructive' });
    } else {
      setProperties((propsRes.data as Property[]) || []);
    }

    const counts: Record<string, number> = {};
    (tenantsRes.data || []).forEach((t: { property_id: string }) => {
      counts[t.property_id] = (counts[t.property_id] || 0) + 1;
    });
    setOccupied(counts);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = { ...formData, units: Number(formData.units), user_id: user.id };
    const { error } = editing
      ? await supabase.from('properties').update(payload).eq('id', editing.id)
      : await supabase.from('properties').insert([payload]);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: editing ? 'Property updated.' : 'Property added.' });
    closeModal();
    load();
  };

  const handleEdit = (p: Property) => {
    setEditing(p);
    setFormData({
      name: p.name,
      address: p.address,
      city: p.city,
      province: p.province,
      type: p.type,
      units: p.units,
      description: p.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (p: Property) => {
    if (!confirm(`Delete "${p.name}"? Its tenants, payments and maintenance records will be deleted too.`)) return;
    const { error } = await supabase.from('properties').delete().eq('id', p.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Property deleted.' });
      load();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  const filtered = properties.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    return matchesSearch && (filterType === 'all' || p.type === filterType);
  });

  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const totalOccupied = Object.values(occupied).reduce((s, n) => s + n, 0);
  const occupancyPct = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  const stats = [
    { icon: Building2, label: 'Properties', value: properties.length },
    { icon: Home, label: 'Total units', value: totalUnits },
    { icon: Users, label: 'Occupied units', value: totalOccupied },
    { icon: Building2, label: 'Occupancy', value: `${occupancyPct}%` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Properties</h1>
          <p className="text-white/80">Every building and unit in your portfolio, with live occupancy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(stat => (
            <Card key={stat.label} className="glass-panel p-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary-light))] to-[hsl(var(--accent))] flex items-center justify-center mb-4">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-white/80 font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Search by name, address or city"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'residential', 'commercial', 'mixed'] as const).map(t => (
              <Button
                key={t}
                onClick={() => setFilterType(t)}
                variant={filterType === t ? 'default' : 'outline'}
                className={filterType === t ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {t === 'all' ? 'All' : typeLabels[t]}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add property
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-bold text-white mb-2">
              {properties.length === 0 ? 'No properties yet' : 'No properties match your search'}
            </h3>
            <p className="text-white/60">
              {properties.length === 0
                ? 'Add your first property, then add tenants to it.'
                : 'Try a different search or filter.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => {
              const occ = occupied[p.id] || 0;
              const pct = p.units > 0 ? Math.min(100, Math.round((occ / p.units) * 100)) : 0;
              return (
                <Card key={p.id} className="glass-panel p-6">
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white inline-block mb-4">
                    {typeLabels[p.type]}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-white/70 text-sm mb-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{[p.address, p.city, p.province].filter(Boolean).join(', ')}</span>
                  </p>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/80 mb-1">
                      <span>{occ} of {p.units} units occupied</span>
                      <span className="font-bold text-white">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[hsl(var(--success))]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(p)} variant="outline" className="flex-1 bg-white/5 text-white border-white/20">
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(p)}
                      variant="outline"
                      className="flex-1 bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={open => { if (!open) closeModal(); }}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2 border-b border-white/10">
              <DialogTitle className="text-2xl font-bold">{editing ? 'Edit property' : 'Add property'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label>Property name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Street address *</Label>
                  <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(v: PropertyType) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed">Mixed use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of units *</Label>
                    <Input type="number" min={0} value={formData.units} onChange={e => setFormData({ ...formData, units: Number(e.target.value) })} required className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <DialogFooter className="sticky bottom-0 bg-black/90 pt-4 pb-2 mt-4 border-t border-white/10">
                  <Button type="button" variant="outline" onClick={closeModal} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white hover:opacity-90">
                    {editing ? 'Save changes' : 'Add property'}
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Properties;

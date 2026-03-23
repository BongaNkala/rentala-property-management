import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Building2, Plus, Search, TrendingUp, TrendingDown, DoorOpen, CheckCircle2, Percent, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  property_type: 'residential' | 'commercial' | 'mixed';
  units: number;
  value: number;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  year_built?: number;
  description?: string;
  amenities?: string[];
  status: 'active' | 'inactive' | 'maintenance' | 'vacant';
}

const Properties = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    property_type: 'residential' as const,
    units: 1,
    value: 0,
    rent: 0,
    bedrooms: 0,
    bathrooms: 0,
    size: 0,
    year_built: new Date().getFullYear(),
    description: '',
    amenities: '',
    status: 'active' as const,
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const propertyData = {
      ...formData,
      user_id: user.id,
      amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
    };

    if (editingProperty) {
      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', editingProperty.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Property updated successfully!' });
        fetchProperties();
        handleCloseModal();
      }
    } else {
      const { error } = await supabase.from('properties').insert([propertyData]);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Property added successfully!' });
        fetchProperties();
        handleCloseModal();
      }
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      postal_code: property.postal_code || '',
      property_type: property.property_type,
      units: property.units,
      value: property.value,
      rent: property.rent || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      size: property.size || 0,
      year_built: property.year_built || new Date().getFullYear(),
      description: property.description || '',
      amenities: property.amenities?.join(', ') || '',
      status: property.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    const { error } = await supabase.from('properties').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Property deleted successfully!' });
      fetchProperties();
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      postal_code: '',
      property_type: 'residential',
      units: 1,
      value: 0,
      rent: 0,
      bedrooms: 0,
      bathrooms: 0,
      size: 0,
      year_built: new Date().getFullYear(),
      description: '',
      amenities: '',
      status: 'active',
    });
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || property.property_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
    occupied: Math.floor(properties.reduce((sum, p) => sum + p.units, 0) * 0.69),
    vacancyRate: 31,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Properties Overview</h1>
          <p className="text-white/80">Manage your properties from this dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Building2, label: 'Total Properties', value: stats.total, trend: '+12.5%', positive: true },
            { icon: DoorOpen, label: 'Total Units', value: stats.totalUnits, trend: '+8.2%', positive: true },
            { icon: CheckCircle2, label: 'Occupied Units', value: stats.occupied, trend: '+15.3%', positive: true },
            { icon: Percent, label: 'Vacancy Rate', value: `${stats.vacancyRate}%`, trend: '-3.1%', positive: false },
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
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'residential', 'commercial', 'mixed'].map(type => (
              <Button
                key={type}
                onClick={() => setFilterType(type)}
                variant={filterType === type ? 'default' : 'outline'}
                className={filterType === type ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <LoadingSkeleton cards={6} />
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties found"
            description={searchTerm || filterType !== 'all' ? 'Try adjusting your filters or search terms' : 'Add your first property to get started managing your portfolio'}
            actionLabel={searchTerm || filterType !== 'all' ? undefined : 'Add Property'}
            onAction={searchTerm || filterType !== 'all' ? undefined : () => setShowModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((property, idx) => (
              <Card key={property.id} className="glass-panel p-6 hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    property.status === 'active' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                    property.status === 'vacant' ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]' :
                    'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
                  }`}>
                    {property.status}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-sm">
                    {property.property_type}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{property.name}</h3>
                <p className="text-white/70 text-sm mb-4 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {property.address}, {property.city}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="text-white/80">Units: <span className="font-bold text-white">{property.units}</span></div>
                  <div className="text-white/80">Value: <span className="font-bold text-white">R{property.value.toLocaleString()}</span></div>
                  {property.bedrooms && <div className="text-white/80">Beds: <span className="font-bold text-white">{property.bedrooms}</span></div>}
                  {property.bathrooms && <div className="text-white/80">Baths: <span className="font-bold text-white">{property.bathrooms}</span></div>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(property)} variant="outline" className="flex-1 bg-white/5 text-white border-white/20 hover:bg-white/10 group">
                    <Edit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Edit
                  </Button>
                  <Button onClick={() => handleDelete(property.id)} variant="outline" className="flex-1 bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30 hover:bg-[hsl(var(--danger))]/30 group">
                    <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal - Fixed with no hover effects */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-h-[90vh] overflow-y-auto [&_.glass-panel]:hover:transform-none [&_.glass-panel]:hover:shadow-none [&_.glass-panel]:hover:translate-y-0 [&_.glass-panel]:hover:before:opacity-0" style={{ transform: 'none', transition: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select value={formData.property_type} onValueChange={(value: 'residential' | 'commercial' | 'mixed') => setFormData({...formData, property_type: value})}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Units *</Label>
                  <Input type="number" value={formData.units} onChange={(e) => setFormData({...formData, units: Number(e.target.value)})} required className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Label>Property Value (R) *</Label>
                  <Input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} required className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: Number(e.target.value)})} className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input type="number" step="0.5" value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: Number(e.target.value)})} className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Label>Size (sqm)</Label>
                  <Input type="number" value={formData.size} onChange={(e) => setFormData({...formData, size: Number(e.target.value)})} className="bg-white/10 border-white/20 text-white focus:bg-white/20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-white/10 border-white/20 text-white focus:bg-white/20" rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white hover:opacity-90">
                  {editingProperty ? 'Update' : 'Add'} Property
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Properties;

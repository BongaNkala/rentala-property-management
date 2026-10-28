import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Business details that appear on invoices.
const BusinessProfileCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', business_name: '', business_address: '', phone: '', logo_url: '' });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, business_name, business_address, phone, logo_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name || '',
            business_name: data.business_name || '',
            business_address: data.business_address || '',
            phone: data.phone || '',
            logo_url: data.logo_url || '',
          });
        }
      });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...form });
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Saved', description: 'Your business details will appear on new invoices.' });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-xl font-bold text-white mb-1">Business details</h2>
      <p className="text-white/70 text-sm mb-6">Shown at the top of every invoice you send.</p>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Your name</Label>
            <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Business name</Label>
            <Input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Phone</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Logo link</Label>
            <Input placeholder="https://" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-white">Business address</Label>
          <Textarea value={form.business_address} onChange={e => setForm({ ...form, business_address: e.target.value })} className="bg-white/10 border-white/20 text-white" />
        </div>
        <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
          {saving ? 'Saving' : 'Save business details'}
        </Button>
      </form>
    </Card>
  );
};

export default BusinessProfileCard;

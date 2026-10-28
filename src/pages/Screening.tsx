import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type ScreeningStatus = 'requested' | 'approved' | 'declined';

interface Screening {
  id: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  monthly_income: number | null;
  status: ScreeningStatus;
  notes: string | null;
  created_at: string;
  properties?: { name: string } | null;
}

const NONE = 'none';
const emptyForm = { applicant_name: '', applicant_email: '', applicant_phone: '', monthly_income: 0, property_id: NONE, notes: '' };

const Screening = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Screening[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [s, p] = await Promise.all([
      supabase.from('screenings').select('*, properties(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').eq('user_id', user.id),
    ]);
    if (s.error) toast({ title: 'Error', description: s.error.message, variant: 'destructive' });
    setItems((s.data as Screening[]) || []);
    setProperties(p.data || []);
    setLoading(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('screenings').insert([
      {
        user_id: user.id,
        applicant_name: form.applicant_name,
        applicant_email: form.applicant_email || null,
        applicant_phone: form.applicant_phone || null,
        monthly_income: form.monthly_income || null,
        property_id: form.property_id === NONE ? null : form.property_id,
        notes: form.notes || null,
        status: 'requested',
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setShow(false);
    setForm(emptyForm);
    load();
  };

  const setStatus = async (id: string, status: ScreeningStatus) => {
    const { error } = await supabase.from('screenings').update({ status }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else load();
  };

  const remove = async (s: Screening) => {
    if (!confirm(`Delete the screening for ${s.applicant_name}?`)) return;
    await supabase.from('screenings').delete().eq('id', s.id);
    load();
  };

  const tone = (s: ScreeningStatus) =>
    s === 'approved'
      ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
      : s === 'declined'
      ? 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
      : 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">Tenant screening</h1>
            <p className="text-white/80">Keep every applicant and your decision in one place</p>
          </div>
          <Button onClick={() => setShow(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
            <Plus className="w-4 h-4 mr-2" /> Add applicant
          </Button>
        </div>

        <Card className="glass-panel p-5 text-white/80 text-sm">
          Credit bureau checks are not connected yet. Run the check with your bureau, then record the outcome here.
          Do not enter ID numbers or bank details in the notes.
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-bold text-white mb-2">No applicants yet</h3>
            <p className="text-white/60">Add an applicant when someone applies for a unit.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(s => (
              <Card key={s.id} className="glass-panel p-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${tone(s.status)}`}>{s.status}</span>
                <h3 className="text-xl font-bold text-white mt-4 mb-1">{s.applicant_name}</h3>
                <p className="text-white/70 text-sm">{s.properties?.name || 'No property chosen'}</p>
                {s.applicant_email && <p className="text-white/70 text-sm">{s.applicant_email}</p>}
                {s.applicant_phone && <p className="text-white/70 text-sm">{s.applicant_phone}</p>}
                {s.monthly_income ? (
                  <p className="text-white/90 text-sm mt-3">Monthly income: <span className="font-bold text-white">R{Number(s.monthly_income).toLocaleString('en-ZA')}</span></p>
                ) : null}
                {s.notes && <p className="text-white/70 text-sm mt-2">{s.notes}</p>}
                <p className="text-white/50 text-xs mt-3">Added {format(new Date(s.created_at), 'dd MMM yyyy')}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setStatus(s.id, 'approved')} variant="outline" className="flex-1 bg-white/5 text-white border-white/20">Approve</Button>
                  <Button size="sm" onClick={() => setStatus(s.id, 'declined')} variant="outline" className="flex-1 bg-white/5 text-white border-white/20">Decline</Button>
                  <Button size="sm" onClick={() => remove(s)} variant="outline" className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={show} onOpenChange={setShow}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-2xl font-bold">Add applicant</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input value={form.applicant_name} onChange={e => setForm({ ...form, applicant_name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.applicant_email} onChange={e => setForm({ ...form, applicant_email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.applicant_phone} onChange={e => setForm({ ...form, applicant_phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly income (R)</Label>
                  <Input type="number" min={0} value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: Number(e.target.value) })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={form.property_id} onValueChange={v => setForm({ ...form, property_id: v })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not chosen yet</SelectItem>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShow(false)} className="bg-white/10 text-white border-white/20">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">Add applicant</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Screening;

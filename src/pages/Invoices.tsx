import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format, addDays } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Search, Mail, MessageSquare, Printer, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  tenant_id: string;
  property_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  description: string | null;
  status: 'draft' | 'sent' | 'paid';
  tenants?: { name: string; email: string; phone: string } | null;
  properties?: { name: string; address: string } | null;
}

interface TenantOption {
  id: string;
  name: string;
  property_id: string;
  rent: number;
}

interface Profile {
  full_name: string | null;
  business_name: string | null;
  business_address: string | null;
  phone: string | null;
  logo_url: string | null;
}

const today = () => format(new Date(), 'yyyy-MM-dd');
const rand = (n: number) => `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const [form, setForm] = useState({
    tenant_id: '',
    amount: 0,
    issue_date: today(),
    due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    description: 'Monthly rent',
  });

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [invRes, tenRes, profRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, tenants(name, email, phone), properties(name, address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('tenants').select('id, name, property_id, rent').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('full_name, business_name, business_address, phone, logo_url').eq('id', user.id).maybeSingle(),
    ]);
    if (invRes.error) toast({ title: 'Error', description: invRes.error.message, variant: 'destructive' });
    setInvoices((invRes.data as Invoice[]) || []);
    setTenants((tenRes.data as TenantOption[]) || []);
    setProfile((profRes.data as Profile) || null);
    setLoading(false);
  };

  const isOverdue = (i: Invoice) => i.status !== 'paid' && i.due_date < today();
  const displayStatus = (i: Invoice) => (isOverdue(i) ? 'overdue' : i.status);

  const nextNumber = () => {
    const nums = invoices
      .map(i => parseInt(i.invoice_number.replace(/\D/g, ''), 10))
      .filter(n => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `INV-${String(next).padStart(4, '0')}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const tenant = tenants.find(t => t.id === form.tenant_id);
    if (!tenant) {
      toast({ title: 'Choose a tenant', description: 'Select the tenant this invoice is for.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('invoices').insert([
      {
        user_id: user.id,
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        invoice_number: nextNumber(),
        issue_date: form.issue_date,
        due_date: form.due_date,
        amount: Number(form.amount),
        description: form.description,
        status: 'draft',
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Invoice created', description: 'Open it to send or print.' });
    setShowModal(false);
    load();
  };

  const message = (i: Invoice) =>
    `Hi ${i.tenants?.name || ''}, invoice ${i.invoice_number} for ${rand(i.amount)} (${i.description || 'rent'}) ` +
    `is due on ${format(new Date(i.due_date), 'dd MMM yyyy')}. ` +
    `${profile?.business_name || profile?.full_name || ''}`.trim();

  const markSent = async (i: Invoice) => {
    if (i.status === 'draft') {
      await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', i.id);
      load();
    }
  };

  const sendEmail = (i: Invoice) => {
    if (!i.tenants?.email) return;
    const url = `mailto:${i.tenants.email}?subject=${encodeURIComponent(`Invoice ${i.invoice_number}`)}&body=${encodeURIComponent(message(i))}`;
    window.location.href = url;
    markSent(i);
  };

  const sendSms = (i: Invoice) => {
    if (!i.tenants?.phone) return;
    window.location.href = `sms:${i.tenants.phone}?body=${encodeURIComponent(message(i))}`;
    markSent(i);
  };

  const markPaid = async (i: Invoice) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_date: today() }).eq('id', i.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    // Record the matching payment so reports and the dashboard stay in sync.
    if (user) {
      await supabase.from('payments').insert([
        {
          user_id: user.id,
          tenant_id: i.tenant_id,
          property_id: i.property_id,
          amount: i.amount,
          payment_date: today(),
          payment_method: 'bank_transfer',
          reference: i.invoice_number,
          status: 'completed',
        },
      ]);
    }
    toast({ title: 'Marked as paid', description: `${i.invoice_number} was recorded as a payment.` });
    setViewing(null);
    load();
  };

  const handleDelete = async (i: Invoice) => {
    if (!confirm(`Delete ${i.invoice_number}?`)) return;
    const { error } = await supabase.from('invoices').delete().eq('id', i.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setViewing(null);
      load();
    }
  };

  const filtered = useMemo(
    () =>
      invoices.filter(i => {
        const q = search.toLowerCase();
        const matches = i.invoice_number.toLowerCase().includes(q) || (i.tenants?.name || '').toLowerCase().includes(q);
        return matches && (filter === 'all' || displayStatus(i) === filter);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, search, filter]
  );

  const totals = {
    outstanding: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0),
    overdue: invoices.filter(isOverdue).reduce((s, i) => s + Number(i.amount), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0),
  };

  const badge = (i: Invoice) => {
    const s = displayStatus(i);
    const cls =
      s === 'paid'
        ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
        : s === 'overdue'
        ? 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
        : s === 'sent'
        ? 'bg-[hsl(var(--info))]/20 text-[hsl(var(--info))]'
        : 'bg-white/10 text-white';
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>{s}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-white/80">Create rent invoices, send them to tenants and track what has been paid</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Outstanding', value: totals.outstanding },
            { label: 'Overdue', value: totals.overdue },
            { label: 'Paid', value: totals.paid },
          ].map(s => (
            <Card key={s.label} className="glass-panel p-6">
              <div className="text-3xl font-black text-white mb-1">{rand(s.value)}</div>
              <div className="text-white/80 font-medium">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Search by invoice number or tenant"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'draft', 'sent', 'overdue', 'paid'] as const).map(f => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'default' : 'outline'}
                className={filter === f ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New invoice
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-bold text-white mb-2">
              {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
            </h3>
            <p className="text-white/60">
              {invoices.length === 0 ? 'Add an active tenant, then create their first invoice.' : 'Try a different search or status.'}
            </p>
          </Card>
        ) : (
          <Card className="glass-panel p-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/70">Invoice</TableHead>
                  <TableHead className="text-white/70">Tenant</TableHead>
                  <TableHead className="text-white/70">Due</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="text-white font-medium">{i.invoice_number}</TableCell>
                    <TableCell className="text-white/90">{i.tenants?.name}</TableCell>
                    <TableCell className="text-white/90">{format(new Date(i.due_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-white font-bold">{rand(i.amount)}</TableCell>
                    <TableCell>{badge(i)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setViewing(i)} className="bg-white/5 text-white border-white/20">
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Create */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant *</Label>
                <Select
                  value={form.tenant_id}
                  onValueChange={v => {
                    const t = tenants.find(x => x.id === v);
                    setForm({ ...form, tenant_id: v, amount: t ? Number(t.rent) : form.amount });
                  }}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select an active tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Amount (R) *</Label>
                <Input type="number" min={0} step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue date *</Label>
                  <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Due date *</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="bg-white/10 text-white border-white/20">
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
                  Create invoice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View / send / print */}
        <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null); }}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{viewing?.invoice_number}</DialogTitle>
            </DialogHeader>
            {viewing && (
              <>
                <div ref={printRef} className="bg-white text-black rounded-xl p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      {profile?.logo_url && <img src={profile.logo_url} alt="" className="h-12 mb-2" />}
                      <div className="text-xl font-bold">{profile?.business_name || profile?.full_name || 'Your business'}</div>
                      {profile?.business_address && <div className="text-sm text-gray-600 whitespace-pre-line">{profile.business_address}</div>}
                      {profile?.phone && <div className="text-sm text-gray-600">{profile.phone}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">INVOICE</div>
                      <div className="text-sm text-gray-600">{viewing.invoice_number}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Billed to</div>
                      <div className="font-semibold">{viewing.tenants?.name}</div>
                      <div>{viewing.properties?.name}</div>
                      <div className="text-gray-600">{viewing.properties?.address}</div>
                    </div>
                    <div className="text-right">
                      <div><span className="text-gray-500">Issued</span> {format(new Date(viewing.issue_date), 'dd MMM yyyy')}</div>
                      <div><span className="text-gray-500">Due</span> {format(new Date(viewing.due_date), 'dd MMM yyyy')}</div>
                    </div>
                  </div>
                  <div className="border-t border-b py-3 flex justify-between">
                    <span>{viewing.description || 'Rent'}</span>
                    <span className="font-bold">{rand(viewing.amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black">
                    <span>Total due</span>
                    <span>{viewing.status === 'paid' ? 'Paid' : rand(viewing.amount)}</span>
                  </div>
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" onClick={() => sendEmail(viewing)} className="bg-white/10 text-white border-white/20">
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </Button>
                  <Button variant="outline" onClick={() => sendSms(viewing)} className="bg-white/10 text-white border-white/20">
                    <MessageSquare className="w-4 h-4 mr-2" /> SMS
                  </Button>
                  <Button variant="outline" onClick={() => handlePrint()} className="bg-white/10 text-white border-white/20">
                    <Printer className="w-4 h-4 mr-2" /> Print / PDF
                  </Button>
                  {viewing.status !== 'paid' && (
                    <Button onClick={() => markPaid(viewing)} className="bg-[hsl(var(--success))] text-black">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as paid
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => handleDelete(viewing)} className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                    Delete
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;

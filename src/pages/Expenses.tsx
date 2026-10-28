import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
}

interface Expense {
  id: string;
  vendor_id: string | null;
  property_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'due' | 'paid';
  vendors?: { name: string } | null;
  properties?: { name: string } | null;
}

const rand = (n: number) => `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const NONE = 'none';

const Expenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'bills' | 'vendors'>('bills');
  const [showBill, setShowBill] = useState(false);
  const [showVendor, setShowVendor] = useState(false);

  const [bill, setBill] = useState({ vendor_id: NONE, property_id: NONE, description: '', amount: 0, due_date: todayStr() });
  const [vendor, setVendor] = useState({ name: '', category: '', email: '', phone: '' });

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [exp, ven, prop] = await Promise.all([
      supabase.from('expenses').select('*, vendors(name), properties(name)').eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('vendors').select('*').eq('user_id', user.id).order('name'),
      supabase.from('properties').select('id, name').eq('user_id', user.id),
    ]);
    if (exp.error) toast({ title: 'Error', description: exp.error.message, variant: 'destructive' });
    setExpenses((exp.data as Expense[]) || []);
    setVendors((ven.data as Vendor[]) || []);
    setProperties(prop.data || []);
    setLoading(false);
  };

  const addBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('expenses').insert([
      {
        user_id: user.id,
        vendor_id: bill.vendor_id === NONE ? null : bill.vendor_id,
        property_id: bill.property_id === NONE ? null : bill.property_id,
        description: bill.description,
        amount: Number(bill.amount),
        due_date: bill.due_date,
        status: 'due',
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setShowBill(false);
    setBill({ vendor_id: NONE, property_id: NONE, description: '', amount: 0, due_date: todayStr() });
    load();
  };

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('vendors').insert([{ ...vendor, user_id: user.id }]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setShowVendor(false);
    setVendor({ name: '', category: '', email: '', phone: '' });
    load();
  };

  const markPaid = async (x: Expense) => {
    const { error } = await supabase.from('expenses').update({ status: 'paid', paid_date: todayStr() }).eq('id', x.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else load();
  };

  const removeBill = async (x: Expense) => {
    if (!confirm(`Delete "${x.description}"?`)) return;
    await supabase.from('expenses').delete().eq('id', x.id);
    load();
  };

  const removeVendor = async (v: Vendor) => {
    if (!confirm(`Delete ${v.name}? Their bills stay, but lose the vendor link.`)) return;
    await supabase.from('vendors').delete().eq('id', v.id);
    load();
  };

  const due = expenses.filter(x => x.status === 'due');
  const paid = expenses.filter(x => x.status === 'paid');
  const dueTotal = due.reduce((s, x) => s + Number(x.amount), 0);
  const paidTotal = paid.reduce((s, x) => s + Number(x.amount), 0);
  const overdueTotal = due.filter(x => x.due_date < todayStr()).reduce((s, x) => s + Number(x.amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Expenses</h1>
          <p className="text-white/80">Vendor bills, what is due and what has been cleared</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Still to pay', value: dueTotal },
            { label: 'Past due date', value: overdueTotal },
            { label: 'Cleared', value: paidTotal },
          ].map(s => (
            <Card key={s.label} className="glass-panel p-6">
              <div className="text-3xl font-black text-white mb-1">{rand(s.value)}</div>
              <div className="text-white/80 font-medium">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-1">
            {(['bills', 'vendors'] as const).map(t => (
              <Button
                key={t}
                onClick={() => setTab(t)}
                variant={tab === t ? 'default' : 'outline'}
                className={tab === t ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/5 text-white border-white/20'}
              >
                {t === 'bills' ? 'Bills' : 'Vendors'}
              </Button>
            ))}
          </div>
          {tab === 'bills' ? (
            <Button onClick={() => setShowBill(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add bill
            </Button>
          ) : (
            <Button onClick={() => setShowVendor(true)} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add vendor
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : tab === 'bills' ? (
          expenses.length === 0 ? (
            <Card className="glass-panel p-12 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-bold text-white mb-2">No bills yet</h3>
              <p className="text-white/60">Add a vendor bill to track what you owe and when.</p>
            </Card>
          ) : (
            <Card className="glass-panel p-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70">Description</TableHead>
                    <TableHead className="text-white/70">Vendor</TableHead>
                    <TableHead className="text-white/70">Property</TableHead>
                    <TableHead className="text-white/70">Due</TableHead>
                    <TableHead className="text-white/70">Amount</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(x => {
                    const late = x.status === 'due' && x.due_date < todayStr();
                    return (
                      <TableRow key={x.id}>
                        <TableCell className="text-white font-medium">{x.description}</TableCell>
                        <TableCell className="text-white/90">{x.vendors?.name || 'None'}</TableCell>
                        <TableCell className="text-white/90">{x.properties?.name || 'General'}</TableCell>
                        <TableCell className={late ? 'text-[hsl(var(--danger))] font-bold' : 'text-white/90'}>
                          {format(new Date(x.due_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-white font-bold">{rand(x.amount)}</TableCell>
                        <TableCell className="text-white/90">{x.status === 'paid' ? 'Paid' : late ? 'Overdue' : 'Due'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {x.status === 'due' && (
                            <Button size="sm" variant="outline" onClick={() => markPaid(x)} className="bg-white/5 text-white border-white/20 mr-2">
                              Mark paid
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => removeBill(x)} className="bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )
        ) : vendors.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <h3 className="text-xl font-bold text-white mb-2">No vendors yet</h3>
            <p className="text-white/60">Save plumbers, electricians and suppliers so you can attach bills to them.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(v => {
              const owed = due.filter(x => x.vendor_id === v.id).reduce((s, x) => s + Number(x.amount), 0);
              return (
                <Card key={v.id} className="glass-panel p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{v.name}</h3>
                  <p className="text-white/70 text-sm mb-3">{v.category || 'Uncategorised'}</p>
                  {v.email && <p className="text-white/70 text-sm">{v.email}</p>}
                  {v.phone && <p className="text-white/70 text-sm">{v.phone}</p>}
                  <p className="text-white/90 mt-3">Owed: <span className="font-bold text-white">{rand(owed)}</span></p>
                  <Button onClick={() => removeVendor(v)} variant="outline" className="mt-4 w-full bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30">
                    Delete
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showBill} onOpenChange={setShowBill}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-2xl font-bold">Add bill</DialogTitle></DialogHeader>
            <form onSubmit={addBill} className="space-y-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={bill.description} onChange={e => setBill({ ...bill, description: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={bill.vendor_id} onValueChange={v => setBill({ ...bill, vendor_id: v })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No vendor</SelectItem>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={bill.property_id} onValueChange={v => setBill({ ...bill, property_id: v })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>General</SelectItem>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (R) *</Label>
                  <Input type="number" min={0} step="0.01" value={bill.amount} onChange={e => setBill({ ...bill, amount: Number(e.target.value) })} required className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Due date *</Label>
                  <Input type="date" value={bill.due_date} onChange={e => setBill({ ...bill, due_date: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowBill(false)} className="bg-white/10 text-white border-white/20">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">Add bill</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showVendor} onOpenChange={setShowVendor}>
          <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-2xl font-bold">Add vendor</DialogTitle></DialogHeader>
            <form onSubmit={addVendor} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={vendor.name} onChange={e => setVendor({ ...vendor, name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="Plumbing, electrical, garden service" value={vendor.category} onChange={e => setVendor({ ...vendor, category: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={vendor.email} onChange={e => setVendor({ ...vendor, email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={vendor.phone} onChange={e => setVendor({ ...vendor, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowVendor(false)} className="bg-white/10 text-white border-white/20">Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white">Add vendor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;

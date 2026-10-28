import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OverdueInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  due_date: string;
  amount: number;
  reminder_count: number;
  last_reminder_at: string | null;
  tenants: { name: string; email: string; phone: string } | null;
  properties: { name: string } | null;
}

const rand = (n: number) => `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

const Arrears = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('invoices')
      .select('id, tenant_id, invoice_number, due_date, amount, reminder_count, last_reminder_at, tenants(name, email, phone), properties(name)')
      .eq('user_id', user.id)
      .neq('status', 'paid')
      .lt('due_date', today)
      .order('due_date', { ascending: true });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setRows((data as unknown as OverdueInvoice[]) || []);
    setLoading(false);
  };

  const days = (r: OverdueInvoice) => differenceInCalendarDays(new Date(), new Date(r.due_date));

  const text = (r: OverdueInvoice) =>
    `Hi ${r.tenants?.name || ''}, a reminder that invoice ${r.invoice_number} for ${rand(r.amount)} ` +
    `was due on ${format(new Date(r.due_date), 'dd MMM yyyy')} and is now ${days(r)} days overdue. Please arrange payment.`;

  const logReminder = async (r: OverdueInvoice) => {
    await supabase
      .from('invoices')
      .update({ reminder_count: r.reminder_count + 1, last_reminder_at: new Date().toISOString() })
      .eq('id', r.id);
    load();
  };

  const emailReminder = (r: OverdueInvoice) => {
    if (!r.tenants?.email) return;
    window.location.href = `mailto:${r.tenants.email}?subject=${encodeURIComponent(`Overdue: ${r.invoice_number}`)}&body=${encodeURIComponent(text(r))}`;
    logReminder(r);
  };

  const smsReminder = (r: OverdueInvoice) => {
    if (!r.tenants?.phone) return;
    window.location.href = `sms:${r.tenants.phone}?body=${encodeURIComponent(text(r))}`;
    logReminder(r);
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const tenantCount = new Set(rows.map(r => r.tenant_id)).size;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Arrears</h1>
          <p className="text-white/80">Unpaid invoices past their due date, oldest first</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="glass-panel p-6">
            <div className="text-3xl font-black text-white mb-1">{rand(total)}</div>
            <div className="text-white/80 font-medium">Total in arrears</div>
          </Card>
          <Card className="glass-panel p-6">
            <div className="text-3xl font-black text-white mb-1">{tenantCount}</div>
            <div className="text-white/80 font-medium">Tenants behind</div>
          </Card>
          <Card className="glass-panel p-6">
            <div className="text-3xl font-black text-white mb-1">{rows.length}</div>
            <div className="text-white/80 font-medium">Overdue invoices</div>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
          </div>
        ) : rows.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--success))]" />
            <h3 className="text-xl font-bold text-white mb-2">Nobody is behind on rent</h3>
            <p className="text-white/60">Overdue invoices will show up here with one-tap reminders.</p>
          </Card>
        ) : (
          <Card className="glass-panel p-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/70">Tenant</TableHead>
                  <TableHead className="text-white/70">Property</TableHead>
                  <TableHead className="text-white/70">Invoice</TableHead>
                  <TableHead className="text-white/70">Days overdue</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Reminders sent</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-white font-medium">{r.tenants?.name}</TableCell>
                    <TableCell className="text-white/90">{r.properties?.name}</TableCell>
                    <TableCell className="text-white/90">{r.invoice_number}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-[hsl(var(--danger))] font-bold">
                        <AlertCircle className="w-4 h-4" /> {days(r)}
                      </span>
                    </TableCell>
                    <TableCell className="text-white font-bold">{rand(r.amount)}</TableCell>
                    <TableCell className="text-white/90">
                      {r.reminder_count}
                      {r.last_reminder_at && (
                        <span className="text-white/50 text-xs ml-2">last {format(new Date(r.last_reminder_at), 'dd MMM')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => emailReminder(r)} className="bg-white/5 text-white border-white/20 mr-2">
                        <Mail className="w-4 h-4 mr-1" /> Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => smsReminder(r)} className="bg-white/5 text-white border-white/20">
                        <MessageSquare className="w-4 h-4 mr-1" /> SMS
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Arrears;

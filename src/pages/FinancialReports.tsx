import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Printer, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const FinancialReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Financial-Statement-${format(new Date(), 'yyyy-MM-dd')}`,
    onAfterPrint: () => {
      toast({
        title: "Statement printed successfully",
        description: "Your financial statement has been sent to the printer",
      });
    },
  });

  const generateReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const [propertiesRes, paymentsRes, maintenanceRes, tenantsRes] = await Promise.all([
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase
          .from('payments')
          .select('*, tenants(name), properties(name, address)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
        supabase
          .from('maintenance')
          .select('*, properties(name)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_date', startDate)
          .lte('completed_date', endDate),
        supabase
          .from('tenants')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ]);

      const properties = propertiesRes.data || [];
      const payments = paymentsRes.data || [];
      const maintenance = maintenanceRes.data || [];
      const tenants = tenantsRes.data || [];

      const propertyStats = properties.map(property => {
        const propertyPayments = payments.filter(
          p => (p.properties as any)?.name === property.name
        );
        const propertyMaintenance = maintenance.filter(
          m => (m.properties as any)?.name === property.name
        );

        const revenue = propertyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const expenses = propertyMaintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const propertyTenants = tenants.filter(t => t.property_id === property.id);
        const occupancy = property.units > 0 
          ? Math.round((propertyTenants.length / property.units) * 100)
          : 0;

        return {
          id: property.id,
          name: property.name,
          address: `${property.address}, ${property.city}`,
          revenue,
          expenses,
          occupancy,
        };
      });

      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalExpenses = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
      const netIncome = totalRevenue - totalExpenses;
      const averageOccupancy = propertyStats.length > 0
        ? Math.round(propertyStats.reduce((sum, p) => sum + p.occupancy, 0) / propertyStats.length)
        : 0;

      const data = {
        startDate: start,
        endDate: end,
        properties: propertyStats,
        payments: payments.map(p => ({
          id: p.id,
          tenant: (p.tenants as any)?.name || 'Unknown',
          property: (p.properties as any)?.name || 'Unknown',
          amount: Number(p.amount),
          date: p.payment_date,
          method: p.payment_method || 'N/A',
        })),
        maintenance: maintenance.map(m => ({
          id: m.id,
          property: (m.properties as any)?.name || 'Unknown',
          description: m.issue,
          cost: Number(m.cost || 0),
          date: m.completed_date || m.created_at,
        })),
        summary: {
          totalRevenue,
          totalExpenses,
          netIncome,
          totalProperties: properties.length,
          activeLeases: tenants.length,
          averageOccupancy,
        },
      };

      setReportData(data);
      toast({
        title: "Report generated!",
        description: "Your financial statement is ready to print",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error generating report",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
          <p className="text-white/80 mt-2">Generate and print comprehensive financial statements</p>
        </div>

        <Card className="glass-panel p-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="startDate" className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="endDate" className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <Button
              onClick={generateReport}
              disabled={loading}
              className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white hover:opacity-90 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {reportData && (
            <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
              <Button
                onClick={handlePrint}
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Statement
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Save as PDF
              </Button>
            </div>
          )}
        </Card>

        {reportData && (
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Statement Preview
            </h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <div className="max-h-[800px] overflow-y-auto p-8">
                <div ref={componentRef} className="bg-white text-black p-8 min-h-[500px]">
                  <h2 className="text-2xl font-bold text-blue-600 mb-4">Financial Statement</h2>
                  <p>Period: {format(reportData.startDate, 'MMM dd, yyyy')} - {format(reportData.endDate, 'MMM dd, yyyy')}</p>
                  <div className="mt-6">
                    <h3 className="text-xl font-bold">Summary</h3>
                    <p>Total Revenue: R{reportData.summary.totalRevenue.toLocaleString()}</p>
                    <p>Total Expenses: R{reportData.summary.totalExpenses.toLocaleString()}</p>
                    <p>Net Income: R{reportData.summary.netIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FinancialReports;

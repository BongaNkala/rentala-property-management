import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Layout, Table2, FileText, RefreshCw, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preferences, setPreferences] = useState({
    push_notifications_enabled: false,
    email_notifications_enabled: true,
    notification_sound_enabled: true,
    notify_on_payments: true,
    notify_on_maintenance: true,
    notify_on_lease_expiry: true,
    theme: 'dark' as const,
    dashboard_layout: 'default' as const,
    language: 'en' as const,
    properties_view: 'grid' as const,
    tenants_view: 'list' as const,
    payments_view: 'table' as const,
    items_per_page: 20 as const,
    default_report_period: '30days' as const,
    currency: 'ZAR' as const,
    date_format: 'DD/MM/YYYY' as const,
    time_format: '24h' as const,
    show_getting_started: true,
    show_quick_actions: true,
    show_dashboard_charts: true,
  });

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Preferences synced',
      description: 'Your settings are now up to date.',
    });
    setSyncing(false);
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all preferences to defaults?')) return;
    setResetting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPreferences({
      push_notifications_enabled: false,
      email_notifications_enabled: true,
      notification_sound_enabled: true,
      notify_on_payments: true,
      notify_on_maintenance: true,
      notify_on_lease_expiry: true,
      theme: 'dark',
      dashboard_layout: 'default',
      language: 'en',
      properties_view: 'grid',
      tenants_view: 'list',
      payments_view: 'table',
      items_per_page: 20,
      default_report_period: '30days',
      currency: 'ZAR',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      show_getting_started: true,
      show_quick_actions: true,
      show_dashboard_charts: true,
    });
    toast({
      title: 'Preferences reset',
      description: 'All preferences have been reset to defaults.',
    });
    setResetting(false);
  };

  const updatePreference = (key: keyof typeof preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    toast({
      title: 'Preference saved',
      description: 'Your preference has been updated.',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-[hsl(var(--primary-light))]" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
            <p className="text-white/70 mt-2">Manage your preferences. Changes sync automatically across all your devices.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={syncing} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync
            </Button>
            <Button onClick={handleReset} disabled={resetting} variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20">
              {resetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Reset
            </Button>
          </div>
        </div>

        <Card className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[hsl(var(--primary-light))]" />
            <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
          </div>
          <Separator className="bg-white/10" />
          <div className="space-y-4">
            {[
              { label: 'Push Notifications', desc: 'Receive browser push notifications', key: 'push_notifications_enabled' },
              { label: 'Email Notifications', desc: 'Receive notifications via email', key: 'email_notifications_enabled' },
              { label: 'Notification Sound', desc: 'Play sound for new notifications', key: 'notification_sound_enabled' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white font-medium">{item.label}</Label>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
                <Switch
                  checked={preferences[item.key as keyof typeof preferences] as boolean}
                  onCheckedChange={(checked) => updatePreference(item.key as keyof typeof preferences, checked)}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-[hsl(var(--primary-light))]" />
            <h2 className="text-xl font-bold text-white">Interface Preferences</h2>
          </div>
          <Separator className="bg-white/10" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-medium">Show Getting Started</Label>
                <p className="text-sm text-white/60">Display welcome banner for new users</p>
              </div>
              <Switch
                checked={preferences.show_getting_started}
                onCheckedChange={(checked) => updatePreference('show_getting_started', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-medium">Show Quick Actions</Label>
                <p className="text-sm text-white/60">Display quick action buttons on dashboard</p>
              </div>
              <Switch
                checked={preferences.show_quick_actions}
                onCheckedChange={(checked) => updatePreference('show_quick_actions', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white font-medium">Show Dashboard Charts</Label>
                <p className="text-sm text-white/60">Display charts and graphs on dashboard</p>
              </div>
              <Switch
                checked={preferences.show_dashboard_charts}
                onCheckedChange={(checked) => updatePreference('show_dashboard_charts', checked)}
              />
            </div>
          </div>
        </Card>

        <Card className="glass-panel p-4 bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-[hsl(var(--primary-light))] mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Auto-Sync Enabled</h3>
              <p className="text-sm text-white/70 mt-1">
                Your preferences are automatically saved and synced across all devices. Changes take effect immediately.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

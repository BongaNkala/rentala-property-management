import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Building2, Users, DollarSign, Wrench, BarChart3, PieChart, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string | number;
}

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const mainNav: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Properties', icon: Building2, path: '/properties' },
    { label: 'Tenants', icon: Users, path: '/tenants' },
    { label: 'Payments', icon: DollarSign, path: '/payments' },
    { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
  ];

  const analyticsNav: NavItem[] = [
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Analytics', icon: PieChart, path: '/analytics' },
  ];

  const settingsNav: NavItem[] = [
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[280px] p-5 flex flex-col gap-7 bg-white/5 backdrop-blur-[40px] border-r border-white/15 rounded-r-3xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center shadow-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[hsl(var(--accent))] bg-clip-text text-transparent">
              Rentala
            </h2>
            <p className="text-xs text-white/80 font-medium">Property Management</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-2 px-2">
          <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold mb-3">Main</div>
          {mainNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-[hsl(var(--primary))]/25 to-[hsl(var(--accent))]/15 border border-white/30 text-white font-semibold shadow-lg'
                  : 'bg-white/3 border border-transparent text-white/90 hover:bg-white/10 hover:border-white/20 hover:translate-x-1'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-transparent animate-shimmer" />
              )}
              <item.icon className={`w-5 h-5 relative z-10 ${isActive(item.path) ? '' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="relative z-10">{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-1 text-xs font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-lg relative z-10 shadow-lg">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Analytics Navigation */}
        <nav className="flex flex-col gap-2 px-2">
          <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold mb-3">Analytics</div>
          {analyticsNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-[hsl(var(--primary))]/25 to-[hsl(var(--accent))]/15 border border-white/30 text-white font-semibold shadow-lg'
                  : 'bg-white/3 border border-transparent text-white/90 hover:bg-white/10 hover:border-white/20 hover:translate-x-1'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-transparent animate-shimmer" />
              )}
              <item.icon className={`w-5 h-5 relative z-10 ${isActive(item.path) ? '' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Settings Navigation */}
        <nav className="flex flex-col gap-2 px-2 mt-auto">
          <div className="text-[11px] uppercase tracking-wider text-white/60 font-semibold mb-3">Settings</div>
          {settingsNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-[hsl(var(--primary))]/25 to-[hsl(var(--accent))]/15 border border-white/30 text-white font-semibold shadow-lg'
                  : 'bg-white/3 border border-transparent text-white/90 hover:bg-white/10 hover:border-white/20 hover:translate-x-1'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-transparent animate-shimmer" />
              )}
              <item.icon className={`w-5 h-5 relative z-10 ${isActive(item.path) ? '' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--danger))]/10 border border-[hsl(var(--danger))]/20 text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/20 hover:border-[hsl(var(--danger))]/30 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* Footer Stats */}
        <div className="px-2 pt-6 border-t border-white/10">
          <div className="flex justify-between gap-4 mb-4">
            <div className="flex-1 text-center p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xl font-bold text-white">8</div>
              <div className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Properties</div>
            </div>
            <div className="flex-1 text-center p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xl font-bold text-white">48</div>
              <div className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">Tenants</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] animate-pulse-glow"></div>
            <span className="text-xs text-white/80 font-medium">System Online</span>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="glass-panel border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to sign out? You'll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              disabled={loggingOut}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={loggingOut}
              className="bg-gradient-to-r from-[hsl(var(--danger))] to-[#dc2626] text-white hover:opacity-90"
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Sidebar;

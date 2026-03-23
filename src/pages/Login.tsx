import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account",
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[hsl(var(--accent))]/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="glass-panel w-full max-w-md p-8 animate-scale-in relative z-10">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-lg animate-pulse-glow">
            <Home className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Rentala</h2>
            <p className="text-sm text-white/80">Property Management</p>
          </div>
        </div>
        
        {/* Header */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-white/70 text-lg">Sign in to manage your properties</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[hsl(var(--danger))]/20 border border-[hsl(var(--danger))]/30 animate-scale-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--danger))] mt-0.5 flex-shrink-0" />
              <p className="text-[hsl(var(--danger))] text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="email" className="text-white font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <div className="relative group">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 pl-4 transition-all duration-200 group-hover:bg-white/8 focus:bg-white/10"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Label htmlFor="password" className="text-white font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <div className="relative group">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 pl-4 transition-all duration-200 group-hover:bg-white/8 focus:bg-white/10"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] hover:opacity-90 text-white font-semibold h-12 animate-fade-in group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ animationDelay: '0.4s' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-center text-white/70">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-[hsl(var(--primary-light))] hover:text-white font-semibold transition-colors inline-flex items-center gap-1 group"
            >
              Sign up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-xs text-white/60 text-center">
            Demo: test@example.com / test123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-[hsl(var(--danger))]' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-[hsl(var(--warning))]' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-[hsl(var(--info))]' };
    return { score, label: 'Strong', color: 'bg-[hsl(var(--success))]' };
  }, [password]);

  const passwordRequirements = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains uppercase & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password, fullName);
      toast({
        title: "Account created!",
        description: "Welcome to Rentala. Let's get started!",
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      toast({
        title: "Signup failed",
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
        <div className="absolute top-20 right-20 w-72 h-72 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[hsl(var(--accent))]/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
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
            Create Account
          </h1>
          <p className="text-white/70 text-lg">Start managing your properties today</p>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="fullName" className="text-white font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <div className="relative group">
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 pl-4 transition-all duration-200 group-hover:bg-white/8 focus:bg-white/10"
                placeholder="John Smith"
              />
            </div>
          </div>
          
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
          
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
                minLength={6}
              />
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Password strength:</span>
                  <span className={`font-bold ${
                    passwordStrength.label === 'Weak' ? 'text-[hsl(var(--danger))]' :
                    passwordStrength.label === 'Fair' ? 'text-[hsl(var(--warning))]' :
                    passwordStrength.label === 'Good' ? 'text-[hsl(var(--info))]' :
                    'text-[hsl(var(--success))]'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Password Requirements */}
                <div className="space-y-1 pt-2">
                  {passwordRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs transition-colors ${
                        req.met ? 'text-[hsl(var(--success))]' : 'text-white/50'
                      }`}
                    >
                      {req.met ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] hover:opacity-90 text-white font-semibold h-12 animate-fade-in group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ animationDelay: '0.5s' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-center text-white/70">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-[hsl(var(--primary-light))] hover:text-white font-semibold transition-colors inline-flex items-center gap-1 group"
            >
              Sign in
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <p className="text-xs font-semibold text-white mb-2">What you'll get:</p>
          <ul className="text-xs text-white/60 space-y-1">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-[hsl(var(--success))]" />
              Unlimited properties & tenants
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-[hsl(var(--success))]" />
              Payment tracking & analytics
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-[hsl(var(--success))]" />
              Maintenance management
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Receipt, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  LogIn,
  UserPlus,
  ArrowLeft,
  Salad,
  Wallet,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCategory, User } from '../types';
import { api, setCurrentUser } from '../services/api';
import logoImg from '../assets/images/expense_insight_logo_1788227161800.jpg';

interface AuthPageProps {
  onSuccess?: (user: User) => void;
  onLoginSuccess?: (user: User) => void;
  initialIsRegister?: boolean;
  onBackToHome?: () => void;
  onExplorePublicLanding?: () => void;
  onOpenAdmin?: () => void;
}

const AVAILABLE_CATEGORIES: ProductCategory[] = [
  'Grocery',
  'Clothing',
  'Food & Health',
  'Beauty & Personal Care',
  'Electronics',
  'Home & Household',
  'Books & Education'
];

export const AuthPage: React.FC<AuthPageProps> = ({ 
  onSuccess, 
  onLoginSuccess, 
  initialIsRegister = true,
  onOpenAdmin 
}) => {
  // Default to Create Account (Register) mode
  const [isRegister, setIsRegister] = useState<boolean>(initialIsRegister !== false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof initialIsRegister === 'boolean') {
      setIsRegister(initialIsRegister);
    }
  }, [initialIsRegister]);

  // Auth callback helper
  const completeAuth = (user: User) => {
    if (onSuccess) {
      onSuccess(user);
    } else if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regMonthlyBudget, setRegMonthlyBudget] = useState('');
  const [regCategories] = useState<ProductCategory[]>([
    'Grocery',
    'Clothing',
    'Food & Health',
    'Beauty & Personal Care',
    'Electronics',
    'Home & Household',
    'Books & Education'
  ]);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !loginPassword) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.login({ email: cleanEmail, password: loginPassword });
      setInfoMsg('Login successful! Loading your dashboard...');
      completeAuth(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email & password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanEmail || !regPassword) {
      setErrorMsg('Please complete all required fields (*).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const budgetNum = regMonthlyBudget.trim() ? (parseFloat(regMonthlyBudget) || 10000) : 10000;
      const { user } = await api.register({
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        monthlyBudget: budgetNum,
        preferredCategories: regCategories
      });
      setInfoMsg('Account created successfully! Loading your dashboard...');
      completeAuth(user);
    } catch (err: any) {
      if (err?.message && err.message.toLowerCase().includes('already exists')) {
        try {
          const { user } = await api.login({ email: cleanEmail, password: regPassword });
          setInfoMsg('Account verified! Welcome back, logging you in...');
          completeAuth(user);
          return;
        } catch (loginErr: any) {
          setErrorMsg('An account with this email address already exists. Please login with your password.');
          return;
        }
      }
      setErrorMsg(err.message || 'Registration could not be completed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const targetEmail = loginEmail.trim();
    if (!targetEmail) {
      setErrorMsg('Please enter your email address in the field above first.');
      return;
    }
    setErrorMsg(null);
    setInfoMsg(`Password reset instructions have been dispatched to ${targetEmail}. (Academic Simulation)`);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans transition-colors">
      
      {/* Subtle Ambient Website Emerald & Teal Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* Top Right Ambient Glow */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            x: [0, 10, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-28 -right-28 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl"
        />

        {/* Bottom Left Ambient Glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -15, 0],
            y: [0, 15, 0]
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-32 -left-32 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] rounded-full bg-teal-500/15 dark:bg-teal-500/10 blur-3xl"
        />

        {/* Bottom Right Subtle Glow */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            x: [0, 15, 0],
            y: [0, -12, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-emerald-600/10 dark:bg-emerald-600/5 blur-3xl"
        />

        {/* Top Left Subtle Ambient */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-2xl"
        />

        {/* Gentle Ambient Glow in Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Authentic 2-Column Floating Canvas matching Website Theme */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[2.25rem] shadow-xl shadow-emerald-950/5 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[620px]"
      >

        {/* LEFT COLUMN: Modern Aesthetic Brand Showcase Banner */}
        <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950/60 p-8 sm:p-12 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
          
          {/* Decorative Subtle Pattern in Left Box */}
          <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:18px_18px]" />

          <div className="relative z-10 flex flex-col items-center max-w-sm">
            
            {/* Square App Icon with Soft Shadow matching Website Theme */}
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.25rem] bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 p-1.5 shadow-lg shadow-emerald-900/15 flex items-center justify-center mb-6 cursor-pointer"
            >
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 p-1 flex items-center justify-center">
                <img 
                  src={logoImg} 
                  alt="Expense Insight Hub" 
                  className="w-full h-full object-cover rounded-[1.8rem]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Brand Title: Expense Insight Hub (Website Gradient) */}
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-zinc-900 dark:text-white leading-tight">
              Expense <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Insight</span> Hub
            </h1>

            {/* Tagline */}
            <p className="mt-2 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide">
              Track • Analyze • Optimize Spending
            </p>

            {/* Subtle Divider Pill */}
            <div className="w-12 h-1 bg-emerald-600 rounded-full my-4" />

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Smart receipt scanning, automated category intelligence, and personalized budget control.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form (Create Account with Budget Field & Login) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto">
            
            {/* Dynamic Title based on Active View */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
                {isRegister ? 'Create Account' : 'Login Account'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {isRegister 
                  ? 'Set up your profile, monthly budget, and start tracking.' 
                  : 'Welcome back. Sign in to continue managing your expenses.'}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info / Success Message */}
            <AnimatePresence>
              {infoMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
                >
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{infoMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* VIEW A: CREATE ACCOUNT FORM (Requested with Budget Field)    */}
            {/* ============================================================ */}
            {isRegister ? (
              <form onSubmit={handleRegister} className="space-y-3.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <UserIcon className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monthly Shopping Budget (Styled like other form fields) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Monthly Shopping Budget (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 15000"
                      value={regMonthlyBudget}
                      onChange={(e) => setRegMonthlyBudget(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <Wallet className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Primary Submit Button matching website emerald styling */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Login Form */}
                <div className="pt-3 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Already have an Account?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Login Account</span>
                  </button>
                </div>

              </form>
            ) : (
              
              /* ============================================================ */
              /* VIEW B: LOGIN ACCOUNT FORM                                    */
              /* ============================================================ */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white text-sm outline-none transition-all placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Login Button matching website emerald styling */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Create Account */}
                <div className="pt-4 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Don't Have an Account?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Create Account</span>
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </motion.div>

    </div>
  );
};

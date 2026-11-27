import React from 'react';
import { 
  Camera, 
  Sparkles, 
  Receipt, 
  TrendingUp, 
  Salad, 
  MapPin, 
  Lightbulb, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Code2
} from 'lucide-react';
import { Logo } from '../components/Logo';

interface PublicLandingPageProps {
  onOpenAuth: (isRegister?: boolean) => void;
  onQuickDemo: () => void;
  onOpenAdmin?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onOpenAuth, onQuickDemo, onOpenAdmin }) => {
  const features = [
    {
      icon: Receipt,
      color: 'emerald',
      title: 'AI Receipt OCR',
      desc: 'Converts thermal bills, handwritten invoices, and supermarket receipts into structured JSON data in seconds.'
    },
    {
      icon: TrendingUp,
      color: 'teal',
      title: 'Expense Analytics',
      desc: 'Track spending by day, week, month, and category. Get automated notifications when spending spikes.'
    },
    {
      icon: Salad,
      color: 'green',
      title: 'Health & Nutrition Insights',
      desc: 'Automatic dietary evaluation for every grocery item. Categorizes into healthy staples, portion limits, and sugary drinks.'
    },
    {
      icon: TrendingUp,
      color: 'cyan',
      title: 'Purchase Frequency Tracking',
      desc: 'Spot repetitive grocery habits, recurring impulse snacks, and restock intervals with proactive warnings.'
    },
    {
      icon: MapPin,
      color: 'amber',
      title: 'Nearby Store Finder',
      desc: 'Find top-rated nearby grocers, pharmacies, and clothing stores aligned with your shopping history with 1 click.'
    },
    {
      icon: Lightbulb,
      color: 'purple',
      title: 'Smart AI Suggestions',
      desc: 'Get hyper-personalized recommendations combining your monthly budget limits, diet balance, and frequent buys.'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors">
      
      {/* Top Navbar */}
      <nav className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-3">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
                title="Admin Control Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => onOpenAuth(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Login
            </button>

            <button
              onClick={() => onOpenAuth(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all hover:scale-105"
            >
              Register Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-2xl text-left space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI-Powered Shopping Receipt & Expense Analyzer</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.1]">
            Scan Your Receipts. <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Understand Your Spending.
            </span> <br />
            Shop Smarter.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            Upload or photograph your shopping receipts. AI extracts every product, categorizes expenses, tracks purchase frequency, and delivers actionable budget & nutrition intelligence.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>🚀 Get Started Free</span>
            </button>

            <button
              onClick={() => onOpenAuth(false)}
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-bold text-sm shadow-xs transition-all hover:scale-105"
            >
              <span>Sign In</span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-4">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>99.4% OCR Extraction Precision</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span>No Medical Advice • Nutrition Education Only</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Graphic Card */}
        <div className="w-full lg:w-96 rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-emerald-900/10 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                🧾
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">ABC Supermarket</p>
                <p className="text-[10px] text-zinc-400">REC-10234 • 24 Aug 2026</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹1,490</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
              <span>Basmati Rice (5kg)</span>
              <span className="font-bold">₹500 <span className="text-[10px] text-emerald-500">🟢</span></span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
              <span>Fresh Cow Milk (2L)</span>
              <span className="font-bold">₹120 <span className="text-[10px] text-emerald-500">🟢</span></span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
              <span>Digestive Biscuits</span>
              <span className="font-bold">₹90 <span className="text-[10px] text-amber-500">🟡</span></span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
              <span>Chilled Cola (2x)</span>
              <span className="font-bold">₹80 <span className="text-[10px] text-rose-500">🔴</span></span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
            ✨ AI Insight: <strong>3 Healthy staples detected</strong>. Sugar soda purchases flagged for monthly quota.
          </div>
        </div>
      </section>

      {/* FEATURE CARDS GRID */}
      <section className="px-6 py-16 bg-white dark:bg-zinc-900 border-t border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Everything You Need To Shop Smarter
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Transforming messy paper slips into transparent financial records and dietary awareness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 hover:border-emerald-500 transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
                    {f.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
          Ready to Experience Expense Insight Hub?
        </h2>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto">
          Intelligent receipt recognition, automatic expense budgeting, and instant nutritional breakdown.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onOpenAuth(false)}
            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
            © 2026 Expense Insight Hub. All Rights Reserved. | Design by NMC
          </p>
        </div>
      </footer>

    </div>
  );
};

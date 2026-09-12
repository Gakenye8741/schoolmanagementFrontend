import { Navbar } from '../components/Navbar';
import { 
  Check, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Building2, 
  GraduationCap,
  Calendar,
  Layers,
  Clock,
  Plus,
   BookOpen,
  Users,
  Award,
  CheckCircle2,
  FileText,
  DollarSign,
  UserCheck,
  BellRing,
  School
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { Footer } from '../components/Footer';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'term' | 'annual' | 'semester'>('term');

  const plans = [
    {
      name: "Starter School",
      tagline: "Perfect for small day schools or primary schools starting out with simple digital management.",
      prices: {
        term: "15,000",
        annual: "40,000",
        semester: "22,000"
      },
      badge: "Essential",
      popular: false,
      capacity: "Up to 250 Students",
      features: [
        "Up to 250 Active Students Database",
        "Student Admission & Digital Records",
        "Simple Fee Tracking & Instant Receipts",
        "Teacher Grade Entry & Report Cards",
        "Admin & Teacher Login Portals",
        "Standard Email Support",
        "Daily Automated Data Backups"
      ],
      cta: "Contact Us to Join",
      ctaLink: "/contact"
    },
    {
      name: "Professional Cloud",
      tagline: "Our most popular package for growing schools wanting complete digital transformation.",
      prices: {
        term: "35,000",
        annual: "95,000",
        semester: "52,000"
      },
      badge: "Most Popular",
      popular: true,
      capacity: "Up to 1,000 Students",
      features: [
        "Up to 1,000 Active Students Database",
        "Everything included in Starter School",
        "Advanced Fee Management & M-Pesa Tracking",
        "Automated Parent SMS & Email Alerts",
        "Class Timetable & Schedule Planner",
        "Student Discipline & Incident Records",
        "Student, Parent & Teacher Portals",
        "Priority 24/7 Support & Staff Training"
      ],
      cta: "Contact Us to Join",
      ctaLink: "/contact"
    },
    {
      name: "Enterprise Institution",
      tagline: "Built for large schools, boarding setups, or institutions with multiple campuses.",
      prices: {
        term: "65,000",
        annual: "180,000",
        semester: "98,000"
      },
      badge: "Unlimited",
      popular: false,
      capacity: "Unlimited Students & Staff",
      features: [
        "Unlimited Students & Staff Members",
        "Everything included in Professional Cloud",
        "Multi-Campus & Branch Control",
        "Custom Domain & School Branding",
        "Advanced Financial & Academic Reports",
        "Dedicated Account Manager",
        "On-site Staff Training & Setup",
        "Custom API System Integrations"
      ],
      cta: "Contact Us to Join",
      ctaLink: "/contact"
    }
  ];

  const addOns = [
    {
      title: "SMS Parent Notification Bundle",
      description: "Direct gateway integration to send automated fee balances, meeting notices, and exam results straight to parents via SMS.",
      price: "KES 3,500 / term",
      badge: "Communication"
    },
    {
      title: "Advanced Data Migration Service",
      description: "Let our tech team safely move your old records from Excel sheets or paper books into ElimuCloud without any data loss.",
      price: "KES 5,000 (One-off)",
      badge: "Onboarding"
    },
    {
      title: "Custom Domain Branding",
      description: "Run your portal on your own school web address (e.g., portal.yourschool.ac.ke) with a secure SSL certificate.",
      price: "KES 6,000 / year",
      badge: "Branding"
    }
  ];

  const faqs = [
    {
      question: "Do we have to pay these prices right now?",
      answer: "No! Right now we are testing the system for free. You will not pay anything while testing with us."
    },
    {
      question: "When will we start paying?",
      answer: "Payment will only start later when we officially launch. Schools that help us test now will get special discounts."
    },
    {
      question: "How do we get an account to test?",
      answer: "Schools cannot register themselves. You just contact us, and our super admin will create your school account and give you your login details."
    },
    {
      question: "Is our school data safe?",
      answer: "Yes, your data is fully secure and backed up safely every single day."
    }
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      <Navbar />
      
      <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content animate-fadeIn">
        
        {/* Hero Section */}
        <section className="relative pt-28 pb-12 lg:pt-36 lg:pb-16 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100">
          {/* Background Decorative Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Hero Content */}
              <div className="lg:col-span-12 lg:text-center space-y-5 max-w-4xl mx-auto">
                
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                  Our Packages, <span className="text-primary underline decoration-primary/30 underline-offset-8">Free During Testing</span>
                </h1>
                
                <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto font-medium">
                  Check out our packages below. Everything is completely free right now while we test the system with schools.
                </p>

              </div>

            </div>
          </div>
        </section>

        {/* Detailed System Overview / Value Strip */}
        <section className="py-10 bg-base-100 border-b border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-base-200/40 border border-base-300 flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-base-content">All-in-One Cloud</h3>
                <p className="text-xs text-base-content/70">Fees, exams, attendance & records in one dashboard.</p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/40 border border-base-300 flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-base-content">Multi-Portal Access</h3>
                <p className="text-xs text-base-content/70">Dedicated secure portals for admins, teachers, and parents.</p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/40 border border-base-300 flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-base-content">Automated Grading</h3>
                <p className="text-xs text-base-content/70">Instant report cards and performance analytics generated fast.</p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/40 border border-base-300 flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-base-content">Zero Risk Testing</h3>
                <p className="text-xs text-base-content/70">Test everything freely with no payment required today.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards Grid Section with Billing Cycle Toggle Placed Directly Above */}
        <section className="py-16 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Choose Your Plan
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Transparent School Packages
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Select the ideal capacity for your campus. Everything is completely free right now during our system testing phase.
              </p>

              {/* Billing Cycle Multi-Toggle placed right above the plans */}
              <div className="pt-2 flex flex-wrap justify-center items-center gap-2 sm:gap-3 bg-base-100 backdrop-blur-md p-2 rounded-2xl max-w-md mx-auto border border-base-300 shadow-sm">
                <button
                  onClick={() => setBillingCycle('term')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    billingCycle === 'term' 
                      ? 'bg-primary text-primary-content shadow-md scale-105' 
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Termly Plan
                </button>

                <button
                  onClick={() => setBillingCycle('semester')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    billingCycle === 'semester' 
                      ? 'bg-primary text-primary-content shadow-md scale-105' 
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <Clock className="w-4 h-4" /> Semester Plan
                </button>

                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 relative ${
                    billingCycle === 'annual' 
                      ? 'bg-primary text-primary-content shadow-md scale-105' 
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Yearly Plan 
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-extrabold tracking-wider shadow animate-bounce">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, index) => (
                <div 
                  key={index} 
                  className={`bg-base-100 p-8 sm:p-10 rounded-3xl shadow-xl border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl relative overflow-hidden group ${
                    plan.popular 
                      ? 'border-primary ring-2 ring-primary/50 shadow-2xl scale-[1.02] bg-gradient-to-b from-base-100 via-base-100 to-primary/5' 
                      : 'border-base-300'
                  }`}
                >
                  {/* Subtle top border illumination on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-extrabold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider inline-block">
                          {plan.badge}
                        </span>
                        <span className="text-xs font-bold text-base-content/60 bg-base-200 px-2.5 py-1 rounded-lg">
                          {plan.capacity}
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold group-hover:text-primary transition-colors">{plan.name}</h3>
                      <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed min-h-[40px]">{plan.tagline}</p>
                    </div>

                    <div className="py-4 border-y border-base-200 transition-all duration-300">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-base-content/40 line-through">
                          KES {billingCycle === 'term' ? plan.prices.term : billingCycle === 'semester' ? plan.prices.semester : plan.prices.annual}
                        </span>
                        <span className="text-3xl sm:text-4xl font-black text-primary transition-all duration-300">
                          FREE
                        </span>
                        <span className="text-xs text-emerald-600 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                          Pilot Access
                        </span>
                      </div>
                      <p className="text-[11px] text-base-content/50 mt-1">Prices shown above will only apply after the testing period.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">Package Features:</p>
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-start gap-3 text-sm text-base-content/80 group/feat">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover/feat:bg-primary group-hover/feat:text-primary-content transition-colors">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 mt-8 border-t border-base-200">
                    <Link 
                      to={plan.ctaLink} 
                      className={`btn w-full rounded-2xl text-base font-bold shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${
                        plan.popular 
                          ? 'btn-primary shadow-primary/20 hover:shadow-xl' 
                          : 'btn-outline border-base-300 hover:bg-base-200'
                      }`}
                    >
                      {plan.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Detailed Package Breakdown & Feature Matrix */}
        <section className="py-20 bg-base-100 border-b border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Deep Dive
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Detailed Package Breakdown
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Explore exactly what module capabilities and operational tools are included across each tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Starter Details */}
              <div className="bg-base-200/40 p-8 rounded-3xl border border-base-300 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <School className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold">Starter School Breakdown</h3>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    Designed specifically to replace scattered registers and traditional paperwork with a clean cloud database.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-base-300/60">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Admission & Records</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Manage up to 250 student profiles, parent contacts, and admission numbers effortlessly.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Basic Fee Collection</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Track student fee balances and generate printable cash or bank-slip receipts instantly.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Teacher Grading Portal</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Teachers can log in, input termly exam scores, and compile neat report cards.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-base-200/40 p-8 rounded-3xl border-2 border-primary/50 shadow-lg space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Full Suite
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-bold shadow-md">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold">Professional Cloud Breakdown</h3>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    Our flagship setup equipped with automated parent communication and advanced financial workflows.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-base-300/60">
                  <div className="flex items-start gap-3">
                    <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Automated Parent Alerts</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Instantly dispatch fee balance reminders, urgent school announcements, and exam notices.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Timetable & Discipline</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Organize master school schedules and maintain digital incident tracking logs securely.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Triple Portal Access</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Separate custom dashboards built specifically for Administrators, Teachers, and Parents.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise Details */}
              <div className="bg-base-200/40 p-8 rounded-3xl border border-base-300 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold">Enterprise Institution Breakdown</h3>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    Engineered for large boarding schools and multi-branch educational networks requiring custom controls.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-base-300/60">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Multi-Campus Control</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Oversee multiple branches or distinct school sections under a single unified master admin login.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Custom Domain & Branding</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Run your software on your own custom web address with dedicated institutional color themes.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Dedicated Support & Setup</h4>
                      <p className="text-xs text-base-content/60 mt-0.5">Assigned account manager, on-site staff training sessions, and priority custom feature integrations.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Optional Add-on Packages Grid Section */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Custom Enhancements
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Optional Add-on Modules
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Extra add-on features (currently free for schools testing with us).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {addOns.map((addon, aIndex) => (
                <div 
                  key={aIndex} 
                  className="bg-base-200/50 p-8 rounded-3xl shadow-xl border border-base-300 flex flex-col justify-between hover:shadow-2xl transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                        {addon.badge}
                      </span>
                      <div className="w-8 h-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-extrabold">
                      {addon.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                      {addon.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-base-300/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-base-content/50 line-through block">{addon.price}</span>
                      <span className="text-xs font-extrabold text-emerald-600">Free in Pilot</span>
                    </div>
                    <Link to="/contact" className="text-xs font-bold hover:underline flex items-center gap-1 text-primary">
                      Contact Us <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Security & Trust Banner Section */}
        <section className="py-16 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-base-content">Bank-Grade Security</h4>
                  <p className="text-xs text-base-content/70 mt-0.5">Encrypted records & daily backups.</p>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-base-content">No Billing During Testing</h4>
                  <p className="text-xs text-base-content/70 mt-0.5">Zero charges while in pilot phase.</p>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-base-content">Direct Support</h4>
                  <p className="text-xs text-base-content/70 mt-0.5">Assistance directly from the developer.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions Section */}
        <section className="py-20 bg-base-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Everything you need to know about testing with us.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-base-200/50 border border-base-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-base font-extrabold text-base-content flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" /> {faq.question}
                  </h3>
                  <p className="text-sm text-base-content/70 mt-3 pl-7 leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              {/* Background blur effects */}
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Building2 className="w-3.5 h-3.5" /> Want to Test Our System in Your School?
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Ready to Upgrade Your School Experience?
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Contact us today. Schools cannot register themselves; our super admin will create your account for you.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <Link 
                  to="/contact" 
                  className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Contact Us to Join
                </Link>
                <Link 
                  to="/login" 
                  className="btn btn-outline text-primary-content border-white/40 hover:bg-white/10 btn-lg rounded-2xl font-bold px-8"
                >
                  Sign In to Portal
                </Link>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default PricingPage;
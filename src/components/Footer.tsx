import { 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Clock, 
  ArrowRight, 
  ChevronUp,
  GraduationCap,
 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-base-300 bg-base-100 text-base-content pt-12 sm:pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
        
        {/* Brand & About Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-base-content block">ElimuCloud</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Smart Institutional Suite</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
            Empowering schools and educational academies with modern administration workflows, automated financial tracking, and secure multi-tenant cloud operations.
          </p>
        </div>

        {/* Quick Links Column (from router paths) */}
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-primary">Quick Navigation</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-base-content/70 font-medium">
            <li>
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Home Portal
              </Link>
            </li>
            <li>
              <Link to="/features" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Features & Capabilities
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Pricing Plans
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Contact Support
              </Link>
            </li>
            <li>
              <Link to="/legal" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Legal &amp; Trust
              </Link>
            </li>
            <li>
              <Link to="/LOgin" className="hover:text-primary transition-colors flex items-center gap-1.5 py-0.5">
                <ArrowRight size={12} className="shrink-0" /> Secure Sign In
              </Link>
            </li>
          </ul>
        </div>

        {/* Direct Contact Details Column */}
        <div className="space-y-4 lg:col-span-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-primary">Direct Contact &amp; Hours</h4>
          <p className="text-xs sm:text-sm text-base-content/70">
            Have questions about testing ElimuCloud in your school? Get in touch with our team directly.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm text-base-content/80 font-medium">
            <div className="flex items-start gap-2.5">
              <Phone size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-base-content/50 font-bold">Phone Support</span>
                <a href="tel:+254789757457" className="hover:text-primary transition-colors">+254 789 757 457</a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-base-content/50 font-bold">Email Address</span>
                <a href="mailto:support@elimucloud.co.ke" className="hover:text-primary transition-colors">support@elimucloud.co.ke</a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-base-content/50 font-bold">Location</span>
                <span>Nairobi / Nyeri, Kenya</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-base-content/50 font-bold">Working Hours</span>
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Strip & Scroll-to-Top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 border-t border-base-300/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/60 text-center sm:text-left">
        <p>&copy; {new Date().getFullYear()} ElimuCloud. All rights reserved.</p>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <p className="flex items-center gap-1 font-medium">
            Engineered with <Heart size={14} className="text-error fill-error shrink-0" /> for Educational Excellence
          </p>
          
          <button 
            onClick={scrollToTop}
            className="btn btn-circle btn-sm btn-primary text-primary-content shadow-md transition-transform hover:scale-110 shrink-0"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};
import { Navbar } from '../components/Navbar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Building2, 
  Clock, 
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';

const ContactPage = () => {
  usePageSeo({
    title: "Contact ElimuCloud | Institutional Support & Engineering Inquiries",
    description: "Get in touch with the ElimuCloud team for platform demonstrations, institutional onboarding, or technical support. Engineered by full-stack developer Brian Gakenye Ndiritu.",
    keywords: "contact ElimuCloud, school software support Kenya, institutional software demo, Brian Gakenye Ndiritu, ElimuCloud helpdesk"
  });
  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    email: '',
    phone: '',
    studentCount: '',
    urgency: 'Normal (Within a week)',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Message sent successfully! Our super admin will reach out to set up your school account.");
      setFormData({
        schoolName: '',
        contactPerson: '',
        email: '',
        phone: '',
        studentCount: '',
        urgency: 'Normal (Within a week)',
        message: ''
      });
    }, 1200);
  };

  const supportChannels = [
    {
      title: "Direct Admin Desk",
      desc: "For urgent onboarding and pilot deployment queries.",
      contact: "+254 789 757 457",
      icon: <Phone className="w-5 h-5 text-primary" />
    },
    {
      title: "Technical Support",
      desc: "For system configuration, role access, and portal assistance.",
      contact: "support@elimucloud.co.ke",
      icon: <Mail className="w-5 h-5 text-primary" />
    },
    {
      title: "Field Operations",
      desc: "Based in Nairobi & Nyeri for physical institutional visits.",
      contact: "Mon - Sat: 8:00 AM - 6:00 PM",
      icon: <Clock className="w-5 h-5 text-primary" />
    }
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="h-16"></div>

      <div className="min-h-[calc(100vh-4rem)] bg-base-100 text-base-content pb-24 overflow-hidden font-sans">
        
        {/* Top Header Section matching Pricing/About style */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100 border-b border-base-300">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              
             
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                Get in Touch to Join Our <span className="text-primary underline decoration-primary/30 underline-offset-8">Testing Cohort</span>
              </h1>
              
              <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto font-medium">
                Schools cannot register themselves. Reach out to us below, and our super admin will set up your school account and provide your login details.
              </p>

            </div>
          </div>
        </section>

        {/* Support Channels Grid Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-10 relative z-20 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel, cIdx) => (
              <div key={cIdx} className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  {channel.icon}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-base-content">{channel.title}</h4>
                  <p className="text-xs text-base-content/70 mt-0.5 leading-relaxed">{channel.desc}</p>
                  <p className="text-xs font-bold text-primary mt-2">{channel.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Info Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-base-100 border border-base-300 rounded-3xl p-8 shadow-xl space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider inline-block">
                    Direct Contact
                  </span>
                  <h3 className="text-2xl font-extrabold text-base-content">Contact Information</h3>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    Have questions about testing ElimuCloud in your school? Get in touch with our team directly.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Phone Support</p>
                      <p className="text-sm font-semibold text-base-content mt-0.5">+254 789 757 457</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-semibold text-base-content mt-0.5">support@elimucloud.co.ke</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Location</p>
                      <p className="text-sm font-semibold text-base-content mt-0.5">Nairobi / Nyeri, Kenya</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Working Hours</p>
                      <p className="text-sm font-semibold text-base-content mt-0.5">Mon - Sat: 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-base-200">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs text-base-content/80 leading-relaxed">
                    <span className="font-bold text-primary block mb-1">Important Note:</span>
                    Schools cannot self-register. Contact us using this form to request your school admin account setup.
                  </div>
                </div>

                <div className="bg-base-200/50 border border-base-300 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> Secure Onboarding
                  </div>
                  <p className="text-xs text-base-content/70 leading-relaxed">
                    Every pilot school is provisioned with a secure, isolated database instance ensuring absolute privacy and data integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-2">
              <div className="bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-10 shadow-xl">
                <div className="space-y-2 mb-8">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider inline-block">
                    Send a Message
                  </span>
                  <h3 className="text-2xl font-extrabold text-base-content">Request School Account Setup</h3>
                  <p className="text-xs text-base-content/70">
                    Fill out the form below with your school details and our super admin will create your portal credentials.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">School Name</label>
                      <input 
                        type="text" 
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Fountain Junior School" 
                        className="input input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Contact Person Name</label>
                      <input 
                        type="text" 
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Mr. James Mwangi (Principal)" 
                        className="input input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="e.g. principal@school.ac.ke" 
                        className="input input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g. +254712345678" 
                        className="input input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Estimated Student Population</label>
                      <input 
                        type="text" 
                        name="studentCount"
                        value={formData.studentCount}
                        onChange={handleChange}
                        placeholder="e.g. 350 Students" 
                        className="input input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Onboarding Urgency</label>
                      <select 
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        className="select select-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
                      >
                        <option>Immediate (Urgent Pilot Setup)</option>
                        <option>Normal (Within a week)</option>
                        <option>Exploring / Planning for Next Term</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Message / Details</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us about your school size (number of students) and when you would like to start testing ElimuCloud..." 
                      className="textarea textarea-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors text-sm leading-relaxed resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn btn-primary w-full rounded-xl text-base font-semibold shadow-md gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>Sending Message...</>
                    ) : (
                      <>Send Setup Request <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Call to Action matching Pricing style */}
        <section className="pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Building2 className="w-3.5 h-3.5" /> Already Have Your Login Credentials?
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Sign In to Your Administration Portal
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Access your school management dashboard to handle student records, fee receipts, and term reports.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <Link 
                  to="/login" 
                  className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Sign In to Portal
                </Link>
              </div>

            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
};

export default ContactPage;
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Shield, Lock, Database, Server, FileText, CheckCircle, HelpCircle, UserCheck } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export const LegalHubPage = () => {
  usePageSeo({
    title: "Terms of Service & Privacy Policy | ElimuCloud",
    description: "Review ElimuCloud's terms of service, data privacy commitments, and institutional compliance standards. Engineered by full-stack developer Brian Gakenye Ndiritu.",
    keywords: "ElimuCloud legal, terms of service, privacy policy, school software compliance Kenya, data protection act Kenya, Brian Gakenye Ndiritu"
  });
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-base-100 text-base-content pt-24 pb-24">
        
        {/* Header Banner matching Pricing/Contact style */}
        <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100 border-b border-base-300 mb-12">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20 shadow-sm">
                <Shield className="w-4 h-4" /> Enterprise Security & Compliance
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                Trust, Security &amp; <span className="text-primary underline decoration-primary/30 underline-offset-8">Legal Hub</span>
              </h1>
              
              <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto font-medium">
                Transparency, institutional compliance, and enterprise-grade data protection are the core pillars of ElimuCloud. Review our comprehensive legal agreements, security frameworks, and governance protocols below.
              </p>

            </div>
          </div>
        </section>

        {/* Combined Legal & Compliance Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* 1. Privacy Policy Section */}
          <section id="privacy" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Data Protection &amp; Privacy</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Privacy Policy</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Effective Date: September 1, 2026 | Version 2.4</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-base-content/80 leading-relaxed">
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">1. Introduction and Scope</h3>
                <p>
                  ElimuCloud (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of educational institutions, administrators, teachers, parents, and students. This Privacy Policy outlines how we collect, process, store, and safeguard institutional data across our multi-tenant cloud platform.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">2. Information We Collect</h3>
                <p className="mb-3">To provide comprehensive school management services, we process several categories of information:</p>
                <ul className="space-y-2.5">
                  <li className="bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <strong className=" block text-xs uppercase tracking-wider text-primary mb-0.5">Institutional Data</strong>
                    School names, physical addresses, contact emails, administrative telephone numbers, branch identifiers, and institutional crest/logo binaries.
                  </li>
                  <li className="bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <strong className=" block text-xs uppercase tracking-wider text-primary mb-0.5">User Account Data</strong>
                    Names, securely hashed authentication credentials (Argon2/Bcrypt), assigned privilege tiers (Super Admin, School Admin, Teacher, Student, Parent), and last login IP auditing timestamps.
                  </li>
                  <li className="bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <strong className=" block text-xs uppercase tracking-wider text-primary mb-0.5">Academic &amp; Operational Records</strong>
                    Student admission numbers, guardian contact numbers, daily attendance logs, continuous assessment marks, term exam grades, disciplinary records, and generated report card archive snapshots.
                  </li>
                  <li className="bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <strong className=" block text-xs uppercase tracking-wider text-primary mb-0.5">Financial Transaction Logs</strong>
                    Fee structure brackets, student ledger entries, payment reference codes, mobile money transaction metadata, and outstanding fee balance histories.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">3. How We Use Collected Information</h3>
                <p>
                  All data processed within ElimuCloud is strictly utilized for authorized institutional administrative functions. This includes generating academic report cards, tracking fee balances, sending automated parent absence alerts, coordinating timetables, and maintaining secure role-based portals. We never sell, lease, or monetize institutional data to third-party advertisers.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">4. Data Retention &amp; Deletion</h3>
                <p>
                  Institutional data is retained for the active duration of the subscribing school&apos;s agreement. Upon contract termination or formal request, schools may execute a complete export of their database records in standard structured formats (CSV/JSON/PDF), followed by secure purging of all tenant records from our primary cloud database cluster within 30 calendar days.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">5. Contact Our Data Protection Officer</h3>
                <p>
                  If you have questions regarding data compliance, privacy practices, or wish to exercise data rights, reach out to our compliance department at <a href="mailto:support@elimucloud.co.ke" className="text-primary font-bold underline">support@elimucloud.co.ke</a> or call <span className="text-primary font-bold">+254 789 757 457</span>.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Terms of Service Section */}
          <section id="terms" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Legal Agreement</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Terms of Service</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Effective Date: September 1, 2026</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-base-content/80 leading-relaxed">
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing, registering, or deploying ElimuCloud for your educational institution, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a school or educational board, you warrant that you possess the legal authority to bind that institution.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">2. Institutional Data Ownership</h3>
                <p>
                  Your school retains 100% intellectual property ownership and absolute custody of all data, records, student rosters, and administrative files uploaded into ElimuCloud. ElimuCloud claims no ownership rights over your institutional content.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">3. User Accounts and Security Obligations</h3>
                <p>
                  School administrators are solely responsible for maintaining the confidentiality of their administrative credentials. Unauthorized privilege escalation attempts, sharing of Super Admin access keys, or intentional bypass of role-based authorization guards will result in immediate account suspension and review.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">4. Service Availability and Uptime</h3>
                <p>
                  We commit to maintaining a target cloud uptime of 99.9%. Routine system updates, schema migrations, and database maintenance are scheduled during off-peak hours (midnight to 4:00 EAT) with advance notifications dispatched to institutional administrators.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">5. Limitation of Liability</h3>
                <p>
                  ElimuCloud is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. While we enforce rigorous automated backups and secure cloud infrastructure, we shall not be held liable for indirect, incidental, or consequential damages resulting from user error, local school network outages, or unapproved third-party integrations.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Security Architecture Section */}
          <section id="security" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Infrastructure &amp; Compliance</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Security Architecture</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Enterprise-grade protection safeguards for sensitive academic records</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-base-content/80 leading-relaxed">
              <p>
                At ElimuCloud, safeguarding student records and financial ledgers is paramount. Our cloud engineering model relies on defense-in-depth principles across every tier of the application stack.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">PostgreSQL &amp; Drizzle ORM Security</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  We utilize robust ORM schema validation and strictly parameterized queries to neutralize SQL injection vulnerabilities and protect database integrity against malicious inputs.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Server size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">Strict Multi-Tenant Isolation</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Institutional partitions are enforced at the database query level using organization scoping (`org_id` filters), guaranteeing that school administrators only access records bound to their specific institution.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">Role-Based Access Control (RBAC)</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Granular permission checks separate duties cleanly across Super Admins, School Admins, Teachers, Students, and Parents, preventing unauthorized module access and privilege escalation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-success">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">TLS Transport &amp; Encrypted Backups</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  All HTTP traffic is encrypted in transit using TLS protocols. Automated encrypted database snapshots occur daily with off-site redundancy for rapid disaster recovery.
                </p>
              </div>
            </div>
          </section>

          {/* 4. FAQ Section */}
          <section id="faq" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <HelpCircle size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Assistance &amp; Guidance</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Frequently Asked Questions</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Comprehensive answers for administrators, teachers, and parents</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-base-content/80">
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  How do teachers input and submit term exam marks?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Teachers log into their designated portal using secure credentials, select their assigned class and subject module, and input continuous assessment or final exam scores directly into the grading grid. Averages and professional student report cards compute instantly.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Can parents view fee balances and payment history in real time?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Yes. Once a payment is verified and recorded by the school finance administrator, the institutional ledger updates immediately on the parent portal, accompanied by downloadable digital receipt references.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  How can our school schedule a guided demonstration or pilot test?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  You can reach out directly via phone at <span className="text-primary font-bold">+254 789 757 457</span> or email our support desk at <span className="text-primary font-bold">support@elimucloud.co.ke</span>. Our team will provision a sandbox testing instance tailored specifically to your institution&apos;s structure.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  What happens if our school needs custom report card formats?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  ElimuCloud supports customizable grading templates. School administrators can configure grading weightings, school crests, and principal signature lines directly from the Super Admin settings dashboard.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Call to Action matching Pricing/Contact style */}
        <section className="pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Shield className="w-3.5 h-3.5" /> Compliance Assistance
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Have Specific Legal or Security Inquiries?
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Our compliance team is ready to review your school&apos;s data governance requirements and assist with institutional onboarding agreements.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <a 
                  href="mailto:support@elimucloud.co.ke" 
                  className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Contact Compliance Team
                </a>
              </div>

            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default LegalHubPage;
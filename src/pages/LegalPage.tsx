import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Shield, 
  Lock, 
  Database, 
  Server, 
  FileText, 
  CheckCircle, 
  HelpCircle, 
  UserCheck,
  Globe,
  Cookie,
  Baby,
  KeyRound,
  Users,
  Scale,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Timer,
  CreditCard,
  Ban,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

export const LegalHubPage = () => {
  usePageSeo({
    title: "Terms of Service & Privacy Policy | Academiq",
    description: "Review Academiq's terms of service, data privacy commitments, and institutional compliance standards. Engineered by full-stack developers Brian Gakenye Ndiritu and Brian Ireri.",
    keywords: "Academiq legal, terms of service, privacy policy, school software compliance Kenya, data protection act Kenya, Brian Gakenye Ndiritu, Brian Ireri"
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
                Transparency, institutional compliance, and enterprise-grade data protection are the core pillars of Academiq. Review our comprehensive legal agreements, security frameworks, and governance protocols below.
              </p>

              {/* Quick jump nav */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <a href="#privacy" className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-base-100 border border-base-300 hover:border-primary/40 hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#terms" className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-base-100 border border-base-300 hover:border-primary/40 hover:text-primary transition-colors">Terms of Service</a>
                <a href="#security" className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-base-100 border border-base-300 hover:border-primary/40 hover:text-primary transition-colors">Security Architecture</a>
                <a href="#faq" className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-base-100 border border-base-300 hover:border-primary/40 hover:text-primary transition-colors">FAQ</a>
              </div>

            </div>
          </div>
        </section>

        {/* Combined Legal & Compliance Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* ═══════════════════════════════════════
              1. PRIVACY POLICY
              ═══════════════════════════════════════ */}
          <section id="privacy" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Data Protection &amp; Privacy</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Privacy Policy</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Effective Date: September 1, 2026 | Version 2.4 | Last Updated: January 2026</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-base-content/80 leading-relaxed">
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">1. Introduction and Scope</h3>
                <p>
                  Academiq (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of educational institutions, administrators, teachers, parents, and students. This Privacy Policy outlines how we collect, process, store, and safeguard institutional data across our multi-tenant cloud platform. This policy applies to all users of the Academiq web application, mobile interface, and any connected sub-services.
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
                  <li className="bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <strong className=" block text-xs uppercase tracking-wider text-primary mb-0.5">Technical &amp; Diagnostic Data</strong>
                    Browser type, device class, session duration, error logs, and API request identifiers — collected solely to maintain platform reliability and security.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">3. How We Use Collected Information</h3>
                <p>
                  All data processed within Academiq is strictly utilized for authorized institutional administrative functions. This includes generating academic report cards, tracking fee balances, sending automated parent absence alerts, coordinating timetables, and maintaining secure role-based portals. We never sell, lease, or monetize institutional data to third-party advertisers.
                </p>
              </div>

              {/* NEW: Data Sharing */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">4. Data Sharing &amp; Third-Party Processors</h3>
                <p className="mb-2">
                  We do not sell institutional data. We only share it with vetted sub-processors strictly to operate the platform:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2.5 bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Cloud Hosting Providers</strong> — for storing encrypted databases and serving the web application.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <CreditCard className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Payment &amp; Mobile Money Gateways</strong> — for processing school fee payments securely.</span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-base-200/50 p-3 rounded-xl border border-base-300/60">
                    <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>SMS &amp; Email Delivery Services</strong> — for sending parent alerts and login notifications.</span>
                  </li>
                </ul>
              </div>

              {/* NEW: Cookies */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-primary" /> 5. Cookies &amp; Session Data
                </h3>
                <p>
                  Academiq uses strictly essential cookies and browser localStorage for authentication sessions and theme preferences. We do not use advertising, marketing, or third-party tracking cookies. Users can clear local session data at any time from their browser settings.
                </p>
              </div>

              {/* NEW: Children's Privacy */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-primary" /> 6. Student &amp; Minor Data Protections
                </h3>
                <p>
                  Because our platform serves schools that register minors, we apply heightened safeguards. Student accounts are never directly created by students; they are provisioned by authorized school administrators. Student records are only visible to assigned teachers, parents/guardians, and authorized staff. We do not run analytics on student behavior for marketing purposes of any kind.
                </p>
              </div>

              {/* NEW: User Rights */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> 7. Your Data Rights
                </h3>
                <p className="mb-2">All institutional users have the following rights, exercisable through their school administrator or by contacting us:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-1" /><span><strong>Right to Access</strong> — request a full export of institutional data.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-1" /><span><strong>Right to Correct</strong> — update inaccurate personal or academic records.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-1" /><span><strong>Right to Erasure</strong> — request deletion of records (subject to legal retention requirements).</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-1" /><span><strong>Right to Object</strong> — object to any processing that is not strictly required for school operations.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-1" /><span><strong>Right to Portability</strong> — export records in machine-readable formats (CSV/JSON).</span></li>
                </ul>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">8. Data Retention &amp; Deletion</h3>
                <p>
                  Institutional data is retained for the active duration of the subscribing school&apos;s agreement. Upon contract termination or formal request, schools may execute a complete export of their database records in standard structured formats (CSV/JSON/PDF), followed by secure purging of all tenant records from our primary cloud database cluster within 30 calendar days.
                </p>
              </div>

              {/* NEW: International Transfers */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> 9. International Data Transfers
                </h3>
                <p>
                  Primary data storage is hosted in cloud regions selected to serve Kenyan schools efficiently. If backup copies are stored in secondary regions, we ensure equivalent security guarantees and contractual protections through our cloud provider&apos;s data processing agreements.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">10. Contact Our Data Protection Officer</h3>
                <p>
                  If you have questions regarding data compliance, privacy practices, or wish to exercise data rights, reach out to our compliance department at <a href="mailto:support@academiq.co.ke" className="text-primary font-bold underline">support@academiq.co.ke</a> or call <span className="text-primary font-bold">+254 789 757 457</span>.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════
              2. TERMS OF SERVICE
              ═══════════════════════════════════════ */}
          <section id="terms" className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 scroll-mt-24">
            <div className="border-b border-base-200 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Legal Agreement</span>
                <h2 className="text-2xl sm:text-3xl font-black mt-0.5 text-base-content">Terms of Service</h2>
                <p className="text-xs text-base-content/50 mt-1 font-medium">Effective Date: September 1, 2026 | Version 2.4</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-base-content/80 leading-relaxed">
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing, registering, or deploying Academiq for your educational institution, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a school or educational board, you warrant that you possess the legal authority to bind that institution.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">2. Institutional Data Ownership</h3>
                <p>
                  Your school retains 100% intellectual property ownership and absolute custody of all data, records, student rosters, and administrative files uploaded into Academiq. Academiq claims no ownership rights over your institutional content.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">3. User Accounts and Security Obligations</h3>
                <p>
                  School administrators are solely responsible for maintaining the confidentiality of their administrative credentials. Unauthorized privilege escalation attempts, sharing of Super Admin access keys, or intentional bypass of role-based authorization guards will result in immediate account suspension and review.
                </p>
              </div>

              {/* NEW: Acceptable Use */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-primary" /> 4. Acceptable Use Policy
                </h3>
                <p className="mb-2">The following activities are strictly prohibited across all Academiq portals:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-1" /><span>Uploading malicious files, malware, or scripts into the platform.</span></li>
                  <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-1" /><span>Attempting to access other schools&apos; data or bypass tenant isolation.</span></li>
                  <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-1" /><span>Using the platform for unauthorized commercial messaging or spam.</span></li>
                  <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-1" /><span>Sharing login credentials with third parties who are not authorized staff.</span></li>
                  <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-1" /><span>Reverse-engineering, scraping, or replicating the platform without written consent.</span></li>
                </ul>
              </div>

              {/* NEW: Subscription */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> 5. Subscription, Pilot &amp; Fees
                </h3>
                <p>
                  During the active pilot testing phase, no subscription fees are charged. When commercial rollout begins, subscribing schools will be billed according to their selected plan (Starter, Professional, or Enterprise) on a termly, semester, or annual basis. All fees are quoted in Kenyan Shillings (KES). Failure to renew may result in read-only access until the subscription is settled.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">6. Service Availability and Uptime</h3>
                <p>
                  We commit to maintaining a target cloud uptime of 99.9%. Routine system updates, schema migrations, and database maintenance are scheduled during off-peak hours (midnight to 4:00 EAT) with advance notifications dispatched to institutional administrators.
                </p>
              </div>

              {/* NEW: Termination */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" /> 7. Termination &amp; Account Closure
                </h3>
                <p>
                  Schools may terminate their Academiq account at any time by providing written notice to our support team. Upon termination, data remains available for a 30-day grace period, during which the school can request a complete export. After 30 days, all institutional records are permanently purged from our primary databases and encrypted backups on a rolling basis.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2">8. Limitation of Liability</h3>
                <p>
                  Academiq is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. While we enforce rigorous automated backups and secure cloud infrastructure, we shall not be held liable for indirect, incidental, or consequential damages resulting from user error, local school network outages, or unapproved third-party integrations.
                </p>
              </div>

              {/* NEW: Modifications */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> 9. Modifications to These Terms
                </h3>
                <p>
                  We may update these Terms periodically to reflect changes in law, security best practices, or platform features. Material changes will be communicated via email to registered school administrators at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the revised terms.
                </p>
              </div>

              {/* NEW: Governing Law */}
              <div>
                <h3 className="font-extrabold text-base text-base-content mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> 10. Governing Law
                </h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising from use of the platform shall be resolved through good-faith negotiation, and where necessary, in the courts of competent jurisdiction in Nairobi, Kenya.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════
              3. SECURITY ARCHITECTURE
              ═══════════════════════════════════════ */}
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
                At Academiq, safeguarding student records and financial ledgers is paramount. Our cloud engineering model relies on defense-in-depth principles across every tier of the application stack — from database isolation down to individual session management.
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

              {/* NEW: Password Policy */}
              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <KeyRound size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">Password Hashing Standards</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  All passwords are stored using Argon2/Bcrypt one-way hashing — never in plain text. Even internal engineers cannot view user passwords, ensuring zero exposure in the event of a database compromise.
                </p>
              </div>

              {/* NEW: Session Management */}
              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Timer size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">Secure Session Management</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Authentication uses signed JSON Web Tokens (JWT) with short expiry windows. Sessions auto-expire on inactive accounts, and administrators can manually revoke access for any user instantly from the settings panel.
                </p>
              </div>

              {/* NEW: Audit Logging */}
              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">Full Audit Trail</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Every create, update, and delete action inside the platform is timestamped and attributed to a specific user account. School administrators can review audit logs to detect unusual activity or resolve disputes.
                </p>
              </div>

              {/* NEW: DDoS Protection */}
              <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <h4 className="font-extrabold text-base text-base-content">DDoS &amp; Abuse Mitigation</h4>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Our infrastructure is protected by rate limiting, IP throttling, and cloud-level DDoS mitigation. Suspicious login attempts trigger automatic lockouts and notify the school administrator by email.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════
              4. FAQ
              ═══════════════════════════════════════ */}
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
                  You can reach out directly via phone at <span className="text-primary font-bold">+254 789 757 457</span> or email our support desk at <span className="text-primary font-bold">support@academiq.co.ke</span>. Our team will provision a sandbox testing instance tailored specifically to your institution&apos;s structure.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  What happens if our school needs custom report card formats?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Academiq supports customizable grading templates. School administrators can configure grading weightings, school crests, and principal signature lines directly from the Super Admin settings dashboard.
                </p>
              </div>

              {/* NEW: Data Migration */}
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Can we migrate our existing records from Excel or paper files?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Yes. Our team offers a guided data migration service that imports student rosters, fee histories, and class structures from Excel spreadsheets. Paper records can also be digitized by our onboarding team as part of your setup package.
                </p>
              </div>

              {/* NEW: Devices */}
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  What devices and browsers does Academiq support?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Academiq works on any modern browser — Chrome, Edge, Firefox, or Safari — across laptops, tablets, and phones. No software installation is required. The interface is responsive and optimized for both desktop and mobile use.
                </p>
              </div>

              {/* NEW: Offline */}
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Does the platform work without internet?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Academiq requires an active internet connection to sync records securely across users. However, we are developing a lightweight offline mode that will allow attendance marking and grade entry to be saved locally and synchronized once connectivity returns.
                </p>
              </div>

              {/* NEW: Training */}
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-extrabold text-base text-base-content flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Do you provide staff training?
                </h4>
                <p className="text-xs text-base-content/70 leading-relaxed pl-4">
                  Yes. All pilot schools receive a free onboarding session — either online or in-person (for schools in Nairobi &amp; Nyeri) — covering admin setup, teacher grading, and parent portal usage. Ongoing support is available via phone and email throughout your subscription.
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
                  href="mailto:support@academiq.co.ke" 
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
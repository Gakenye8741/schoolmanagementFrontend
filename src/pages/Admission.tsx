import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";


const Admission = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 bg-base-100 text-base-content transition-all">
        <h1 className="text-4xl font-bold text-center">Admissions at Endarasha Boys High School</h1>

        {/* Introduction */}
        <section>
          <p>
            At Endarasha Boys High School, we believe that education is a
            fundamental right for every young person. Our admissions process is
            designed to be transparent, inclusive, and fair, ensuring that
            students from all backgrounds have the opportunity to access quality
            secondary education.
          </p>
        </section>

        {/* Admission Requirements */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Admission Requirements</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Official KCPE results slip or certificate.</li>
            <li>Original birth certificate and copies.</li>
            <li>Two recent passport-size photographs.</li>
            <li>
              Letter of admission from the Ministry of Education or County Education Office (Form One intake).
            </li>
            <li>
              Completed school admission form (available from the school or downloaded online).
            </li>
          </ul>
        </section>

        {/* Form One Admissions */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Form One Admissions</h2>
          <p>
            Students admitted to Form One are selected based on performance in the Kenya Certificate of Primary Education (KCPE) and Ministry of Education placement. We receive students from all over the country, promoting diversity and integration.
          </p>
        </section>

        {/* Midstream Transfers */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Midstream Transfers (Form 2–3)</h2>
          <p>
            Transfer requests into Form 2 or 3 are reviewed based on availability
            of space, academic performance, and disciplinary history from the
            former school. Parents or guardians are required to provide:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Previous school’s report forms and transfer letter.</li>
            <li>KCPE results for verification.</li>
            <li>Letter from the Sub-County Director of Education (for transfers).</li>
          </ul>
        </section>

        {/* Admission Process */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Admission Process</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Obtain and complete the admission form.</li>
            <li>Submit the required documents listed above.</li>
            <li>Attend a short interview or orientation session (if required).</li>
            <li>Pay the admission and term fees as advised.</li>
            <li>Receive a uniform and boarding kit list.</li>
          </ol>
        </section>

        {/* Fee Structure */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Fee Structure</h2>
          <p>
            Our fees are in line with government recommendations and are subject
            to change as advised by the Ministry of Education. A detailed fee
            breakdown will be provided during the admission process. Financial
            aid or bursaries may be available for deserving students upon request.
          </p>
        </section>

        {/* Why Choose Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Why Choose Endarasha Boys High School?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Strong academic track record with consistent KCSE performance.</li>
            <li>Dedicated teaching and support staff.</li>
            <li>Well-equipped laboratories, library, and ICT facilities.</li>
            <li>Robust co-curricular and extracurricular programs.</li>
            <li>Disciplined, secure, and spiritually nurturing environment.</li>
          </ul>
        </section>

        {/* Contact Info */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact for Admissions</h2>
          <p>
            For inquiries, please visit our school or contact the school office
            using the details below:
          </p>
          <ul className="list-inside space-y-1">
            <li><strong>Phone:</strong> +254-700-123-456</li>
            <li><strong>Email:</strong> <a className="text-primary underline" href="mailto:admissions@endarashaboys.ac.ke">admissions@endarashaboys.ac.ke</a></li>
            <li><strong>Location:</strong> Endarasha, Kieni West, Nyeri County, Kenya</li>
          </ul>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Admission;

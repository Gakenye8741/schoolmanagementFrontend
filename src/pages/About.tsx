import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";


const About = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 text-base leading-relaxed bg-base-100 text-base-content transition-colors duration-300">
        <h1 className="text-4xl font-bold text-center text-primary mb-8">
          About Endarasha Boys High School
        </h1>

        {/* Introduction */}
        <section>
          <p>
            Nestled in the serene and picturesque landscape of Kieni West, Nyeri County, Kenya, Endarasha Boys High School stands as a beacon of educational excellence, moral grounding, and holistic development. Established with a vision to transform young men into responsible, well-rounded, and industrious citizens, our institution has grown in reputation and stature over the years. We pride ourselves on not just delivering academic excellence but also instilling in our students the values, discipline, and skills necessary to succeed in a dynamic and demanding world.
          </p>
          <p>
            Our school culture is founded on dedication, resilience, integrity, and community. We believe that education is more than just the acquisition of knowledge—it is the foundation upon which character is built, purpose is discovered, and futures are shaped. At Endarasha Boys, we cultivate a learning environment where every student is encouraged to aim higher, work harder, and dream bigger.
          </p>
        </section>

        {/* Motto */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Our Motto</h2>
          <p className="italic text-lg font-medium">“Discipline, Integrity, Excellence”</p>
          <p>
            Our motto represents the core principles that guide all our actions and aspirations. "Discipline" forms the foundation of every student’s journey at Endarasha Boys. It encompasses self-control, responsibility, and respect for authority. "Integrity" highlights the importance of honesty, moral uprightness, and ethical behavior. "Excellence" speaks to our relentless pursuit of academic success and personal growth in all areas of life.
          </p>
        </section>

        {/* Vision */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Our Vision</h2>
          <p>
            To be a leading national school that nurtures disciplined, morally upright, and academically excellent young men who will positively transform society.
          </p>
          <p>
            We envision a future where graduates of Endarasha Boys stand out not just in Kenya but globally—as innovators, leaders, and compassionate changemakers. Our vision reflects our commitment to quality education, character development, and servant leadership.
          </p>
        </section>

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Our Mission</h2>
          <p>
            To provide a conducive learning environment that fosters academic excellence, nurtures talent, and instills moral values, enabling students to achieve their full potential and serve the community with honor and distinction.
          </p>
          <p>
            We are dedicated to creating a school atmosphere that balances intellectual rigor with emotional intelligence, discipline with creativity, and tradition with innovation. Our mission is fulfilled daily through the efforts of our committed staff, supportive parents, and industrious students.
          </p>
        </section>

        {/* Core Values */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Our Core Values</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Discipline:</strong> The backbone of academic and personal success. We foster a strong sense of responsibility and self-regulation in our learners.</li>
            <li><strong>Integrity:</strong> Honesty and transparency in all our actions, both within and outside the school community.</li>
            <li><strong>Excellence:</strong> Striving for the highest standards in academics, sports, and personal conduct.</li>
            <li><strong>Respect:</strong> Valuing diversity, listening to others, and honoring everyone’s dignity.</li>
            <li><strong>Hard Work:</strong> Encouraging a culture of effort, perseverance, and determination.</li>
            <li><strong>Teamwork:</strong> Working collaboratively with staff, students, and stakeholders for a common goal.</li>
            <li><strong>Faith and Service:</strong> Commitment to a higher purpose and service to community and country.</li>
          </ul>
        </section>

        {/* Historical Background */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Historical Background</h2>
          <p>
            Founded in the early post-independence years, Endarasha Boys High School was initially a small day school serving the local community. Over the decades, it has evolved into a full-fledged boarding school, equipped with modern facilities and a highly qualified teaching staff. The school has consistently posted impressive results in national examinations and has produced leaders in various fields—education, business, government, and beyond.
          </p>
          <p>
            Our alumni continue to be our greatest ambassadors, upholding the values instilled in them and carrying the Endarasha Boys legacy wherever they go.
          </p>
        </section>

        {/* Academics and Co-Curricular */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Academics & Co-Curricular Activities</h2>
          <p>
            At Endarasha Boys High School, we offer a broad-based curriculum that caters to the intellectual, emotional, and physical development of our students. We emphasize STEM (Science, Technology, Engineering, and Mathematics) subjects, as well as the arts and humanities, ensuring that every learner finds their niche.
          </p>
          <p>
            Co-curricular activities are also central to our educational model. From athletics, drama, and music to science fairs, debate clubs, and scouting—students are given opportunities to discover and nurture their talents beyond the classroom.
          </p>
        </section>

        {/* Community Engagement */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Community Engagement</h2>
          <p>
            As a school deeply rooted in the local community, we believe in giving back. We partner with local institutions, churches, and NGOs to participate in various outreach programs such as environmental conservation, community service days, mentorship programs, and health awareness campaigns.
          </p>
          <p>
            This engagement not only benefits the community but helps shape our students into socially conscious citizens who understand the importance of empathy, service, and civic responsibility.
          </p>
        </section>

        {/* Looking Ahead */}
        <section>
          <h2 className="text-2xl font-semibold text-secondary mb-2">Looking Ahead</h2>
          <p>
            As we look to the future, Endarasha Boys High School remains committed to its founding ideals while embracing innovation and modern education practices. Plans are underway to expand our digital learning infrastructure, build additional science laboratories, and introduce global exchange programs that will further enhance our students' learning experiences.
          </p>
          <p>
            We invite you to become part of our journey—whether as a student, parent, educator, or partner. Together, we will continue to write the proud story of Endarasha Boys High School for generations to come.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default About;

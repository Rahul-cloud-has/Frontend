import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./About.css";
import Rahul from "../../assets/rahul.jpeg";
import abcd from "../../assets/abcd.jpg";
import ajaygupta from "../../assets/ajaygupta.jpeg"

/* ─── Static Data ─── */
const MILESTONES = [
  { year: "2015", title: "Company Founded", desc: "Started with first center in Mumbai with a vision to transform skill education.", icon: "🏢", students: "100+" },
  { year: "2017", title: "50 Centers Milestone", desc: "Expanded to 5 states across India with growing franchise partners.", icon: "📍", students: "3,000+" },
  { year: "2019", title: "100 Centers Achievement", desc: "Reached 10,000+ students with major industry placement tie-ups.", icon: "🎓", students: "10,000+" },
  { year: "2021", title: "Government Recognition", desc: "Received ISO certification and govt recognition for all courses.", icon: "📜", students: "12,000+" },
  { year: "2024", title: "170+ Centers Network", desc: "India's #1 skill education franchise operating across 8+ states.", icon: "🏆", students: "13,000+" },
];

const VALUES = [
  { title: "Quality Education", desc: "Industry-aligned curriculum with practical hands-on training.", icon: "📚" },
  { title: "Zero Investment", desc: "Start your franchise with absolutely zero hidden fees.", icon: "💰" },
  { title: "100% Placement", desc: "Guaranteed assistance with 500+ hiring partner companies.", icon: "💼" },
  { title: "Expert Faculty", desc: "Learn from 200+ industry professionals with 10+ years exp.", icon: "👨‍🏫" },
  { title: "Certified Courses", desc: "ISO certified, government recognized valid certificates.", icon: "📜" },
  { title: "Pan India Network", desc: "170+ centers across 8+ states with strong alumni support.", icon: "🌍" },
];

const TEAM = [
  { name: "Ajay Gupta", role: "Founder & CEO", experience: "15+ Yrs", bio: "Visionary leader transforming skill education.", image: ajaygupta, social: { linkedin: "#", twitter: "#" } },
  { name: "Rahul Mishra", role: "Head of Education", experience: "12+ Yrs", bio: "Curriculum expert for innovative learning.", image: Rahul, social: { linkedin: "#", twitter: "#" } },
  { name: "abc", role: "Technical Director", experience: "7+ Yrs", bio: "Tech innovator driving digital growth.", image:abcd, social: { linkedin: "#", twitter: "#" } },
  { name: "Neha Singh", role: "Placement Head", experience: "8+ Yrs", bio: "Career mentor connecting students to MNCs.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop", social: { linkedin: "#", twitter: "#" } },
];

const COURSES = [
  { name: "Full Stack Development", icon: "💻", students: "3,000+" },
  { name: "Data Science & AI", icon: "🤖", students: "2,500+" },
  { name: "Digital Marketing", icon: "📱", students: "2,000+" },
  { name: "UI/UX Design", icon: "🎨", students: "1,500+" },
  { name: "Cloud Computing", icon: "☁️", students: "1,200+" },
  { name: "Cyber Security", icon: "🔒", students: "800+" },
  { name: "Mobile App Dev", icon: "📲", students: "1,000+" },
  { name: "Business Analytics", icon: "📊", students: "900+" },
];

const PARTNERS = [
  "Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "HCL", "Accenture", "Tech Mahindra", "Capgemini"
];

const About = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafIdRef = useRef(null);
  const goToTop = () => window.scrollTo(0, 0);

  /* Scroll Animations */
  useEffect(() => {
    const elements = document.querySelectorAll(".abt-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("abt-visible");
        }
      });
    }, { threshold: 0.15 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Mouse Parallax */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        setMousePos({ 
          x: (e.clientX / window.innerWidth - 0.5) * 30, 
          y: (e.clientY / window.innerHeight - 0.5) * 30 
        });
        rafIdRef.current = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div className="abt-master">
      {/* Background Elements */}
      <div className="abt-grid-bg"></div>
      <div className="abt-blob blob-top"></div>
      <div className="abt-blob blob-bottom"></div>

      {/* ===== HERO SECTION ===== */}
      <section className="abt-hero">
        <img className="abt-hero-img" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop" alt="Students" />
        <div className="abt-hero-overlay"></div>

        <div className="abt-container abt-hero-content abt-reveal">
          <div className="abt-badge">✦ ABOUT EDUSKILLVISION ✦</div>
          <h1>Transforming Lives Through <br /> <span className="abt-gold-text">Skill Education</span></h1>
          <p>India's #1 Skill Education & Franchise Network | Established 2015</p>
          
          <div className="abt-hero-stats">
            <div><span>13,000+</span> Students</div><div className="abt-div"></div>
            <div><span>170+</span> Centers</div><div className="abt-div"></div>
            <div><span>8+</span> States</div><div className="abt-div"></div>
            <div><span>100%</span> Placement</div>
          </div>
        </div>

        {/* Floating Parallax Cards */}
        <div className="abt-float-wrap abt-hide-mobile" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
          <div className="abt-fcard fc-1"><span>🏆</span><h4>#1 in India</h4></div>
          <div className="abt-fcard fc-2"><span>⭐</span><h4>4.9/5 Reviews</h4></div>
          <div className="abt-fcard fc-3"><span>📜</span><h4>ISO Certified</h4></div>
        </div>
      </section>

      {/* ===== OUR STORY ===== */}
      <section className="abt-section">
        <div className="abt-container abt-story-grid">
          <div className="abt-story-img-box abt-reveal">
            <div className="main-img"><img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=600&fit=crop" alt="Skills" /></div>
            <div className="sub-img"><img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=400&fit=crop" alt="Group" /></div>
            <div className="exp-badge"><h2>8+</h2><p>Years<br/>Excellence</p></div>
          </div>
          <div className="abt-story-text abt-reveal">
            <span className="abt-tag">Our Story</span>
            <h2>India's Most Trusted <span className="abt-gold-text">Franchise Network</span></h2>
            <p className="lead"><strong>EduSkillVision</strong> has grown to become India's largest skill education network, empowering thousands of students and partners nationwide.</p>
            <p>Our mission is to give every student in small towns the skills to become independent. We offer industry-ready courses and a highly profitable Zero-Investment franchise model.</p>
            <div className="story-features">
              <div className="sf-item"><span>🎯</span> IT Courses</div>
              <div className="sf-item"><span>🤝</span> Zero Investment</div>
              <div className="sf-item"><span>💼</span> 100% Job Support</div>
              <div className="sf-item"><span>📜</span> ISO Certified</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COURSES GRID ===== */}
      <section className="abt-section">
        <div className="abt-container">
          <div className="abt-heading abt-reveal">
            <span className="abt-tag">Our Programs</span>
            <h2>Courses We <span className="abt-gold-text">Provide</span></h2>
          </div>
          <div className="abt-courses-grid">
            {COURSES.map((course, idx) => (
              <div key={idx} className="abt-mc-card abt-reveal" style={{transitionDelay: `${(idx%4) * 0.05}s`}}>
                <div className="mc-icon">{course.icon}</div>
                <h4>{course.name}</h4>
                <p>👨‍🎓 {course.students} Enrolled</p>
              </div>
            ))}
          </div>
          <div className="abt-center abt-mt-5 abt-reveal">
            <Link to="/courses" onClick={goToTop} className="abt-btn-gold">Explore Full Catalog →</Link>
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className="abt-section">
        <div className="abt-container abt-mv-grid">
          <div className="abt-mv-card abt-reveal">
            <div className="mv-glow"></div>
            <div className="mv-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>Making quality skill education accessible and affordable to every student in India. We aim to empower youth with practical knowledge to secure top jobs globally.</p>
            <div className="mv-highlight"><span>🚀</span> Empower 1 Lakh+ Students</div>
          </div>
          <div className="abt-mv-card abt-reveal" style={{transitionDelay: "0.2s"}}>
            <div className="mv-glow"></div>
            <div className="mv-icon">👁️</div>
            <h3>Our Vision</h3>
            <p>To expand our network to 500+ centers across India, becoming the most trusted and profitable zero-investment education franchise model in the country.</p>
            <div className="mv-highlight"><span>🌟</span> 500+ Centers by 2026</div>
          </div>
        </div>
      </section>

      {/* ===== FRANCHISE ===== */}
      <section className="abt-section">
        <div className="abt-container abt-fa-grid">
          <div className="abt-fa-text abt-reveal">
            <span className="abt-tag">Partner With Us</span>
            <h2>Start Your Own <span className="abt-gold-text">Skill Center</span></h2>
            <p>Join our network of 170+ centers. Start earning instantly while transforming lives through quality education with zero upfront franchise fee.</p>
            <div className="fa-bens">
              <div><span>✅</span> Zero Franchise Fee</div>
              <div><span>✅</span> 40% Profit Margin</div>
              <div><span>✅</span> Marketing Support</div>
              <div><span>✅</span> Setup in 15 Days</div>
            </div>
            <Link to="/franchise" onClick={goToTop} className="abt-btn-glass abt-mt-4">Apply For Franchise</Link>
          </div>
          <div className="abt-fa-img abt-reveal">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" alt="Team" />
            <div className="img-glow"></div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="abt-section">
        <div className="abt-container">
          <div className="abt-heading abt-reveal">
            <span className="abt-tag">Our Journey</span>
            <h2>Key <span className="abt-gold-text">Milestones</span></h2>
          </div>
          <div className="abt-timeline">
            <div className="tl-line"></div>
            {MILESTONES.map((item, idx) => (
              <div key={idx} className={`tl-item abt-reveal ${idx % 2 === 0 ? "left" : "right"}`}>
                <div className="tl-dot"></div>
                <div className="tl-content">
                  <span className="tl-year">{item.year}</span>
                  <h3>{item.icon} {item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="tl-stat">👨‍🎓 {item.students} Students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section className="abt-section">
        <div className="abt-container">
          <div className="abt-heading abt-reveal">
            <span className="abt-tag">What Drives Us</span>
            <h2>Core <span className="abt-gold-text">Values</span></h2>
          </div>
          <div className="abt-values-grid">
            {VALUES.map((val, idx) => (
              <div key={idx} className="abt-val-card abt-reveal" style={{transitionDelay: `${(idx%3)*0.1}s`}}>
                <div className="val-icon">{val.icon}</div>
                <h3>{val.title}</h3>
                <p>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LEADERSHIP ===== */}
      <section className="abt-section">
        <div className="abt-container">
          <div className="abt-heading abt-reveal">
            <span className="abt-tag">Leadership</span>
            <h2>Meet Our <span className="abt-gold-text">Experts</span></h2>
          </div>
          <div className="abt-team-grid">
            {TEAM.map((member, idx) => (
              <div key={idx} className="abt-team-card abt-reveal" style={{transitionDelay: `${(idx%4)*0.1}s`}}>
                <div className="tm-img">
                  <img src={member.image} alt={member.name} />
                  <div className="tm-overlay">
                    <p>{member.bio}</p>
                  </div>
                </div>
                <div className="tm-info">
                  <h3>{member.name}</h3>
                  <p className="abt-gold-text">{member.role}</p>
                  <span className="tm-exp">{member.experience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="abt-marquee-sec abt-reveal">
        <div className="abt-container abt-center">
          <h4>OUR STUDENTS ARE PLACED AT</h4>
        </div>
        <div className="abt-marquee">
          <div className="abt-track">
            {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, idx) => (
              <div key={idx} className="abt-pt-card">{partner}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="abt-section abt-mb-fix">
        <div className="abt-container">
          <div className="abt-cta-box abt-reveal">
            <div className="cta-glow"></div>
            <h2>Ready to Transform Your <span className="abt-gold-text">Future?</span></h2>
            <p>Whether you want to learn new skills or start your franchise, we have the perfect path for you.</p>
            <div className="cta-btns">
              <Link to="/courses" onClick={goToTop} className="abt-btn-gold">Explore Courses</Link>
              <Link to="/contact" onClick={goToTop} className="abt-btn-glass">Contact Us</Link>
            </div>
            <div className="cta-trust">
              <span>✅ Zero Investment</span>
              <span>✅ 100% Placement</span>
              <span>✅ Govt Certified</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
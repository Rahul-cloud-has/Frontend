// Franchisee.jsx - Navy & Gold Premium Version
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Franchisee.css";

const testimonials = [
  { quote: "Best decision of my life! Zero investment and full support from day one.", name: "Rahul Sharma", role: "Partner • Delhi", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
  { quote: "Amazing support system and high-quality courses. Students love it!", name: "Priya Patel", role: "Partner • Mumbai", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
  { quote: "My center is now the most popular skill center in my city!", name: "Amit Kumar", role: "Partner • Bangalore", avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
  { quote: "From a small room to 300+ students. Incredible journey!", name: "Sneha Gupta", role: "Partner • Pune", avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
  { quote: "Profit margins are excellent. Truly a game-changing opportunity!", name: "Vikram Singh", role: "Partner • Jaipur", avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
];

const Franchisee = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fr-visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fr-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    const counters = document.querySelectorAll(".fr-count");
    counters.forEach((counter) => {
      if (counter.classList.contains("counted")) return;
      counter.classList.add("counted");
      const target = parseInt(counter.getAttribute("data-target"));
      const increment = target / 60;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = Math.ceil(current);
        }
      }, 25);
    });
  }, []);

  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const benefits = [
    { icon: "💰", title: "Zero Investment", desc: "No franchise fee, no hidden charges. Start with zero cost.", features: ["No Fee", "No Royalty", "No Hidden Cost"] },
    { icon: "📚", title: "Multiple Courses", desc: "8+ industry-ready courses designed by experts.", features: ["Web Dev", "Data Science", "Marketing"] },
    { icon: "🤝", title: "Full Support", desc: "Training, marketing & operational support at every step.", features: ["Marketing Kit", "Training", "24/7 Help"] },
    { icon: "📜", title: "Certified Programs", desc: "Government recognized certificates with global validity.", features: ["ISO Certified", "Govt. Recognized", "Global Valid"] },
    { icon: "🌍", title: "Pan India Network", desc: "170+ centers across 8+ states with strong alumni.", features: ["170+ Centers", "8+ States", "Alumni Network"] },
    { icon: "💼", title: "Placement Support", desc: "100% placement assistance with top companies.", features: ["100% Assist", "Top Companies", "Career Growth"] },
    { icon: "📈", title: "High Profit", desc: "Earn up to 40% profit margin with recurring revenue.", features: ["40% Margin", "Monthly Income", "Recurring"] },
    { icon: "🏆", title: "Brand Recognition", desc: "India's fastest growing skill education franchise.", features: ["#1 Brand", "Award Winning", "Featured"] },
    { icon: "🎯", title: "Quick Setup", desc: "Get operational in just 15 days with our team.", features: ["15 Days", "Dedicated Team", "Full Guide"] },
  ];

  const stats = [
    { value: 170, suffix: "+", label: "Centers", icon: "🏫" },
    { value: 13000, suffix: "+", label: "Students", icon: "👨‍🎓" },
    { value: 8, suffix: "+", label: "States", icon: "📍" },
    { value: 100, suffix: "%", label: "Placement", icon: "💼" },
    { value: 40, suffix: "%", label: "Profit Margin", icon: "📈" },
    { value: 15, suffix: " Days", label: "Quick Setup", icon: "⚡" },
  ];

  const steps = [
    { step: "01", title: "Apply Online", desc: "Fill the franchise application form", icon: "📝" },
    { step: "02", title: "Quick Review", desc: "We review within 24 hours", icon: "🔍" },
    { step: "03", title: "Center Setup", desc: "Setup with our complete support", icon: "🏗️" },
    { step: "04", title: "Launch & Earn", desc: "Start earning from day one", icon: "🚀" },
  ];

  const courses = [
    { name: "Full Stack Development", duration: "6 Months", icon: "💻" },
    { name: "Data Science & AI", duration: "8 Months", icon: "🤖" },
    { name: "Digital Marketing", duration: "4 Months", icon: "📱" },
    { name: "UI/UX Design", duration: "5 Months", icon: "🎨" },
    { name: "Cloud Computing", duration: "6 Months", icon: "☁️" },
    { name: "Cyber Security", duration: "6 Months", icon: "🔒" },
    { name: "Mobile App Dev", duration: "5 Months", icon: "📲" },
    { name: "Business Analytics", duration: "4 Months", icon: "📊" },
  ];

  return (
    <div className="fr-page">
      {/* Background Effects */}
      <div className="fr-grid-bg"></div>
      <div className="fr-blob fr-blob-1"></div>
      <div className="fr-blob fr-blob-2"></div>

      {/* ===== HERO ===== */}
      <section className="fr-hero">
        <div className="fr-wrap">
          <div className="fr-hero-grid">
            <div className="fr-hero-left fr-animate">
              <span className="fr-badge">🚀 #1 Franchise Opportunity in India</span>
              <h1>Start Your Own <span className="fr-grad-text">Skill Center</span><br />With Zero Investment</h1>
              <p className="fr-hero-desc">
                Join India's fastest growing skill development franchise.
                <strong> Zero fee</strong> • <strong>Full support</strong> • <strong>8+ courses</strong> • <strong>100% placement</strong>
              </p>
              <div className="fr-hero-stats-row">
                {stats.slice(0, 4).map((s, i) => (
                  <div key={i} className="fr-hero-stat-item">
                    <strong><span className="fr-count" data-target={s.value}>0</span>{s.suffix}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="fr-hero-btns">
                <Link to="/franchise-apply" className="fr-btn-main">🚀 Apply Now - It's Free</Link>
                <a href="#fr-benefits" className="fr-btn-sec">▶ Watch Demo</a>
              </div>
            </div>
            <div className="fr-hero-right fr-animate">
              <div className="fr-hero-card">
                <div className="fr-hc-glow"></div>
                <span className="fr-hc-badge">FRANCHISE</span>
                <div className="fr-hc-logo">🎓</div>
                <h3>Your Skill Center</h3>
                <p>Start earning from Day 1</p>
                <div className="fr-hc-stats">
                  <div><strong>₹2L+</strong><span>Monthly Revenue</span></div>
                  <div><strong>40%</strong><span>Profit Margin</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="fr-stats fr-animate">
        <div className="fr-wrap">
          <div className="fr-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="fr-stat-card">
                <span className="fr-stat-emoji">{s.icon}</span>
                <div className="fr-stat-num">
                  <span className="fr-count" data-target={s.value}>0</span>{s.suffix}
                </div>
                <span className="fr-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section id="fr-benefits" className="fr-benefits">
        <div className="fr-wrap">
          <div className="fr-sec-head fr-animate">
            <span className="fr-tag">Why Choose Us</span>
            <h2>Why Franchise With <span className="fr-grad-text">Us</span></h2>
            <p>Unmatched benefits for franchise partners</p>
          </div>
          <div className="fr-benefits-grid">
            {benefits.map((b, i) => (
              <div key={i} className="fr-benefit-card fr-animate">
                <div className="fr-bc-glow"></div>
                <div className="fr-bc-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
                <div className="fr-bc-tags">
                  {b.features.map((f, fi) => (
                    <span key={fi}>✓ {f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COURSES ===== */}
      <section className="fr-courses">
        <div className="fr-wrap">
          <div className="fr-sec-head fr-animate">
            <span className="fr-tag">Our Courses</span>
            <h2>Courses Your Center Will <span className="fr-grad-text">Offer</span></h2>
            <p>Industry-ready courses by top professionals</p>
          </div>
          <div className="fr-courses-grid fr-animate">
            {courses.map((c, i) => (
              <div key={i} className="fr-course-card">
                <span className="fr-cc-icon">{c.icon}</span>
                <div>
                  <h4>{c.name}</h4>
                  <span className="fr-cc-dur">⏱️ {c.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="fr-steps-sec">
        <div className="fr-wrap">
          <div className="fr-sec-head fr-animate">
            <span className="fr-tag">Simple Process</span>
            <h2>How It <span className="fr-grad-text">Works</span></h2>
            <p>Start in 4 simple steps</p>
          </div>
          <div className="fr-steps-grid fr-animate">
            {steps.map((s, i) => (
              <div key={i} className="fr-step-card">
                <div className="fr-sc-dot">{s.icon}</div>
                <span className="fr-sc-num">{s.step}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="fr-testimonials">
        <div className="fr-wrap">
          <div className="fr-sec-head fr-animate">
            <span className="fr-tag">Success Stories</span>
            <h2>Our <span className="fr-grad-text">Partners</span> Speak</h2>
            <p>Real stories from franchise partners</p>
          </div>
          <div className="fr-testi-grid fr-animate">
            {testimonials.map((t, i) => (
              <div key={i} className={`fr-testi-card ${i === activeTestimonial ? 'fr-testi-active' : ''}`}>
                <p>"{t.quote}"</p>
                <div className="fr-testi-author">
                  <img src={t.avatar} alt={t.name} />
                  <div>
                    <h4>{t.name}</h4>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="fr-testi-dots">
            {testimonials.map((_, i) => (
              <button key={i} className={`fr-tdot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)}></button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="fr-faq">
        <div className="fr-wrap">
          <div className="fr-sec-head fr-animate">
            <span className="fr-tag">FAQs</span>
            <h2>Frequently Asked <span className="fr-grad-text">Questions</span></h2>
          </div>
          <div className="fr-faq-grid fr-animate">
            {[
              { q: "Is there any franchise fee?", a: "No! Completely zero investment with no hidden charges." },
              { q: "How quickly can I start?", a: "Get operational within 15 days with dedicated support." },
              { q: "What support do I get?", a: "Training, marketing, curriculum, and 24/7 assistance." },
              { q: "What's the profit potential?", a: "Up to 40% profit margin with recurring revenue." },
            ].map((f, i) => (
              <div key={i} className="fr-faq-card">
                <h4>❓ {f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="fr-cta">
        <div className="fr-wrap">
          <div className="fr-cta-box fr-animate">
            <div className="fr-cta-glow"></div>
            <span className="fr-cta-badge">🚀 Limited Slots Available</span>
            <h2>Ready to Build Your <span className="fr-grad-text">Dream Business?</span></h2>
            <p>Join 170+ successful partners. Don't miss this opportunity!</p>
            <div className="fr-cta-btns">
              <Link to="/franchise-apply" className="fr-btn-main fr-btn-lg">🚀 Apply Now - It's Free</Link>
              <Link to="/contact" className="fr-btn-outline-w">📞 Contact Us</Link>
            </div>
            <div className="fr-cta-trust-row">
              <span>✅ No Investment</span>
              <span>✅ 24/7 Support</span>
              <span>✅ Start in 15 Days</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Franchisee;
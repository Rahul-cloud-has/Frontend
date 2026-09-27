// Home.js - FINAL MASTERPIECE (Fixed Overlaps, Smooth Scrolling, Premium UI)
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL, apiConfig } from "../../Api";
import "./Home.css";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const statsRef = useRef(null);
  const revealRefs = useRef([]);

  const goToCourses = () => window.scrollTo(0, 0);

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const getCourseImage = (imgSrc) => {
    if (!imgSrc || imgSrc === "null" || imgSrc === "undefined") {
      return "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop";
    }
    if (imgSrc.startsWith("http://") || imgSrc.startsWith("https://")) return imgSrc;
    const backendHost = API_URL.replace(/\/api\/?$/, "");
    return `${backendHost}${imgSrc.startsWith("/") ? "" : "/"}${imgSrc}`;
  };

  const heroSlides = [
    {
      id: 1,
      image: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
      title: "Information Technology",
      subtitle: "Learn cutting-edge IT skills",
      desc: "Master Web Development, Python, Data Science, AI & ML",
      category: "IT & Software",
    },
    {
      id: 2,
      image: "https://images.pexels.com/photos/6863174/pexels-photo-6863174.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
      title: "Tally & Accounting",
      subtitle: "Become a finance expert",
      desc: "Master Tally Prime, GST, Income Tax & Financial Accounting",
      category: "Finance & Accounting",
    },
  ];

  const stats = [
    { icon: "👨‍🎓", value: 13000, label: "Students Trained", suffix: "+" },
    { icon: "🏫", value: 170, label: "Active Centers", suffix: "+" },
    { icon: "📍", value: 8, label: "States Covered", suffix: "+" },
    { icon: "🏆", value: 2015, label: "Since", suffix: "" },
    { icon: "💼", value: 100, label: "Placement Rate", suffix: "%" },
    { icon: "🎓", value: 50, label: "Expert Trainers", suffix: "+" },
  ];

  const advantages = [
    { icon: "💰", title: "Zero-Fee Franchise", desc: "Start your own center with zero investment." },
    { icon: "🎯", title: "Job-Ready Curriculum", desc: "Courses designed by top tech experts." },
    { icon: "🤝", title: "100% Job Support", desc: "Guaranteed assistance with top MNCs." },
    { icon: "📜", title: "Certified Courses", desc: "Get globally recognized ISO certificates." },
    { icon: "💻", title: "Live Projects", desc: "Hands-on experience with real-world tasks." },
    { icon: "🌍", title: "Pan India Network", desc: "Join 170+ centers across 8+ states." },
  ];

  const learningSteps = [
    { step: "01", title: "Choose Course", desc: "Select from our wide range of industry-expert programs." },
    { step: "02", title: "Learn & Practice", desc: "Gain hands-on experience through live practical projects." },
    { step: "03", title: "Get Certified", desc: "Earn globally recognized ISO certification upon completion." },
    { step: "04", title: "Get Placed", desc: "Secure your dream job with our dedicated placement cell." }
  ];

  const recruiters = [
    { name: "TCS", role: "Software Trainee" },
    { name: "Infosys", role: "System Analyst" },
    { name: "Wipro", role: "Web Developer" },
    { name: "Tech Mahindra", role: "IT Consultant" },
    { name: "HDFC Bank", role: "Tally Expert" },
    { name: "ICICI Bank", role: "Finance Exec" },
    { name: "Reliance", role: "Data Analyst" },
    { name: "Capgemini", role: "Cloud Engineer" },
  ];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [coursesRes, catsRes, dursRes] = await Promise.all([
        axios.get(`${API_URL}/website/courses/`, apiConfig()),
        axios.get(`${API_URL}/website/categories/`, apiConfig()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/website/durations/`, apiConfig()).catch(() => ({ data: [] })),
      ]);

      let data = coursesRes.data?.data || (Array.isArray(coursesRes.data) ? coursesRes.data : []);
      const categories = Array.isArray(catsRes.data) ? catsRes.data : [];
      const durations = Array.isArray(dursRes.data) ? dursRes.data : [];

      const getCategoryName = (catId) => {
        if (typeof catId === "object" && catId !== null) return catId.name || catId.label || "IT & COMPUTER";
        const found = categories.find((c) => String(c.id) === String(catId));
        return found ? found.label || found.name : "IT & COMPUTER";
      };

      const getDurationValue = (durId) => {
        if (typeof durId === "object" && durId !== null) return durId.name || durId.value || "1 Year";
        const found = durations.find((d) => String(d.id) === String(durId));
        return found ? found.value || found.name : "1 Year";
      };

      const mappedCourses = data.map((course) => ({
        id: course.id,
        name: course.course_name || course.name || "Unnamed Course",
        image: course.image || course.image_url || "",
        category: getCategoryName(course.category),
        duration: getDurationValue(course.duration || course.sessions),
        students: course.students || "150+",
        description: course.description || "Premium professional training course for career growth.",
        is_professional: course.is_professional !== false,
      }));
      setCourses(mappedCourses);
    } catch (error) {
      toast.error("Failed to load courses from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    const slideInterval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          if (entry.target.classList.contains("stats-grid")) {
            const counters = entry.target.querySelectorAll(".stat-number");
            counters.forEach(counter => {
              if (counter.classList.contains("counted")) return;
              counter.classList.add("counted");
              const target = +counter.getAttribute("data-target");
              let count = 0;
              const speed = target / 40;
              const updateCount = () => {
                if (count < target) {
                  count += speed;
                  counter.innerText = Math.ceil(count);
                  requestAnimationFrame(updateCount);
                } else {
                  counter.innerText = target;
                }
              };
              updateCount();
            });
          }
        }
      });
    }, { threshold: 0.15 });

    revealRefs.current.forEach((el) => { if (el) observer.observe(el); });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [courses]);

  const displayCourses = searchTerm
    ? courses.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()))
    : courses;

  return (
    <div className="home-premium-master">
      <ToastContainer theme="dark" />
      <div className="pro-bg-grid"></div>

      {/* ===== HERO SECTION ===== */}
      <section className="pro-hero">
        {heroSlides.map((slide, index) => (
          <div key={slide.id} className={`pro-slide ${index === currentSlide ? "active" : ""}`}>
            <img src={slide.image} alt={slide.title} className="pro-bg-img" />
            <div className="pro-overlay"></div>
            <div className="container pro-hero-content">
              <span className="pro-badge">{slide.category}</span>
              <h1>{slide.title}</h1>
              <h3>{slide.subtitle}</h3>
              <p>{slide.desc}</p>
              <div className="pro-buttons">
                <Link to="/courses" onClick={goToCourses} className="pro-btn-gold">Explore Courses 🚀</Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ===== 6 STATS ===== */}
      <section className="pro-stats">
        <div className="container">
          <div className="stats-grid reveal" ref={statsRef}>
            {stats.map((stat, index) => (
              <div key={index} className="pro-stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value-box">
                  <span className="stat-number" data-target={stat.value}>0</span>
                  <span className="stat-suffix">{stat.suffix}</span>
                </div>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (LEARNING PATH) ===== */}
      <section className="pro-learning-path section-spacing reveal" ref={addToRefs}>
        <div className="container">
          <div className="pro-heading text-center">
            <span className="pro-tag">Your Journey</span>
            <h2>How It <span className="gold-text">Works</span></h2>
            <p>A simple 4-step path to achieving your dream career.</p>
          </div>
          <div className="steps-grid">
            {learningSteps.map((item, idx) => (
              <div key={idx} className="step-card" style={{transitionDelay: `${idx * 0.1}s`}}>
                <div className="step-number">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COURSES (COMPACT CARDS) ===== */}
      <section className="pro-courses section-spacing">
        <div className="container">
          <div className="pro-heading text-center reveal" ref={addToRefs}>
            <span className="pro-tag">Popular Programs</span>
            <h2>Our Top <span className="gold-text">Courses</span></h2>
            <p>Industry-aligned curriculum designed by experts.</p>
          </div>

          <div className="pro-search reveal" ref={addToRefs}>
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search courses (e.g., Python, Tally)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="courses-grid-exact">
              {displayCourses.slice(0, 6).map((course, idx) => (
                <div key={course.id} className="pro-course-card reveal" ref={addToRefs} style={{transitionDelay: `${(idx % 3) * 0.1}s`}}>
                  <div className="card-image">
                    <img src={getCourseImage(course.image)} alt={course.name} />
                    <div className="badges">
                      {course.is_professional && <span className="badge-pro">⭐ PRO</span>}
                      <span className="badge-cat">{course.category}</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 title={course.name}>{course.name}</h3>
                    <p>{course.description}</p>
                    <div className="card-meta">
                      <span>⏱️ {course.duration}</span>
                      <span>👥 {course.students}</span>
                    </div>
                    <div className="card-footer">
                      <Link to="/courses" onClick={goToCourses} className="btn-enroll">
                        Enroll Now →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-5 reveal" ref={addToRefs}>
            <Link to="/courses" onClick={goToCourses} className="pro-btn-glass outline">View All Programs →</Link>
          </div>
        </div>
      </section>

      {/* ===== FRANCHISE BANNER ===== */}
      <section className="pro-franchise section-spacing reveal" ref={addToRefs}>
        <div className="container">
          <div className="franchise-box">
            <div className="franchise-text">
              <span className="pro-tag">Partner With Us</span>
              <h2>Start Your Own <span className="gold-text">Education Center</span></h2>
              <p>Join our Zero-Fee Franchise Model. Get full marketing, software, and operational support to build a highly profitable business in your city.</p>
              <ul>
                <li>✅ Free Center Management ERP</li>
                <li>✅ Marketing & Branding Support</li>
                <li>✅ Lifetime Operational Guidance</li>
              </ul>
              <Link to="/franchise" className="pro-btn-gold mt-4">Apply For Franchise →</Link>
            </div>
            <div className="franchise-image">
              <img src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Franchise" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES ===== */}
      <section className="pro-features section-spacing">
        <div className="container">
          <div className="pro-heading text-center reveal" ref={addToRefs}>
            <span className="pro-tag">✨ What We Offer</span>
            <h2>Our Premium <span className="gold-text">Services</span></h2>
          </div>
          <div className="features-grid">
            {advantages.map((adv, idx) => (
              <div key={idx} className="pro-feature-card reveal" ref={addToRefs} style={{transitionDelay: `${idx * 0.1}s`}}>
                <div className="hover-glow"></div>
                <div className="icon">{adv.icon}</div>
                <h3>{adv.title}</h3>
                <p>{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ANIMATED CARDS MARQUEE (FIXED CLIPPING) ===== */}
      <section className="pro-marquee reveal" ref={addToRefs}>
        <div className="container text-center">
          <h4>OUR STUDENTS ARE PLACED IN TOP COMPANIES</h4>
        </div>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {[...recruiters, ...recruiters, ...recruiters].map((recruiter, idx) => (
              <div key={idx} className="recruiter-card">
                <span className="r-name">{recruiter.name}</span>
                <span className="r-role">{recruiter.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pro-cta section-spacing">
        <div className="container">
          <div className="cta-box reveal" ref={addToRefs}>
            <div className="cta-bg-glow"></div>
            <h2>Ready To Build Your Future?</h2>
            <p>Join 13,000+ successful students. Get trained, get certified, and get placed.</p>
            <div className="cta-actions">
              <Link to="/contact" onClick={goToCourses} className="pro-btn-gold">Contact Us Today</Link>
            
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
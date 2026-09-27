import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, apiConfig } from "../../Api";
import "./Courses.css";

const WEBSITE_URL = `${API_URL}/website`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu & Kashmir","Ladakh",
];

const WHY_CARDS = [
  { icon:"🎓", title:"Expert Trainers", back:"Learn from industry professionals with 10+ years of real-world experience across multiple domains.", points:["Industry Experts","Practical Knowledge","Real-world Insights"] },
  { icon:"📋", title:"Practical Training", back:"Real machines, live software, and actual client projects for hands-on learning experience.", points:["Live Projects","Case Studies","Hands-on Learning"] },
  { icon:"💼", title:"Placement Support", back:"100% assistance to help you land your dream job after course completion in top companies.", points:["Resume Building","Interview Prep","Job Assistance"] },
  { icon:"📜", title:"Certified Courses", back:"Get government recognized certificates after course completion to boost your career prospects.", points:["Govt. Recognized","Industry Validated","Lifetime Access"] },
  { icon:"🌍", title:"Pan India Network", back:"170+ centers across 8+ states with a strong alumni network for lifelong support.", points:["8+ States","170+ Centers","Alumni Network"] },
  { icon:"💡", title:"Industry Aligned", back:"Curriculum designed with industry experts to meet current market demands and trends.", points:["Expert Designed","Market Ready","Future Focused"] },
];

const LEARNING_STEPS = [
  { step: "01", icon: "🎯", title: "Choose Course", desc: "Pick from 100+ programs across IT, Business, Trade skills & more." },
  { step: "02", icon: "📚", title: "Learn & Practice", desc: "Get hands-on training with live projects and expert guidance." },
  { step: "03", icon: "📜", title: "Get Certified", desc: "Earn government recognized certifications validating your skills." },
  { step: "04", icon: "💼", title: "Get Placed", desc: "Land your dream job with our 100% placement assistance program." },
];

const GUARANTEES = [
  { icon: "✅", title: "Lifetime Access", desc: "Once enrolled, access all learning materials for lifetime." },
  { icon: "🎯", title: "Job Guarantee", desc: "100% placement support with 500+ hiring partners across India." },
  { icon: "💰", title: "Affordable Fees", desc: "Best-in-class training at the most affordable price with EMI options." },
  { icon: "🏆", title: "Trusted Since 2015", desc: "8+ years of excellence in skill education with 13,000+ alumni." },
];

const TESTIMONIALS = [
  { quote:"This course completely transformed my career. Zero to hero in just 6 months! The trainers explained everything so well.", name:"Rahul Sharma", course:"IT & Computer", img:"https://randomuser.me/api/portraits/men/32.jpg" },
  { quote:"Practical training and placement support helped me land my dream job at a great salary package. Highly recommended!", name:"Priya Patel", course:"Tally & Accounting", img:"https://randomuser.me/api/portraits/women/44.jpg" },
  { quote:"Best decision of my life! Trainers are amazing and the curriculum is completely industry-focused and top-notch.", name:"Amit Kumar", course:"Professional Training", img:"https://randomuser.me/api/portraits/men/45.jpg" },
];

const FALLBACK_CATEGORIES = [
  { id: "it-computer", label: "IT & Computer", icon: "💻",
    courses: [
      { id: 1, name: "Full Stack Web Development", duration: "6 Months", students: "2,500+", fee: "₹49,999", description: "MERN stack, HTML, CSS, JavaScript, React, Node.js.", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop", isProfessional: true },
      { id: 2, name: "Python & Data Science", duration: "5 Months", students: "1,800+", fee: "₹44,999", description: "Python, Pandas, NumPy, Machine Learning.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop", isProfessional: true },
      { id: 3, name: "DCA", duration: "6 Months", students: "5,200+", fee: "₹12,999", description: "MS Office, Internet, Email, Typing.", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop", isProfessional: false },
    ],
  },
  { id: "accounting", label: "Accounting & Finance", icon: "💰",
    courses: [
      { id: 4, name: "Tally Prime with GST", duration: "3 Months", students: "4,500+", fee: "₹14,999", description: "Tally Prime, GST filing, TDS.", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop", isProfessional: false },
    ],
  },
];

const HERO_SLIDES = [
  { id:1, image:"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&h=1080&fit=crop" },
  { id:2, image:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&h=1080&fit=crop" },
  { id:3, image:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1920&h=1080&fit=crop" },
];

const Courses = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const sectionRef = useRef(null);
  const location = useLocation();

  // Route to Top Helper
  const goToTop = () => window.scrollTo(0, 0);

  const [enrollModal, setEnrollModal] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [enrollForm, setEnrollForm] = useState({
    studentName: "", courseName: "", mobile: "", city: "", state: "", email: "",
  });
  const [enrollState, setEnrollState] = useState("idle");
  const [enrollError, setEnrollError] = useState("");

  const [apiCategories, setApiCategories] = useState([]);
  const [apiCourses, setApiCourses] = useState([]);
  const [apiDurations, setApiDurations] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  /* FETCH API */
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        if (!isMounted) return;
        setApiLoading(true);
        setApiError("");
        const config = { ...(apiConfig() || {}), signal: controller.signal };
        const [catRes, corRes, durRes] = await Promise.all([
          axios.get(`${WEBSITE_URL}/categories/`, config),
          axios.get(`${WEBSITE_URL}/courses/`, config),
          axios.get(`${WEBSITE_URL}/durations/`, config),
        ]);
        if (!isMounted) return;
        setApiCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setApiCourses(Array.isArray(corRes.data) ? corRes.data : []);
        setApiDurations(Array.isArray(durRes.data) ? durRes.data : []);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        if (!isMounted) return;
        setApiError("Could not load courses from server. Showing sample data.");
        toast.error("Could not load courses. Showing sample data.", { toastId: "cs-err" });
      } finally {
        if (isMounted) setApiLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (apiLoading) return;
    const params = new URLSearchParams(location.search);
    const categoryFromURL = params.get("category");
    if (categoryFromURL) {
      setFilter(categoryFromURL);
      setTimeout(() => {
        document.querySelector(".crs-explore-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, [location.search, apiLoading]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  const getDurLabel = (durId) => {
    const d = apiDurations.find((dur) => String(dur.id) === String(durId));
    return d ? d.value : durId || "—";
  };

  const ALL_CATEGORIES = (() => {
    if (apiCategories.length > 0) {
      return apiCategories.map((cat) => ({
        ...cat,
        courses: apiCourses
          .filter((c) => String(c.category) === String(cat.id))
          .map((c) => ({
            ...c,
            icon: cat.icon,
            duration: getDurLabel(c.duration),
            students: c.students || "N/A",
            fee: c.fee ? `₹${Number(c.fee).toLocaleString("en-IN")}` : "—",
            isProfessional: c.is_professional || false,
            categoryLabel: cat.label,
            categoryIcon: cat.icon,
            image: c.image || "",
            description: c.description || "",
          })),
      }));
    }
    return FALLBACK_CATEGORIES;
  })();

  const ALL_COURSES_LIST = ALL_CATEGORIES.flatMap((cat) =>
    cat.courses.map((c) => ({ ...c, category: cat.id, categoryLabel: cat.label, categoryIcon: cat.icon }))
  );

  const filteredCourses = ALL_COURSES_LIST.filter((course) => {
    const mf = filter === "all" || String(course.category) === String(filter);
    const term = searchTerm.toLowerCase();
    const ms = !searchTerm ||
      String(course.name || "").toLowerCase().includes(term) ||
      String(course.description || "").toLowerCase().includes(term) ||
      String(course.categoryLabel || "").toLowerCase().includes(term);
    return mf && ms;
  });

  const activeCat = ALL_CATEGORIES.find((c) => String(c.id) === String(filter));

  const modalCourses = selectedCatId
    ? ALL_CATEGORIES.find((c) => String(c.id) === String(selectedCatId))?.courses || []
    : ALL_COURSES_LIST;

  useEffect(() => {
    const iv = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("crs-visible");
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".crs-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [apiLoading, filteredCourses.length]);

  const openEnroll = (course) => {
    const catId = course ? course.category : "";
    setSelectedCatId(catId ? String(catId) : "");
    setEnrollModal(course ? { id: course.id, name: course.name } : { id: null, name: "" });
    setEnrollForm({
      studentName: "", courseName: course ? course.name : "",
      mobile: "", city: "", state: "", email: "",
    });
    setEnrollState("idle"); setEnrollError("");
    document.body.style.overflow = "hidden";
  };

  const closeEnroll = () => {
    setEnrollModal(null); setEnrollState("idle"); setEnrollError("");
    document.body.style.overflow = "";
  };

  const onEnrollChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      setEnrollForm((p) => ({ ...p, mobile: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setEnrollForm((p) => ({ ...p, [name]: value }));
  };

  const onCategoryChange = (e) => {
    const catId = e.target.value;
    setSelectedCatId(catId);
    const cat = ALL_CATEGORIES.find((c) => String(c.id) === String(catId));
    setEnrollForm((p) => ({ ...p, courseName: cat?.courses[0]?.name || "" }));
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    const studentName = enrollForm.studentName.trim();
    const mobile = enrollForm.mobile.trim();
    const courseName = enrollForm.courseName;

    if (!studentName) { setEnrollError("Please enter your full name."); setEnrollState("error"); toast.warning("Please enter your name."); return; }
    if (!/^\d{10}$/.test(mobile)) { setEnrollError("Enter valid 10-digit mobile."); setEnrollState("error"); toast.warning("Enter valid mobile."); return; }
    if (!courseName) { setEnrollError("Please select a course."); setEnrollState("error"); toast.warning("Please select a course."); return; }

    const loadingToastId = toast.loading("Submitting enrollment...");
    try {
      setEnrollState("loading"); setEnrollError("");
      const payload = { student_name: studentName, course_name: courseName, mobile, email: enrollForm.email || "", city: enrollForm.city || "", state: enrollForm.state || "", status: "new" };
      await axios.post(`${WEBSITE_URL}/enquiries/`, payload, apiConfig());
      setEnrollState("done");
      toast.update(loadingToastId, { render: "Enrollment successful! Our team will contact you.", type: "success", isLoading: false, autoClose: 3500 });
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || "Something went wrong.";
      setEnrollError(errMsg); setEnrollState("error");
      toast.update(loadingToastId, { render: errMsg, type: "error", isLoading: false, autoClose: 4000 });
    }
  };

  return (
    <div className="crs-master">
      <div className="crs-grid-bg"></div>
      <div className="crs-blob crs-blob-1"></div>
      <div className="crs-blob crs-blob-2"></div>

      {/* HERO */}
      <section className="crs-hero">
        {HERO_SLIDES.map((s, i) => (
          <div key={s.id} className={`crs-slide ${i === currentSlide ? "active" : ""}`}>
            <img src={s.image} alt="Hero" />
            <div className="crs-slide-overlay"></div>
          </div>
        ))}

        <div className="crs-container crs-hero-content">
          <span className="crs-badge">🎯 {ALL_COURSES_LIST.length}+ Career Programs Available</span>
          <h1>Discover Your <span className="crs-gold-text">Perfect Course</span></h1>
          <p>Choose from a wide range of industry-focused programs designed to launch your career. Whether you seek technical mastery, professional skills, or vocational expertise — we have the perfect path for you.</p>

          <div className="crs-hero-stats">
            <div><span>{ALL_COURSES_LIST.length}+</span> Total Courses</div>
            <div className="crs-div"></div>
            <div><span>13,000+</span> Students Trained</div>
            <div className="crs-div"></div>
            <div><span>100%</span> Placement Aid</div>
          </div>
        </div>

        <div className="crs-slide-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={i === currentSlide ? "active" : ""} onClick={() => setCurrentSlide(i)} aria-label={`Slide ${i+1}`} />
          ))}
        </div>
      </section>

      {apiError && !apiLoading && (
        <div className="crs-error-banner">⚠️ {apiError}</div>
      )}

      {/* LEARNING JOURNEY (STEPS) */}
      <section className="crs-journey-section">
        <div className="crs-container">
          <div className="crs-heading crs-reveal">
            <span className="crs-tag">How It Works</span>
            <h2>Your Learning <span className="crs-gold-text">Journey</span></h2>
            <p>A simple, structured 4-step path to transform from beginner to a skilled professional ready for the job market.</p>
          </div>
          <div className="crs-journey-grid">
            {LEARNING_STEPS.map((item, idx) => (
              <div key={idx} className="crs-journey-card crs-reveal" style={{transitionDelay: `${idx * 0.1}s`}}>
                <div className="crs-j-step">{item.step}</div>
                <div className="crs-j-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE COURSES SECTION (Search + Filter + Grid) */}
      <section className="crs-explore-section">
        <div className="crs-container">
          <div className="crs-heading crs-reveal">
            <span className="crs-tag">Explore Programs</span>
            <h2>Browse Our <span className="crs-gold-text">Course Catalog</span></h2>
            <p>Filter by category or search directly to find the course that fits your ambition.</p>
          </div>

          {/* SEARCH BAR */}
          <div className="crs-search-wrap crs-reveal">
            <span className="crs-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search from all courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crs-search-input"
            />
            {searchTerm && (
              <button className="crs-search-clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>

          {/* Dynamic Filter Tabs (From API) */}
          <div className="crs-filter-tabs crs-reveal">
            <button
              className={`crs-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              <span>📚</span> All Courses
              <span className="crs-count">{ALL_COURSES_LIST.length}</span>
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`crs-tab ${String(filter) === String(cat.id) ? "active" : ""}`}
                onClick={() => setFilter(cat.id)}
              >
                <span>{cat.icon || "📘"}</span> {cat.label}
                <span className="crs-count">{cat.courses.length}</span>
              </button>
            ))}
          </div>

          <div className="crs-results-info">
            Showing <strong>{filteredCourses.length}</strong> of {ALL_COURSES_LIST.length} courses
            {searchTerm && <> for "<strong className="crs-gold-text">{searchTerm}</strong>"</>}
          </div>

          {/* COURSES GRID */}
          <div ref={sectionRef}>
            {apiLoading ? (
              <div className="crs-loading">
                <div className="crs-spinner"></div>
                <p>Loading courses from server...</p>
              </div>
            ) : (
              <>
                {filter !== "all" && activeCat && (
                  <div className="crs-active-cat crs-reveal">
                    <div>
                      <span className="crs-ac-icon">{activeCat.icon || "📘"}</span>
                      <div>
                        <h2>{activeCat.label}</h2>
                        <p>{activeCat.courses.length} Programs Available</p>
                      </div>
                    </div>
                    <button onClick={() => setFilter("all")}>✕ Show All</button>
                  </div>
                )}

                <div className="crs-courses-grid">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, idx) => (
                      <div key={course.id} className="crs-course-card crs-reveal" style={{transitionDelay: `${(idx % 3) * 0.1}s`}}>
                        <div className="crs-card-img">
                          {course.image ? (
                            <img src={course.image} alt={course.name} loading="lazy" />
                          ) : (
                            <div className="crs-img-placeholder">{course.categoryIcon || "📚"}</div>
                          )}
                          <div className="crs-card-badges">
                            {course.isProfessional && <span className="crs-badge-pro">⭐ PRO</span>}
                            <span className="crs-badge-cat">{course.categoryIcon} {course.categoryLabel}</span>
                          </div>
                        </div>

                        <div className="crs-card-body">
                          <h3 title={course.name}>{course.name}</h3>
                          <p>{course.description || "Quality professional training program to boost your career."}</p>
                          <div className="crs-card-meta">
                            <span>⏱️ {course.duration}</span>
                            <span>👥 {course.students}</span>
                          </div>
                          <div className="crs-card-footer">
                            <div className="crs-price">
                              <span className="crs-price-label">Fee</span>
                              <span className="crs-price-amt">{course.fee}</span>
                            </div>
                            <button type="button" className="crs-enroll-btn" onClick={() => openEnroll(course)}>
                              Enroll →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="crs-no-courses">
                      <span>🔍</span>
                      <h3>No courses found</h3>
                      <p>Try different keywords or explore other categories.</p>
                      <button onClick={() => { setFilter("all"); setSearchTerm(""); }}>View All Courses</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* GUARANTEES SECTION */}
      <section className="crs-guarantee-section">
        <div className="crs-container">
          <div className="crs-heading crs-reveal">
            <span className="crs-tag">Our Promise</span>
            <h2>What You <span className="crs-gold-text">Get With Us</span></h2>
            <p>We back every program with strong commitments to ensure your investment brings maximum returns.</p>
          </div>
          <div className="crs-guarantee-grid">
            {GUARANTEES.map((item, idx) => (
              <div key={idx} className="crs-guarantee-card crs-reveal" style={{transitionDelay: `${idx * 0.1}s`}}>
                <div className="crs-g-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="crs-why-section">
        <div className="crs-container">
          <div className="crs-heading crs-reveal">
            <span className="crs-tag">Why Learn With Us</span>
            <h2>Your Success is Our <span className="crs-gold-text">Priority</span></h2>
            <p>We go above and beyond traditional education to deliver world-class training programs.</p>
          </div>

          <div className="crs-why-grid">
            {WHY_CARDS.map((card, idx) => (
              <div className="crs-why-card crs-reveal" key={card.title} style={{transitionDelay: `${(idx % 3) * 0.1}s`}}>
                <div className="crs-why-glow"></div>
                <div className="crs-why-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.back}</p>
                <div className="crs-why-points">
                  {card.points.map((p) => <span key={p}>✓ {p}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="crs-testi-section">
        <div className="crs-container">
          <div className="crs-heading crs-reveal">
            <span className="crs-tag">Student Success Stories</span>
            <h2>What Our <span className="crs-gold-text">Students Say</span></h2>
            <p>Real feedback from our alumni who transformed their lives through our programs.</p>
          </div>

          <div className="crs-testi-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div className="crs-testi-card crs-reveal" key={t.name} style={{transitionDelay: `${idx * 0.15}s`}}>
                <div className="crs-quote">"</div>
                <p>{t.quote}</p>
                <div className="crs-author">
                  <img src={t.img} alt={t.name} loading="lazy" />
                  <div>
                    <h4>{t.name}</h4>
                    <span>{t.course}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA (FIXED ROUTE TO /franchisee) */}
      <section className="crs-cta-section">
        <div className="crs-container">
          <div className="crs-cta-box crs-reveal">
            <div className="crs-cta-glow"></div>
            <span className="crs-tag">🚀 Start Today</span>
            <h2>Ready to Build Your <span className="crs-gold-text">Career?</span></h2>
            <p>Join 13,000+ successful students who transformed their lives with our industry-leading programs.</p>
            <div className="crs-cta-btns">
              
              {/* BUTTON 1: Scrolls to Courses Grid */}
              <button 
                type="button" 
                className="crs-btn-gold" 
                onClick={() => document.querySelector(".crs-explore-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Get Started Now
              </button>
              
              {/* BUTTON 2: Changed from /franchise to /franchisee and text changed to Get Franchise */}
              <Link to="/franchisee" onClick={goToTop} className="crs-btn-glass">
                Get Franchise
              </Link>
              
            </div>
          </div>
        </div>
      </section>

      {/* ENROLL MODAL */}
      {enrollModal && (
        <div className="crs-modal-backdrop" onClick={closeEnroll} role="dialog" aria-modal="true">
          <div className="crs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crs-modal-head">
              <div>
                <h3>📝 Enrollment Form</h3>
                <p>Fill details · Our team will call you within 24 hrs</p>
              </div>
              <button type="button" className="crs-modal-close" onClick={closeEnroll}>✕</button>
            </div>

            {enrollState === "done" ? (
              <div className="crs-modal-success">
                <span>🎉</span>
                <h4>Thank You!</h4>
                <p>Enrollment submitted successfully.</p>
                <button type="button" onClick={closeEnroll}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit}>
                <div className="crs-field">
                  <label>Full Name <span>*</span></label>
                  <input name="studentName" value={enrollForm.studentName} onChange={onEnrollChange} placeholder="Enter your full name" />
                </div>

                <div className="crs-field">
                  <label>Category</label>
                  <select value={selectedCatId} onChange={onCategoryChange}>
                    <option value="">-- Choose Category --</option>
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label} ({cat.courses.length})</option>
                    ))}
                  </select>
                </div>

                <div className="crs-field">
                  <label>Course <span>*</span></label>
                  <select name="courseName" value={enrollForm.courseName} onChange={onEnrollChange}>
                    <option value="">-- Choose Course --</option>
                    {modalCourses.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} — {c.fee}</option>
                    ))}
                  </select>
                </div>

                <div className="crs-field">
                  <label>Mobile <span>*</span></label>
                  <input name="mobile" type="tel" value={enrollForm.mobile} onChange={onEnrollChange} placeholder="10-digit number" maxLength={10} />
                </div>

                <div className="crs-field">
                  <label>Email</label>
                  <input name="email" type="email" value={enrollForm.email} onChange={onEnrollChange} placeholder="your@email.com (optional)" />
                </div>

                <div className="crs-row">
                  <div className="crs-field">
                    <label>City</label>
                    <input name="city" value={enrollForm.city} onChange={onEnrollChange} placeholder="City" />
                  </div>
                  <div className="crs-field">
                    <label>State</label>
                    <select name="state" value={enrollForm.state} onChange={onEnrollChange}>
                      <option value="">-- State --</option>
                      {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>

                {enrollError && <div className="crs-error">⚠️ {enrollError}</div>}

                <button type="submit" className="crs-submit-btn" disabled={enrollState === "loading"}>
                  {enrollState === "loading" ? (<><span className="crs-btn-spinner"></span> Submitting...</>) : "Submit Enrollment →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
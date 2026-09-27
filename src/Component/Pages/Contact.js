import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaBuilding,
} from "react-icons/fa";
import { API_URL, apiConfig } from "../../Api";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cnt-visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".cnt-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Please enter your full name.";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Please enter a valid email address.";
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) return "Please enter a valid 10-digit phone number.";
    if (!formData.message.trim()) return "Please enter your message.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMsg = validateForm();

    if (validationMsg) {
      toast.warning(validationMsg);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Sending your message...");

    const contactData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || "",
      subject: formData.subject.trim() || "General Inquiry",
      message: formData.message.trim(),
      status: "Pending",
    };

    try {
      await axios.post(`${API_URL}/contact/`, contactData, apiConfig());
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.update(loadingToast, { render: "Message sent successfully! We'll get back to you soon.", type: "success", isLoading: false, autoClose: 3500 });
    } catch (apiError) {
      try {
        const storedContacts = JSON.parse(localStorage.getItem("contactMessages") || "[]");
        storedContacts.push({ id: Date.now(), ...contactData, createdAt: new Date().toISOString() });
        localStorage.setItem("contactMessages", JSON.stringify(storedContacts));
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        toast.update(loadingToast, { render: "Saved locally! We'll sync it soon.", type: "success", isLoading: false, autoClose: 3500 });
      } catch (storageError) {
        toast.update(loadingToast, { render: "Failed to send message. Try again.", type: "error", isLoading: false, autoClose: 4000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappNumber = "918463065317";
  const whatsappMessage = encodeURIComponent("Hello EduSkillVision! I would like to know more about your courses.");

  const infoCards = [
    { icon: <FaMapMarkerAlt />, title: "Head Office", details: ["Ambikapur, Surguja", "Chhattisgarh - 497001"] },
    { icon: <FaPhoneAlt />, title: "Call Us", details: ["+91 84630 65317", "+91 9301534300"] },
    { icon: <FaEnvelope />, title: "Email Us", details: ["eduskillvision@gmail.com"] },
    { icon: <FaClock />, title: "Working Hours", details: ["Mon - Sat: 9:00 AM - 8:00 PM", "Sunday: Closed"] },
  ];

  const branches = [
    { name: "Ambikapur (Head Office)", address: "Ambikapur, Surguja, Chhattisgarh - 497001", phone: "+91 84630 65317" },
    { name: "Delhi", address: "Connaught Place, New Delhi - 110001", phone: "+91 84630 65317" },
    { name: "Raipur", address: "Civil Lines, Raipur, Chhattisgarh - 492001", phone: "+91 84630 65317" },
  ];

  const faqs = [
    { q: "What courses do you offer?", a: "We offer IT, Accounting, Digital Marketing, Fashion Design, Plumbing, Electrical & many more." },
    { q: "How can I enroll in a course?", a: "You can enroll online via our Courses page, call us, or visit any nearest branch." },
    { q: "Do you provide placement support?", a: "Yes! We provide 100% placement assistance with top companies across India." },
    { q: "Is there any franchise opportunity?", a: "Yes, we offer a Zero-Investment franchise model. Check our Franchise page." },
  ];

  // ONLY 3 SOCIAL ICONS AS REQUESTED
  const socialLinks = [
    { title: "WhatsApp", href: `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, icon: <FaWhatsapp />, color: "#25D366" },
    { title: "Instagram", href: "https://instagram.com/eduskillvision", icon: <FaInstagram />, color: "#E4405F" },
    { title: "Facebook", href: "https://facebook.com/eduskillvision", icon: <FaFacebookF />, color: "#1877F2" },
  ];

  const goToTop = () => window.scrollTo(0, 0);

  return (
    <div className="cnt-master">
      <ToastContainer theme="dark" position="top-right" autoClose={4000} />
      
      {/* Background FX */}
      <div className="cnt-grid-bg"></div>
      <div className="cnt-blob cnt-blob-1"></div>
      <div className="cnt-blob cnt-blob-2"></div>

      {/* ===== HERO ===== */}
      <section className="cnt-hero">
        <div className="cnt-hero-overlay"></div>
        <div className="cnt-container">
          <div className="cnt-hero-content cnt-reveal">
            <span className="cnt-badge">📞 GET IN TOUCH</span>
            <h1>Contact <span className="cnt-gold-text">Us</span></h1>
            <p>We'd love to hear from you. Reach out to us for any queries, support, or franchise details.</p>
            <div className="cnt-breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span className="cnt-active">Contact Us</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INFO CARDS ===== */}
      <section className="cnt-info-section">
        <div className="cnt-container">
          <div className="cnt-info-grid">
            {infoCards.map((card, i) => (
              <div key={i} className="cnt-info-card cnt-reveal" style={{transitionDelay: `${i*0.1}s`}}>
                <div className="cnt-info-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                {card.details.map((detail, j) => <p key={j}>{detail}</p>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT FORM & MAP ===== */}
      <section className="cnt-form-section">
        <div className="cnt-container">
          <div className="cnt-form-grid">
            
            {/* Form Left */}
            <div className="cnt-form-left cnt-reveal">
              <span className="cnt-tag">Send Message</span>
              <h2>Let's Start a <span className="cnt-gold-text">Conversation</span></h2>
              <p>Fill in the form below and our team will get back to you within 24 hours.</p>

              <form onSubmit={handleSubmit} className="cnt-form">
                <div className="cnt-form-row">
                  <div className="cnt-field">
                    <input type="text" name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="cnt-field">
                    <input type="email" name="email" placeholder="Email Address *" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="cnt-form-row">
                  <div className="cnt-field">
                    <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} maxLength={10} />
                  </div>
                  <div className="cnt-field">
                    <input type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} />
                  </div>
                </div>
                <div className="cnt-field">
                  <textarea name="message" placeholder="Your Message *" rows="4" value={formData.message} onChange={handleChange} required></textarea>
                </div>
                <button type="submit" className="cnt-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "⏳ Sending..." : "Send Message 🚀"}
                </button>
              </form>
            </div>

            {/* Map & Details Right */}
            <div className="cnt-form-right cnt-reveal">
              <div className="cnt-map-card">
                <h3><FaMapMarkerAlt style={{ color: "#FFB703", marginRight: 8 }} /> Find Us Here</h3>
                <div className="cnt-map-box">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.7877584524736!2d83.19265877539618!3d23.126554579085797!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398500a2020cbe4b%3A0x27c1e2c9c5b0e5f6!2sAmbikapur%2C%20Chhattisgarh!5e0!3m2!1sen!2sin!4v1700000000000"
                    width="100%" height="220" style={{ border: 0 }} allowFullScreen="" loading="lazy" title="Location"
                  ></iframe>
                </div>

                <div className="cnt-social-links">
                  <h4>Connect With Us</h4>
                  <div className="cnt-social-icons">
                    {socialLinks.map((social, idx) => (
                      <a 
                        key={idx} href={social.href} target="_blank" rel="noopener noreferrer"
                        className="cnt-social-btn" style={{ '--hover-color': social.color }}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      {/* ===== BRANCHES ===== */}
      <section className="cnt-branches-section">
        <div className="cnt-container">
          <div className="cnt-heading cnt-reveal">
            <span className="cnt-tag">Our Presence</span>
            <h2>Visit Our <span className="cnt-gold-text">Branches</span></h2>
          </div>
          <div className="cnt-branches-grid">
            {branches.map((b, i) => (
              <div key={i} className="cnt-branch-card cnt-reveal" style={{transitionDelay: `${i*0.1}s`}}>
                <div className="cnt-branch-icon"><FaBuilding /></div>
                <h3>{b.name}</h3>
                <p>{b.address}</p>
                <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="cnt-branch-phone">
                  <FaPhoneAlt /> {b.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="cnt-faq-section">
        <div className="cnt-container">
          <div className="cnt-heading cnt-reveal">
            <span className="cnt-tag">FAQ</span>
            <h2>Frequently Asked <span className="cnt-gold-text">Questions</span></h2>
          </div>
          <div className="cnt-faq-grid cnt-reveal">
            {faqs.map((f, i) => (
              <div key={i} className="cnt-faq-card">
                <h4><span className="cnt-gold-text">Q.</span> {f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cnt-cta-section">
        <div className="cnt-container">
          <div className="cnt-cta-box cnt-reveal">
            <div className="cnt-cta-glow"></div>
            <h2>Ready to Get Started?</h2>
            <p>Join 13,000+ successful students who transformed their careers with us.</p>
            <div className="cnt-cta-btns">
              <Link to="/courses" onClick={goToTop} className="cnt-btn-gold">Explore Courses</Link>
              <Link to="/franchisee" onClick={goToTop} className="cnt-btn-glass">Become a Franchisee</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="cnt-float-wa">
        <FaWhatsapp />
      </a>
    </div>
  );
};

export default Contact;
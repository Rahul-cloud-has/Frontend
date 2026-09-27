import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope
} from "react-icons/fa";
import logo from "../../assets/image.png"; 
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Contact Details
  const CONTACT = {
    headOffice: "Ambikapur, Surguja, CG - 497001",
    regionalOffice: "Delhi, India",
    phone1: "+91 84630 65317",
    phone2: "+91 9301534399",
    email1: "eduskillvision@gmail.com",
    email2: "info@eduskillvision.com",
    whatsappNumber: "918463065317",
    whatsappMessage: encodeURIComponent("Hello EduSkillVision! I would like to know more about your courses.")
  };

  const handleNavigation = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-premium">
      <div className="footer-main">
        <div className="ft-container footer-grid">
          
          {/* COLUMN 1: BRAND & SOCIALS */}
          <div className="ft-col-brand">
            <Link to="/" className="ft-logo" onClick={handleNavigation}>
              <img src={logo} alt="EduSkillVision Logo" className="ft-logo-img" />
              <div className="ft-logo-text">
                <h3><span className="ft-blue">Edu</span><span className="ft-gold">Skill</span><span className="ft-blue">Vision</span></h3>
              </div>
            </Link>
            
            <p className="ft-desc">
              Empowering students with practical skills, career-focused training, and employment opportunities across India. Join 13,000+ successful students today.
            </p>
            <p className="ft-cin">CIN: U80900CT2023PTC014511</p>

            {/* Social Icons */}
            <div className="ft-socials">
              <a href={`https://wa.me/${CONTACT.whatsappNumber}?text=${CONTACT.whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="ft-social-link wa" title="WhatsApp">
                <FaWhatsapp />
              </a>
              <a href="https://instagram.com/eduskillvision" target="_blank" rel="noopener noreferrer" className="ft-social-link ig" title="Instagram">
                <FaInstagram />
              </a>
              <a href="https://facebook.com/eduskillvision" target="_blank" rel="noopener noreferrer" className="ft-social-link fb" title="Facebook">
                <FaFacebookF />
              </a>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS */}
          <div className="ft-col-links">
            <h4>QUICK LINKS</h4>
            <ul>
              <li><Link to="/" onClick={handleNavigation}>Home</Link></li>
              <li><Link to="/about" onClick={handleNavigation}>About Us</Link></li>
              <li><Link to="/courses" onClick={handleNavigation}>Our Courses</Link></li>
              <li><Link to="/franchisee" onClick={handleNavigation}>Get Franchise</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: REACH US */}
          <div className="ft-col-links ft-contact-info">
            <h4>REACH US</h4>
            <ul>
              <li>
                <FaPhoneAlt className="ft-icon" /> 
                <a href={`tel:${CONTACT.phone1.replace(/\s/g, '')}`}>{CONTACT.phone1}</a>
              </li>
              <li>
                <FaPhoneAlt className="ft-icon" /> 
                <a href={`tel:${CONTACT.phone2.replace(/\s/g, '')}`}>{CONTACT.phone2}</a>
              </li>
              <li>
                <FaEnvelope className="ft-icon" /> 
                <a href={`mailto:${CONTACT.email1}`}>{CONTACT.email1}</a>
              </li>

              {/* ✅ Head Office (Ambikapur) */}
              <li className="ft-address">
                <FaMapMarkerAlt className="ft-icon" /> 
                <span><strong>Head Office:</strong> {CONTACT.headOffice}</span>
              </li>

              {/* ✅ Regional Office (Delhi) */}
              <li className="ft-address">
                <FaMapMarkerAlt className="ft-icon" /> 
                <span><strong>Regional Office:</strong> {CONTACT.regionalOffice}</span>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: SUPPORT & LEGAL */}
          <div className="ft-col-links">
            <h4>SUPPORT & LEGAL</h4>
            <ul>
              <li><Link to="/contact" onClick={handleNavigation}>Contact Us</Link></li>
              <li><Link to="/privacy-policy" onClick={handleNavigation}>Privacy Policy</Link></li>
              <li><Link to="/terms" onClick={handleNavigation}>Terms of Service</Link></li>
              <li><Link to="/sitemap" onClick={handleNavigation}>Sitemap</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="footer-bottom">
        <div className="ft-container bottom-flex">
          <p>© {currentYear} <strong>EduSkillVision Education Pvt. Ltd.</strong> All rights reserved.</p>
          <p className="ft-credit">
            {/* Powered by <a href="https://dimensioninfotech.com" target="_blank" rel="noopener noreferrer">Dimension Infotech</a> */}
          </p>
        </div>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={`https://wa.me/${CONTACT.whatsappNumber}?text=${CONTACT.whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-wa"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp />
      </a>
    </footer>
  );
};

export default Footer;
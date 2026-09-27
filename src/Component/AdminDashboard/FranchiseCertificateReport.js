// FranchiseCertificateReport.jsx - Complete with Working Print
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL, apiConfig } from '../../Api';
import './FranchiseCertificateReport.css';

const FranchiseCertificateReport = () => {
  const [certificates, setCertificates] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // 📤 LOAD DATA
  // ============================================
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/franchise-certificates/`, apiConfig());
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (response.data?.data) data = response.data.data;
      else if (response.data?.results) data = response.data.results;

      data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setCertificates(data);
      setFilteredData(data);

      const courses = [...new Set(data.map(c => c.course_name || c.courseName).filter(Boolean))];
      setUniqueCourses(courses);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load certificates.');
      setCertificates([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ============================================
  // 🔍 FILTERS
  // ============================================
  useEffect(() => {
    let result = [...certificates];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.applicant_name || c.applicantName || '')?.toLowerCase().includes(term) ||
        (c.franchise_name || c.franchiseName || '')?.toLowerCase().includes(term) ||
        (c.father_name || c.fatherName || '')?.toLowerCase().includes(term) ||
        (c.cert_no || c.certNo || '')?.toLowerCase().includes(term) ||
        (c.franchise_code || c.franchiseCode || '')?.toLowerCase().includes(term) ||
        (c.course_name || c.courseName || '')?.toLowerCase().includes(term)
      );
    }
    if (filterCourse) {
      result = result.filter(c => (c.course_name || c.courseName) === filterCourse);
    }
    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, filterCourse, certificates]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleView = (cert) => {
    setSelectedCertificate(cert);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCertificate(null);
  };

  // ============================================
  // ✅ QR PATTERN
  // ============================================
  const generateQRPattern = () => {
    const size = 19;
    const grid = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let filled = false;
        if (r < 6 && c < 6) filled = (r < 2 || r > 3 || c < 2 || c > 3) || (r > 2 && r < 4 && c > 2 && c < 4);
        else if (r < 6 && c >= size - 6) filled = (r < 2 || r > 3 || c < size - 5 || c > size - 2) || (r > 2 && r < 4 && c > size - 5 && c < size - 2);
        else if (r >= size - 6 && c < 6) filled = (r < size - 5 || r > size - 2 || c < 2 || c > 3) || (r > size - 5 && r < size - 2 && c > 2 && c < 4);
        else filled = Math.random() > 0.5;
        grid.push(filled);
      }
    }
    return `<div style="width:100%;height:100%;display:grid;grid-template-columns:repeat(${size},1fr);grid-template-rows:repeat(${size},1fr);">
      ${grid.map(f => `<div style="background:${f ? '#1a2a5e' : 'white'};"></div>`).join('')}
    </div>`;
  };

  // ============================================
  // ✅ CERTIFICATE HTML - FIXED
  // ============================================
  const getCertificateHTML = (d) => {
    const hasPhoto = d.applicant_photo || d.applicantPhoto;
    const qrPattern = generateQRPattern();

    const socialLinks = d.social_links || d.socialLinks || [];
    const activeSocialLinks = socialLinks.filter(link => link.url && link.url.trim() !== '');

    const getSocialIcon = (platform) => {
      const icons = { 'Facebook': '📘', 'Instagram': '📷', 'YouTube': '▶️', 'LinkedIn': '💼' };
      return icons[platform] || '🔗';
    };

    const certNo = d.cert_no || d.certNo || 'ESV/FR/2026/001';
    const franchiseCode = d.franchise_code || d.franchiseCode || 'ESV/FRC/001';
    const applicantName = d.applicant_name || d.applicantName || 'Applicant Name';
    const franchiseName = d.franchise_name || d.franchiseName || 'Franchise Name';
    const courseName = d.course_name || d.courseName || 'Course Name';
    const companyName = d.company_name || d.companyName || 'EduSkillVision';
    const centerCoordinator = d.center_coordinator || d.centerCoordinator || 'Rahul Mishra';
    const director = d.director || 'Mr. Ajay Kumar Gupta';
    const headOffice = d.head_office || d.headOffice || 'Ambikapur, Surguja (C.G.) 497001';
    const regionalOffice = d.regional_office || d.regionalOffice || 'Bilaspur, Chhattisgarh';
    const phone = d.phone || '+91 91111 37575';
    const email = d.email || 'info@eduskillvision.com';
    const website = d.website || 'eduskillvision.com';
    const validityFrom = d.validity_from || d.validityFrom || '1st April 2026';
    const validityTo = d.validity_to || d.validityTo || '31st March 2027';
    const city = d.city || 'ASOLA/SURGUJA';
    const state = d.state || 'CHHATTISGARH';

    // ✅ Build social links HTML properly
    let socialLinksHTML = '';
    if (activeSocialLinks.length > 0) {
      socialLinksHTML = `<span style="color:rgba(255,255,255,0.15);">|</span>`;
      activeSocialLinks.forEach((link, idx) => {
        socialLinksHTML += `
          <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">
            ${link.icon || getSocialIcon(link.platform)} ${link.platform}
          </span>
          ${idx < activeSocialLinks.length - 1 ? '<span style="color:rgba(255,255,255,0.15);">|</span>' : ''}
        `;
      });
    } else {
      socialLinksHTML = `
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">📷 /eduskillvision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">f /eduskillvision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">▶ /EduSkillVision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">in /eduskillvision</span>
      `;
    }

    return `
    <div style="
      width:850px; height:1150px; 
      background: #ffffff;
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      box-sizing: border-box;
      padding: 40px 50px 38px;
      position: relative;
      border: 12px solid #1a2a5e;
    ">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:#ffffff;z-index:0;"></div>
      <div style="position:absolute;top:6px;left:6px;right:6px;bottom:6px;border:3px solid #c8a84e;z-index:1;pointer-events:none;"></div>
      <div style="position:absolute;top:16px;left:16px;right:16px;bottom:16px;border:1.5px solid rgba(200,168,78,0.35);z-index:1;pointer-events:none;"></div>

      <div style="position:relative;z-index:4;text-align:center;height:100%;display:flex;flex-direction:column;justify-content:space-between;align-items:center;">

        <div style="width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding:0 5px;">
            <div style="width:85px;text-align:left;">
              <div style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(145deg,#f0d060,#c8a84e);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.12);border:3px solid white;">
                  <span style="font-size:14px;font-weight:900;color:#1a2a5e;letter-spacing:0.5px;line-height:1;text-align:center;">
                    <span style="display:block;font-size:16px;">ESV</span>
                    <span style="display:block;font-size:6px;letter-spacing:1.5px;font-weight:700;">SKILL</span>
                  </span>
                </div>
              </div>
            </div>

            <div style="flex:1;text-align:center;padding:0 10px;">
              <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:28px;color:#c8a84e;font-weight:900;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">
                ${companyName}
              </div>
              <div style="font-size:10px;color:#1a2a5e;font-weight:600;letter-spacing:1px;margin-top:3px;font-family:Georgia,serif;font-style:italic;">
                Empowering Skills, Building Futures
              </div>
            </div>
            <div style="width:85px;"></div>
          </div>

          <div style="height:18px;"></div>

          <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:20px;color:#1a2a5e;font-weight:900;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">
            Certificate of Affiliation
          </div>

          <div style="display:flex;align-items:center;justify-content:center;margin:6px 0 10px;">
            <span style="width:50px;height:1.5px;background:linear-gradient(to right,transparent,#c8a84e,transparent);display:inline-block;"></span>
            <span style="color:#c8a84e;font-size:14px;margin:0 12px;">✦</span>
            <span style="width:50px;height:1.5px;background:linear-gradient(to right,transparent,#c8a84e,transparent);display:inline-block;"></span>
          </div>

          ${hasPhoto && hasPhoto.length > 100 ? `
            <div style="width:75px;height:90px;border:3px solid #1a2a5e;overflow:hidden;border-radius:4px;margin:0 auto 6px;background:white;">
              <img src="${hasPhoto}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          ` : `
            <div style="width:75px;height:90px;border:2px dashed #c8a84e;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#bbb;background:#fafafa;margin:0 auto 6px;">PHOTO</div>
          `}

          <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:18px;color:#c8a84e;font-weight:400;margin-bottom:2px;">
            ~ Certified that ~
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:2px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#1a2a5e;font-weight:900;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid rgba(200,168,78,0.3);padding-bottom:5px;text-align:center;">
              CENTRE MANAGER
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:2px 0 4px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;opacity:0.8;text-align:center;">
              ${applicantName}
            </div>
          </div>

          <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:18px;color:#c8a84e;font-weight:400;margin:4px 0 4px;letter-spacing:1px;">
            ~ runs the authorized affiliated ~
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:4px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:6px 30px;border-top:2px solid rgba(200,168,78,0.3);border-bottom:2px solid rgba(200,168,78,0.3);text-align:center;">
              ${franchiseName}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:3px 0;">
            <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:14px;color:#c8a84e;font-weight:700;letter-spacing:4px;text-transform:uppercase;background:rgba(200,168,78,0.08);padding:2px 20px;border-radius:20px;">
              (ESV CENTRE)
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:3px 0;">
            <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:16px;color:#c8a84e;font-weight:400;">
              of
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:20px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
              ${companyName}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:5px 0;">
            <div style="font-family:'Poppins',sans-serif;font-size:13px;color:#1a2a5e;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:6px 25px;border:2px solid #c8a84e;border-radius:25px;background:white;">
              for ${courseName}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:12px auto 0;">
            <div style="text-align:left;padding:8px 30px;background:#f8fafc;border-radius:8px;border:1px solid #eef2f6;min-width:300px;">
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Certificate No.</span>
                <span style="font-weight:600;color:#c8a84e;">${certNo}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Franchise Code</span>
                <span style="font-weight:600;color:#c8a84e;">${franchiseCode}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Validity</span>
                <span style="font-weight:600;color:#c8a84e;">${validityFrom} To ${validityTo}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">City/Dist</span>
                <span style="font-weight:600;color:#c8a84e;">${city}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">State</span>
                <span style="font-weight:600;color:#c8a84e;">${state}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="width:100%;">
          <div style="display:flex;align-items:center;justify-content:center;margin:0 0 6px;">
            <span style="width:25px;height:1px;background:#c8a84e;display:inline-block;"></span>
            <span style="color:#c8a84e;font-size:6px;margin:0 4px;">✧</span>
            <span style="width:25px;height:1px;background:#c8a84e;display:inline-block;"></span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;padding:0 10px;max-width:520px;margin:0 auto;">
            <div style="text-align:center;width:150px;">
              <div style="width:70px;height:1.5px;background:#1a2a5e;margin:0 auto 6px;"></div>
              <div style="font-size:10px;font-weight:700;color:#1a2a5e;">${centerCoordinator}</div>
              <div style="font-size:8px;color:#6b7a8f;">Centre Manager</div>
              <div style="font-size:7px;color:#c8a84e;font-weight:600;margin-top:2px;">✓ Verified</div>
            </div>

            <div style="text-align:center;width:85px;">
              <div style="width:65px;height:65px;margin:0 auto;border:2px solid #c8a84e;border-radius:4px;background:white;display:flex;align-items:center;justify-content:center;padding:3px;">
                ${qrPattern}
              </div>
              <div style="font-size:6px;color:#999;margin-top:1px;letter-spacing:0.5px;text-transform:uppercase;">Scan to Verify</div>
            </div>

            <div style="text-align:center;width:150px;">
              <div style="width:70px;height:1.5px;background:#1a2a5e;margin:0 auto 6px;"></div>
              <div style="font-size:10px;font-weight:700;color:#1a2a5e;">${director}</div>
              <div style="font-size:8px;color:#6b7a8f;">Director</div>
              <div style="font-size:7px;color:#c8a84e;font-weight:600;margin-top:2px;">✦ Authorized Signatory</div>
            </div>
          </div>

          <div style="text-align:center;margin-top:8px;padding:0 15px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#1a2a5e;font-weight:900;letter-spacing:1px;">
              ${companyName}
            </div>
            <div style="font-size:9px;color:#6b7a8f;line-height:1.5;font-family:Georgia,serif;font-weight:600;">
              <strong>Head Office :</strong> ${headOffice}
            </div>
            <div style="font-size:8px;color:#6b7a8f;line-height:1.4;font-family:Georgia,serif;font-weight:500;">
              <strong>Regional Office :</strong> ${regionalOffice}
            </div>
            <div style="display:inline-block;border:1.5px solid #c8a84e;padding:2px 15px;font-size:8px;font-weight:700;color:#1a2a5e;margin-top:4px;letter-spacing:0.5px;background:#fef9f0;border-radius:3px;">
              📞 ${phone} | ✉ ${email}
            </div>
          </div>

          <div style="margin-top:8px;background:#1a2a5e;display:flex;align-items:center;justify-content:center;padding:5px 12px;gap:6px;border-radius:5px;flex-wrap:wrap;border:1.5px solid #c8a84e;width:100%;max-width:700px;margin-left:auto;margin-right:auto;">
            <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">
              🌐 ${website}
            </span>
            ${socialLinksHTML}
          </div>
        </div>
      </div>
    </div>
    `;
  };

  // ============================================
  // 📥 DOWNLOAD PDF
  // ============================================
  const downloadPDF = async (data) => {
    setIsDownloading(true);
    try {
      const certHTML = getCertificateHTML(data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = certHTML;
      tempDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:850px;height:1150px;background:white;z-index:9999;';
      document.body.appendChild(tempDiv);
      await new Promise(r => setTimeout(r, 1500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 850,
        height: 1150,
        logging: false
      });
      document.body.removeChild(tempDiv);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [850, 1150],
        compress: true
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 850, 1150);
      pdf.save(`Franchise_Certificate_${(data.applicant_name || data.applicantName || 'certificate').replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('⚠️ Error generating PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================
  // 🖨️ PRINT - Fits Certificate on ONE PAGE
  // ============================================
  const handlePrint = (cert) => {
    const dataToPrint = cert || selectedCertificate;
    
    if (!dataToPrint) {
      alert('⚠️ Please select a certificate first!');
      return;
    }

    const certHTML = getCertificateHTML(dataToPrint);
    const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
    
    if (!printWindow) {
      alert('⚠️ Please allow popups for this website to print.');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${dataToPrint.applicant_name || dataToPrint.applicantName || 'Print'}</title>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            
            body {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            /* Certificate container - Fit to page */
            #cert-print-container {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0;
            }
            
            /* ✅ Scale certificate to fit A4 */
            #cert-print-container > div {
              transform-origin: center center;
              transform: scale(0.72);
            }
            
            /* ============ PRINT STYLES ============ */
            @page {
              size: A4 portrait;
              margin: 0;
              padding: 0;
            }
            
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              #cert-print-container {
                width: 210mm !important;
                height: 297mm !important;
                padding: 0 !important;
                margin: 0 !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                overflow: hidden !important;
              }
              
              /* ✅ Certificate SCALED to fit A4 - IMPORTANT */
              #cert-print-container > div {
                transform: scale(0.62) !important;
                transform-origin: center center !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
              }
              
              /* Hide any overflow */
              body > *:not(#cert-print-container) {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="cert-print-container">
            ${certHTML}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.addEventListener('afterprint', function() {
                  setTimeout(function() { window.close(); }, 500);
                });
              }, 1000);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  // ============================================
  // 🏷️ STATUS BADGE
  // ============================================
  const StatusBadge = ({ status }) => {
    const statusMap = {
      'Active': 'cert-status-active',
      'Inactive': 'cert-status-inactive',
      'Expired': 'cert-status-expired',
      'Generated': 'cert-status-generated'
    };
    const cls = statusMap[status] || 'cert-status-generated';
    return <span className={`cert-status-badge ${cls}`}>{status || 'Generated'}</span>;
  };

  // ============================================
  // ⏳ LOADING / ERROR
  // ============================================
  if (loading) {
    return (
      <div className="cert-report-container">
        <div className="cert-report-card">
          <div className="cert-report-loading">⏳ Loading franchise certificates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cert-report-container">
        <div className="cert-report-card">
          <div className="cert-report-error">
            <span>❌</span>
            <p>{error}</p>
            <button onClick={loadData}>🔄 Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="cert-report-container">
      <div className="cert-report-card">
        
        {/* Header */}
        <div className="cert-report-header">
          <div>
            <h2>🏢 Franchise Certificate Report</h2>
            <p>View all generated franchise certificates</p>
          </div>
          <div className="cert-report-actions">
            <button className="cert-btn-refresh" onClick={loadData} title="Refresh">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="cert-report-filters">
          <div className="filter-group" style={{ flex: 2 }}>
            <input
              type="text"
              className="cert-report-search"
              placeholder="🔍 Search by name, franchise, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              className="cert-report-select"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <button
            className="cert-report-reset"
            onClick={() => {
              setSearchTerm('');
              setFilterCourse('');
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Table */}
        <div className="cert-report-table-wrap">
          {filteredData.length === 0 ? (
            <div className="cert-report-empty">
              <span>🏢</span>
              <p>No franchise certificates found</p>
              <small>Generate franchise certificates to see them here</small>
            </div>
          ) : (
            <table className="cert-report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Certificate</th>
                  <th>Applicant</th>
                  <th>Franchise</th>
                  <th>Course</th>
                  <th>Franchise Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((cert, index) => (
                  <tr key={cert.id || index}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <span className="cert-report-id">
                        {cert.cert_no || cert.certNo || '-'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {(cert.applicant_photo || cert.applicantPhoto) && (
                          <img
                            src={cert.applicant_photo || cert.applicantPhoto}
                            alt=""
                            style={{ width: '22px', height: '26px', borderRadius: '3px', objectFit: 'cover' }}
                          />
                        )}
                        <strong>{cert.applicant_name || cert.applicantName || '-'}</strong>
                      </div>
                    </td>
                    <td>{cert.franchise_name || cert.franchiseName || '-'}</td>
                    <td><strong>{cert.course_name || cert.courseName || '-'}</strong></td>
                    <td>
                      <span className="grade-badge grade-aplus">
                        {cert.franchise_code || cert.franchiseCode || '-'}
                      </span>
                    </td>
                    <td><StatusBadge status={cert.status} /></td>
                    <td>
                      <div className="cert-report-actions-cell">
                        <button
                          className="cert-report-view-btn"
                          onClick={() => handleView(cert)}
                          title="View"
                        >
                          👁️
                        </button>
                        <button
                          className="cert-report-download-btn"
                          onClick={() => downloadPDF(cert)}
                          title="Download PDF"
                          disabled={isDownloading}
                        >
                          📥
                        </button>
                        <button
                          className="cert-report-print-btn"
                          onClick={() => handlePrint(cert)}
                          title="Print Certificate"
                        >
                          🖨️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="cert-report-pagination">
            <span className="cert-report-page-info">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
            </span>
            <div className="cert-report-page-btns">
              <button
                className="cert-report-page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >◀</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    className={`cert-report-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >{pageNum}</button>
                );
              })}
              <button
                className="cert-report-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >▶</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL - View Certificate ===== */}
      {showModal && selectedCertificate && (
        <div className="cert-report-modal-overlay" onClick={handleCloseModal}>
          <div className="cert-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-report-modal-header">
              <h3>📜 Certificate Preview</h3>
              <div className="cert-report-modal-actions">
                <button
                  className="btn-print-modal"
                  onClick={() => handlePrint(selectedCertificate)}
                  title="Print"
                >
                  🖨️ Print
                </button>
                <button
                  className="btn-pdf-modal"
                  onClick={() => downloadPDF(selectedCertificate)}
                  disabled={isDownloading}
                >
                  {isDownloading ? '⏳' : '📥 PDF'}
                </button>
                <button className="cert-report-modal-close" onClick={handleCloseModal}>✕</button>
              </div>
            </div>
            <div className="cert-report-modal-body">
              <div className="certificate-preview-wrapper">
                <div
                  className="certificate-preview-content"
                  dangerouslySetInnerHTML={{ __html: getCertificateHTML(selectedCertificate) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseCertificateReport;
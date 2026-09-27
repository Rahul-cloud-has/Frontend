// AdminCourses.jsx — Updated with Toast (No backend/API changes, only alerts/confirm/console replaced)
import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL, apiConfig } from "../../Api";
import "./AdminCourses.css";

/* ═══════════════════════════════════════════
   API BASE — Website endpoints prefix
═══════════════════════════════════════════ */
const WEBSITE_URL = `${API_URL}/website`;

/* ═══════════════════════════════════════════
   RESPONSE HANDLER
═══════════════════════════════════════════ */
const handleRes = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Server Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

/* ═══════════════════════════════════════════
   FETCH WRAPPER — Auto attach headers (with token)
═══════════════════════════════════════════ */
const fetchApi = (url, options = {}) => {
  const config = apiConfig();
  return fetch(url, {
    ...options,
    headers: {
      ...config.headers,
      ...(options.headers || {}),
    },
  }).then(handleRes);
};

/* ═══════════════════════════════════════════
   API METHODS — All using centralized config
═══════════════════════════════════════════ */
const API = {
  getCategories:   () => fetchApi(`${WEBSITE_URL}/categories/`),
  createCategory:  (d) => fetchApi(`${WEBSITE_URL}/categories/`,     { method: "POST", body: JSON.stringify(d) }),
  deleteCategory:  (id) => fetchApi(`${WEBSITE_URL}/categories/${id}/`, { method: "DELETE" }),

  getDurations:    () => fetchApi(`${WEBSITE_URL}/durations/`),
  createDuration:  (d) => fetchApi(`${WEBSITE_URL}/durations/`,     { method: "POST", body: JSON.stringify(d) }),
  deleteDuration:  (id) => fetchApi(`${WEBSITE_URL}/durations/${id}/`, { method: "DELETE" }),

  getCourses:      () => fetchApi(`${WEBSITE_URL}/courses/`),
  createCourse:    (d) => fetchApi(`${WEBSITE_URL}/courses/`,     { method: "POST", body: JSON.stringify(d) }),
  updateCourse:    (id, d) => fetchApi(`${WEBSITE_URL}/courses/${id}/`, { method: "PUT", body: JSON.stringify(d) }),
  deleteCourse:    (id) => fetchApi(`${WEBSITE_URL}/courses/${id}/`, { method: "DELETE" }),

  getEnquiries:    () => fetchApi(`${WEBSITE_URL}/enquiries/`),
  updateEnqStatus: (id, status) => fetchApi(`${WEBSITE_URL}/enquiries/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteEnquiry:   (id) => fetchApi(`${WEBSITE_URL}/enquiries/${id}/`, { method: "DELETE" }),
};

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const ROWS_PER_PAGE = 8;

const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#11998e,#38ef7d)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#6c5ce7,#a29bfe)",
  "linear-gradient(135deg,#00b894,#00cec9)",
];
const randomGradient = () => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

const EMPTY_COURSE = {
  name: "", category: "", duration: "", fee: "",
  total_payment: "", description: "", students: "",
  image: "", is_professional: false,
};

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
const AdminCourses = () => {
  const [categories, setCategories] = useState([]);
  const [durations,  setDurations]  = useState([]);
  const [courses,    setCourses]    = useState([]);
  const [enquiries,  setEnquiries]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [editId,     setEditId]     = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCatModal,    setShowCatModal]    = useState(false);
  const [showDurModal,    setShowDurModal]    = useState(false);
  const [newCatName,  setNewCatName]  = useState("");
  const [newCatIcon,  setNewCatIcon]  = useState("📚");
  const [newDurValue, setNewDurValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat,  setFilterCat]  = useState("all");
  const [activeView, setActiveView] = useState("courses");
  const [coursePage, setCoursePage] = useState(1);
  const [enqPage,    setEnqPage]    = useState(1);

  /* ═══ Toast Confirm Helper ═══ */
  const confirmAction = (label, onConfirm) => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: "6px", fontSize: "14px" }}>{label}</div>
          <div style={{ fontSize: "13px", marginBottom: "12px", color: "#64748b" }}>This action cannot be undone.</div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={closeToast}
              style={{ border: "none", borderRadius: "6px", padding: "7px 14px", background: "#e5e7eb", color: "#111827", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
            >Cancel</button>
            <button
              type="button"
              onClick={() => { closeToast(); onConfirm(); }}
              style={{ border: "none", borderRadius: "6px", padding: "7px 14px", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
            >Delete</button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, position: "top-center" }
    );
  };

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cats, durs, cors, enqs] = await Promise.all([
        API.getCategories(),
        API.getDurations(),
        API.getCourses(),
        API.getEnquiries(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setDurations(Array.isArray(durs)  ? durs : []);
      setCourses(Array.isArray(cors)    ? cors : []);
      setEnquiries(Array.isArray(enqs)  ? enqs : []);
    } catch (err) {
      setError(`⚠️ Cannot connect to server. Make sure Django is running at ${API_URL}`);
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Helpers ── */
  const getCatObj  = (catId) => categories.find((c) => String(c.id) === String(catId));
  const getDurLabel = (durId) => {
    const d = durations.find((dur) => String(dur.id) === String(durId));
    return d ? d.value : durId || "—";
  };

  const calcTotal = (fee) => {
    const n = parseInt(String(fee).replace(/\D/g, ""), 10);
    return n ? n + Math.round(n * 0.18) : "";
  };

  const handleFeeChange = (val) =>
    setCourseForm((p) => ({ ...p, fee: val, total_payment: calcTotal(val) }));

  /* ── Category CRUD ── */
  const handleAddCategory = async () => {
    if (!newCatName.trim()) { toast.error("Enter category name"); return; }
    setSaving(true);
    try {
      const created = await API.createCategory({
        label: newCatName.trim(), icon: newCatIcon || "📚", gradient: randomGradient(),
      });
      setCategories((prev) => [...prev, created]);
      setCourseForm((p) => ({ ...p, category: created.id }));
      setNewCatName(""); setNewCatIcon("📚"); setShowCatModal(false);
    } catch (err) { toast.error("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteCategory = (id) => {
    confirmAction("Delete this category?", async () => {
      try {
        await API.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (err) { toast.error("Failed: " + err.message); }
    });
  };

  /* ── Duration CRUD ── */
  const handleAddDuration = async () => {
    if (!newDurValue.trim()) { toast.error("Enter duration"); return; }
    setSaving(true);
    try {
      const created = await API.createDuration({ value: newDurValue.trim() });
      setDurations((prev) => [...prev, created]);
      setCourseForm((p) => ({ ...p, duration: created.id }));
      setNewDurValue(""); setShowDurModal(false);
    } catch (err) { toast.error("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteDuration = (id) => {
    confirmAction("Delete this duration?", async () => {
      try {
        await API.deleteDuration(id);
        setDurations((prev) => prev.filter((d) => d.id !== id));
      } catch (err) { toast.error("Failed: " + err.message); }
    });
  };

  /* ── Course CRUD ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.name.trim()) { toast.error("Course name required"); return; }
    if (!courseForm.category)    { toast.error("Select a category");    return; }
    if (!courseForm.duration)    { toast.error("Select a duration");    return; }
    if (!courseForm.fee)         { toast.error("Fee required");         return; }

    const payload = {
      name:            courseForm.name,
      category:        courseForm.category,
      duration:        courseForm.duration,
      fee:             courseForm.fee,
      total_payment:   courseForm.total_payment || calcTotal(courseForm.fee),
      description:     courseForm.description,
      students:        courseForm.students,
      image:           courseForm.image,
      is_professional: courseForm.is_professional,
    };

    setSaving(true);
    try {
      if (editId) {
        const updated = await API.updateCourse(editId, payload);
        setCourses((prev) => prev.map((c) => c.id === editId ? updated : c));
        toast.success("Course updated successfully!");
      } else {
        const created = await API.createCourse(payload);
        setCourses((prev) => [...prev, created]);
        toast.success("Course added successfully!");
      }
      setCourseForm(EMPTY_COURSE); setEditId(null); setShowForm(false);
    } catch (err) { toast.error("Failed to save course: " + err.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (course) => {
    setCourseForm({
      name:            course.name            || "",
      category:        course.category        || "",
      duration:        course.duration        || "",
      fee:             course.fee             || "",
      total_payment:   course.total_payment   || calcTotal(course.fee),
      description:     course.description     || "",
      students:        course.students        || "",
      image:           course.image           || "",
      is_professional: course.is_professional || false,
    });
    setEditId(course.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    confirmAction("Delete this course?", async () => {
      try {
        await API.deleteCourse(id);
        setCourses((prev) => prev.filter((c) => c.id !== id));
      } catch (err) { toast.error("Failed: " + err.message); }
    });
  };

  const clearForm = () => { setCourseForm(EMPTY_COURSE); setEditId(null); };
  const closeForm = () => { clearForm(); setShowForm(false); };

  /* ── Enquiry ── */
  const handleStatusChange = async (id, status) => {
    try {
      const updated = await API.updateEnqStatus(id, status);
      setEnquiries((prev) => prev.map((e) => e.id === id ? updated : e));
    } catch (err) { toast.error("Status update failed: " + err.message); }
  };

  const handleDeleteEnquiry = (id) => {
    confirmAction("Delete this enquiry?", async () => {
      try {
        await API.deleteEnquiry(id);
        setEnquiries((prev) => prev.filter((e) => e.id !== id));
      } catch (err) { toast.error("Failed: " + err.message); }
    });
  };

  /* ── Filter & Pagination ── */
  const filtered = courses.filter((c) => {
    const q = searchTerm.toLowerCase();
    const cat = getCatObj(c.category);
    const ok = !q ||
      (c.name     || "").toLowerCase().includes(q) ||
      (cat?.label || "").toLowerCase().includes(q) ||
      String(c.fee || "").includes(q);
    return ok && (filterCat === "all" || String(c.category) === String(filterCat));
  });

  const filteredEnq = enquiries.filter((e) => {
    const q = searchTerm.toLowerCase();
    return !q ||
      (e.student_name || "").toLowerCase().includes(q) ||
      (e.course_name  || "").toLowerCase().includes(q) ||
      (e.mobile       || "").includes(q);
  });

  const totalCoursePages = Math.ceil(filtered.length    / ROWS_PER_PAGE) || 1;
  const totalEnqPages    = Math.ceil(filteredEnq.length / ROWS_PER_PAGE) || 1;
  const paginatedCourses = filtered.slice((coursePage - 1) * ROWS_PER_PAGE, coursePage * ROWS_PER_PAGE);
  const paginatedEnq     = filteredEnq.slice((enqPage - 1) * ROWS_PER_PAGE, enqPage * ROWS_PER_PAGE);
  const newEnqCount      = enquiries.filter((e) => e.status === "new").length;

  /* ═══ LOADING STATE ═══ */
  if (loading) {
    return (
      <div className="ac-page">
        <div className="ac-loading-wrap">
          <div className="ac-loading-spinner" />
          <p>Loading data from server...</p>
        </div>
      </div>
    );
  }

  /* ═══ MAIN RENDER ═══ */
  return (
    <div className="ac-page">
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {error && (
        <div className="ac-error-bar">
          {error}
          <button onClick={fetchAll} style={{
            marginLeft: 10, background: "transparent",
            border: "1px solid #dc2626", color: "#dc2626",
            padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 10
          }}>Retry</button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ac-top-header">
        <div className="ac-top-title">
          <span className="ac-top-icon">📚</span>
          <h1>Course Management</h1>
        </div>
        <div className="ac-top-actions">
          <button className="ac-manage-btn" onClick={() => setShowManageModal(true)}>⚙️ Manage</button>
          {showForm
            ? <button className="ac-close-form-btn" onClick={closeForm}>✕ Close Form</button>
            : <button className="ac-close-form-btn" onClick={() => setShowForm(true)}>➕ Add Course</button>
          }
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="ac-stats-row">
        <div className="ac-stat-box"><span>{categories.length}</span><p>Categories</p></div>
        <div className="ac-stat-box"><span>{durations.length}</span><p>Durations</p></div>
        <div className="ac-stat-box"><span>{courses.length}</span><p>Courses</p></div>
        <div className={`ac-stat-box ${newEnqCount > 0 ? "glow" : ""}`}><span>{newEnqCount}</span><p>New Enquiries</p></div>
        <div className="ac-stat-box"><span>{enquiries.length}</span><p>Total Enquiries</p></div>
      </div>

      {/* ── View Toggle ── */}
      <div className="ac-view-toggle">
        <button
          className={`ac-view-btn ${activeView === "courses" ? "active" : ""}`}
          onClick={() => { setActiveView("courses"); setSearchTerm(""); setCoursePage(1); }}
        >📚 Courses ({courses.length})</button>
        <button
          className={`ac-view-btn ${activeView === "enquiries" ? "active" : ""}`}
          onClick={() => { setActiveView("enquiries"); setSearchTerm(""); setEnqPage(1); }}
        >
          📋 Enquiries {newEnqCount > 0 && <span className="ac-badge">{newEnqCount}</span>}
        </button>
      </div>

      {/* ══ COURSES VIEW ══ */}
      {activeView === "courses" && (
        <>
          {showForm && (
            <div className="ac-form-card">
              <div className="ac-form-header">
                <h3>{editId ? "✏️ Edit Course" : "➕ Add New Course"}</h3>
              </div>
              <form onSubmit={handleSubmit} className="ac-form">

                <div className="ac-row">
                  <div className="ac-field">
                    <label>Category <span className="req">*</span></label>
                    <div className="ac-input-with-btn">
                      <select value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} required>
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                      <button type="button" className="ac-add-inline-btn"
                        onClick={() => setShowCatModal(true)}>+</button>
                    </div>
                  </div>
                  <div className="ac-field">
                    <label>Course Name <span className="req">*</span></label>
                    <input value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      placeholder="e.g. Web Development" required />
                  </div>
                </div>

                <div className="ac-row">
                  <div className="ac-field">
                    <label>Duration <span className="req">*</span></label>
                    <div className="ac-input-with-btn">
                      <select value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} required>
                        <option value="">Select Duration</option>
                        {durations.map((d) => (
                          <option key={d.id} value={d.id}>{d.value}</option>
                        ))}
                      </select>
                      <button type="button" className="ac-add-inline-btn"
                        onClick={() => setShowDurModal(true)}>+</button>
                    </div>
                  </div>
                  <div className="ac-field">
                    <label>Fee (₹) <span className="req">*</span></label>
                    <input type="number" value={courseForm.fee}
                      onChange={(e) => handleFeeChange(e.target.value)}
                      placeholder="e.g. 15000" required />
                  </div>
                </div>

                <div className="ac-row">
                  <div className="ac-field">
                    <label>Total Payment <small>+18% GST (auto)</small></label>
                    <input
                      value={courseForm.total_payment
                        ? `₹ ${Number(courseForm.total_payment).toLocaleString("en-IN")}` : ""}
                      readOnly className="ac-readonly" placeholder="Auto-calculated" />
                  </div>
                  <div className="ac-field">
                    <label>Description</label>
                    <input value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Optional short description" />
                  </div>
                </div>

                <div className="ac-row three">
                  <div className="ac-field">
                    <label>Students</label>
                    <input value={courseForm.students}
                      onChange={(e) => setCourseForm({ ...courseForm, students: e.target.value })}
                      placeholder="e.g. 2,500+" />
                  </div>
                  <div className="ac-field">
                    <label>Image URL</label>
                    <input value={courseForm.image}
                      onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })}
                      placeholder="https://..." />
                  </div>
                  <div className="ac-field">
                    <label>&nbsp;</label>
                    <label className="ac-check">
                      <input type="checkbox" checked={courseForm.is_professional}
                        onChange={(e) => setCourseForm({ ...courseForm, is_professional: e.target.checked })} />
                      ⭐ Professional
                    </label>
                  </div>
                </div>

                <div className="ac-form-btns">
                  <button type="submit" className="ac-add-btn-green" disabled={saving}>
                    {saving ? "⏳ Saving..." : editId ? "✏️ Update Course" : "➕ Add Course"}
                  </button>
                  <button type="button" className="ac-clear-btn" onClick={clearForm}>Clear</button>
                </div>
              </form>
            </div>
          )}

          <div className="ac-toolbar">
            <div className="ac-search-box">
              <span className="search-icon">🔍</span>
              <input value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCoursePage(1); }}
                placeholder="Search by name, category, fee..." />
              {searchTerm && <button onClick={() => setSearchTerm("")}>✕</button>}
            </div>
            <select className="ac-filter-sel" value={filterCat}
              onChange={(e) => { setFilterCat(e.target.value); setCoursePage(1); }}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="ac-report-card">
            <div className="ac-report-head">
              <h3>📋 Course List</h3>
              <span className="ac-count-chip">{filtered.length} courses</span>
            </div>
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Course Name</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Fee</th>
                    <th>Total (GST)</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="ac-empty-td">
                        <span>📭</span>
                        <p>No courses found. Click "Add Course" to get started.</p>
                      </td>
                    </tr>
                  ) : paginatedCourses.map((course, idx) => {
                    const cat    = getCatObj(course.category);
                    const rowNum = (coursePage - 1) * ROWS_PER_PAGE + idx + 1;
                    return (
                      <tr key={course.id}>
                        <td className="td-num">{rowNum}</td>
                        <td>
                          {course.is_professional && <span className="td-pro-icon">⭐</span>}
                          <span className="td-name">{course.name}</span>
                          {course.description && <span className="td-desc">{course.description}</span>}
                        </td>
                        <td>
                          {cat
                            ? <span className="td-cat-badge" style={{ background: cat.gradient }}>{cat.icon} {cat.label}</span>
                            : "—"}
                        </td>
                        <td className="td-dur">{getDurLabel(course.duration)}</td>
                        <td className="td-fee">₹{Number(course.fee || 0).toLocaleString("en-IN")}</td>
                        <td className="td-fee">₹{Number(course.total_payment || 0).toLocaleString("en-IN")}</td>
                        <td className="td-students">{course.students || "—"}</td>
                        <td>
                          <div className="td-actions">
                            <button className="ac-icon-btn ac-edit-ico" onClick={() => handleEdit(course)} title="Edit">✏️</button>
                            <button className="ac-icon-btn ac-del-ico" onClick={() => handleDelete(course.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > ROWS_PER_PAGE && (
              <div className="ac-pagination">
                <span className="ac-page-info">
                  {((coursePage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(coursePage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="ac-page-btns">
                  <button disabled={coursePage === 1} onClick={() => setCoursePage((p) => p - 1)}>← Prev</button>
                  <span className="ac-page-num">{coursePage}/{totalCoursePages}</span>
                  <button disabled={coursePage === totalCoursePages} onClick={() => setCoursePage((p) => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ ENQUIRIES VIEW ══ */}
      {activeView === "enquiries" && (
        <>
          <div className="ac-toolbar">
            <div className="ac-search-box">
              <span className="search-icon">🔍</span>
              <input value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setEnqPage(1); }}
                placeholder="Search by name, course, mobile..." />
              {searchTerm && <button onClick={() => setSearchTerm("")}>✕</button>}
            </div>
            <div className="ac-enq-pills">
              {["new", "contacted", "enrolled", "rejected"].map((s) => (
                <span key={s} className={`ac-pill ac-pill-${s}`}>
                  {enquiries.filter((e) => e.status === s).length} {s}
                </span>
              ))}
            </div>
          </div>

          <div className="ac-report-card">
            <div className="ac-report-head">
              <h3>📋 Enquiry List</h3>
              <span className="ac-count-chip">{filteredEnq.length} total</span>
            </div>
            <div className="ac-table-scroll">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>#</th><th>Student</th><th>Course</th><th>Mobile</th>
                    <th>Email</th><th>Location</th><th>Status</th><th>Date</th><th>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnq.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="ac-empty-td">
                        <span>📭</span><p>No enquiries yet</p>
                      </td>
                    </tr>
                  ) : paginatedEnq.map((enq, idx) => {
                    const rowNum = (enqPage - 1) * ROWS_PER_PAGE + idx + 1;
                    return (
                      <tr key={enq.id} className={`enq-${enq.status}`}>
                        <td className="td-num">{rowNum}</td>
                        <td className="td-name">{enq.student_name}</td>
                        <td style={{ fontSize: 11, color: "#475569", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {enq.course_name}
                        </td>
                        <td><a href={`tel:${enq.mobile}`} className="td-phone">{enq.mobile}</a></td>
                        <td>
                          {enq.email
                            ? <a href={`mailto:${enq.email}`} className="td-email">{enq.email}</a>
                            : "—"}
                        </td>
                        <td className="td-loc">{[enq.city, enq.state].filter(Boolean).join(", ") || "—"}</td>
                        <td>
                          <select className={`ac-status sel-${enq.status}`} value={enq.status}
                            onChange={(e) => handleStatusChange(enq.id, e.target.value)}>
                            <option value="new">🔵 New</option>
                            <option value="contacted">🟡 Contacted</option>
                            <option value="enrolled">🟢 Enrolled</option>
                            <option value="rejected">🔴 Rejected</option>
                          </select>
                        </td>
                        <td className="td-date">
                          {enq.created_at
                            ? new Date(enq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                            : "—"}
                        </td>
                        <td>
                          <button className="ac-icon-btn ac-del-ico"
                            onClick={() => handleDeleteEnquiry(enq.id)} title="Delete">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredEnq.length > ROWS_PER_PAGE && (
              <div className="ac-pagination">
                <span className="ac-page-info">
                  {((enqPage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(enqPage * ROWS_PER_PAGE, filteredEnq.length)} of {filteredEnq.length}
                </span>
                <div className="ac-page-btns">
                  <button disabled={enqPage === 1} onClick={() => setEnqPage((p) => p - 1)}>← Prev</button>
                  <span className="ac-page-num">{enqPage}/{totalEnqPages}</span>
                  <button disabled={enqPage === totalEnqPages} onClick={() => setEnqPage((p) => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ MANAGE MODAL ══ */}
      {showManageModal && (
        <div className="ac-modal-back" onClick={() => setShowManageModal(false)}>
          <div className="ac-modal ac-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-head">
              <h3>⚙️ Manage Categories & Durations</h3>
              <button onClick={() => setShowManageModal(false)}>✕</button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-manage-block">
                <div className="ac-manage-block-head">
                  <h4>📂 Categories ({categories.length})</h4>
                  <button className="ac-manage-add-btn" onClick={() => setShowCatModal(true)}>➕ Add</button>
                </div>
                <div className="ac-chips-grid">
                  {categories.length === 0
                    ? <p className="ac-manage-empty">No categories yet</p>
                    : categories.map((c) => (
                        <span key={c.id} className="ac-chip" style={{ background: c.gradient }}>
                          {c.icon} {c.label}
                          <button onClick={() => handleDeleteCategory(c.id)}>✕</button>
                        </span>
                      ))
                  }
                </div>
              </div>
              <div className="ac-manage-block">
                <div className="ac-manage-block-head">
                  <h4>⏱️ Durations ({durations.length})</h4>
                  <button className="ac-manage-add-btn" onClick={() => setShowDurModal(true)}>➕ Add</button>
                </div>
                <div className="ac-chips-grid">
                  {durations.length === 0
                    ? <p className="ac-manage-empty">No durations yet</p>
                    : durations.map((d) => (
                        <span key={d.id} className="ac-chip-plain">
                          ⏱️ {d.value}
                          <button onClick={() => handleDeleteDuration(d.id)}>✕</button>
                        </span>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ CATEGORY MODAL ══ */}
      {showCatModal && (
        <div className="ac-modal-back" onClick={() => setShowCatModal(false)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-head">
              <h3>➕ Add Category</h3>
              <button onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-field">
                <label>Name <span className="req">*</span></label>
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. IT & Computer" autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
              </div>
              <div className="ac-field">
                <label>Icon (Emoji)</label>
                <input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="💻" maxLength={3} />
              </div>
              <div className="ac-modal-btns">
                <button className="ac-add-btn-green" onClick={handleAddCategory} disabled={saving}>
                  {saving ? "⏳ Adding..." : "✅ Add Category"}
                </button>
                <button className="ac-clear-btn" onClick={() => setShowCatModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DURATION MODAL ══ */}
      {showDurModal && (
        <div className="ac-modal-back" onClick={() => setShowDurModal(false)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-head">
              <h3>➕ Add Duration</h3>
              <button onClick={() => setShowDurModal(false)}>✕</button>
            </div>
            <div className="ac-modal-body">
              <div className="ac-field">
                <label>Duration <span className="req">*</span></label>
                <input value={newDurValue} onChange={(e) => setNewDurValue(e.target.value)}
                  placeholder="e.g. 6 Months" autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddDuration()} />
              </div>
              <div className="ac-modal-btns">
                <button className="ac-add-btn-green" onClick={handleAddDuration} disabled={saving}>
                  {saving ? "⏳ Adding..." : "✅ Add Duration"}
                </button>
                <button className="ac-clear-btn" onClick={() => setShowDurModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCourses;
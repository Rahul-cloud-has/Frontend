import React from "react";
import "./CategoryCards.css";

// Photo cards for the course categories. Shared by Home (limit=4) and Courses (all 8).
// The card itself is not a link; its Enroll button opens the enrollment form.
const CategoryCards = ({ categories, limit, onEnroll }) => {
  const visible = limit ? categories.slice(0, limit) : categories;
  return (
    <div className="cat-cards">
      {visible.map((cat, idx) => (
        <div
          key={cat.id}
          className="cat-card"
          style={{ animationDelay: `${(idx % 4) * 0.08}s` }}
        >
          <div className="cat-card-img">
            <img src={cat.image} alt={cat.label} loading="lazy" />
          </div>
          <div className="cat-card-info">
            <h3>{cat.label}</h3>
            <div className="cat-card-footer">
              <span className="cat-card-count">
                {cat.courses.length > 0
                  ? `${cat.courses.length} ${cat.courses.length === 1 ? "Program" : "Programs"}`
                  : ""}
              </span>
              <button type="button" className="cat-card-enroll" onClick={() => onEnroll(cat.id)}>
                Enroll Now →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryCards;

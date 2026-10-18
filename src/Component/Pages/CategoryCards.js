import React from "react";
import "./CategoryCards.css";

// Photo cards for the course categories. Shared by Home (limit=4) and Courses (all 8).
const CategoryCards = ({ categories, limit, onSelect }) => {
  const visible = limit ? categories.slice(0, limit) : categories;
  return (
    <div className="cat-cards">
      {visible.map((cat, idx) => (
        <button
          type="button"
          key={cat.id}
          className="cat-card"
          style={{ animationDelay: `${(idx % 4) * 0.08}s` }}
          onClick={() => onSelect(cat.id)}
        >
          <div className="cat-card-img">
            <img src={cat.image} alt={cat.label} loading="lazy" />
          </div>
          <div className="cat-card-info">
            <h3>{cat.label}</h3>
            <span>
              {cat.courses.length > 0
                ? `${cat.courses.length} ${cat.courses.length === 1 ? "Program" : "Programs"} →`
                : "Explore →"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CategoryCards;

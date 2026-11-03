import imgCake from "../../assets/categories/cake.jpg";
import imgComputer from "../../assets/categories/computer.jpg";
import imgElectrician from "../../assets/categories/electrician.jpg";
import imgMehandi from "../../assets/categories/mehandi.jpg";
import imgTailoring from "../../assets/categories/tailoring.jpg";
import imgAccounting from "../../assets/categories/accounting.jpg";
import imgPlumbing from "../../assets/categories/plumbing.jpg";
import imgBeautician from "../../assets/categories/beautician.jpg";

// The 8 course categories the client wants on the public site. API categories are
// merged into a card by label keyword, so renamed/misspelled duplicates
// (e.g. "CAKE MAKING & BAKING COURCE") still land on the right card.
export const CATEGORY_CARDS = [
  { key: "cake", label: "CAKE MAKING & BAKING COURSE", icon: "🎂", keywords: ["cake", "bak"], image: imgCake },
  { key: "electrician", label: "ELECTRICIAN CERTIFICATE COURSE", icon: "⚡", keywords: ["electric"], image: imgElectrician },
  { key: "mehandi", label: "MEHENDI DESIGNING COURSE", icon: "🖐️", keywords: ["mehandi", "mehendi", "mehndi", "henna"], image: imgMehandi },
  { key: "tally", label: "TALLY & ACCOUNTING CERTIFICATE COURSE", icon: "📒", keywords: ["tally", "account"], image: imgAccounting },
  { key: "plumbing", label: "PLUMBING CERTIFICATE COURSE", icon: "🔧", keywords: ["plumb"], image: imgPlumbing },
  { key: "beautician", label: "COMPLETE BEAUTY & SALON CERTIFICATE COURSE", icon: "💄", keywords: ["beauti", "salon", "parlour", "parlor"], image: imgBeautician },
  { key: "tailoring", label: "TAILORING & DRESS DESIGNING COURSE", icon: "🧵", keywords: ["tailor", "dress"], image: imgTailoring },
  { key: "computer", label: "COMPUTER CERTIFICATE COURSE", icon: "💻", keywords: ["comput", "program"], image: imgComputer },
];

export const findCardKey = (label = "") => {
  const text = String(label).toLowerCase();
  return CATEGORY_CARDS.find((card) => card.keywords.some((k) => text.includes(k)))?.key;
};

// Always returns the 8 client categories, each with the API courses that belong to it.
export const buildCategories = (apiCategories, apiCourses, getDurLabel) =>
  CATEGORY_CARDS.map((card) => {
    const apiCatIds = apiCategories
      .filter((cat) => findCardKey(cat.label) === card.key)
      .map((cat) => String(cat.id));
    return {
      id: card.key,
      label: card.label,
      icon: card.icon,
      image: card.image,
      apiCatIds,
      courses: apiCourses
        .filter((c) => apiCatIds.includes(String(c.category)))
        .map((c) => ({
          ...c,
          icon: card.icon,
          duration: getDurLabel(c.duration),
          students: c.students || "N/A",
          fee: c.fee ? `₹${Number(c.fee).toLocaleString("en-IN")}` : "—",
          isProfessional: c.is_professional || false,
          categoryLabel: card.label,
          categoryIcon: card.icon,
          categoryImage: card.image,
          image: c.image || "",
          description: c.description || "",
        })),
    };
  });

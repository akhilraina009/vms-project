const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../frontend/src/ITVisitors.jsx");
let content = fs.readFileSync(filePath, "utf8");

// 1. Ensure CSS and Lucide icon imports
if (!content.includes('import "./ITVisit.css";')) {
  content = content.replace(
    'import { useCallback, useEffect, useState, useRef } from "react";',
    'import { useCallback, useEffect, useState, useRef } from "react";\nimport "./ITVisit.css";'
  );
}

// Add new lucide icons
const lucideImports = [
  "Smartphone",
  "Scan",
  "Columns",
  "ArrowRightCircle",
  "ArrowRight"
];
lucideImports.forEach(icon => {
  if (!content.includes(icon + ",")) {
    content = content.replace(
      'Laptop,',
      `Laptop,\n  ${icon},`
    );
  }
});

// 2. Add SVG and helper functions before `export default function ITVisitors()`
const helpers = `
function categorizeAsset(asset) {
  const text = \`\${asset?.asset_type || ""} \${asset?.brand_model || ""}\`.toLowerCase();
  if (
    text.includes("laptop") ||
    text.includes("notebook") ||
    text.includes("macbook") ||
    text.includes("thinkpad") ||
    text.includes("computer") ||
    text.includes("pc")
  ) {
    return "Laptop";
  }
  if (
    text.includes("mobile") ||
    text.includes("phone") ||
    text.includes("iphone") ||
    text.includes("android") ||
    text.includes("tablet") ||
    text.includes("ipad") ||
    text.includes("smartphone")
  ) {
    return "Mobile";
  }
  return "Others";
}

function getFormattedVisitId(visit, visitorId) {
  if (visit?.pass_number) return visit.pass_number;
  const vid = String(visit?.visit_id || visitorId || "001");
  if (vid.startsWith("V-")) return vid;
  const clean = vid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const dateStr = visit?.check_in_time
    ? new Date(visit.check_in_time).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return \`V-\${dateStr}-\${clean.slice(-3) || "001"}\`;
}

function Laptop3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="34" cy="48" rx="28" ry="6" fill="#bfdbfe" fillOpacity="0.45" />
      <path d="M12 36L22 10C22.5 8.5 24 7.5 25.5 7.5H48.5C50 7.5 51.5 8.5 52 10L60 36H12Z" fill="#3b82f6" />
      <path d="M14 34L23 12C23.3 11 24.2 10 25.5 10H47C48.2 10 49.2 11 49.5 12L56 34H14Z" fill="#1e40af" />
      <rect x="25" y="14" width="20" height="15" rx="2" fill="#60a5fa" fillOpacity="0.8" />
      <path d="M28 18H40M28 22H36" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 38C6 36.5 7.2 35.5 8.7 35.5H59.3C60.8 35.5 62 36.5 62 38L64 43C64 44.5 62.8 45.5 61.3 45.5H6.7C5.2 45.5 4 44.5 4 43L6 38Z" fill="#93c5fd" />
      <path d="M8 38H60L58 42H10L8 38Z" fill="#dbeafe" />
      <rect x="29" y="39" width="10" height="2" rx="1" fill="#60a5fa" />
    </svg>
  );
}

function PackageCheck3DIcon() {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="48" rx="26" ry="6" fill="#bbf7d0" fillOpacity="0.5" />
      <path d="M12 24L32 12L52 24L32 36L12 24Z" fill="#4ade80" />
      <path d="M12 24L32 36V48L12 36V24Z" fill="#22c55e" />
      <path d="M52 24L32 36V48L52 36V24Z" fill="#16a34a" />
      <path d="M32 12L24 8L16 16L24 20L32 12Z" fill="#86efac" />
      <path d="M32 12L40 8L48 16L40 20L32 12Z" fill="#86efac" />
      <circle cx="46" cy="40" r="11" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M42 40L45 43L50 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssetFallbackIcon({ category }) {
  if (category === "Laptop") {
    return (
      <svg width="26" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="#eff6ff" />
        <path d="M2 18h20v2H2z" fill="#93c5fd" />
      </svg>
    );
  }
  if (category === "Mobile") {
    return (
      <svg width="22" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#f0fdf4" />
        <circle cx="12" cy="18" r="1" fill="#16a34a" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" fill="#fffbeb" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
`;

if (!content.includes("function categorizeAsset")) {
  content = content.replace("export default function ITVisitors() {", helpers + "\nexport default function ITVisitors() {");
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Imports and helper functions inserted successfully.");

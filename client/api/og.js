/**
 * GET /api/og — crawler-only preview cards for WhatsApp/Telegram/Facebook.
 *
 * WhatsApp's crawler reads og: tags WITHOUT running JavaScript, so the SPA's
 * static index.html can only ever show one generic card. Vercel rewrites
 * crawler user-agents here (see vercel.json); humans keep the SPA untouched.
 * All metadata is derived from the URL itself — no backend dependency, so
 * this can never time out or 500 on a crawler.
 */

const SITE_URL = "https://usequire.vercel.app";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = "Quire";
const DEFAULT_TITLE = "Quire — A quire for every course";
const DEFAULT_DESCRIPTION =
  "Community-built library for Uniuyo engineering — past questions, lecture notes, and textbooks by course.";

const CATEGORY_LABELS = {
  all: "All materials",
  textBook: "Textbooks",
  pastQuestion: "Past questions",
  lectureNote: "Lecture notes",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prettifySlug(slug) {
  return String(slug || "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Canonical department names so shared filtered links read
// "Computer Engineering", never "CPE" or "Cpe". Accepts URL slugs,
// legacy shortNames (any case), and full names (pass-through).
const DEPARTMENTS_BY_SLUG = {
  "agricultural-engineering": "Agricultural Engineering",
  "chemical-engineering": "Chemical Engineering",
  "civil-engineering": "Civil Engineering",
  "computer-engineering": "Computer Engineering",
  "electrical-electronic-engineering": "Electrical and Electronics Engineering",
  "food-engineering": "Food Engineering",
  "mechanical-engineering": "Mechanical Engineering",
  "petroleum-engineering": "Petroleum Engineering",
};

const DEPARTMENTS_BY_SHORTNAME = {
  AGE: "Agricultural Engineering",
  CHE: "Chemical Engineering",
  CVE: "Civil Engineering",
  CPE: "Computer Engineering",
  ELE: "Electrical and Electronics Engineering",
  FDE: "Food Engineering",
  MEE: "Mechanical Engineering",
  PEE: "Petroleum Engineering",
};

function departmentName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return (
    DEPARTMENTS_BY_SLUG[raw.toLowerCase()] ||
    DEPARTMENTS_BY_SHORTNAME[raw.toUpperCase()] ||
    prettifySlug(raw)
  );
}

/**
 * Build the card for a path+query. Vercel passes the original page as
 * ?path=/books&courseCode=GET211... (see vercel.json rewrite).
 */
function cardFor(path, query) {
  const canonical = `${SITE_URL}${path}`;

  if (path === "/" || path === "") {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: canonical };
  }

  if (path === "/books") {
    const code = (query.courseCode || "").toUpperCase();
    const category = CATEGORY_LABELS[query.category] || CATEGORY_LABELS.all;
    if (code) {
      return {
        title: `Materials for ${code} — ${category} | ${SITE_NAME}`,
        description: `Browse ${category.toLowerCase()} for ${code}, shared by Uniuyo engineering students on ${SITE_NAME}.`,
        url: canonical,
      };
    }
    return {
      title: `Library Books | ${SITE_NAME}`,
      description: `Search past questions, lecture notes, and textbooks by course on ${SITE_NAME}.`,
      url: canonical,
    };
  }

  if (path === "/courses") {
    const bits = [];
    if (query.department) bits.push(departmentName(query.department));
    if (query.level) bits.push(`${query.level} Level`);
    if (query.semester) bits.push(`${query.semester} Semester`);
    if (bits.length > 0) {
      return {
        title: `${bits.join(" · ")} Courses | ${SITE_NAME}`,
        description: `Engineering courses for ${bits.join(", ")} — pick a course to see its materials on ${SITE_NAME}.`,
        url: canonical,
      };
    }
    return {
      title: `Available Courses | ${SITE_NAME}`,
      description: `Browse Uniuyo engineering courses by department, level, and semester on ${SITE_NAME}.`,
      url: canonical,
    };
  }

  const deptMatch = path.match(/^\/departments\/([^/]+)\/?$/);
  if (deptMatch) {
    const name = prettifySlug(decodeURIComponent(deptMatch[1]));
    return {
      title: `${name} | ${SITE_NAME}`,
      description: `Explore ${name} — courses, career paths, and study materials for Uniuyo engineering on ${SITE_NAME}.`,
      url: canonical,
    };
  }

  if (path === "/materials") {
    return {
      title: `Materials Archive | ${SITE_NAME}`,
      description: `The full archive of community-shared engineering study materials on ${SITE_NAME}.`,
      url: canonical,
    };
  }

  if (path === "/requests") {
    return {
      title: `Material Requests | ${SITE_NAME}`,
      description: `Request a missing past question, note, or textbook — the community uploads it on ${SITE_NAME}.`,
      url: canonical,
    };
  }

  if (path === "/about") {
    return {
      title: `About | ${SITE_NAME}`,
      description: `Why ${SITE_NAME} exists: no more scattered Drives or expired WhatsApp resends for Uniuyo engineers.`,
      url: canonical,
    };
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: canonical };
}

export default function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const rawPath = url.searchParams.get("path") || "/";
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const query = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k !== "path") query[k] = v;
  }

  const card = cardFor(path, query);
  const title = escapeHtml(card.title);
  const description = escapeHtml(card.description);
  const pageUrl = escapeHtml(card.url);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Crawler responses are cheap and deterministic; cache briefly at the edge.
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="canonical" href="${pageUrl}" />
<meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
<p><a href="${pageUrl}">${title}</a></p>
</body>
</html>`);
};

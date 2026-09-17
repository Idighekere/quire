import React from "react";
import { Books } from "@phosphor-icons/react";
import { departments } from "@/constants";
import { Link } from "react-router-dom";
import { QuireMark } from "@/components/brand/quire-logo";
import { BRAND_NAME, BRAND_DESCRIPTION } from "@/constants/branding";

const footerQuickLinks = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/departments", label: "Departments" },
  { to: "/materials", label: "Materials Archive" },
  { to: "/requests", label: "Requests" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
];

export default function Footer({
  siteTitle = BRAND_NAME,
  logo = <QuireMark size={40} className="shrink-0" />,
  description = BRAND_DESCRIPTION,
  developerName = "Idighekere Udo",
  developerUrl = "https://idighekere.vercel.app",
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2 lg:pr-12">
            <Link to="/" className="flex items-center gap-2.5">
              {logo}
              <span className="font-bold tracking-tight">{siteTitle}</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs text-muted-foreground shadow-card">
              <Books weight="bold" className="h-4 w-4 text-primary" />
              <span className="font-mono uppercase tracking-[0.09em]">
                Engineering resources, curated
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {footerQuickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h3 className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
              Departments
            </h3>
            <ul className="space-y-2.5">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <Link
                    to={`/departments/${dept.slug}`}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {dept.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright and developer info */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {siteTitle}. All rights reserved.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Developed by{" "}
            <a
              href={developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              {developerName}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
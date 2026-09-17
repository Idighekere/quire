import * as React from "react"

export function QuireMark({ size = 32, className, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <g transform="rotate(-7 16 16)">
        <rect x="4" y="6" width="16" height="18" rx="2.5" fill="#e6f0f6" stroke="#e5e4df" strokeWidth="0.7" />
        <rect x="7.5" y="6" width="16" height="18" rx="2.5" fill="#eeecf7" stroke="#e5e4df" strokeWidth="0.7" />
        <rect x="11" y="6" width="16" height="18" rx="2.5" fill="#fffefa" stroke="#292a26" strokeWidth="0.9" />
        <circle cx="19" cy="15" r="4.4" fill="none" stroke="#ff6302" strokeWidth="1.6" />
        <line x1="22.2" y1="18.2" x2="25" y2="21" stroke="#ff6302" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function QuireLogo({ size = 32, showWordmark = true, wordmarkClassName, className, ...props }) {
  if (!showWordmark) return <QuireMark size={size} className={className} {...props} />
  const height = size
  const markSize = size
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}
      {...props}
    >
      <QuireMark size={markSize} />
      <span
        className={wordmarkClassName}
        style={{
          fontFamily: "DM Sans Variable, sans-serif",
          fontWeight: 750,
          letterSpacing: "-0.03em",
          fontSize: height * 0.58,
          lineHeight: 1,
          color: "#292a26",
        }}
      >
        Quire
      </span>
    </span>
  )
}

export default QuireMark

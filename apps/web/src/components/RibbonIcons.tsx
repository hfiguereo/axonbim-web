/** Ribbon icons — filled + stroke, less minimal line-art. */

import type { ReactNode } from "react";

type IconProps = { name: string };

function Svg({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const fill = "currentColor";
const muted = "color-mix(in srgb, currentColor 28%, transparent)";

export function Icon({ name }: IconProps) {
  switch (name) {
    case "wall":
      return (
        <Svg>
          <rect x="2" y="4" width="5" height="16" rx="0.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="9.5" y="6" width="5" height="14" rx="0.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="17" y="3" width="5" height="17" rx="0.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M2 20h20" stroke={fill} strokeWidth="1.4" />
        </Svg>
      );
    case "door":
      return (
        <Svg>
          <rect x="5" y="2" width="12" height="20" rx="1" fill={muted} stroke={fill} strokeWidth="1.3" />
          <rect x="7" y="4" width="8" height="16" rx="0.5" fill="none" stroke={fill} strokeWidth="1" opacity="0.5" />
          <circle cx="14.5" cy="12" r="1.1" fill={fill} />
        </Svg>
      );
    case "window":
      return (
        <Svg>
          <rect x="3" y="4" width="18" height="14" rx="1" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M12 4v14M3 11h18" stroke={fill} strokeWidth="1.3" />
          <rect x="5" y="6" width="5" height="3.5" fill={fill} opacity="0.2" />
          <rect x="14" y="6" width="5" height="3.5" fill={fill} opacity="0.2" />
        </Svg>
      );
    case "component":
      return (
        <Svg>
          <rect x="2" y="2" width="9" height="9" rx="1.2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="13" y="2" width="9" height="9" rx="1.2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="2" y="13" width="9" height="9" rx="1.2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="13" y="13" width="9" height="9" rx="1.2" fill={fill} opacity="0.45" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "column":
      return (
        <Svg>
          <path d="M6 4h12v2H6zM7 6h10v12H7zM5 18h14v2H5z" fill={muted} stroke={fill} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M9 8v8M15 8v8" stroke={fill} strokeWidth="1.1" opacity="0.55" />
        </Svg>
      );
    case "roof":
      return (
        <Svg>
          <path d="M2 11l10-8 10 8" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5 10.5V20h14v-9.5" fill={muted} stroke={fill} strokeWidth="1.3" />
          <rect x="14" y="13" width="3" height="4" fill={fill} opacity="0.35" />
        </Svg>
      );
    case "ceiling":
      return (
        <Svg>
          <rect x="2" y="3" width="20" height="4" rx="0.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M5 7v3M19 7v3M4 14h16" stroke={fill} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M6 14l2 4h8l2-4" fill={muted} stroke={fill} strokeWidth="1.1" />
        </Svg>
      );
    case "floor":
      return (
        <Svg>
          <path d="M3 8h18v4H3z" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M2 16h20" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12v4M19 12v4" stroke={fill} strokeWidth="1.2" />
          <path d="M7 9.5h10" stroke={fill} strokeWidth="1" opacity="0.4" />
        </Svg>
      );
    case "curtain":
      return (
        <Svg>
          <rect x="2" y="2" width="20" height="20" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M8 2v20M16 2v20M2 8h20M2 16h20" stroke={fill} strokeWidth="1.15" />
          <rect x="9" y="9" width="6" height="6" fill={fill} opacity="0.25" />
        </Svg>
      );
    case "stair":
      return (
        <Svg>
          <path
            d="M3 20h5v-4h5v-4h5V8h3v12H3z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path d="M8 20v-4M13 16v-4M18 12V8" stroke={fill} strokeWidth="1.1" opacity="0.5" />
        </Svg>
      );
    case "ramp":
      return (
        <Svg>
          <path d="M2 19h6L21 7v12H2z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5 19l11-10" stroke={fill} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
        </Svg>
      );
    case "rail":
      return (
        <Svg>
          <path d="M2 17h20M2 8h20" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 8v9M10 8v9M15 8v9M20 8v9" stroke={fill} strokeWidth="1.3" />
          <circle cx="5" cy="8" r="1.2" fill={fill} />
          <circle cx="20" cy="8" r="1.2" fill={fill} />
        </Svg>
      );
    case "line":
      return (
        <Svg>
          <path d="M4 19L20 5" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="4" cy="19" r="2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <circle cx="20" cy="5" r="2" fill={muted} stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "group":
      return (
        <Svg>
          <rect x="2" y="4" width="12" height="12" rx="1.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="10" y="8" width="12" height="12" rx="1.5" fill={fill} opacity="0.35" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "text":
      return (
        <Svg>
          <rect x="3" y="3" width="18" height="18" rx="2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M7 8h10M12 8v10" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case "room":
      return (
        <Svg>
          <rect x="3" y="3" width="18" height="18" rx="1.5" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M3 14h8v7" fill="none" stroke={fill} strokeWidth="1.2" />
          <circle cx="12" cy="10" r="2.2" fill={fill} opacity="0.4" />
          <path d="M9 17h6" stroke={fill} strokeWidth="1.3" strokeLinecap="round" />
        </Svg>
      );
    case "area":
      return (
        <Svg>
          <path d="M3 5h11v11H3z" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M10 10h11v11H10z" fill={fill} opacity="0.3" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "separator":
      return (
        <Svg>
          <path d="M12 2v20" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M5 7l7-3 7 3M5 17l7 3 7-3" fill="none" stroke={fill} strokeWidth="1.3" />
          <path d="M5 7v10M19 7v10" stroke={fill} strokeWidth="1.1" opacity="0.45" />
        </Svg>
      );
    case "fill":
      return (
        <Svg>
          <path d="M4 18l6-11 4 6 2-3 4 8H4z" fill={muted} stroke={fill} strokeWidth="1.25" strokeLinejoin="round" />
          <circle cx="8" cy="15" r="1.5" fill={fill} opacity="0.5" />
        </Svg>
      );
    case "opening":
      return (
        <Svg>
          <rect x="2" y="2" width="20" height="20" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="7" y="7" width="10" height="10" rx="0.5" fill="var(--bg-2, #24303a)" stroke={fill} strokeWidth="1.4" />
          <path d="M7 7l10 10M17 7L7 17" stroke={fill} strokeWidth="1" opacity="0.35" />
        </Svg>
      );
    case "beam":
      return (
        <Svg>
          <rect x="2" y="9" width="20" height="6" rx="0.8" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M5 4v5M19 4v5M5 15v5M19 15v5" stroke={fill} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M3 5h4M17 5h4M3 19h4M17 19h4" stroke={fill} strokeWidth="1.3" />
        </Svg>
      );
    case "foundation":
      return (
        <Svg>
          <rect x="4" y="7" width="16" height="5" rx="0.5" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M2 18h20M6 12v6M18 12v6" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 9.5h8" stroke={fill} strokeWidth="1" opacity="0.4" />
        </Svg>
      );
    case "rebar":
      return (
        <Svg>
          <path
            d="M3 6c5 0 5 12 10 12s5-12 10-12"
            fill="none"
            stroke={fill}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="3" cy="6" r="1.8" fill={fill} />
          <circle cx="23" cy="6" r="1.8" fill={fill} />
        </Svg>
      );
    case "link":
      return (
        <Svg>
          <path
            d="M9 12a4 4 0 0 0 0 5.5l2.5 2.5a4 4 0 0 0 5.5-5.5"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 12a4 4 0 0 0 0-5.5L12.5 4A4 4 0 0 0 7 9.5"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "import":
      return (
        <Svg>
          <path d="M12 3v11" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M7 10l5 5 5-5" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18h16v3H4z" fill={muted} stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "load":
      return (
        <Svg>
          <path d="M6 10V4h12v6" fill="none" stroke={fill} strokeWidth="1.5" />
          <rect x="3" y="10" width="18" height="10" rx="1.5" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M8 14h8M8 17h5" stroke={fill} strokeWidth="1.3" strokeLinecap="round" />
        </Svg>
      );
    case "dim":
      return (
        <Svg>
          <path d="M3 6v12M21 6v12" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 12h18" stroke={fill} strokeWidth="1.8" />
          <path d="M6 9l-3 3 3 3M18 9l3 3-3 3" fill="none" stroke={fill} strokeWidth="1.4" strokeLinejoin="round" />
        </Svg>
      );
    case "tag":
      return (
        <Svg>
          <path
            d="M3 11l7-7h8v8l-7 7-8-8z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="15.5" cy="8.5" r="1.6" fill={fill} />
        </Svg>
      );
    case "detail":
      return (
        <Svg>
          <circle cx="12" cy="12" r="5" fill={muted} stroke={fill} strokeWidth="1.4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill={fill} />
        </Svg>
      );
    case "cloud":
      return (
        <Svg>
          <path
            d="M7 17a4.5 4.5 0 0 1 0-9 5.2 5.2 0 0 1 9.8-1.5A4.5 4.5 0 0 1 18 17H7z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.3"
          />
        </Svg>
      );
    case "analyze":
      return (
        <Svg>
          <rect x="3" y="12" width="3.5" height="8" rx="0.5" fill={muted} stroke={fill} strokeWidth="1" />
          <rect x="8.5" y="6" width="3.5" height="14" rx="0.5" fill={fill} opacity="0.45" stroke={fill} strokeWidth="1" />
          <rect x="14" y="9" width="3.5" height="11" rx="0.5" fill={muted} stroke={fill} strokeWidth="1" />
          <rect x="19.5" y="4" width="3.5" height="16" rx="0.5" fill={fill} opacity="0.35" stroke={fill} strokeWidth="1" />
        </Svg>
      );
    case "mass":
      return (
        <Svg>
          <path d="M4 18l8-14 8 14H4z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 18l4-7 4 7" fill={fill} opacity="0.25" />
        </Svg>
      );
    case "topo":
      return (
        <Svg>
          <path
            d="M2 16c3-5 5-5 8 0s5 5 8 0 3-5 6 0"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M2 20c3-4 5-4 8 0s5 4 8 0 3-4 6 0"
            fill="none"
            stroke={fill}
            strokeWidth="1.3"
            opacity="0.45"
          />
        </Svg>
      );
    case "sync":
      return (
        <Svg>
          <path
            d="M20 12a8 8 0 1 1-2.2-5.5"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M20 4v6h-6" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "plan":
      return (
        <Svg>
          <rect x="3" y="3" width="18" height="18" rx="1.5" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M3 10h18M10 3v18" stroke={fill} strokeWidth="1.4" />
          <rect x="12" y="12" width="6" height="6" fill={fill} opacity="0.3" />
        </Svg>
      );
    case "view3d":
      return (
        <Svg>
          <path
            d="M12 2l9 5v10l-9 5-9-5V7l9-5z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "elevation":
      return (
        <Svg>
          <path d="M3 19V8l9-5 9 5v11H3z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M3 13h18" stroke={fill} strokeWidth="1.2" />
          <rect x="9" y="14" width="4" height="5" fill={fill} opacity="0.35" />
        </Svg>
      );
    case "section":
      return (
        <Svg>
          <path d="M5 2v20M19 2v20" stroke={fill} strokeWidth="1.5" />
          <path d="M5 12h14" stroke={fill} strokeWidth="1.8" />
          <path d="M5 12l5-3.5v7L5 12z" fill={fill} />
        </Svg>
      );
    case "sheet":
      return (
        <Svg>
          <path d="M6 2h9l5 5v15H6V2z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M15 2v5h5" fill="none" stroke={fill} strokeWidth="1.2" />
          <path d="M9 12h8M9 15h8M9 18h5" stroke={fill} strokeWidth="1.3" strokeLinecap="round" />
        </Svg>
      );
    case "camera":
      return (
        <Svg>
          <path
            d="M3 8h4l2-2.5h6L17 8h4v11H3V8z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13.5" r="3.5" fill="none" stroke={fill} strokeWidth="1.4" />
          <circle cx="12" cy="13.5" r="1.4" fill={fill} />
        </Svg>
      );
    case "vg":
      return (
        <Svg>
          <circle cx="12" cy="12" r="7" fill={muted} stroke={fill} strokeWidth="1.4" />
          <path d="M12 7v10M7 12h10" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill={fill} opacity="0.4" />
        </Svg>
      );
    case "fit":
      return (
        <Svg>
          <path
            d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
            fill="none"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="8" y="8" width="8" height="8" rx="1" fill={muted} stroke={fill} strokeWidth="1.1" />
        </Svg>
      );
    case "tile":
      return (
        <Svg>
          <rect x="2" y="2" width="9" height="9" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="13" y="2" width="9" height="9" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="2" y="13" width="9" height="9" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="13" y="13" width="9" height="9" rx="1" fill={fill} opacity="0.4" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "settings":
      return (
        <Svg>
          <circle cx="12" cy="12" r="3.2" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path
            d="M12 2.5v2.5M12 19v2.5M2.5 12h2.5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2l-1.8 1.8M7 17l-1.8 1.8"
            stroke={fill}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "units":
      return (
        <Svg>
          <rect x="4" y="3" width="16" height="18" rx="2" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M8 8h3l4 8h-3M9 12h5" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "material":
      return (
        <Svg>
          <path d="M4 17l8-12 8 12H4z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 17l4-6 4 6" fill={fill} opacity="0.35" />
        </Svg>
      );
    case "new":
      return (
        <Svg>
          <path d="M6 2h9l5 5v15H6V2z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M15 2v5h5" fill="none" stroke={fill} strokeWidth="1.2" />
          <path d="M12 11v6M9 14h6" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case "demo":
      return (
        <Svg>
          <rect x="3" y="4" width="18" height="14" rx="2" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M10 9l5 3-5 3V9z" fill={fill} />
          <path d="M6 20h12" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case "select":
      return (
        <Svg>
          <path
            d="M5 2l11 8-5 1.5L15 20l-2.5 1.2-4-8.5L5 16V2z"
            fill={muted}
            stroke={fill}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "move":
      return (
        <Svg>
          <path d="M12 3v18M3 12h18" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"
            stroke={fill}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "copy":
      return (
        <Svg>
          <rect x="8" y="8" width="12" height="12" rx="1.5" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke={fill} strokeWidth="1.3" />
        </Svg>
      );
    case "rotate":
      return (
        <Svg>
          <path
            d="M20 12a8 8 0 1 1-2.4-5.7"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M20 5v6h-6" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "mirror":
      return (
        <Svg>
          <path d="M12 2v20" stroke={fill} strokeWidth="1.8" strokeDasharray="2.5 2" />
          <path d="M4 7l6 5-6 5V7z" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M20 7l-6 5 6 5V7z" fill={fill} opacity="0.35" stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "align":
      return (
        <Svg>
          <path d="M3 5h18M3 12h12M3 19h15" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      );
    case "trim":
      return (
        <Svg>
          <path d="M5 5l14 14" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 5l3 3M5 16l3 3" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M11 5h8v8" fill="none" stroke={fill} strokeWidth="1.5" />
        </Svg>
      );
    case "split":
      return (
        <Svg>
          <path d="M3 12h18M12 3v18" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill={muted} stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "delete":
      return (
        <Svg>
          <path d="M5 7h14l-1.2 13H6.2L5 7z" fill={muted} stroke={fill} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M3 7h18M9 7V4h6v3" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 11v6M14 11v6" stroke={fill} strokeWidth="1.4" strokeLinecap="round" />
        </Svg>
      );
    case "join":
      return (
        <Svg>
          <rect x="2" y="8" width="8" height="8" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <rect x="14" y="8" width="8" height="8" rx="1" fill={muted} stroke={fill} strokeWidth="1.2" />
          <path d="M10 12h4" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      );
    case "cancel":
      return (
        <Svg>
          <circle cx="12" cy="12" r="9" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M8 8l8 8M16 8l-8 8" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case "height":
      return (
        <Svg>
          <path d="M12 3v18" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M7 6l5-3 5 3M7 18l5 3 5-3" fill="none" stroke={fill} strokeWidth="1.6" strokeLinejoin="round" />
        </Svg>
      );
    case "thickness":
      return (
        <Svg>
          <rect x="4" y="5" width="16" height="14" rx="1" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M9 5v14M15 5v14" stroke={fill} strokeWidth="1.5" />
          <path d="M9 12h6" stroke={fill} strokeWidth="1.3" strokeDasharray="2 2" />
        </Svg>
      );
    case "chain":
      return (
        <Svg>
          <rect x="3" y="4" width="9" height="6" rx="3" fill={muted} stroke={fill} strokeWidth="1.4" />
          <rect x="12" y="14" width="9" height="6" rx="3" fill={muted} stroke={fill} strokeWidth="1.4" />
          <path d="M10 8l4 8" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case "unlink":
      return (
        <Svg>
          <rect x="2" y="4" width="8" height="6" rx="3" fill={muted} stroke={fill} strokeWidth="1.3" />
          <rect x="14" y="14" width="8" height="6" rx="3" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M9 8l2 2M13 14l-2-2M11 9l2 4" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case "rect":
      return (
        <Svg>
          <rect x="4" y="5" width="16" height="14" rx="1" fill={muted} stroke={fill} strokeWidth="1.4" />
        </Svg>
      );
    case "arc":
      return (
        <Svg>
          <path
            d="M4 17a9 9 0 0 1 16 0"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="4" cy="17" r="1.6" fill={fill} />
          <circle cx="20" cy="17" r="1.6" fill={fill} />
        </Svg>
      );
    case "pickLines":
      return (
        <Svg>
          <path d="M4 18L10 6M14 6l6 12" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 14h8" stroke={fill} strokeWidth="1.5" strokeDasharray="2.5 2" />
          <circle cx="12" cy="14" r="2" fill={muted} stroke={fill} strokeWidth="1.2" />
        </Svg>
      );
    case "pickFace":
      return (
        <Svg>
          <path d="M4 18l8-14 8 14H4z" fill={muted} stroke={fill} strokeWidth="1.3" />
          <circle cx="12" cy="12" r="2.2" fill={fill} />
        </Svg>
      );
    case "finish":
      return (
        <Svg>
          <circle cx="12" cy="12" r="9" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M7 12l3.5 3.5L17 9" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "restart":
      return (
        <Svg>
          <path
            d="M6 12a6 6 0 1 1 1.8 4.2"
            fill="none"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M5 8v5h5" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg>
          <rect x="4" y="4" width="16" height="16" rx="2" fill={muted} stroke={fill} strokeWidth="1.3" />
          <path d="M8 12h8M12 8v8" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
  }
}

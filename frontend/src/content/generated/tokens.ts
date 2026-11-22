// Generated from the NOTtEodo app. Do not edit by hand. Source: scripts/sync-tokens.ts
export const colors = {
  "light": {
    "canvas": "#F7F3EE",
    "surface": "#EFE8E1",
    "surface-high": "#E8DFD6",
    "surface-dim": "#E2DDD7",
    "surface-lowest": "#FFFFFF",
    "sheet": "#FFFFFF",
    "field": "#F4EFE9",
    "tint": "#F3EEE8",
    "hairline": "#E2D8CF",
    "divider": "#EDE6DF",
    "outline": "#727879",
    "outline-variant": "#C2C7C9",
    "track": "#EADFD9",
    "ink": "#1A1614",
    "ink-container": "#292524",
    "text": "#1D1C15",
    "text-muted": "#424849",
    "text-soft": "#6B605A",
    "accent": "#7A1F2B",
    "accent-fill": "#7A1F2B",
    "on-accent": "#FFFFFF",
    "rosewood": "#B5505E",
    "clay": "#9B3B47",
    "noir": "#5A1620",
    "oxblood": "#8E2433",
    "blush": "#D0485A",
    "bronze": "#9E7B56",
    "linen": "#E9E4D9",
    "error": "#BA1A1A",
    "inverse-surface": "#1A1614",
    "inverse-text": "#F6F3ED"
  },
  "dark": {
    "canvas": "#000000",
    "surface": "#000000",
    "surface-high": "#0A0A0A",
    "surface-dim": "#000000",
    "surface-lowest": "#000000",
    "sheet": "#0F0D0D",
    "field": "#161313",
    "tint": "#1A0E10",
    "hairline": "#1E1E1E",
    "divider": "#221C1D",
    "outline": "#2E1A1D",
    "outline-variant": "#1E1E1E",
    "track": "#2A1F21",
    "ink": "#F6F3ED",
    "ink-container": "#2A0E12",
    "text": "#F6F3ED",
    "text-muted": "#A89C9C",
    "text-soft": "#A89C9C",
    "accent": "#D0485A",
    "accent-fill": "#8E2433",
    "on-accent": "#F6F3ED",
    "rosewood": "#B5505E",
    "clay": "#9B3B47",
    "noir": "#5A1620",
    "oxblood": "#8E2433",
    "blush": "#D0485A",
    "bronze": "#9E7B56",
    "linen": "#F6F3ED",
    "error": "#D0485A",
    "inverse-surface": "#F6F3ED",
    "inverse-text": "#1A1614"
  }
} as const;
export const motion = {
  "duration": {
    "quick": 160,
    "standard": 320,
    "entrance": 620,
    "exit": 220,
    "staggerStep": 55,
    "staggerCap": 520,
    "entryDelay": 300,
    "themeWash": 460,
    "inkStrike": 460,
    "inkStrikeOut": 260,
    "cardPeek": 380,
    "cardPeekOut": 300,
    "pressDown": 90,
    "pressUp": 420,
    "sheenIn": 260,
    "sheenOut": 720,
    "countUpDelay": 120,
    "countUp": 1250,
    "kinetic": 1100,
    "rolling": 520,
    "auraLife": 520,
    "moduleSwitch": 460,
    "moduleSwitchOut": 260,
    "moduleSwitchDimensional": 760,
    "pageRoute": 520,
    "pageRouteOut": 300,
    "overlay": 420
  },
  "easing": {
    "silk": [
      0.16,
      1,
      0.3,
      1
    ],
    "settle": [
      0.34,
      1.36,
      0.64,
      1
    ],
    "exit": [
      0.4,
      0,
      1,
      1
    ],
    "inkStrike": [
      0.45,
      0,
      0.2,
      1
    ],
    "cardPeek": [
      0.34,
      1.3,
      0.64,
      1
    ],
    "easeOut": [
      0,
      0,
      0.58,
      1
    ],
    "easeIn": [
      0.42,
      0,
      1,
      1
    ],
    "easeOutCubic": [
      0.215,
      0.61,
      0.355,
      1
    ],
    "easeInCubic": [
      0.55,
      0.055,
      0.675,
      0.19
    ],
    "easeInOutCubic": [
      0.645,
      0.045,
      0.355,
      1
    ],
    "easeInOutSine": [
      0.445,
      0.05,
      0.55,
      0.95
    ],
    "easeOutBack": [
      0.175,
      0.885,
      0.32,
      1.275
    ]
  }
} as const;
export type ColorRole = keyof typeof colors.light;
/** Every colour the brand allows, used by the forbidden-colour lint. */
export const allowedHex: readonly string[] = ["#000000","#0A0A0A","#0F0D0D","#161313","#1A0E10","#1A1614","#1D1C15","#1E1E1E","#221C1D","#292524","#2A0E12","#2A1F21","#2E1A1D","#424849","#5A1620","#6B605A","#727879","#7A1F2B","#8E2433","#9B3B47","#9E7B56","#A89C9C","#B5505E","#BA1A1A","#C2C7C9","#D0485A","#E2D8CF","#E2DDD7","#E8DFD6","#E9E4D9","#EADFD9","#EDE6DF","#EFE8E1","#F3EEE8","#F4EFE9","#F6F3ED","#F7F3EE","#FFFFFF"];

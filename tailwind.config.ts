module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["JetBrains Mono", "Inter", "ui-monospace", "monospace"],
      },
      colors: {
        background: {
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
          settings: "var(--background-settings)",
        },
        interactive: {
          DEFAULT: "var(--interactive)",
          secondary: "var(--interactive-secondary)",
        },
        border: {
          DEFAULT: "var(--border)",
          light: "var(--border-light)",
        },
        white: {
          soft: "var(--white-soft)",
          hover: "var(--white-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          secondary: "var(--accent-secondary)",
        },
        text: {
          DEFAULT: "var(--text)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
        },
        dropdown: "var(--dropdown)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 255, 128, 0.18)",
        "glow-strong": "0 0 30px rgba(0, 255, 128, 0.28)",
        "glow-arm": "0 0 24px rgba(0, 255, 128, 0.35)",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
};

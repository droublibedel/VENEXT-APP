/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        vx: {
          primary: "var(--vx-primary)",
          secondary: "var(--vx-secondary)",
          accent: "var(--vx-accent)",
          graphite: "var(--vx-graphite)",
          "graphite-muted": "var(--vx-graphite-muted)",
          panel: "var(--vx-panel)",
          "panel-warm": "var(--vx-panel-warm)",
          white: "var(--vx-white)",
          ink: "var(--vx-ink)",
          surface: "var(--vx-surface)",
          signal: "var(--vx-signal)",
          caution: "var(--vx-caution)",
          trust: "var(--vx-trust)",
        },
      },
      spacing: {
        vxxs: "var(--vx-space-xxs)",
        vxsm: "var(--vx-space-sm)",
        vxmd: "var(--vx-space-md)",
        vxlg: "var(--vx-space-lg)",
        vxxl: "var(--vx-space-xl)",
        vx2xl: "var(--vx-space-xxl)",
      },
      borderRadius: {
        vxsm: "var(--vx-radius-sm)",
        vxmd: "var(--vx-radius-md)",
        vxlg: "var(--vx-radius-lg)",
      },
      fontFamily: {
        vx: ["var(--vx-font-sans)"],
      },
      boxShadow: {
        vxlayer:
          "0 10px 30px rgba(15, 26, 23, 0.12), 0 2px 8px rgba(15, 26, 23, 0.08)",
        vxwallet: "0 -12px 40px rgba(15, 26, 23, 0.18)",
      },
    },
  },
};

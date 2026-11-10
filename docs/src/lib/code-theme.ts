import type { ThemeRegistration } from "shiki";

export const codeTheme: ThemeRegistration = {
  name: "teyvat-night",
  type: "dark",
  colors: {
    "editor.background": "#0e1322",
    "editor.foreground": "#ece5d8",
  },
  settings: [
    { settings: { foreground: "#ece5d8", background: "#0e1322" } },
    {
      scope: ["support.type.property-name", "meta.object-literal.key"],
      settings: { foreground: "#d3bc8e" },
    },
    {
      scope: ["string", "string.quoted"],
      settings: { foreground: "#9fd6a8" },
    },
    {
      scope: ["constant.numeric", "constant.language"],
      settings: { foreground: "#f0a35e" },
    },
    {
      scope: ["keyword", "storage", "entity.name.function", "support.function"],
      settings: { foreground: "#b9a2e6" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#8a8476" },
    },
    {
      scope: ["comment"],
      settings: { foreground: "#6b6a7a", fontStyle: "italic" },
    },
    {
      scope: ["variable", "variable.other"],
      settings: { foreground: "#8fd3f0" },
    },
  ],
};

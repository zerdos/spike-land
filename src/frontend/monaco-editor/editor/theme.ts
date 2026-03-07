import { editor } from "monaco-editor";

/**
 * Obsidian Dark theme for Monaco Editor
 * Matches the image-studio glassmorphism and Creation Amber/Cyber Emerald palette.
 */
export const defineObsidianTheme = () => {
  editor.defineTheme("obsidian-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { background: "0a0c14" },
      { token: "", foreground: "e2e8f0", background: "0a0c14" },
      // Keywords (e.g. const, let, if, export)
      { token: "keyword", foreground: "a3b8fc", fontStyle: "bold" },
      // Types & Classes
      { token: "type", foreground: "728ef8" },
      { token: "class", foreground: "728ef8", fontStyle: "bold" },
      { token: "type.identifier", foreground: "728ef8" },
      // Functions
      { token: "identifier.function", foreground: "ffb800" } /* Creation Amber */,
      // Variables and default identifiers
      { token: "identifier", foreground: "e2e8f0" },
      { token: "variable", foreground: "e2e8f0" },
      // Strings
      { token: "string", foreground: "00ffcc" } /* Cyber Emerald */,
      // Numbers
      { token: "number", foreground: "fcd34d" },
      // Booleans
      { token: "boolean", foreground: "ffb800", fontStyle: "italic" },
      // Comments
      { token: "comment", foreground: "94a3b8", fontStyle: "italic" },
      // JSX Tags
      { token: "tag", foreground: "728ef8" },
      // JSX Attributes
      { token: "attribute.name", foreground: "a3b8fc" },
      { token: "attribute.value", foreground: "00ffcc" },
    ],
    colors: {
      // Editor background matching Obsidian core
      "editor.background": "#0a0c14",
      "editor.foreground": "#e2e8f0",

      // Cursor and selection
      "editorCursor.foreground": "#ffb800",
      "editor.selectionBackground": "#252a4780",
      "editor.inactiveSelectionBackground": "#181c3180",

      // Line numbers
      "editorLineNumber.foreground": "#4b5563",
      "editorLineNumber.activeForeground": "#cbd5e1",

      // Gutter and current line highlight
      "editor.lineHighlightBackground": "#101321",
      "editorGutter.background": "#0a0c14",

      // Widgets (suggestions, menus)
      "editorSuggestWidget.background": "#101321",
      "editorSuggestWidget.border": "#ffffff1a",
      "editorSuggestWidget.foreground": "#e2e8f0",
      "editorSuggestWidget.selectedBackground": "#252a47",
      "editorSuggestWidget.highlightForeground": "#ffb800",

      // Minimap
      "minimap.background": "#0a0c14",

      // Scrollbar
      "scrollbarSlider.background": "#ffffff1a",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });
};

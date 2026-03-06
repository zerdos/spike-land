import { memo, useMemo } from "react";
import { tokenizeTypeScript, type Token } from "./tokenizer";
import { getTheme, getGutterWidth, LAYOUT, type MonacoThemeColors } from "./theme";

export interface MonacoCoverProps {
  value: string;
  isDark: boolean;
  onClick: () => void;
}

function getTokenColor(
  token: Token,
  theme: MonacoThemeColors,
): string | undefined {
  if (token.type === "") return undefined;
  return theme.tokenColors[token.type] ?? undefined;
}

export const MonacoCover = memo(function MonacoCover({
  value,
  isDark,
  onClick,
}: MonacoCoverProps) {
  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const normalizedValue = useMemo(
    () => value.replace(/\t/g, " ".repeat(LAYOUT.tabSize)),
    [value],
  );

  const tokenizedLines = useMemo(
    () => tokenizeTypeScript(normalizedValue),
    [normalizedValue],
  );

  const lineCount = tokenizedLines.length;
  const gutterWidth = useMemo(() => getGutterWidth(lineCount), [lineCount]);

  const outerStyle: React.CSSProperties = useMemo(
    () => ({
      position: "relative",
      overflow: "hidden",
      width: "100%",
      height: "100%",
      background: theme.background,
      fontFamily: LAYOUT.fontFamily,
      fontSize: LAYOUT.fontSize,
      fontWeight: "normal",
      letterSpacing: "0px",
      lineHeight: `${LAYOUT.lineHeight}px`,
      fontFeatureSettings: '"liga" on, "calt" on',
      cursor: "text",
    }),
    [theme.background],
  );

  const gutterStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: 0,
      top: 0,
      height: "100%",
      width: gutterWidth,
      background: theme.background,
    }),
    [gutterWidth, theme.background],
  );

  const gutterPaddingStyle: React.CSSProperties = useMemo(
    () => ({
      paddingTop: LAYOUT.paddingTop,
    }),
    [],
  );

  const lineNumberStyle: React.CSSProperties = useMemo(
    () => ({
      height: LAYOUT.lineHeight,
      lineHeight: `${LAYOUT.lineHeight}px`,
      fontSize: LAYOUT.fontSize,
      fontFamily: LAYOUT.fontFamily,
      fontVariantNumeric: "tabular-nums",
      color: theme.lineNumber,
      textAlign: "right" as const,
      paddingRight: LAYOUT.lineNumberRightPadding,
      boxSizing: "border-box" as const,
      width: "100%",
    }),
    [theme.lineNumber],
  );

  const contentStyle: React.CSSProperties = useMemo(
    () => ({
      marginLeft: gutterWidth,
      paddingTop: LAYOUT.paddingTop,
      paddingLeft: LAYOUT.contentLeftPadding,
      paddingBottom: LAYOUT.paddingBottom,
      overflow: "hidden",
      color: theme.foreground,
    }),
    [gutterWidth, theme.foreground],
  );

  const lineStyle: React.CSSProperties = useMemo(
    () => ({
      height: LAYOUT.lineHeight,
      lineHeight: `${LAYOUT.lineHeight}px`,
      whiteSpace: "pre" as const,
      overflowWrap: "initial" as const,
    }),
    [],
  );

  return (
    <div style={outerStyle} onClick={onClick}>
      <div style={gutterStyle}>
        <div style={gutterPaddingStyle}>
          {tokenizedLines.map((_tokens: Token[], i: number) => (
            <div key={i} style={lineNumberStyle}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div style={contentStyle}>
        {tokenizedLines.map((tokens: Token[], i: number) => (
          <div key={i} style={lineStyle}>
            {tokens.map((token: Token, j: number) => {
              const color = getTokenColor(token, theme);
              return (
                <span
                  key={j}
                  style={color !== undefined ? { color } : undefined}
                >
                  {token.value}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

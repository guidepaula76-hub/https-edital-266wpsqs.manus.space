import { useEffect, useState, type RefObject } from "react";

export function useWritingLines(
  ref: RefObject<HTMLTextAreaElement | null>,
  text: string,
  visible: boolean
) {
  const [metrics, setMetrics] = useState({ lines: 0, columns: 68 });
  useEffect(() => {
    const editor = ref.current;
    if (!visible || !editor) return;
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    Object.assign(mirror.style, {
      position: "fixed",
      left: "-100000px",
      top: "0",
      visibility: "hidden",
      pointerEvents: "none",
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
      wordBreak: "normal",
      margin: "0",
      padding: "0",
      border: "0",
      boxSizing: "content-box",
    });
    document.body.appendChild(mirror);
    const measure = () => {
      const style = getComputedStyle(editor);
      const width =
        editor.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      if (width <= 0) return;
      Object.assign(mirror.style, {
        width: `${width}px`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        tabSize: style.tabSize,
      });
      mirror.textContent = text ? `${text}\u200b` : "";
      const height =
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.8;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context)
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const charWidth =
        context?.measureText("M").width || parseFloat(style.fontSize) * 0.6;
      const next = {
        lines: text
          ? Math.max(
              1,
              Math.round(mirror.getBoundingClientRect().height / height)
            )
          : 0,
        columns: Math.max(1, Math.floor(width / charWidth)),
      };
      setMetrics(previous =>
        previous.lines === next.lines && previous.columns === next.columns
          ? previous
          : next
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(editor);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      mirror.remove();
      window.removeEventListener("resize", measure);
    };
  }, [ref, text, visible]);
  return metrics;
}

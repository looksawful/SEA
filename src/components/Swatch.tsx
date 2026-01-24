"use client";
import { CSSProperties, HTMLAttributes } from "react";

interface SwatchProps extends HTMLAttributes<HTMLDivElement> {
  color: string;
  ink?: string;
  borderColor?: string;
}

export const Swatch = ({ color, ink, borderColor, className = "", style, ...props }: SwatchProps) => {
  const swatchStyle = {
    ...style,
    "--swatch": color,
    ...(ink ? { "--swatch-ink": ink } : {}),
    ...(borderColor ? { "--swatch-border": borderColor } : {}),
  } as CSSProperties;

  return <div className={`bg-swatch border-swatch ${className}`} style={swatchStyle} {...props} />;
};

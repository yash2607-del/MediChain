import React from "react";
import "./button.scss";

export function Button({
  children,
  className = "",
  variant = "solid",
  ...props
}) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

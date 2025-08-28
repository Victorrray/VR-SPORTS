// src/components/Button.js
import React from "react";

export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={
        "px-6 py-2 rounded-xl font-semibold bg-primary text-primary-foreground shadow hover:bg-primary-foreground hover:text-primary transition duration-200 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

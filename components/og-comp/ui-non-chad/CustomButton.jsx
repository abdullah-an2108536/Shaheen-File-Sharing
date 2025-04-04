"use client";
import React from "react";

 

export default function CustomButton({
  label,
  onClick,
  fullWidth,
  icon: Icon, // Optional icon component
  color = "bg-blue-600", // Default background color
  className = "", // Allows extra Tailwind/utility classes from parent
  disabled = false, // Disables the button
  iconSize = 16, // Icon size
  iconColor="white"
}) {
 

  const widthClasses = fullWidth ? "w-full" : "";

  const finalClass = `
  inline-flex items-center justify-center
  px-3 py-2 text-sm font-semibold gap-1
  transition-transform duration-300
  hover:scale-105
  text-white
  ${widthClasses}
  ${color}
  ${disabled ? "cursor-not-allowed opacity-50" : ""}
  ${className}
// `
//     // Below lines just remove extra whitespace.
    .split("\n")
    .map((str) => str.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={finalClass}
    >
      {Icon && <Icon size={iconSize} /> && <Icon color={iconColor} />}
      {label}
    </button>
  );
}


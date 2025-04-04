"use client";
import React from "react";

export default function NavLinks() {
  return (
    <nav className="hidden md:flex space-x-6">
      <a href="/home" className="text-gray-600 hover:text-gray-800">Home</a>
      <a href="#" className="text-gray-600 hover:text-gray-800">Receive</a>
      <a href="#" className="text-gray-600 hover:text-gray-800">Contact</a>
      <a href="#" className="text-gray-600 hover:text-gray-800">About</a>
    </nav>
  );
}

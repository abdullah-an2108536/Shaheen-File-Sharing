"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { hashPassword, comparePasswords } from "@/lib/crypto";
import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
import { X } from "lucide-react";

export default function LoginForm({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pass, setPass] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Authentication failed");
        return;
      }

      router.push("/admin"); // ✅ Server will check auth based on cookie
    } catch (err) {
      setError("Unexpected error during login");
      console.error(err);
    }
  };

  // const handleLogin = async (e) => {
  //   e.preventDefault();

  //   const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USER;
  //   const ADMIN_HASH = process.env.NEXT_PUBLIC_ADMIN_PASS;
  //   const SALT = "kjOOeuZuAXheBsyidihKRA==";

  //   const hashedInputPassword = await hashPassword(password, SALT);

  //   if (
  //     username === ADMIN_USERNAME &&
  //     (await comparePasswords(password, ADMIN_HASH, SALT))
  //   ) {
  //     sessionStorage.setItem("isAdmin", "true");
  //     setPass(true);
  //     router.push("/admin");
  //   } else {
  //     setError("Invalid credentials");
  //   }
  // };

  // const handleClose = () => {
  //   router.push("/"); // Navigate back to home when clicking "X"
  // };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50  transition-transform duration-300 hover:scale-105">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center justify-center  mb-4">
          <img
            src="/logo.png"
            alt="Shaheen Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="text-xl font-bold text-gray-800">Shaheen</div>
        </div>

        <div className="text-center text-2xl font-bold mb-4">Login</div>

        {error && <div className="text-red-500 text-center">{error}</div>}
        {pass && (
          <div className="text-green-500 p-2 text-center">Welcome Admin</div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />

          {/* Custom Button Instead of Default Button */}
          <button
            type="submit"
            className="transition-transform duration-300 hover:scale-105 w-full bg-blue-600 text-white p-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

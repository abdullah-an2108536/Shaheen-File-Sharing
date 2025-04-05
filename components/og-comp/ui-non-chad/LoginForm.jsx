"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
// import { hashPassword, comparePasswords } from "@/lib/crypto";
// import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
import { X } from "lucide-react";

export default function LoginForm({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pass, setPass] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Spinner
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Start loading

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      setPass(true);
      setError("");
      setLoading(false);

      //   onClose(); // 

      if (pathname.startsWith("/admin")) {
        router.refresh(); // ✅ Refresh if already there
        // router.push("/admin");
      } else {
        router.push("/admin"); // ✅ Otherwise, navigate
      }

      // ✅ Show green success message briefly
      // setTimeout(() => {
      //   onClose(); // 

      //   if (pathname.startsWith("/admin")) {
      //     router.refresh(); // ✅ Refresh if already there
      //     // router.push("/admin");
      //   } else {
      //     router.push("/admin"); // ✅ Otherwise, navigate
      //   }
      // }, 1200);
    } catch (err) {
      setError("Unexpected error during login");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-transform duration-300 hover:scale-105">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-4">
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

        {error && <div className="text-red-500 text-center mb-2">{error}</div>}
        {pass && (
          <>
            <div className="text-green-500 p-2 text-center">Welcome Admin</div>
            {pathname.startsWith("/admin") && (
              <div className="text-green-500 p-2 text-center">
                You May Have to Refresh the page to see the changes
              </div>
            )}
          </>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
            disabled={loading}
          />

          <button
            type="submit"
            className="transition-transform duration-300 hover:scale-105 w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

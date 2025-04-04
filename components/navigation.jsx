"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

import DropDownAdmin from "@/components/og-comp/admin/DropDownAdmin"; // ✅ Import dropdown
import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
import LoginForm from "@/components/og-comp/ui-non-chad/LoginForm";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  
  useEffect(() => {
    const checkAdmin = async () => {
      const res = await fetch("/api/check-admin");
      const { isAdmin } = await res.json();
      setIsAdmin(isAdmin);
    };
  
    checkAdmin();
  }, []);
  

  return (
    <>
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
      <header className="flex   w-full  sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="  flex w-full  items-center p-4 h-16">
          {isAdmin && pathname.startsWith("/admin") && (
            <div className="relative">
              {/* ✅ Add relative container */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-600 hover:scale-105"
              >
                <Menu size={24} />
              </button>
              <div className="left-40 bottom-8 absolute">
                {/* ✅ Position dropdown directly under the button */}
                <DropDownAdmin isOpen={isDropdownOpen} />
              </div>
            </div>
          )}
          <div className=" flex h-16 w-full  items-center justify-between px-4">
            <Link href="/" className="flex items-center  gap-3">
              <Image
                src="/logo.png"
                alt="Shaheen Logo"
                width={52}
                height={52}
                className="object-contain"
              />
              <div className="text-xl font-bold text-gray-800">Shaheen</div>
            </Link>

            <nav className="hidden items-baseline md:flex md:gap-8">
              <Link
                href="/send"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Send
              </Link>
              <Link
                href="/receive"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Receive
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                About
              </Link>
              {/* <Link
            href="/admin"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Admin
          </Link> */}

              {/* Admin Controls */}
              {isAdmin && !pathname.startsWith("/admin") ? (
                <div className="flex items-center space-x-3">
                  <CustomButton
                    label="Logout"
                    className="bg-red-400 hover:text-gray-100 p-2 rounded"
                    onClick={() => {
                      // sessionStorage.removeItem("isAdmin");
                      // setIsAdmin(false);
                      // router.push("/");
                      fetch("/api/logout", { method: "POST" }).then(() => {
                        setIsAdmin(false);
                        router.push("/");
                      });
                      
                    }}
                  />

                  <CustomButton
                    label="Go To Admin Page"
                    className="bg-slate-500 hover:text-gray-800 p-2 rounded"
                    onClick={() => router.push("/admin")}
                  />
                </div>
              ) : isAdmin ? (
                <CustomButton
                  label="Logout"
                  className="bg-red-400 hover:text-gray-100 p-2 rounded"
                  onClick={() => {
                    // sessionStorage.removeItem("isAdmin");
                    // setIsAdmin(false);
                    // router.push("/");
                    fetch("/api/logout", { method: "POST" }).then(() => {
                      setIsAdmin(false);
                      router.push("/");
                    });
                    
                  }}
                />
              ) : (
                <CustomButton
                  label="Admin"
                  className="bg-slate-500 hover:text-gray-800 p-2 rounded"
                  onClick={() => setShowLogin(true)}
                />
              )}
            </nav>
          </div>
          <button
            className="block md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Show Login Form if triggered */}
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "container absolute left-0 right-0 top-16 z-50 bg-background p-6 md:hidden",
            isMenuOpen ? "block" : "hidden"
          )}
        >
          <nav className="flex flex-col space-y-4">
            <Link
              href="/send"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Send
            </Link>
            <Link
              href="/receive/download"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Receive
            </Link>

            <Link
              href="/how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            {/* Admin Controls */}
            <div className="w-[50%]">
              {isAdmin && !pathname.startsWith("/admin") ? (
                <div className="flex items-center space-x-3">
                  <CustomButton
                    label="Logout"
                    className="bg-red-400 hover:text-gray-100 p-2 rounded"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // sessionStorage.removeItem("isAdmin");
                      // setIsAdmin(false);
                      // router.push("/");

                      fetch("/api/logout", { method: "POST" }).then(() => {
                        setIsAdmin(false);
                        router.push("/");
                      });
                      
                    }}
                  />

                  <CustomButton
                    label="Go To Admin Page"
                    className="bg-slate-500 hover:text-gray-800 p-2 rounded"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/admin");
                    }}
                  />
                </div>
              ) : isAdmin ? (
                <CustomButton
                  label="Logout"
                  className="bg-red-400 hover:text-gray-100 p-2 rounded"
                  onClick={() => {
                    setIsMenuOpen(false);
                    // sessionStorage.removeItem("isAdmin");
                    // setIsAdmin(false);
                    // router.push("/");
                    fetch("/api/logout", { method: "POST" }).then(() => {
                      setIsAdmin(false);
                      router.push("/");
                    });
                    
                  }}
                />
              ) : (
                <CustomButton
                  label="Admin"
                  className="bg-slate-500 hover:text-gray-800 p-2 rounded"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogin(true);
                  }}
                />
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

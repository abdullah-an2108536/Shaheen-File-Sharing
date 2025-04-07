// "use client";
// import React, { useState, useEffect } from "react";
// import { Menu } from "lucide-react";
// import DropDownAdmin from "@/components/og-comp/admin/DropDownAdmin"; // ✅ Import dropdown

// import NavLinks from "@/components/navigation"
// // import NavLinks from "@/components/og-comp/ui-non-chad/NavLinks";
// import { useRouter, usePathname } from "next/navigation";
// import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
// import LoginForm from "@/components/og-comp/ui-non-chad/CustomButton";

// export default function TopBar() {
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     const adminStatus = sessionStorage.getItem("isAdmin");
//     setIsAdmin(adminStatus === "true");
//   }, []);

//   return (
//     <div className="relative">
//       {/* Top Bar */}
//       <div className="w-full border-b border-gray-200 bg-white">
//         <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
//           {/* Left Side */}
//           <div className="flex items-center space-x-3">
//             {/* Sidebar Toggle Button */}
//             {isAdmin && pathname.startsWith("/admin") && (
//               <div className="relative">
//                 {" "}
//                 {/* ✅ Add relative container */}
//                 <button
//                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                   className="text-gray-600 hover:scale-105"
//                 >
//                   <Menu size={24} />
//                 </button>
//                 <div className="left-36 bottom-8 absolute">
//                   {/* ✅ Position dropdown directly under the button */}
//                   <DropDownAdmin isOpen={isDropdownOpen} />
//                 </div>
//               </div>
//             )}

//             {/* Logo */}
//             {/* <img
//               src="/Shaheenlogobg.png"
//               alt="Shaheen Logo"
//               className="h-8 w-auto"
//             />
//             <div className="text-xl font-bold text-gray-800">Shaheen</div> */}
//           </div>

//           {/* Right Side */}
//           <div className="flex items-center space-x-6">
//             <NavLinks />

//             {/* Admin Controls */}
//             {isAdmin && !pathname.startsWith("/admin") ? (
//               <div className="flex items-center space-x-3">
//                 <CustomButton
//                   label="Logout"
//                   className="bg-red-400 hover:text-gray-100 p-2 rounded"
//                   onClick={() => {
//                     sessionStorage.removeItem("isAdmin");
//                     // setIsAdmin(false);
//                     // router.push("/home");
//                     fetch("/api/logout", { method: "POST" }).then(() => {
//                       setIsAdmin(false);
//                       router.push("/");
//                     });
                    
//                   }}
//                 />

//                 <CustomButton
//                   label="Admin"
//                   className="bg-slate-500 hover:text-gray-800 p-2 rounded"
//                   onClick={() => router.push("/admin")}
//                 />
//               </div>
//             ) : isAdmin ? (
//               <CustomButton
//                 label="Logout"
//                 className="bg-red-400 hover:text-gray-100 p-2 rounded"
//                 onClick={() => {
//                   sessionStorage.removeItem("isAdmin");
//                   // setIsAdmin(false);
//                   // router.push("/home");
//                   fetch("/api/logout", { method: "POST" }).then(() => {
//                     setIsAdmin(false);
//                     router.push("/");
//                   });
                  
//                 }}
//               />
//             ) : (
//               <CustomButton
//                 label="Login"
//                 className="bg-slate-500 hover:text-gray-800 p-2 rounded"
//                 onClick={() => setShowLogin(true)}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Show Login Form if triggered */}
//       {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
//     </div>
//   );
// }

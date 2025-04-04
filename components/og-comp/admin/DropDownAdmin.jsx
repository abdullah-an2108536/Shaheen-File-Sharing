"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { UserCog, CircleGauge } from "lucide-react";
import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";

export default function DropDownAdmin({ isOpen }) {
  const router = useRouter();

  return (
    <div className={`absolute top-12 right-0 w-44 bg-white shadow-lg rounded-lg transition-all duration-300
        ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
      `}
    >
      {/* Navigation Buttons */}
      <div className="p-2 space-y-2">
        <CustomButton
          label="Admin Main"
          className="w-full flex flex-row justify-evenly space-x-3 p-2  bg-stone-700 text-gray-700 hover:bg-stone-800 rounded text-sm"
          onClick={() => router.push("/admin")}
          icon={UserCog}
          iconSize={18}
   
        />

        <CustomButton
          label="Dashboard"
          className="w-full flex flex-row justify-evenly space-x-3 p-2  bg-stone-700 text-gray-700 hover:bg-stone-800 rounded text-sm"
          onClick={() => router.push("/admin/dashboard")}
          icon={CircleGauge}
          iconSize={18}
        />
      </div>
    </div>
  );
}

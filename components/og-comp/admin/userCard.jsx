"use client";
import React, { useState } from "react";
// import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";

export default function UserCard({ email, storageUsed, filesSent}) {
  return (
    <div className="flex items-center justify-between bg-white shadow-md rounded-lg p-3 space-x-4">
      {/* Email */}
      <div className="text-gray-800 text-sm flex-1">{email}</div>

      {/* Files Sent */}
      <div className="text-gray-600 text-sm text-center">Storage used :{storageUsed}</div>

      {/* Total Size */}
      <div className="text-gray-600 text-sm text-center">Files Sent : {filesSent}</div>

      {/* Ban/Unban Action
      <CustomButton
        label={isBanned ? "UN-Ban" : "Ban"}
        className={`px-3 py-1 rounded-lg text-sm ${
          isBanned ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}
        onClick={onToggleBan}
      /> */}
    </div>
  );
}

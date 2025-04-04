"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FilePlus } from "lucide-react";
import React from "react";

export default function UploadJsonZone({ onSuccess }) {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      // ✅ Filter only JSON files
      const jsonFiles = acceptedFiles.filter((file) => file.type === "application/json");
      if (jsonFiles.length === 0) {
        alert("Only JSON files are allowed!");
        return;
      }

      setFiles(jsonFiles);
      if (jsonFiles.length > 0 && onSuccess) {
        onSuccess(jsonFiles[0]); // Pass first file to parent's callback
      }
    },
    [onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/json": [".json"] }, // ✅ Accept JSON only
    maxSize: 50 * 1024 * 1024 // 50MB max size
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-8 w-full max-w-lg mx-auto rounded-lg text-center cursor-pointer transition-all duration-300 shadow-md 
        ${isDragActive ? "border-blue-600 bg-blue-50 shadow-lg" : "border-gray-300 bg-gray-100"}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center w-full justify-center opacity-40">
        <FilePlus className="size-20 mx-auto text-blue-600" />
        <div className="text-lg font-medium text-gray-700 mt-2">
          Drop your JSON file here or{" "}
          <div className="text-blue-600 font-semibold cursor-pointer hover:underline">
            browse
          </div>
        </div>
        <div className="text-sm text-gray-500">Only JSON files (Max: 50MB)</div>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 text-sm text-gray-700">
          {files.map((file) => (
            <li key={file.name} className="truncate">
              📄 {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

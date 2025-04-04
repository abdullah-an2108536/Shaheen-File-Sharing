"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FilePlus } from "lucide-react";
import React from "react";

export default function Upload({ onSuccess }) {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles(acceptedFiles);
      if (acceptedFiles.length > 0 && onSuccess) {
        onSuccess(acceptedFiles[0]); // Pass first file to parent's callback
      }
    },
    [onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024 // Increased max file size to 50MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-8 w-full max-w-md rounded-lg text-center cursor-pointer transition-all duration-300 shadow-md 
        ${
          isDragActive
            ? "border-blue-600 bg-blue-50 shadow-lg"
            : "border-gray-300 bg-gray-100"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center w-full justify-center">
        <FilePlus className="size-20 mx-auto text-blue-600" />
        <div className="text-lg font-medium text-gray-700 mt-2">
          Drop your file here or{" "}
          <div className="text-blue-600 font-semibold cursor-pointer hover:underline">
            browse
          </div>
        </div>
        <div className="text-sm text-gray-500">Maximum size: 50MB</div>
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

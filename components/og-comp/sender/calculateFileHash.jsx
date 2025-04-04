"use client";

import { useState, useEffect } from "react";

/**
 * A custom hook to compute the SHA-256 hash of a File object.
 * 
 * @param {File|null} file - The file to be hashed. May be null initially.
 * @returns {string} - The computed hex hash, or "" if not available yet.
 */
export default function calculateFileHash(file) {
  const [fileHash, setFileHash] = useState("");

  useEffect(() => {
    if (!file) {
      setFileHash("");
      return;
    }
    generateFileHash(file).catch((err) => {
      console.error("Error hashing file:", err);
      setFileHash("");
    });
  }, [file]);

  async function generateFileHash(selectedFile) {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    setFileHash(bufferToHex(hashBuffer));
  }

  function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return fileHash;
}

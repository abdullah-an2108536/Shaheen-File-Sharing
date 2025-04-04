// sender/useSenderKeys.js
"use client";

import { useState, useEffect } from "react";
import { bufferToHex } from "../../utils/cryptoUtils";

/**
 * A custom hook that generates ECDH encryption & MAC key pairs
 * on mount (or whenever you'd like), returning hex strings.
 */
export default function useSenderKeys() {
  const [senderPublicKeyHex, setSenderPublicKeyHex] = useState("");
  const [senderPrivateKeyHex, setSenderPrivateKeyHex] = useState("");
  const [senderMacPublicKeyHex, setSenderMacPublicKeyHex] = useState("");
  const [senderMacPrivateKeyHex, setSenderMacPrivateKeyHex] = useState("");

  useEffect(() => {
    calculateSenderKeys();
  }, []);

  async function calculateSenderKeys() {
    try {
      // 1) Encryption Key Pair
      const encryptKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );
      const publicEnc = await crypto.subtle.exportKey(
        "raw",
        encryptKeyPair.publicKey
      );
      const privateEnc = await crypto.subtle.exportKey(
        "pkcs8",
        encryptKeyPair.privateKey
      );

      setSenderPublicKeyHex(bufferToHex(publicEnc));
      setSenderPrivateKeyHex(bufferToHex(privateEnc));

      // 2) MAC Key Pair
      const macKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );
      const publicMac = await crypto.subtle.exportKey(
        "raw",
        macKeyPair.publicKey
      );
      const privateMac = await crypto.subtle.exportKey(
        "pkcs8",
        macKeyPair.privateKey
      );

      setSenderMacPublicKeyHex(bufferToHex(publicMac));
      setSenderMacPrivateKeyHex(bufferToHex(privateMac));
    } catch (err) {
      console.error("Error generating keys:", err);
    }
  }

  return {
    senderPublicKeyHex,
    senderPrivateKeyHex,
    senderMacPublicKeyHex,
    senderMacPrivateKeyHex,
  };
}

"use client";

/**
 * IndexedDB database name and store names
 */
const DB_NAME = "ShaheenFileSharing";
const KEYS_STORE = "keys";
const SHARED_SECRETS_STORE = "sharedSecrets";

/**
 * Opens the IndexedDB database
 * @returns A Promise that resolves to an IDBDatabase
 */
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 3);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create stores if they don't exist
            if (!db.objectStoreNames.contains(KEYS_STORE)) {
                db.createObjectStore(KEYS_STORE, { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains(SHARED_SECRETS_STORE)) {
                db.createObjectStore(SHARED_SECRETS_STORE, { keyPath: "id" });
            }
        };
    });
}

/**
 * Generates a Diffie-Hellman key pair for secure file sharing
 * @returns A Promise that resolves to a CryptoKeyPair
 */
export async function generateKeyPair() {
    try {
        // Generate an ECDH key pair
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256", // Standard curve for ECDH
            },
            true, // Make the key extractable so we can store it
            ["deriveKey", "deriveBits"] // Key usages
        );

        return keyPair;
    } catch (error) {
        console.error("Error generating key pair:", error);
        throw new Error("Failed to generate cryptographic keys");
    }
}

/**
 * Stores both encryption and MAC key pairs in IndexedDB using the public key as the identifier
 * @param keyPair The encryption CryptoKeyPair to store
 * @param publicKeyString The public key string to use as identifier
 * @param macKeyPair The MAC CryptoKeyPair to store
 * @param macPublicKeyString The MAC public key string
 * @returns A Promise that resolves when the key pairs are stored
 */
export async function storeKeyPair(keyPair, publicKeyString, macKeyPair, macPublicKeyString) {
    try {
        // Export the private key
        const privateKeyExported = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyString = btoa(String.fromCharCode(...new Uint8Array(privateKeyExported)));

        // Export the MAC private key
        const macPrivateKeyExported = await window.crypto.subtle.exportKey("pkcs8", macKeyPair.privateKey);
        const macPrivateKeyString = btoa(String.fromCharCode(...new Uint8Array(macPrivateKeyExported)));

        // Store in IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readwrite");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.put({
                id: publicKeyString, // Use the public key as the identifier
                senderPrivateKey: privateKeyString,
                senderPublicKey: publicKeyString,
                senderMacPrivateKey: macPrivateKeyString,
                senderMacPublicKey: macPublicKeyString,
                createdAt: new Date().toISOString(),
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error storing key pairs:", error);
        throw new Error("Failed to store encryption and MAC keys");
    }
}

/**
 * Stores a recipient key pair in IndexedDB
 * @param keyPair The encryption CryptoKeyPair to store
 * @param macKeyPair The MAC CryptoKeyPair to store
 * @param senderPublicKey The sender's public key to associate with this recipient key
 * @returns A Promise that resolves when the key pair is stored
 */
export async function storeRecipientKeyPair(keyPair, macKeyPair, senderPublicKey) {
    try {
        // Export the public key
        const publicKeyExported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const publicKeyString = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)));

        // Export the private key
        const privateKeyExported = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyString = btoa(String.fromCharCode(...new Uint8Array(privateKeyExported)));

        // Export the MAC public key
        const macPublicKeyExported = await window.crypto.subtle.exportKey("spki", macKeyPair.publicKey);
        const macPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(macPublicKeyExported)));

        // Export the MAC private key
        const macPrivateKeyExported = await window.crypto.subtle.exportKey("pkcs8", macKeyPair.privateKey);
        const macPrivateKeyString = btoa(String.fromCharCode(...new Uint8Array(macPrivateKeyExported)));

        // Store in IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readwrite");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.put({
                id: `recipient-${senderPublicKey}`, // Use the sender's public key to identify the recipient key
                recipientPublicKey: publicKeyString,
                recipientPrivateKey: privateKeyString,
                recipientMacPublicKey: macPublicKeyString,
                recipientMacPrivateKey: macPrivateKeyString,
                senderPublicKey: senderPublicKey, // Store the sender public key for reference
                createdAt: new Date().toISOString(),
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error storing recipient key pairs:", error);
        throw new Error("Failed to store recipient encryption and MAC keys");
    }
}

/**
 * Gets the sender's private keys by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to an object containing the private keys
 */
export async function getPrivateKeyBySenderPublicKey(senderPublicKey) {
    try {
        // Ensure the public key is properly decoded from URL encoding if needed
        const decodedPublicKey = senderPublicKey.includes("%") ? decodeURIComponent(senderPublicKey) : senderPublicKey;

        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(decodedPublicKey);

            request.onsuccess = async () => {
                if (request.result) {
                    // Convert base64 string back to ArrayBuffer
                    const binaryString = atob(request.result.senderPrivateKey);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Import the private key
                    const privateKey = await window.crypto.subtle.importKey(
                        "pkcs8",
                        bytes.buffer,
                        {
                            name: "ECDH",
                            namedCurve: "P-256",
                        },
                        true,
                        ["deriveKey", "deriveBits"]
                    );

                    resolve(privateKey);
                } else {
                    reject(new Error("No private key found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting private key:", error);
        throw new Error("Failed to get private key");
    }
}

/**
 * Gets a MAC private key by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to the MAC private key
 */
export async function getMacPrivateKeyBySenderPublicKey(senderPublicKey) {
    try {
        // Ensure the public key is properly decoded from URL encoding if needed
        const decodedPublicKey = senderPublicKey.includes("%") ? decodeURIComponent(senderPublicKey) : senderPublicKey;

        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(decodedPublicKey);

            request.onsuccess = async () => {
                if (request.result && request.result.senderMacPrivateKey) {
                    // Convert base64 string back to ArrayBuffer
                    const binaryString = atob(request.result.senderMacPrivateKey);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Import the private key
                    const privateKey = await window.crypto.subtle.importKey(
                        "pkcs8",
                        bytes.buffer,
                        {
                            name: "ECDH",
                            namedCurve: "P-256",
                        },
                        true,
                        ["deriveKey", "deriveBits"]
                    );

                    resolve(privateKey);
                } else {
                    reject(new Error("No MAC private key found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting MAC private key:", error);
        throw new Error("Failed to get MAC private key");
    }
}

/**
 * Gets a recipient private key by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to the recipient's private key
 */
export async function getRecipientPrivateKey(senderPublicKey) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(`recipient-${senderPublicKey}`);

            request.onsuccess = async () => {
                if (request.result) {
                    // Convert base64 string back to ArrayBuffer
                    const binaryString = atob(request.result.recipientPrivateKey);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Import the private key
                    const privateKey = await window.crypto.subtle.importKey(
                        "pkcs8",
                        bytes.buffer,
                        {
                            name: "ECDH",
                            namedCurve: "P-256",
                        },
                        true,
                        ["deriveKey", "deriveBits"]
                    );

                    resolve(privateKey);
                } else {
                    reject(new Error("No recipient private key found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting recipient private key:", error);
        throw new Error("Failed to get recipient private key");
    }
}

/**
 * Gets a recipient MAC private key by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to the recipient's MAC private key
 */
export async function getRecipientMacPrivateKey(senderPublicKey) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(`recipient-${senderPublicKey}`);

            request.onsuccess = async () => {
                if (request.result && request.result.recipientMacPrivateKey) {
                    // Convert base64 string back to ArrayBuffer
                    const binaryString = atob(request.result.recipientMacPrivateKey);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Import the private key
                    const privateKey = await window.crypto.subtle.importKey(
                        "pkcs8",
                        bytes.buffer,
                        {
                            name: "ECDH",
                            namedCurve: "P-256",
                        },
                        true,
                        ["deriveKey", "deriveBits"]
                    );

                    resolve(privateKey);
                } else {
                    reject(new Error("No recipient MAC private key found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting recipient MAC private key:", error);
        throw new Error("Failed to get recipient MAC private key");
    }
}

// Update the importPublicKey function with better error handling and debugging
/**
 * Imports a public key from a base64 string
 * @param publicKeyString The public key as a base64 string
 * @returns A Promise that resolves to a CryptoKey
 */
export async function importPublicKey(publicKeyString) {
    try {
        if (!publicKeyString) {
            throw new Error("Public key string is empty or undefined");
        }

        // Ensure the string is properly decoded from URL encoding if needed
        const decodedString = publicKeyString.includes("%") ? decodeURIComponent(publicKeyString) : publicKeyString;

        console.log("Importing public key, length:", decodedString.length);

        try {
            // Convert the base64 string to an ArrayBuffer
            const binaryString = atob(decodedString);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            console.log("Decoded key to binary, length:", bytes.length);

            // Import the public key
            try {
                const publicKey = await window.crypto.subtle.importKey(
                    "spki",
                    bytes.buffer,
                    {
                        name: "ECDH",
                        namedCurve: "P-256",
                    },
                    true,
                    []
                );

                console.log("Successfully imported public key");
                return publicKey;
            } catch (importError) {
                console.error("Error in crypto.subtle.importKey:", importError);
                throw new Error(`Failed to import key: ${importError.message}`);
            }
        } catch (decodeError) {
            console.error("Error decoding base64 string:", decodeError);
            throw new Error(`Failed to decode base64: ${decodeError.message}`);
        }
    } catch (error) {
        console.error("Error importing public key:", error);
        throw new Error(`Failed to import public key: ${error.message}`);
    }
}

/**
 * Derives a shared secret from a private key and a public key
 * @param privateKey The private key
 * @param publicKey The public key
 * @returns A Promise that resolves to the derived bits
 */
export async function deriveSharedSecret(privateKey, publicKey) {
    try {
        // Derive bits from the key pair
        const derivedBits = await window.crypto.subtle.deriveBits(
            {
                name: "ECDH",
                public: publicKey,
            },
            privateKey,
            256 // Number of bits to derive
        );

        return derivedBits;
    } catch (error) {
        console.error("Error deriving shared secret:", error);
        throw new Error("Failed to derive shared secret");
    }
}

/**
 * Stores both encryption and MAC shared secrets in IndexedDB
 * @param encryptionSecret The encryption shared secret as an ArrayBuffer
 * @param macSecret The MAC shared secret as an ArrayBuffer
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves when the shared secrets are stored
 */
export async function storeSharedSecret(encryptionSecret, macSecret, senderPublicKey) {
    try {
        // Convert ArrayBuffer to string for storage
        const encryptionSecretArray = new Uint8Array(encryptionSecret);
        const encryptionSecretString = Array.from(encryptionSecretArray)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        // Convert MAC ArrayBuffer to string for storage
        const macSecretArray = new Uint8Array(macSecret);
        const macSecretString = Array.from(macSecretArray)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        // Store in IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(SHARED_SECRETS_STORE, "readwrite");
        const store = transaction.objectStore(SHARED_SECRETS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.put({
                id: senderPublicKey, // Use the sender's public key as the identifier
                secret: encryptionSecretString,
                macSecret: macSecretString,
                senderPublicKey: senderPublicKey, // Store the sender public key for reference
                createdAt: new Date().toISOString(),
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error storing shared secrets:", error);
        throw new Error("Failed to store shared secrets");
    }
}

/**
 * Gets a shared secret by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to the shared secret as a hex string
 */
export async function getSharedSecretBySenderPublicKey(senderPublicKey) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(SHARED_SECRETS_STORE, "readonly");
        const store = transaction.objectStore(SHARED_SECRETS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(senderPublicKey);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.secret);
                } else {
                    reject(new Error("No shared secret found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting shared secret:", error);
        throw new Error("Failed to get shared secret");
    }
}

/**
 * Gets a MAC shared secret by sender public key
 * @param senderPublicKey The sender's public key
 * @returns A Promise that resolves to the MAC shared secret as a hex string
 */
export async function getMacSharedSecretBySenderPublicKey(senderPublicKey) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(SHARED_SECRETS_STORE, "readonly");
        const store = transaction.objectStore(SHARED_SECRETS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(senderPublicKey);

            request.onsuccess = () => {
                if (request.result && request.result.macSecret) {
                    resolve(request.result.macSecret);
                } else {
                    reject(new Error("No MAC shared secret found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting MAC shared secret:", error);
        throw new Error("Failed to get MAC shared secret");
    }
}

/**
 * Deletes keys from IndexedDB
 * @returns A Promise that resolves when the keys are deleted
 */
export async function deleteKeys() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([KEYS_STORE, SHARED_SECRETS_STORE], "readwrite");
        const keysStore = transaction.objectStore(KEYS_STORE);
        const secretsStore = transaction.objectStore(SHARED_SECRETS_STORE);

        return new Promise((resolve, reject) => {
            const keysRequest = keysStore.clear();
            const secretsRequest = secretsStore.clear();

            // Use transaction complete to ensure all operations are done
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Error deleting keys:", error);
        throw new Error("Failed to delete keys");
    }
}

/**
 * Encrypts a file using the shared secret with improved error handling
 * @param file The file to encrypt
 * @param sharedSecret The shared secret as a hex string
 * @returns A Promise that resolves to the encrypted file as an ArrayBuffer
 */
export async function encryptFile(file, sharedSecret) {
    try {
        if (!file) {
            throw new Error("No file provided for encryption");
        }

        if (!sharedSecret) {
            throw new Error("No shared secret provided for encryption");
        }

        // Convert the file to ArrayBuffer
        let fileBuffer;
        try {
            fileBuffer = await file.arrayBuffer();
        } catch (fileError) {
            throw new Error(`Failed to read file: ${fileError.message}`);
        }

        // Convert hex string to ArrayBuffer
        let sharedSecretBytes;
        try {
            const hexArray = sharedSecret.match(/.{1,2}/g);
            if (!hexArray) {
                throw new Error("Invalid shared secret format");
            }
            sharedSecretBytes = new Uint8Array(hexArray.map((byte) => Number.parseInt(byte, 16)));
        } catch (parseError) {
            throw new Error(`Failed to parse shared secret: ${parseError.message}`);
        }

        // Generate a random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // Import the shared secret as a key
        let key;
        try {
            key = await window.crypto.subtle.importKey("raw", sharedSecretBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
        } catch (keyError) {
            throw new Error(`Failed to import encryption key: ${keyError.message}`);
        }

        // Encrypt the file
        let encryptedBuffer;
        try {
            encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                key,
                fileBuffer
            );
        } catch (encryptError) {
            throw new Error(`Encryption failed: ${encryptError.message}`);
        }

        // Combine IV and encrypted data
        const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedBuffer), iv.length);

        return result.buffer;
    } catch (error) {
        console.error("Error encrypting file:", error);
        throw new Error(`Failed to encrypt file: ${error.message}`);
    }
}

/**
 * Computes a MAC for the encrypted file with improved error handling
 * @param encryptedFile The encrypted file as an ArrayBuffer
 * @param macSharedSecret The MAC shared secret as a hex string
 * @returns A Promise that resolves to the MAC as a hex string
 */
export async function computeMAC(encryptedFile, macSharedSecret) {
    try {
        if (!encryptedFile) {
            throw new Error("No encrypted file provided for MAC computation");
        }

        if (!macSharedSecret) {
            throw new Error("No MAC shared secret provided");
        }

        // Convert hex string to ArrayBuffer
        let macSharedSecretBytes;
        try {
            const hexArray = macSharedSecret.match(/.{1,2}/g);
            if (!hexArray) {
                throw new Error("Invalid MAC shared secret format");
            }
            macSharedSecretBytes = new Uint8Array(hexArray.map((byte) => Number.parseInt(byte, 16)));
        } catch (parseError) {
            throw new Error(`Failed to parse MAC shared secret: ${parseError.message}`);
        }

        // Import the MAC shared secret as a key
        let key;
        try {
            key = await window.crypto.subtle.importKey("raw", macSharedSecretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        } catch (keyError) {
            throw new Error(`Failed to import MAC key: ${keyError.message}`);
        }

        // Compute the MAC
        let macBuffer;
        try {
            macBuffer = await window.crypto.subtle.sign("HMAC", key, encryptedFile);
        } catch (signError) {
            throw new Error(`MAC computation failed: ${signError.message}`);
        }

        // Convert to hex string
        const macArray = new Uint8Array(macBuffer);
        const macHex = Array.from(macArray)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        return macHex;
    } catch (error) {
        console.error("Error computing MAC:", error);
        throw new Error(`Failed to compute MAC: ${error.message}`);
    }
}

/**
 * Gets the public key string from the key pair
 * @returns A Promise that resolves to an object containing both public keys
 */
export async function getPublicKeyString() {
    try {
        // Generate a new key pair for encryption
        const encryptionKeyPair = await generateKeyPair();

        // Export the encryption public key
        const encryptionPublicKeyExported = await window.crypto.subtle.exportKey("spki", encryptionKeyPair.publicKey);
        const encryptionPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(encryptionPublicKeyExported)));

        // Generate a new key pair for MAC
        const macKeyPair = await generateKeyPair();

        // Export the MAC public key
        const macPublicKeyExported = await window.crypto.subtle.exportKey("spki", macKeyPair.publicKey);
        const macPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(macPublicKeyExported)));

        // Store both key pairs
        await storeKeyPair(encryptionKeyPair, encryptionPublicKeyString, macKeyPair, macPublicKeyString);

        return encryptionPublicKeyString;
    } catch (error) {
        console.error("Error getting public key string:", error);
        throw new Error("Failed to get public key string");
    }
}

// Update the getMacPublicKeyString function to handle the case when no parameter is provided
/**
 * Gets the MAC public key string for a given sender public key
 * @param senderPublicKey The sender's public key (optional)
 * @returns A Promise that resolves to the MAC public key as a base64 string
 */
export async function getMacPublicKeyString(senderPublicKey) {
    try {
        // If no senderPublicKey is provided, generate a new MAC key pair
        if (!senderPublicKey) {
            // Generate a new key pair for MAC
            const macKeyPair = await generateKeyPair();

            // Export the MAC public key
            const macPublicKeyExported = await window.crypto.subtle.exportKey("spki", macKeyPair.publicKey);
            const macPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(macPublicKeyExported)));

            return macPublicKeyString;
        }

        // Otherwise, retrieve the MAC public key from storage
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(senderPublicKey);

            request.onsuccess = () => {
                if (request.result && request.result.senderMacPublicKey) {
                    resolve(request.result.senderMacPublicKey);
                } else {
                    reject(new Error("No MAC public key found for this sender public key"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting MAC public key string:", error);
        throw new Error(`Failed to get MAC public key string: ${error.message}`);
    }
}

/**
 * Check if keys exist in IndexedDB
 * @returns A Promise that resolves to a boolean indicating if keys exist
 */
export async function checkForExistingKeys() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(KEYS_STORE, "readonly");
        const store = transaction.objectStore(KEYS_STORE);

        return new Promise((resolve) => {
            const request = store.count();
            request.onsuccess = () => {
                resolve(request.result > 0);
            };
            request.onerror = () => {
                resolve(false);
            };
        });
    } catch (error) {
        console.error("Error checking for existing keys:", error);
        return false;
    }
}
/**
 * Fetches all keys from the KEYS_STORE
 * @returns a rpomise that resolved to the List of key IDs in the indexDB
 */
export async function getAllSharedStoredKeys() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(SHARED_SECRETS_STORE, "readonly");
        const store = transaction.objectStore(SHARED_SECRETS_STORE);

        return new Promise((resolve, reject) => {
            const request = store.getAll(); // ✅ This fetches all the data (key + value)

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => reject("Failed to fetch keys for recipent from IndexedDB");
        });
    } catch (error) {
        console.error("Error fetching keys:", error);
        throw new Error("Failed to fetch keys");
    }
}

/**
 * Decrypts an encrypted file using the shared secret (hex string).
 * @param {ArrayBuffer} encryptedDataBuffer - The encrypted data (with IV prepended).
 * @param {string} sharedSecret - The shared secret as a hex string.
 * @returns {Promise<Uint8Array>} - The decrypted file as a Uint8Array.
 */
export async function decryptFile(encryptedDataBuffer, sharedSecret) {
    try {
        if (!encryptedDataBuffer || !sharedSecret) {
            throw new Error("Missing required parameters for decryption");
        }

        // Extract the IV (first 12 bytes for AES-GCM)
        const iv = encryptedDataBuffer.slice(0, 12);
        const encryptedData = encryptedDataBuffer.slice(12);

        // Convert the sharedSecret hex string to Uint8Array (same as your encryption logic)
        const hexArray = sharedSecret.match(/.{1,2}/g);
        if (!hexArray) {
            throw new Error("Invalid shared secret format");
        }
        const sharedSecretBytes = new Uint8Array(hexArray.map(byte => Number.parseInt(byte, 16)));

        // Import the shared secret as a CryptoKey
        const key = await window.crypto.subtle.importKey(
            "raw",
            sharedSecretBytes,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        // Perform decryption
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encryptedData
        );

        return new Uint8Array(decryptedBuffer);
    } catch (error) {
        console.error("Error during decryption:", error);
        throw new Error(`Failed to decrypt file: ${error.message}`);
    }
}


/**
 *****
 * functions for admin sign in
 *****
 */
export function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBuffer(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))).buffer;
}

export async function generateSalt() {
    const saltArray = new Uint8Array(16); // 16 bytes of randomness
    window.crypto.getRandomValues(saltArray);
    return btoa(String.fromCharCode(...saltArray)); // Convert to Base64
}

export async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Buffer.from(hashBuffer).toString("base64"); // Use Buffer to convert to Base64
}

export async function comparePasswords(inputPassword, storedHash, salt) {
    const hashedInput = await hashPassword(inputPassword, salt);
    return hashedInput === storedHash;
}

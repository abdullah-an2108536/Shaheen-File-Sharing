# Shaheen

Shaheen is an open-source secure file-sharing solution built with **React** and **Next.js**. Designed to address the inherent vulnerabilities of traditional cloud storage, Shaheen employs state-of-the-art cryptographic techniques to protect your files—even in untrusted cloud environments.

---

## Table of Contents

-   [Overview](#overview)
-   [Key Features](#key-features)
-   [Security Architecture](#security-architecture)
-   [Usage](#usage)
-   [Getting Started](#getting-started)

---

## Overview

In today's digital era, cloud-based file sharing is everywhere. However, this dependence raises serious concerns about data breaches, privacy, and trust. **Shaheen** addresses these concerns by ensuring files are encrypted, authenticated, and stored securely—even from potentially untrustworthy cloud providers.

Shaheen uses secure technologies like the **Diffie-Hellman key exchange**, **AES encryption**, and **Message Authentication Codes (MAC)** to protect user data with end-to-end encryption. Users do not need to register or rely on pre-existing certificates.

---

## Key Features

-   🔐 **Secure Key Exchange** — Uses Diffie-Hellman protocol to establish shared keys dynamically.
-   🗄 **AES Encryption** — Ensures files are encrypted before cloud upload.
-   📄 **Integrity & Authenticity** — Validates files using MAC.
-   ☁️ **Multi-Cloud Storage** — Redundancy via multiple cloud providers to ensure availability.
-   🎛 **File Controls** — Set file lifespan, view limits, and other custom options.
-   👤 **Anonymous Sharing** — No account or registration required.

---

## Security Architecture

Shaheen's security design follows a layered approach:

-   **Key Exchange:** Securely establishes encryption keys without requiring PKI or user accounts.
-   **Encryption:** All files are encrypted with AES before being stored or transferred.
-   **File Validation:** Combines cryptographic hashes and MACs to verify file integrity and authenticity.
-   **Cloud Redundancy:** Stores encrypted files across multiple cloud providers for enhanced availability and resilience.
-   **User Control:** Users define file expiration, access count, and more.

---

## Usage

### 📤 Upload a File

Select a file to share. It will be encrypted before uploading.

### 🔑 Key Exchange

Shaheen uses Diffie-Hellman to securely exchange keys between sender and receiver.

### 📎 Share File

After encryption and key exchange, you can securely send your file.

### 📥 Receiver Access

The recipient uses the shared key to decrypt and verify the file.

### ⚙️ Control Settings

You can set access limits, expiration time, and more.

---

## Getting Started

### Prerequisites

-   Node.js v14 or higher
-   npm or yarn
-   Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shaheen.git
cd shaheen

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

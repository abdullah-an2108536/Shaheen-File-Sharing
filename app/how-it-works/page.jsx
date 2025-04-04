// app/how-it-works/page.jsx
import Link from "next/link"
import { ArrowRight, Lock, Key, RefreshCw, FileText, Shield, Database, Server } from "lucide-react"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "How It Works - Shaheen File Sharing",
  description: "Learn how Shaheen's secure file sharing system works with end-to-end encryption",
}

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex-1 min-w-full">
        {/* Hero Section */}
        <section className="container py-12 md:py-16 lg:py-20 min-w-full">
          <div className="mx-auto max-w-[800px] text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              How <span className="text-primary">Shaheen</span> Works
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Our secure file sharing system uses advanced cryptography to ensure your files remain private and secure
              throughout the entire process.
            </p>
          </div>
        </section>

        {/* Security Overview */}
        <section className="container py-12 min-w-full">
          <div className="mx-auto max-w-[900px]">
            <h2 className="mb-6 text-3xl font-bold tracking-tighter">Security Overview</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Shaheen uses a combination of cryptographic techniques to provide end-to-end security for your
              files. Here's how the system works:
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="bg-primary p-4 text-primary-foreground">
                  <h3 className="text-xl font-bold">Client-Side Encryption</h3>
                </div>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex gap-2">
                      <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>All encryption happens in your browser before data is transmitted</span>
                    </li>
                    <li className="flex gap-2">
                      <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Private keys never leave your device</span>
                    </li>
                    <li className="flex gap-2">
                      <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Files are encrypted with a unique key for each transfer</span>
                    </li>
                    <li className="flex gap-2">
                      <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Even we cannot access your unencrypted files</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-primary p-4 text-primary-foreground">
                  <h3 className="text-xl font-bold">Zero Knowledge Design</h3>
                </div>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    <li className="flex gap-2">
                      <Database className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>We never store your encryption keys on our servers</span>
                    </li>
                    <li className="flex gap-2">
                      <Database className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Metadata is minimized to protect your privacy</span>
                    </li>
                    <li className="flex gap-2">
                      <Database className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Our servers only see encrypted data</span>
                    </li>
                    <li className="flex gap-2">
                      <Database className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>Access controls can be set</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Encryption Process */}
        <section className="bg-muted py-12 min-w-full">
          <div className="container min-w-full">
            <div className="mx-auto max-w-[900px]">
              <h2 className="mb-6 text-3xl font-bold tracking-tighter">The Encryption Process</h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Shaheen uses the Diffie-Hellman key exchange protocol to establish secure keys between sender
                and recipient, followed by AES-256 encryption for the file data.
              </p>

              <div className="relative mb-16 overflow-hidden rounded-xl border bg-card p-6 shadow-sm md:p-8">
                <h3 className="mb-6 text-2xl font-bold">Step 1: Key Generation</h3>
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold">What Happens:</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex gap-2">
                        <Key className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          When you initiate file sharing, your browser generates a public-private key pair using the
                          ECDH (Elliptic Curve Diffie-Hellman) algorithm
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Key className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The private key is stored securely in your browser's IndexedDB storage and never transmitted
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Key className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The public key is shared with the recipient through an email
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded-lg bg-muted p-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <Key className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-sm">
                            <div className="mb-1 font-semibold">Public Key (shared)</div>
                            <div className="rounded bg-muted-foreground/10 p-2 text-xs">A8f3...7d2c</div>
                          </div>
                          <div className="mt-3 font-mono text-sm">
                            <div className="mb-1 font-semibold">Private Key (secret)</div>
                            <div className="rounded bg-muted-foreground/10 p-2 text-xs">F7b2...9e4a</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-16 overflow-hidden rounded-xl border bg-card p-6 shadow-sm md:p-8">
                <h3 className="mb-6 text-2xl font-bold">Step 2: Key Exchange</h3>
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold">What Happens:</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex gap-2">
                        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The recipient receives the sender's public key and generates their own public-private key pair
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The recipient's browser uses the sender's public key and their own private key to derive a
                          shared secret
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The recipient sends their public key back to the sender, who derives the same shared secret
                          using their private key
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          This shared secret is never transmitted over the network, but is identical on both sides
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded-lg bg-muted p-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <div className="mb-2 font-semibold">Sender</div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <Key className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <RefreshCw className="h-8 w-8 text-primary" />
                          <div className="text-center">
                            <div className="mb-2 font-semibold">Recipient</div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <Key className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <div className="mb-2 font-semibold">Shared Secret (identical on both sides)</div>
                          <div className="rounded bg-primary/10 p-2 font-mono text-xs text-primary">c4d8...e7f2</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm md:p-8">
                <h3 className="mb-6 text-2xl font-bold">Step 3: File Encryption & Transfer</h3>
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold">What Happens:</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex gap-2">
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>The shared secret is used to derive an AES-256 encryption key</span>
                      </li>
                      <li className="flex gap-2">
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>The file is encrypted in chunks directly in the browser using this key</span>
                      </li>
                      <li className="flex gap-2">
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>Only the encrypted file is uploaded to our servers and the cloud</span>
                      </li>
                      <li className="flex gap-2">
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          The recipient downloads the encrypted file and decrypts it in their browser using the same
                          shared secret
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded-lg bg-muted p-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">File Encryption</div>
                          <div className="mt-2 space-y-2">
                            <div className="rounded bg-background p-2 text-sm">Original File</div>
                            <div className="flex items-center justify-center">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                            <div className="rounded bg-primary/10 p-2 text-sm">AES-256 Encryption</div>
                            <div className="flex items-center justify-center">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                            <div className="rounded bg-background p-2 text-sm">Encrypted File</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Storage */}
        <section className="container py-12 min-w-full">
          <div className="mx-auto max-w-[900px]">
            <h2 className="mb-6 text-3xl font-bold tracking-tighter">How Keys Are Stored</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Shaheen uses your browser's built-in secure storage mechanisms to protect your cryptographic keys.
            </p>

            <div className="mb-12 rounded-xl border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-2xl font-bold">IndexedDB Storage</h3>
              <p className="mb-6 text-muted-foreground">
                All cryptographic keys are stored in your browser's IndexedDB, a secure client-side storage system:
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Database className="h-5 w-5 text-primary" />
                    Keys Store
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Stores your private keys</li>
                    <li>• Indexed by public key identifiers</li>
                    <li>• Never synchronized to servers</li>
                    <li>• Cleared when you clear browser data</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Shield className="h-5 w-5 text-primary" />
                    IndexedDB Security
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Same-Origin Policy Enforcement</li>
                    <li>• Sandboxed Storage</li>
                    <li>• Limited Exposure to Cross-Site Scripting</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-md bg-primary/10 p-4 text-sm">
                <h4 className="mb-2 font-semibold text-primary">Security Note:</h4>
                <p className="text-muted-foreground">
                  If you clear your browser data or switch browsers, you'll need to generate new keys. This is a
                  security feature, as it ensures your keys are not accessible across different environments.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-2xl font-bold">Server-Side Storage</h3>
              <p className="mb-6 text-muted-foreground">
                Our servers and the cloud stores minimal information to facilitate secure file sharing:
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Server className="h-5 w-5 text-primary" />
                    What is Exposed
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Encrypted file data</li>
                    <li>• Public keys (not sensitive)</li>
                    <li>• Access control parameters</li>
                    <li>• Email addresses (can use anonymous ones)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Shield className="h-5 w-5 text-primary" />
                    What We Don't Store
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Private keys</li>
                    <li>• Established Encryption Keys</li>
                    <li>• User Data (no login)</li>
                    <li>• Unencrypted file contents</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-md bg-primary/10 p-4 text-sm">
                <h4 className="mb-2 font-semibold text-primary">Zero Knowledge Design:</h4>
                <p className="text-muted-foreground">
                  Our system is designed so that even if our servers were compromised, attackers would only have access
                  to encrypted data that cannot be decrypted without the private keys stored only on your device.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="bg-muted py-12 min-w-full">
          <div className="container min-w-full">
            <div className="mx-auto max-w-[900px]">
              <h2 className="mb-6 text-3xl font-bold tracking-tighter">Technical Details</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                For the technically inclined, here are the specific cryptographic algorithms and methods used in
                Shaheen:
              </p>

              <div className="space-y-6">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-xl font-bold">Cryptographic Algorithms</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex gap-2">
                      <Key className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">Key Exchange:</span> ECDH (Elliptic Curve
                        Diffie-Hellman) with P-256 curve
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <Lock className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">File Encryption:</span> AES-256-GCM
                        (Galois/Counter Mode)
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">Key Derivation:</span> HKDF (HMAC-based Key
                        Derivation Function)
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-xl font-bold">Browser APIs Used</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex gap-2">
                      <Shield className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">Web Crypto API:</span> For all cryptographic
                        operations
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <Database className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">IndexedDB:</span> For secure client-side storage
                        of keys
                      </div>
                    </li>

                  </ul>
                </div>

                
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-12 min-w-full">
          <div className="mx-auto max-w-[900px] rounded-xl border bg-card p-8 text-center shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Ready to Experience Secure File Sharing?</h2>
            <p className="mb-6 text-muted-foreground">
              Start sending and receiving files with enterprise-grade security today.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/send">
                <Button size="lg" className="gap-2">
                  Send Files
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/receive">
                <Button size="lg" variant="outline" className="gap-2">
                  Receive Files
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}


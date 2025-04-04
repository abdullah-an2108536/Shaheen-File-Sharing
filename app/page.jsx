import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Lock, Key, FileText, RefreshCw } from "lucide-react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">

      <Navigation />
    <div className="flex items-center flex-col">
      {/* Hero Section */}
      {/* Hero Section */}
<section className="container relative min-h-screen overflow-hidden pb-20 pt-10 md:pb-24 md:pt-10 lg:pt-0 lg:pb-5 flex items-center justify-center">
  <div className="absolute inset-0 -z-10 bg-white" />
  <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 text-center">
    <div className="flex h-40 w-40 items-center justify-center rounded-full">
      <Image 
        src="/logo.png" 
        alt="Shaheen Logo" 
        width={160} 
        height={160}
        className="w-full h-full object-contain"
      />
    </div>
    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
      Secure File Sharing Solution<span className="text-primary"></span>
    </h1>
    <p className="max-w-[800px] text-xl text-muted-foreground md:text-2xl">
      Share files with end-to-end encryption in <span className="text-red-500">untrusted Cloud Environments</span>. Your data never leaves your device
      unencrypted.
    </p>

    <div className="flex flex-col gap-4 sm:flex-row">
      <Link href="/send">
        <Button size="lg" className="gap-2 px-8 text-2xl">
          Send Files
          {/* <ArrowRight className="h-5 w-5" /> */}
        </Button>
      </Link>
      <Link href="/receive">
        <Button size="lg" className="gap-2 bg-slate-400 px-8 text-md">
          Receive Files
          {/* <ArrowRight className="h-5 w-5" /> */}
        </Button>
      </Link>
    </div>

    <div className="mt-8 flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
      <Shield className="h-4 w-4 text-primary" />
      <span>End-to-end encrypted. Zero knowledge. Anonymous.</span>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose <span className="text-primary">Shaheen</span>?
            </h2>
            <p className="mx-auto max-w-[700px] text-xl text-muted-foreground">
              Our platform is built with security and privacy from the Cloud as the foundation, not an afterthought.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">End-to-End Encryption</h3>
              <p className="text-muted-foreground">
                Your files are encrypted before they leave your device. The end-to-end encryption is performed by You!
              </p>
            </div>

            <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Access Control</h3>
              <p className="text-muted-foreground">
                Set expiry dates, access limits, and earliest access dates for complete control over who can access your
                files and when.
              </p>
            </div>

            <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Easy to Use</h3>
              <p className="text-muted-foreground">
                Simple interface makes advanced secure file sharing techniques accessible to everyone
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section  className="bg-muted py-20 min-w-full">
        <div className="container min-w-full">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
            <p className="mx-auto max-w-[700px] text-xl text-muted-foreground">
              Secure file sharing in three simple steps.
            </p>
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="relative grid gap-10 md:grid-cols-3">
              {/* Connection line for desktop */}
              <div className="absolute left-1/2 top-24 hidden h-0.5 w-[80%] -translate-x-1/2 bg-border md:block" />

              <div className="relative flex flex-col items-center rounded-xl bg-background p-8 text-center shadow-sm">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-4 text-2xl font-bold">Generate Keys</h3>
                <p className="text-muted-foreground">
                  Your browser generates a unique cryptographic key pair. The private key never leaves your device.
                </p>
                <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Key className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="relative flex flex-col items-center rounded-xl bg-background p-8 text-center shadow-sm">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-4 text-2xl font-bold">Exchange Keys</h3>
                <p className="text-muted-foreground">
                  Only Public keys are exchanged through emails the between sender and recipient.
                </p>
                <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <RefreshCw className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="relative flex flex-col items-center rounded-xl bg-background p-8 text-center shadow-sm">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-4 text-2xl font-bold">Secure Transfer</h3>
                <p className="text-muted-foreground">
                  Files are encrypted with an established secret key before upload to the Cloud.
                </p>
                <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="gap-2">
                  Learn More About Our Security
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-[900px] rounded-lg bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Share Securely?</h2>
          <p className="mb-6 text-lg md:text-xl">
            Start sending and receiving files today.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/send">
              <Button size="lg" variant="secondary" className="gap-2">
                Send Files
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button
                size="lg"
                variant="secondary"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  )
}


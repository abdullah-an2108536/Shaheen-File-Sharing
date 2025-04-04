// app/send/page.jsx

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import SendFileForm from "@/components/send-file-form"

export const metadata = {
  title: "Send Files - Shaheen File Sharing",
  description: "Send files securely with Shaheen File Sharing",
}

export default function SendPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
    
      <main className="container flex-1 py-12 min-w-full">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Send Files Securely</h1>
            <p className="mt-4 text-muted-foreground">
              Fill out the form below to initiate secure file sharing with the recipient.
            </p>
          </div>

          <SendFileForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}


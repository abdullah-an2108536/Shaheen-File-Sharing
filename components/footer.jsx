import Link from "next/link"
import Image from "next/image" // added import for Image
import { Mail, Phone, Shield, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t w-full bg-muted/50">
      <div className="flex items-center flex-col py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pl-4">
          <div className="md:pl-5">
            <div className="flex items-center gap-2 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-md  text-primary-foreground">
                <Image src="/logo.png" alt="Shaheen Logo" width={32} height={32} />
              </div>
              <span className="text-xl">Shaheen</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Secure file sharing with end-to-end encryption in untrustworthy Cloud Environments. Your data never leaves your
              device unencrypted.
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="https://github.com" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="mailto:shaheen.file.sharing@gmail.com" className="text-muted-foreground hover:text-foreground">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/send" className="text-muted-foreground hover:text-foreground">
                  Send Files
                </Link>
              </li>
              <li>
                <Link href="/receive" className="text-muted-foreground hover:text-foreground">
                  Receive Files
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-muted-foreground hover:text-foreground">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                support@shaheen.example
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                +974 1234-5678
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Security: security@shaheen.example
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Shaheen File Sharing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


import { Suspense } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import FileUploadForm from "@/components/file-upload-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Upload File - Shaheen File Sharing",
  description: "Upload your file securely with Shaheen File Sharing",
}

// Loading skeleton for the file upload form
function FileUploadFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  )
}

export default function UploadFilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="container flex-1 py-12 min-w-full">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Upload Your File</h1>
            <p className="mt-4 text-muted-foreground">
              Your secure connection has been established. You can now upload your file.
            </p>
          </div>

          <Suspense fallback={<FileUploadFormSkeleton />}>
            <FileUploadForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}


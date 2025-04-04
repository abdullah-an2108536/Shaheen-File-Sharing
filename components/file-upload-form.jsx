"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation" // Import useSearchParams hook
import { Upload, FileText, Shield, CheckCircle2, AlertCircle, Info, Calendar, Hash, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  getPrivateKeyBySenderPublicKey,
  getMacPrivateKeyBySenderPublicKey,
  importPublicKey,
  deriveSharedSecret,
  encryptFile,
  computeMAC,
} from "@/lib/crypto"

export default function FileUploadForm() {
  const router = useRouter()
  const searchParams = useSearchParams() // Use the hook to get searchParams
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sharedSecret, setSharedSecret] = useState(null)
  const [macSharedSecret, setMacSharedSecret] = useState(null)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  // file validation constants
  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB in bytes
  const ALLOWED_FILE_TYPES = [
    "application/pdf", // PDF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    "image/png", // PNG
    "image/jpeg", // JPEG/JPG
    "text/plain", // TXT
  ]
  const ALLOWED_FILE_EXTENSIONS = [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt"]

  // state for file validation errors
  const [fileError, setFileError] = useState(null)

  // Extract parameters from URL
  const fileName = searchParams?.get("fileName") || ""
  const fileDescription = searchParams?.get("description") || ""
  const senderEmail = searchParams?.get("senderEmail") || ""
  const recipientEmail = searchParams?.get("recipientEmail") || ""
  const senderPublicKey = searchParams?.get("senderPublicKey") || ""
  const recipientPublicKey = searchParams?.get("recipientPublicKey") || ""
  const macRecipientPublicKey = searchParams?.get("macRecipientPublicKey") || ""
  const startDate = searchParams?.get("startDate") ? new Date(searchParams.get("startDate")) : null
  const expirationDate = searchParams?.get("expirationDate") ? new Date(searchParams.get("expirationDate")) : null
  const accessCount = searchParams?.get("accessCount") || 1
  const accessTime = searchParams?.get("accessTime") || "alltime"

  // Log parameters
  useEffect(() => {
    const logParams = async () => {
      try {
        // Safely log parameters
        console.log("Parameters received:", {
          fileName: fileName || "missing",
          senderEmail: senderEmail || "missing",
          recipientEmail: recipientEmail || "missing",
        })

        // Create a debug object with all the key parameters
        const debug = {
          senderPublicKey: senderPublicKey ? `${senderPublicKey.substring(0, 20)}...` : "missing",
          recipientPublicKey: recipientPublicKey ? `${recipientPublicKey.substring(0, 20)}...` : "missing",
          macRecipientPublicKey: macRecipientPublicKey ? `${macRecipientPublicKey.substring(0, 20)}...` : "missing",
        }

        setDebugInfo(debug)

        // Check if we have all required parameters
        if (!senderPublicKey || !recipientPublicKey || !macRecipientPublicKey) {
          console.warn("Missing required parameters:", debug)
        }
      } catch (err) {
        console.error("Error processing parameters:", err)
      }
    }

    logParams()
  }, [fileName, senderEmail, recipientEmail, senderPublicKey, recipientPublicKey, macRecipientPublicKey])

  // Establish shared secrets
  useEffect(() => {
    // Skip if we don't have all required parameters
    if (!senderPublicKey || !recipientPublicKey || !macRecipientPublicKey) {
      setIsLoading(false)
      setError("Missing required parameters. Please check the URL and try again.")
      return
    }

    const establishSecrets = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("Establishing secrets with parameters:")
        console.log("- senderPublicKey:", senderPublicKey.substring(0, 20) + "...")
        console.log("- recipientPublicKey:", recipientPublicKey.substring(0, 20) + "...")
        console.log("- macRecipientPublicKey:", macRecipientPublicKey.substring(0, 20) + "...")

        // Get the sender's private key using the sender public key - first decode the URL encoding
        const decodedSenderPublicKey = decodeURIComponent(senderPublicKey)
        console.log("Decoded sender public key, length:", decodedSenderPublicKey.length)

        const senderPrivateKey = await getPrivateKeyBySenderPublicKey(decodedSenderPublicKey)

        if (!senderPrivateKey) {
          throw new Error("No private key found for the provided sender public key")
        }

        console.log("Retrieved sender private key successfully")

        // Import the recipient's public key - first decode the URL encoding
        const decodedRecipientPublicKey = decodeURIComponent(recipientPublicKey)
        console.log("Decoded recipient public key, length:", decodedRecipientPublicKey.length)

        const importedRecipientPublicKey = await importPublicKey(decodedRecipientPublicKey)

        if (!importedRecipientPublicKey) {
          throw new Error("Failed to import recipient public key")
        }

        console.log("Imported recipient public key successfully")

        // Derive the shared secret for encryption
        const encryptionSecret = await deriveSharedSecret(senderPrivateKey, importedRecipientPublicKey)
        console.log("Derived encryption shared secret successfully")

        // Convert to hex string for display
        const encryptionSecretArray = new Uint8Array(encryptionSecret)
        const encryptionSecretHex = Array.from(encryptionSecretArray)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")

        setSharedSecret(encryptionSecretHex)
        console.log("Encryption shared secret established:")

        // Get the sender's MAC private key
        const macSenderPrivateKey = await getMacPrivateKeyBySenderPublicKey(decodedSenderPublicKey)

        if (!macSenderPrivateKey) {
          throw new Error("No MAC private key found for the provided sender public key")
        }

        // Import the recipient's MAC public key
        const decodedMacRecipientPublicKey = decodeURIComponent(macRecipientPublicKey)
        console.log("Decoded MAC recipient public key, length:", decodedMacRecipientPublicKey.length)

        const importedMacRecipientPublicKey = await importPublicKey(decodedMacRecipientPublicKey)

        if (!importedMacRecipientPublicKey) {
          throw new Error("Failed to import MAC recipient public key")
        }

        console.log("Imported MAC recipient public key successfully")

        // Derive the shared secret for MAC
        const macSecret = await deriveSharedSecret(macSenderPrivateKey, importedMacRecipientPublicKey)
        console.log("Derived MAC shared secret successfully")

        // Convert to hex string
        const macSecretArray = new Uint8Array(macSecret)
        const macSecretHex = Array.from(macSecretArray)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")

        setMacSharedSecret(macSecretHex)
        console.log("MAC shared secret established")

        // Clear any previous errors since we succeeded
        setError(null)
      } catch (err) {
        console.error("Error establishing shared secrets:", err)
        setError(`Failed to establish secure connection: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    // Call the function to establish secrets
    establishSecrets()
  }, [senderPublicKey, recipientPublicKey, macRecipientPublicKey])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `File size exceeds the maximum limit of 4 MB (File size limited in Free Version of Shaheen). Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        )
        return
      }

      // Validate file type
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      const isValidExtension = ALLOWED_FILE_EXTENSIONS.includes(fileExtension)
      const isValidMimeType = ALLOWED_FILE_TYPES.includes(file.type)

      if (!isValidExtension && !isValidMimeType) {
        setFileError(`Invalid file type. Allowed types are: PDF, DOCX, PNG, JPEG, and TXT.`)
        return
      }

      // Clear any previous errors
      setFileError(null)
      setSelectedFile(file)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `File size exceeds the maximum limit of 4 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        )
        return
      }

      // Validate file type
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      const isValidExtension = ALLOWED_FILE_EXTENSIONS.includes(fileExtension)
      const isValidMimeType = ALLOWED_FILE_TYPES.includes(file.type)

      if (!isValidExtension && !isValidMimeType) {
        setFileError(`Invalid file type. Allowed types are: PDF, DOCX, PNG, JPEG, and TXT.`)
        return
      }

      // Clear any previous errors
      setFileError(null)
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !sharedSecret || !macSharedSecret) {
      setError(
        "Missing required data for upload. Please ensure you have selected a file and established a secure connection.",
      )
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Start progress indication
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 200)

      // Encrypt the file
      setUploadProgress(10)
      let encryptedFile
      try {
        encryptedFile = await encryptFile(selectedFile, sharedSecret)
      } catch (encryptError) {
        throw new Error(`File encryption failed: ${encryptError.message}`)
      }
      setUploadProgress(40)

      // Compute MAC for the encrypted file
      let mac
      try {
        mac = await computeMAC(encryptedFile, macSharedSecret)
      } catch (macError) {
        throw new Error(`MAC computation failed: ${macError.message}`)
      }
      setUploadProgress(60)

      // Create metadata
      const metadata = {
        name: fileName,
        description: fileDescription || "",
        startDate: startDate ? startDate.toISOString() : null,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
        accessCount: accessCount,
        accessTime: accessTime,
        mac: mac,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadDate: new Date().toISOString(),
      }

      // Create a Blob from the encrypted file
      const encryptedBlob = new Blob([encryptedFile], { type: "application/octet-stream" })

      // Create a File object from the Blob
      const encryptedFileObj = new File([encryptedBlob], `${senderPublicKey}.encrypted`, {
        type: "application/octet-stream",
      })

      // Create a Blob for the metadata
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" })

      // Create a File object for the metadata
      const metadataFileObj = new File([metadataBlob], `${senderPublicKey}.metadata.json`, {
        type: "application/json",
      })

      // Create FormData for the upload
      const formData = new FormData()
      formData.append("file", encryptedFileObj)
      formData.append("metadata", metadataFileObj)
      formData.append("senderPublicKey", senderPublicKey)

      // Upload the files
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to upload file"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If we can't parse the error JSON, use the status text
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setUploadProgress(100)
      setIsSuccess(true)
      clearInterval(progressInterval)
    } catch (err) {
      console.error("Error uploading file:", err)
      setError("Failed to upload file: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading File Details</CardTitle>
          <CardDescription>Please wait while we establish a secure connection...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>We encountered an error while setting up your secure connection.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          {/* Debug information */}
          <div className="mt-4 rounded-md bg-muted p-4">
            <h3 className="mb-2 font-medium">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          <div className="mt-4 flex justify-between">
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry Connection
            </Button>
            <Button onClick={() => router.push("/send")}>Return to Send Page</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!senderPublicKey || !recipientPublicKey || !macRecipientPublicKey || !fileName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Missing Parameters</CardTitle>
          <CardDescription>We couldn't find the required parameters for file upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The upload link may be invalid or missing required parameters. Please return to the send page to create a
            new file sharing request.
          </p>

          {/* Debug information */}
          <div className="mt-4 rounded-md bg-muted p-4">
            <h3 className="mb-2 font-medium">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          <Button onClick={() => router.push("/send")} className="mt-4 w-full">
            Return to Send Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Upload File: {fileName}
        </CardTitle>
        <CardDescription>Secure connection established with {recipientEmail}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSuccess ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Your file has been encrypted and uploaded successfully!</AlertDescription>
            </Alert>

            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">What happens next?</h3>
              <p className="text-sm text-muted-foreground">
                The recipient will be notified that your file is ready for download. They will be able to securely
                access the file using the shared encryption key.
              </p>
            </div>

            <Button onClick={() => router.push("/send")} className="w-full">
              Send Another File
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4" data-testid="secure-connection-message">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-green-700">
                <Shield className="h-4 w-4" />
                Secure Connection Established
              </h3>
              <p className="text-sm text-muted-foreground">
                A secure end-to-end encrypted connection has been established with {recipientEmail}.
              </p>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">File Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">File Name:</span>
                  <span>{fileName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Recipient:</span>
                  <span>{recipientEmail}</span>
                </div>
                {fileDescription && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <span className="font-medium">Description:</span>
                    <span>{fileDescription}</span>
                  </div>
                )}
              </div>
            </div>

            {(startDate || expirationDate || accessCount || accessTime === "daytime") && (
              <div className="rounded-md bg-muted p-4">
                <h3 className="mb-2 font-medium">Access Restrictions</h3>
                <div className="space-y-2">
                  {startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Earliest Access:</span>
                      <span>{startDate.toLocaleDateString()}</span>
                    </div>
                  )}
                  {expirationDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Expiration Date:</span>
                      <span>{expirationDate.toLocaleDateString()}</span>
                    </div>
                  )}
                  {accessCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Access Limit:</span>
                      <span>{accessCount} times</span>
                    </div>
                  )}
                  {accessTime === "daytime" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Access Time:</span>
                      <span>Daytime only (8 AM - 6 PM)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md border-2 border-dashed p-8" onDragOver={handleDragOver} onDrop={handleDrop}>
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">Upload Your File</h3>
                <p className="mb-4 text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Select File
                </Button>
              </div>
            </div>

            {selectedFile && (
              <div className="rounded-md bg-muted p-4">
                <h3 className="mb-2 font-medium">Selected File</h3>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedFile.name}</span>
                  <span className="text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              </div>
            )}

            {fileError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Encrypting and uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || fileError}
              className="w-full gap-2"
            >
              {isUploading ? "Uploading..." : "Encrypt & Upload File"}
              <Upload className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Info className="h-4 w-4" />
          <span>Your file will be encrypted using a 256-bit shared secret key.</span>
        </div>
      </CardFooter>
    </Card>
  )
}


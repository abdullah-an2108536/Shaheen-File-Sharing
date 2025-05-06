// components/send-file-form.jsx
"use client"

import { useState, useEffect } from "react"
import {
  CalendarIcon,
  Hash,
  Mail,
  FileText,
  Send,
  Info,
  AlertCircle,
  Shield,
  CheckCircle,
  Copy,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { sendFileRequest } from "@/lib/actions"
import { generateKeyPair, storeKeyPair } from "@/lib/crypto"

import QRCodeDisplay from "@/components/QRCodeDisplay"


// validation constants
const MAX_ACCESS_COUNT = 5
const MAX_START_DATE_DAYS = 7 // 1 week
const MAX_LIFESPAN_DAYS = 60 // 2 months

export default function SendFileForm() {
  // Form state
  const [step, setStep] = useState("generate-keys") // "generate-keys", "form", "success"
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [publicKey, setPublicKey] = useState("")
  const [macPublicKey, setMacPublicKey] = useState("")

  // Form fields
  const [startDate, setStartDate] = useState(null)
  const [expirationDate, setExpirationDate] = useState(null)
  const [accessCount, setAccessCount] = useState("")
  const [accessTime, setAccessTime] = useState("alltime")
  const [useStartDate, setUseStartDate] = useState(false)
  const [useExpirationDate, setUseExpirationDate] = useState(false)
  const [useAccessCount, setUseAccessCount] = useState(false)


  const [shareLink, setShareLink] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [isWhatsAppSending, setIsWhatsAppSending] = useState(false)
  const [whatsAppError, setWhatsAppError] = useState(null)
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false)

  const [submittedFormData, setSubmittedFormData] = useState(null);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (step === "success" && submittedFormData) {
      const host = window.location.origin;
      
      let receiveLink = `${host}/receive?senderEmail=${encodeURIComponent(submittedFormData.senderEmail)}&recipientEmail=${encodeURIComponent(
        submittedFormData.recipientEmail
      )}&fileName=${encodeURIComponent(submittedFormData.fileName)}&senderPublicKey=${encodeURIComponent(publicKey)}&macSenderPublicKey=${encodeURIComponent(
        macPublicKey
      )}`;
      
      // Add optional parameters
      if (submittedFormData.fileDescription) {
        receiveLink += `&description=${encodeURIComponent(submittedFormData.fileDescription)}`;
      }
      
      if (useStartDate && startDate) {
        receiveLink += `&startDate=${encodeURIComponent(startDate.toISOString())}`;
      }
      
      if (useExpirationDate && expirationDate) {
        receiveLink += `&expirationDate=${encodeURIComponent(expirationDate.toISOString())}`;
      }
      
      if (useAccessCount && accessCount) {
        receiveLink += `&accessCount=${encodeURIComponent(accessCount)}`;
      }
      
      receiveLink += `&accessTime=${encodeURIComponent(accessTime)}`;
      
      setShareLink(receiveLink);
    } else {
      setShareLink(""); // Reset shareLink when not in success step
    }
  }, [step, publicKey, macPublicKey, startDate, expirationDate, accessCount, accessTime, useStartDate, useExpirationDate, useAccessCount, submittedFormData]);

  const handleGenerateKeys = async () => {
    setIsGeneratingKeys(true)
    setError(null)

    try {
      console.log("Generating encryption key pair...")
      // Generate new key pair for encryption
      const keyPair = await generateKeyPair()
      console.log("Encryption key pair generated successfully")

      // Export the public key
      const publicKeyExported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
      console.log("Exported encryption public key, size:", publicKeyExported.byteLength)

      // Convert to base64 string
      const publicKeyString = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)))
      console.log("Converted encryption public key to base64, length:", publicKeyString.length)

      console.log("Generating MAC key pair...")
      // Generate MAC key pair
      const macKeyPair = await generateKeyPair()
      console.log("MAC key pair generated successfully")

      // Export the MAC public key
      const macPublicKeyExported = await window.crypto.subtle.exportKey("spki", macKeyPair.publicKey)
      console.log("Exported MAC public key, size:", macPublicKeyExported.byteLength)

      // Convert to base64 string
      const macPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(macPublicKeyExported)))
      console.log("Converted MAC public key to base64, length:", macPublicKeyString.length)

      // Store both key pairs together
      await storeKeyPair(keyPair, publicKeyString, macKeyPair, macPublicKeyString)
      console.log("Stored both key pairs successfully")

      // Set the public keys for the form
      setPublicKey(publicKeyString)
      setMacPublicKey(macPublicKeyString)
      console.log("Public keys set for form")

      // Move to the form step
      setStep("form")
    } catch (err) {
      console.error("Error generating keys:", err)
      setError(`Failed to generate encryption keys: ${err.message}`)
    } finally {
      setIsGeneratingKeys(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Clear previous validation errors
    setValidationErrors({})

    // Get form data
    const formData = new FormData(event.currentTarget)
    const errors = {}

    const formDataObj = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
    });
    setSubmittedFormData(formDataObj);

    // Validate access count
    if (useAccessCount) {
      const count = Number.parseInt(accessCount)
      if (isNaN(count) || count <= 0) {
        errors.accessCount = "Access count must be a positive number"
      } else if (count > MAX_ACCESS_COUNT) {
        errors.accessCount = `Access count cannot exceed ${MAX_ACCESS_COUNT}`
      }
    }

    // Validate dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxStartDate = new Date(today)
    maxStartDate.setDate(today.getDate() + MAX_START_DATE_DAYS)

    const maxExpirationDate = new Date(today)
    maxExpirationDate.setDate(today.getDate() + MAX_LIFESPAN_DAYS)

    if (useStartDate && startDate) {
      if (startDate < today) {
        errors.startDate = "Earliest access date cannot be in the past"
      } else if (startDate > maxStartDate) {
        errors.startDate = `Earliest access date cannot be more than ${MAX_START_DATE_DAYS} days from today`
      }
    }

    if (useExpirationDate && expirationDate) {
      if (expirationDate < today) {
        errors.expirationDate = "Expiration date cannot be in the past"
      } else if (useStartDate && startDate && expirationDate <= startDate) {
        errors.expirationDate = "Expiration date must be after the earliest access date"
      } else if (expirationDate > maxExpirationDate) {
        errors.expirationDate = `Expiration date cannot be more than ${MAX_LIFESPAN_DAYS} days from today`
      }
    }

    // If there are validation errors, stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setIsSubmitting(false)
      return
    }

    try {
      // Add the public keys to the form data
      formData.append("senderPublicKey", publicKey)
      formData.append("macSenderPublicKey", macPublicKey)

      // Add optional attributes if enabled
      if (useStartDate && startDate) {
        formData.append("startDate", startDate.toISOString())
      }

      if (useExpirationDate && expirationDate) {
        formData.append("expirationDate", expirationDate.toISOString())
      }

      if (useAccessCount && accessCount) {
        formData.append("accessCount", accessCount)
      }

      formData.append("accessTime", accessTime)

      // Validate required fields
      const senderEmail = formData.get("senderEmail")
      const recipientEmail = formData.get("recipientEmail")
      const fileName = formData.get("fileName")

      if (!senderEmail || !recipientEmail || !fileName) {
        throw new Error("Sender email, recipient email, and file name are required")
      }

      // Validate email formats
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(senderEmail)) {
        throw new Error("Invalid sender email format")
      }
      if (!emailRegex.test(recipientEmail)) {
        throw new Error("Invalid recipient email format")
      }

      await sendFileRequest(formData)

      // Show success message
      setStep("success")
    } catch (error) {
      console.error("Error sending file request:", error)
      setError("Error sending file request: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 1: Generate Keys
  if (step === "generate-keys") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Encryption Key Setup
          </CardTitle>
          <CardDescription>
            We need to generate encryption keys to secure your file. This happens for each file you share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p>
              To ensure your file is securely encrypted, we need to generate a unique set of encryption keys. These keys
              will be stored securely in your browser and never sent to our servers.
            </p>
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">What this means for you:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>A new key pair is generated for each file you share</li>
                <li>Your file will be encrypted before it leaves your device</li>
                <li>Only the intended recipient can decrypt and access your file</li>
                <li>Your keys are stored locally and never shared with our servers</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateKeys} disabled={isGeneratingKeys} className="w-full">
            {isGeneratingKeys ? "Generating Keys..." : "Generate Encryption Keys"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Step 2: File Sharing Form
  if (step === "form") {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>File Sharing Request</CardTitle>
          <CardDescription>
            Fill out this form to initiate the secure file sharing process. We'll send a link to the recipient with
            instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="mb-6 border-green-500 bg-green-50 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Encryption keys generated successfully! Now fill out the form below.</AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender Email */}
            <div className="space-y-2">
              <Label htmlFor="senderEmail">
                Your Email Address
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senderEmail"
                  name="senderEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">
                Recipient's Email Address
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  placeholder="recipient@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="fileName">
                File Name
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fileName"
                  name="fileName"
                  type="text"
                  placeholder="e.g. Quarterly Report"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* File Description */}
            <div className="space-y-2">
  <Label htmlFor="fileDescription">File Description (Optional)</Label>
  <Textarea
    id="fileDescription"
    name="fileDescription"
    placeholder="Add a description of the file you're sharing"
    rows={3}
    maxLength={200}  // Limit to 200 characters
  />
</div>


            {/* File Attributes */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium">File Access Attributes (Optional)</h3>

              {/* Earliest Start Date */}
              <div className="flex items-start space-x-2">
                <Checkbox id="useStartDate" checked={useStartDate} onCheckedChange={setUseStartDate} />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="useStartDate"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Earliest Access Date
                  </Label>
                  {useStartDate && (
                    <div className="mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {validationErrors.startDate && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.startDate}</p>
                  )}
                  <p className="text-xs text-muted-foreground">The file cannot be accessed before this date.</p>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="flex items-start space-x-2">
                <Checkbox id="useExpirationDate" checked={useExpirationDate} onCheckedChange={setUseExpirationDate} />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="useExpirationDate"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Expiration Date
                  </Label>
                  {useExpirationDate && (
                    <div className="mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !expirationDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expirationDate}
                            onSelect={setExpirationDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {validationErrors.expirationDate && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.expirationDate}</p>
                  )}
                  <p className="text-xs text-muted-foreground">The file cannot be accessed after this date.</p>
                </div>
              </div>

              {/* Access Count */}
              <div className="flex items-start space-x-2">
                <Checkbox id="useAccessCount" checked={useAccessCount} onCheckedChange={setUseAccessCount} />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="useAccessCount"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Access Count Limit
                  </Label>
                  {useAccessCount && (
                    <div className="mt-2 flex w-full max-w-sm items-center space-x-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Number of times"
                          className="pl-10"
                          min="1"
                          value={accessCount}
                          onChange={(e) => setAccessCount(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {validationErrors.accessCount && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.accessCount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Limit how many times the file can be accessed.</p>
                </div>
              </div>

              {/* Access Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Access Time Restriction</Label>
                <RadioGroup defaultValue="alltime" value={accessTime} onValueChange={setAccessTime}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alltime" id="alltime" />
                    <Label htmlFor="alltime" className="font-normal">
                      All times (24/7)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daytime" id="daytime" />
                    <Label htmlFor="daytime" className="font-normal">
                      Daytime only (8 AM - 6 PM recipient's local time)
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">Restrict when the file can be accessed.</p>
              </div>
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                <p>Restrictions:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Maximum access count: {MAX_ACCESS_COUNT} times</li>
                  <li>Earliest access date: Up to {MAX_START_DATE_DAYS} days from today</li>
                  <li>Maximum file lifespan: {MAX_LIFESPAN_DAYS} days (2 months)</li>
                  <li>Expiration date must be after earliest access date</li>
                </ul>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !publicKey || !macPublicKey}>
              {isSubmitting ? "Sending..." : "Send File Request"}
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>Your file will be encrypted before upload using the shared secret key.</span>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Step 3: Success
  if (step === "success") {

    <QRCodeDisplay value={shareLink} />

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(shareLink)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }

    const sendWhatsApp = () => {
      if (!phoneNumber) {
        setWhatsAppError("Please enter a phone number")
        return
      }

      setIsWhatsAppSending(true)
      setWhatsAppError(null)

      try {
        // Format phone number (remove spaces, dashes, etc.)
        const formattedNumber = phoneNumber.replace(/\D/g, "")

        // Create WhatsApp link
        const message = `I'm sharing a file with you securely via Shaheen File Sharing. Use this link to Start the Process: ${shareLink}`
        const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`

        // Open WhatsApp in a new tab
        window.open(whatsappUrl, "_blank")

        setWhatsAppSuccess(true)
        setTimeout(() => setWhatsAppSuccess(false), 3000)
      } catch (error) {
        console.error("Error sending WhatsApp:", error)
        setWhatsAppError("Failed to open WhatsApp. Please try again.")
      } finally {
        setIsWhatsAppSending(false)
      }
    }

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-green-600">Request Sent Successfully</CardTitle>
          <CardDescription>Your file sharing request has been sent to the recipient.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-500 bg-green-50 text-green-700 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your file sharing request has been sent successfully! An email has been sent to the recipient with
              instructions.
            </AlertDescription>
          </Alert>

          <div className="border rounded-md p-6 mb-6 bg-slate-50">
  <h2 className="text-lg font-semibold mb-4">Additional Ways of Sharing Link</h2>
  
  <div className="space-y-4">
    {/* WhatsApp Sharing */}
    <div className="border rounded-md p-4 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <h4 className="font-medium">WhatsApp</h4>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Share the secure link directly via WhatsApp with your recipient's phone number. This method provides additonal trust as the message will be sent from you phone number to the reciever.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="tel"
          placeholder="Enter phone number with country code (e.g., +1234567890)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={sendWhatsApp}
          disabled={isWhatsAppSending}
          className="flex-shrink-0 gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <MessageSquare className="h-4 w-4" />
          Send
        </Button>
      </div>
      {whatsAppError && <p className="text-sm text-red-600 mt-2">{whatsAppError}</p>}
      {whatsAppSuccess && <p className="text-sm text-green-600 mt-2">WhatsApp opened successfully!</p>}
    </div>

    {/* Copy Link */}


    <div className="border rounded-md p-4 bg-muted">
      <div className="flex items-center gap-2 mb-2">
        <Copy className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium">Copy Link</h4>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Copy this link to share manually via any communication method
      </p>
      <Button 
        onClick={copyToClipboard} 
        className="w-full gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
      >
        {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {isCopied ? "Copied!" : "Copy to Clipboard"}
      </Button>
    </div>
  </div>
</div>
<QRCodeDisplay value={shareLink} />
          <div className="rounded-md bg-muted p-6 mb-6">
            <h3 className="mb-4 text-lg font-medium">What happens next?</h3>
            <ol className="list-decimal space-y-3 pl-5">
              <li>Your recipient will receive an email with your file sharing request.</li>
              <li>They'll click the link in the email to generate their encryption keys.</li>
              <li>Their keys will be automatically generated and a shared secret will be established.</li>
              <li>You'll receive an email with a link to upload your file securely.</li>
              <li>Click that link to upload and encrypt your file.</li>
            </ol>
          </div>


          {/* Share Link Section */}


          <div className="mt-6">
            <Button
              onClick={() => {
                setStep("generate-keys")
                setPublicKey("")
                setMacPublicKey("")
                setStartDate(null)
                setExpirationDate(null)
                setAccessCount("")
                setAccessTime("alltime")
                setUseStartDate(false)
                setUseExpirationDate(false)
                setUseAccessCount(false)
              }}
              className="w-full"
            >
              Share Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}


"use client";

import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton"; // update path if needed
import { ArrowDownToLine } from "lucide-react";

import { useState, useEffect } from "react";
import {
  FileText,
  Mail,
  Calendar,
  Hash,
  Clock,
  CheckCircle2,
  CheckCircle,
  Copy,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  generateKeyPair,
  storeRecipientKeyPair,
  deriveSharedSecret,
  storeSharedSecret
} from "@/lib/crypto";

import { sendRecipientPublicKey } from "@/lib/actions";

export default function ReceiveFileInfo({ searchParams }) {
  const [params, setParams] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  const [shareLink, setShareLink] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState(null);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);

  // Fetch and resolve search params
  useEffect(() => {
    async function fetchParams() {
      if (searchParams) {
        const resolvedParams = await searchParams;
        setParams(resolvedParams);
      }
    }

    fetchParams();
  }, [searchParams]);

  console.log(searchParams);

  const {
    senderEmail = "",
    recipientEmail = "",
    fileName = "",
    senderPublicKey = "",
    description: fileDescription = "",
    startDate,
    expirationDate,
    accessCount,
    accessTime = "alltime",
    macSenderPublicKey = ""
  } = params;

  const startDateObj = startDate ? new Date(startDate) : null;
  const expirationDateObj = expirationDate ? new Date(expirationDate) : null;

  // Process the file sharing request automatically
  useEffect(() => {
    const processRequest = async () => {
      if (
        senderEmail &&
        recipientEmail &&
        fileName &&
        senderPublicKey &&
        !isComplete &&
        !isProcessing
      ) {
        setIsProcessing(true);
        setError(null);

        try {
          // Generate recipient key pair for encryption
          const recipientKeyPair = await generateKeyPair();

          // Export the recipient's public key
          const publicKeyExported = await window.crypto.subtle.exportKey(
            "spki",
            recipientKeyPair.publicKey
          );

          // Convert to base64 string
          const recipientPublicKeyString = btoa(
            String.fromCharCode(...new Uint8Array(publicKeyExported))
          );

          // Generate recipient MAC key pair
          const recipientMacKeyPair = await generateKeyPair();

          // Export the recipient's MAC public key
          const macPublicKeyExported = await window.crypto.subtle.exportKey(
            "spki",
            recipientMacKeyPair.publicKey
          );

          // Convert to base64 string
          const recipientMacPublicKeyString = btoa(
            String.fromCharCode(...new Uint8Array(macPublicKeyExported))
          );

          // Store recipient key pairs in IndexedDB
          await storeRecipientKeyPair(
            recipientKeyPair,
            recipientMacKeyPair,
            senderPublicKey
          );

          // Import the sender's public key - first decode the URL encoding, then decode base64
          const decodedPublicKey = decodeURIComponent(senderPublicKey);
          const binaryString = atob(decodedPublicKey);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const importedSenderPublicKey = await window.crypto.subtle.importKey(
            "spki",
            bytes.buffer,
            {
              name: "ECDH",
              namedCurve: "P-256"
            },
            true,
            []
          );

          // Import the sender's MAC public key
          const decodedMacPublicKey = decodeURIComponent(macSenderPublicKey);
          const macBinaryString = atob(decodedMacPublicKey);
          const macBytes = new Uint8Array(macBinaryString.length);
          for (let i = 0; i < macBinaryString.length; i++) {
            macBytes[i] = macBinaryString.charCodeAt(i);
          }

          const importedSenderMacPublicKey =
            await window.crypto.subtle.importKey(
              "spki",
              macBytes.buffer,
              {
                name: "ECDH",
                namedCurve: "P-256"
              },
              true,
              []
            );

          // Derive shared secret for encryption
          const encryptionSecret = await deriveSharedSecret(
            recipientKeyPair.privateKey,
            importedSenderPublicKey
          );

          // Derive shared secret for MAC
          const macSecret = await deriveSharedSecret(
            recipientMacKeyPair.privateKey,
            importedSenderMacPublicKey
          );

          // Store both shared secrets together
          await storeSharedSecret(encryptionSecret, macSecret, senderPublicKey);

          // Send recipient's public key back to sender
          const formData = new FormData();
          formData.append("recipientPublicKey", recipientPublicKeyString);
          formData.append("macRecipientPublicKey", recipientMacPublicKeyString);
          formData.append("senderEmail", senderEmail);
          formData.append("recipientEmail", recipientEmail);
          formData.append("fileName", fileName);
          formData.append("senderPublicKey", senderPublicKey);
          formData.append("macSenderPublicKey", macSenderPublicKey);

          // Add optional attributes
          if (fileDescription)
            formData.append("fileDescription", fileDescription);
          if (startDateObj)
            formData.append("startDate", startDateObj.toISOString());
          if (expirationDateObj)
            formData.append("expirationDate", expirationDateObj.toISOString());

          if (accessCount) formData.append("accessCount", accessCount);
          formData.append("accessTime", accessTime);

          // Create Upload Link for WhatsApp and copying
          const host = process.env.NEXT_PUBLIC_APP_URL;

          let uploadLink = `${host}/upload?senderEmail=${encodeURIComponent(
            senderEmail
          )}&recipientEmail=${encodeURIComponent(
            recipientEmail
          )}&fileName=${encodeURIComponent(
            fileName
          )}&senderPublicKey=${encodeURIComponent(
            senderPublicKey
          )}&recipientPublicKey=${encodeURIComponent(
            recipientPublicKeyString
          )}&macRecipientPublicKey=${encodeURIComponent(
            recipientMacPublicKeyString
          )}`;

          // Add optional parameters
          if (fileDescription)
            uploadLink += `&description=${encodeURIComponent(fileDescription)}`;
          if (startDate)
            uploadLink += `&startDate=${encodeURIComponent(startDate)}`;
          if (expirationDate)
            uploadLink += `&expirationDate=${encodeURIComponent(
              expirationDate
            )}`;
          if (accessCount)
            uploadLink += `&accessCount=${encodeURIComponent(accessCount)}`;
          if (accessTime)
            uploadLink += `&accessTime=${encodeURIComponent(accessTime)}`;
          setShareLink(uploadLink);

          await sendRecipientPublicKey(formData);

          setIsComplete(true);
        } catch (err) {
          console.error("Error processing file sharing request:", err);
          setError(
            "Failed to process the file sharing request. Please try again."
          );
        } finally {
          setIsProcessing(false);
        }
      }
    };

    processRequest();
  }, [
    senderEmail,
    recipientEmail,
    fileName,
    senderPublicKey,
    fileDescription,
    startDateObj,
    expirationDateObj,
    accessCount,
    accessTime,
    isComplete,
    isProcessing
  ]);

  // If no required parameters are provided, show a generic receive page
  if (!senderEmail || !recipientEmail || !fileName || !senderPublicKey) {
    return (
      <div className="w-full">
        <CustomButton
          label="Go To Download Page"
          onClick={() => (window.location.href = "/receive/download")}
          fullWidth
          icon={ArrowDownToLine}
          iconColor="white"
          color="bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500"
          className="text-white rounded-md shadow-lg relative overflow-hidden border border-white/10 before:bg-white/20 before:rounded-md before:opacity-10 before:animate-pulse pointer-events-auto hover:shadow-xl hover:scale-105 transition-all my-5"
        />
        <Card>
          <CardHeader>
            <CardTitle>No File Selected</CardTitle>
            <CardDescription>
              If someone is sharing a file with you, then please use the link
              provided in your email to continue file transfer process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you received an email with a file sharing request, please click
              the link in that email to access the file.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const sendWhatsApp = () => {
    if (!phoneNumber) {
      setWhatsAppError("Please enter a phone number");
      return;
    }

    setIsWhatsAppSending(true);
    setWhatsAppError(null);

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedNumber = phoneNumber.replace(/\D/g, "");

      // Create WhatsApp link
      const message = `Our Keys have been established. Click the link to securely upload the File: ${shareLink}`;
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
        message
      )}`;

      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank");

      setWhatsAppSuccess(true);
      setTimeout(() => setWhatsAppSuccess(false), 3000);
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      setWhatsAppError("Failed to open WhatsApp. Please try again.");
    } finally {
      setIsWhatsAppSending(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            File Sharing Request
          </CardTitle>
          <CardDescription>
            {senderEmail} wants to share a file with you securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isComplete ? (
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Keys established! An email has been sent to {senderEmail} with a
                link to upload the file.
              </AlertDescription>
            </Alert>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p>Establishing Keys...</p>
            </div>
          ) : null}

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
                <span className="font-medium">Sender:</span>
                <span>{senderEmail}</span>
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

          {(startDate ||
            expirationDate ||
            accessCount ||
            accessTime === "daytime") && (
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">Access Restrictions</h3>
              <div className="space-y-2">
                {startDateObj && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Earliest Access:</span>
                    <span>{startDateObj.toLocaleDateString()}</span>
                  </div>
                )}

                {expirationDateObj && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Expiration Date:</span>
                    <span>{expirationDateObj.toLocaleDateString()}</span>
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

          <div className="border rounded-md p-6 mb-6 bg-slate-50">
            <h2 className="text-lg font-semibold mb-4">
              Additional Ways of Sharing Link
            </h2>

            <div className="space-y-4">
              {/* WhatsApp Sharing */}
              <div className="border rounded-md p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#25D366"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <h4 className="font-medium">WhatsApp</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Share the secure link directly via WhatsApp with your recipient's phone number. This method provides additional trust as the message will be sent from your phone number to the receiver.
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
                {whatsAppError && (
                  <p className="text-sm text-red-600 mt-2">{whatsAppError}</p>
                )}
                {whatsAppSuccess && (
                  <p className="text-sm text-green-600 mt-2">
                    WhatsApp opened successfully!
                  </p>
                )}
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
                  {isCopied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {isCopied ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </div>
            </div>
          </div>

          {isComplete && (
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">What happens next?</h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  The sender ({senderEmail}) will receive an email with a link to securely encrypt and upload the file using the established keys.
                </li>
                <li>Your keys have been securely stored inside this browser.</li>
                <li>You can view a list of the files shared with you.</li>
                <li>You can then securely download and decrypt the file.</li>
              </ol>
            </div>
          )}

          {!isComplete && !isProcessing && (
            <Button onClick={() => window.location.reload()} className="w-full">
              Process Request
            </Button>
          )}
        </CardContent>
        <CardFooter className="border-t p-4 text-center text-sm text-muted-foreground">
          Shaheen File Sharing uses end-to-end encryption to ensure your files remain private and secure.
        </CardFooter>
      </Card>
      <CustomButton
        label="Go To Download Page"
        onClick={() => (window.location.href = "/receive/download")}
        fullWidth
        icon={ArrowDownToLine}
        iconColor="white"
        color="bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500"
        className="text-white py-3 rounded-md shadow-lg relative overflow-hidden border border-white/10 before:absolute before:inset-0 before:bg-white/20 before:rounded-md before:opacity-10 before:animate-pulse pointer-events-auto hover:shadow-xl hover:scale-105 transition-all my-5"
      />
    </div>
  );
}

"use server";

// server actions for the application

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// email from sender to the recipient
export async function sendFileRequest(formData) {
    // Extract form data
    const senderEmail = formData.get("senderEmail");
    const recipientEmail = formData.get("recipientEmail");
    const fileName = formData.get("fileName");
    const fileDescription = formData.get("fileDescription");
    const senderPublicKey = formData.get("senderPublicKey");
    const macSenderPublicKey = formData.get("macSenderPublicKey");
    const startDate = formData.get("startDate");
    const expirationDate = formData.get("expirationDate");
    const accessCount = formData.get("accessCount");
    const accessTime = formData.get("accessTime");

    // Validate required fields
    if (!senderEmail || !recipientEmail || !fileName || !senderPublicKey) {
        throw new Error("Sender email, recipient email, file name, and public key are required");
    }

    try {
        // Build the receive link with query parameters
        const host = process.env.NEXT_PUBLIC_APP_URL;

        let receiveLink = `${host}/receive?senderEmail=${encodeURIComponent(senderEmail)}&recipientEmail=${encodeURIComponent(
            recipientEmail
        )}&fileName=${encodeURIComponent(fileName)}&senderPublicKey=${encodeURIComponent(senderPublicKey)}&macSenderPublicKey=${encodeURIComponent(
            macSenderPublicKey
        )}`;

        // Add optional parameters
        if (fileDescription) receiveLink += `&description=${encodeURIComponent(fileDescription)}`;
        if (startDate) receiveLink += `&startDate=${encodeURIComponent(startDate)}`;
        if (expirationDate) receiveLink += `&expirationDate=${encodeURIComponent(expirationDate)}`;
        if (accessCount) receiveLink += `&accessCount=${encodeURIComponent(accessCount)}`;
        if (accessTime) receiveLink += `&accessTime=${encodeURIComponent(accessTime)}`;

        // Format attributes for display in the email
        const attributes = [];
        if (startDate) attributes.push(`Earliest Access Date: ${new Date(startDate).toLocaleDateString()}`);
        if (expirationDate) attributes.push(`Expiration Date: ${new Date(expirationDate).toLocaleDateString()}`);
        if (accessCount) attributes.push(`Access Count Limit: ${accessCount}`);
        if (accessTime === "daytime") attributes.push("Access Time: Daytime only (8 AM - 6 PM)");

        // Create email content
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${host}/logo.png" alt="Shaheen Logo" style="width: 100px; height: auto;">
          <h1 style="color: #333;">Secure File Sharing Request</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          <strong>${senderEmail}</strong> wants to share a file with you securely using Shaheen File Sharing.
        </p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #0070f3; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #333; font-size: 18px;">File Details</h2>
          <p style="margin: 5px 0;"><strong>File Name:</strong> ${fileName}</p>
          ${fileDescription ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${fileDescription}</p>` : ""}
          
          ${
              attributes.length
                  ? `
            <h3 style="margin: 15px 0 5px; font-size: 16px;">Access Restrictions</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${attributes.map((attr) => `<li style="margin: 5px 0;">${attr}</li>`).join("")}
            </ul>
          `
                  : ""
          }
        </div>
        
        <div style="margin: 25px 0; text-align: center;">
          <a href="${receiveLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              🔽  Start Transfer Process
          </a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px;">
          <h3 style="color: #333; font-size: 16px;">How It Works</h3>
          <ol style="padding-left: 20px; line-height: 1.5;">
            <li>Click the button above to start the file transfer process</li>
            <li>Your encryption keys will be automatically generated and stored on your client</li>
            <li>The Sender will recieve a link that will allow key establishment to be complete on the sender side</li>
            <li>The sender will upload the encrypted file to cloud storage</li>
            <li>You'll be able to view files shared with you on the Recieve page of Shaheen</li>
          </ol>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
          This is a secure file sharing request from Shaheen File Sharing.
          If you didn't expect this email, please ignore it.
        </p>
      </div>
    `;

        // Send the email directly using nodemailer
        const mailOptions = {
            from: `"${senderEmail} via Shaheen" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `${senderEmail} wants to share "${fileName}" with you`,
            html: emailContent,
        };

        const info = await transporter.sendMail(mailOptions);

        // Return success response
        return {
            success: true,
            messageId: info.messageId,
            receiveLink: receiveLink,
        };
    } catch (error) {
        console.error("Error sending file request:", error);
        throw new Error("Failed to send file request: " + error.message);
    }
}

export async function sendRecipientPublicKey(formData) {
    // Extract form data
    const recipientPublicKey = formData.get("recipientPublicKey");
    const senderEmail = formData.get("senderEmail");
    const recipientEmail = formData.get("recipientEmail");
    const fileName = formData.get("fileName");
    const senderPublicKey = formData.get("senderPublicKey");
    const fileDescription = formData.get("fileDescription");
    const startDate = formData.get("startDate");
    const expirationDate = formData.get("expirationDate");
    const accessCount = formData.get("accessCount");
    const accessTime = formData.get("accessTime");

    const macRecipientPublicKey = formData.get("macRecipientPublicKey");

    // Validate required fields
    if (!recipientPublicKey || !senderEmail || !fileName || !senderPublicKey) {
        throw new Error("Recipient public key, sender email, file name, and sender public key are required");
    }

    try {
        // Build the upload link with query parameters

        const host = process.env.NEXT_PUBLIC_APP_URL;

        let uploadLink = `${host}/upload?senderEmail=${encodeURIComponent(senderEmail)}&recipientEmail=${encodeURIComponent(
            recipientEmail
        )}&fileName=${encodeURIComponent(fileName)}&senderPublicKey=${encodeURIComponent(senderPublicKey)}&recipientPublicKey=${encodeURIComponent(
            recipientPublicKey
        )}&macRecipientPublicKey=${encodeURIComponent(macRecipientPublicKey)}`;

        // Add optional parameters
        if (fileDescription) uploadLink += `&description=${encodeURIComponent(fileDescription)}`;
        if (startDate) uploadLink += `&startDate=${encodeURIComponent(startDate)}`;
        if (expirationDate) uploadLink += `&expirationDate=${encodeURIComponent(expirationDate)}`;
        if (accessCount) uploadLink += `&accessCount=${encodeURIComponent(accessCount)}`;
        if (accessTime) uploadLink += `&accessTime=${encodeURIComponent(accessTime)}`;

        // Create email content
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${host}/logo.png" alt="Shaheen Logo" style="width: 100px; height: auto;">
          <h1 style="color: #333;">Ready to Upload Your File</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          The recipient has generated their encryption keys and is ready to receive your file <strong>${fileName}</strong>.
        </p>
        
        <div style="margin: 25px 0; text-align: center;">
          <a href="${uploadLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Upload Your File
          </a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px;">
          <h3 style="color: #333; font-size: 16px;">What Happens Next</h3>
          <ol style="padding-left: 20px; line-height: 1.5;">
            <li>Click the button above to access the upload page</li>
            <li>Select your file to upload</li>
            <li>Your file will be encrypted using the established secret key</li>
            <li>The recipient will be able to access and decrypt file using the key established on recipient client</li>
          </ol>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
          This link is unique and secure. Do not share it with anyone else.
        </p>
      </div>
    `;

        // Send the email directly using nodemailer
        const mailOptions = {
            from: `"Shaheen File Sharing" <${process.env.EMAIL_USER}>`,
            to: senderEmail,
            subject: `Ready to upload "${fileName}" to ${recipientEmail}`,
            html: emailContent,
        };

        const info = await transporter.sendMail(mailOptions);

        // Return success response
        return {
            success: true,
            messageId: info.messageId,
            uploadLink: uploadLink,
        };
    } catch (error) {
        console.error("Error sending recipient public key:", error);
        throw new Error("Failed to send upload notification: " + error.message);
    }
}

// // Parse and get the URL query parameters
// export function parseUrlQuery_reciver(urlString) {
//   try {
//     const url = new URL(urlString);
//     const params = new URLSearchParams(url.search);
//     return {
//       senderEmail: params.get("senderEmail"),
//       recipientEmail: params.get("recipientEmail"),
//       fileName: params.get("fileName"),
//       senderPublicKey: params.get("senderPublicKey"),
//       macSenderPublicKey: params.get("macSenderPublicKey"),
//       accessTime: params.get("accessTime"),
//     };
//   } catch (err) {
//     console.error("Failed to parse URL", err);
//     return null;
//   }
// }

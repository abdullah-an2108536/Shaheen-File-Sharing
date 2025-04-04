"use client";
import React from "react";

export default function EmailConstructor({
  senderEmail,
  includeEmail,
  fileDescription,
  expirationDate,
  viewHours,
  downloadLink,
}) {
  // Conditionally render Expiration block
  let expirationBlock = "";
  if (expirationDate && expirationDate !== "No Expiration") {
    expirationBlock = `
      <div style="color: red; font-weight: bold; text-align: center; margin-top: 10px;">
        ⚠️ Note: File will expire on ${expirationDate}
      </div>
    `;
  }

  // Conditionally render Sender Email block
  let senderEmailBlock = "";
  if (includeEmail && senderEmail) {
    senderEmailBlock = `
      <div style="background-color: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd; margin-top: 10px;">
        <div><strong>Sender's Email:</strong> ${senderEmail}</div>
      </div>
    `;
  }

  // Conditionally render ViewHours block (if not "All Day")
  let viewHoursBlock = "";
  if (viewHours && viewHours !== "All Day" && viewHours.trim() !== " - ") {
    viewHoursBlock = `
      <div><strong>View Hours:</strong> ${viewHours}</div>
    `;
  }

  // Conditionally render Description (if not "No Description")
  let descriptionBlock = "";
  if (fileDescription && fileDescription !== "No Description") {
    descriptionBlock = `
      <div><strong>Description:</strong> ${fileDescription}</div>
    `;
  }

  // Build final HTML
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <div style="max-width: 500px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px #ddd;">
        
        <!-- Logo -->
        <img src="/Shaheenlogobg.png" alt="Shaheen Logo" style="width: 100%; border-radius: 10px 10px 0 0;" />
        
        <!-- Header -->
        <div style="color: black; text-align: center;">File Is On Its Way</div>
        <div style="text-align: center;">
          Hello User, a file is on its way. Would you like to accept it?
        </div>
  
        <!-- "From" Box -->
        <div style="background-color: #f3f3f3; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <div style="font-weight: bold; color: red;">❗ You are Receiving the file from:</div>
        </div>
  
        <!-- Optional Sender Email -->
        ${senderEmailBlock}
        
        <!-- Optional "View Hours" -->
        ${
          viewHoursBlock
            ? `<div style="background-color: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd; margin-top: 10px;">
                 ${viewHoursBlock}
               </div>`
            : ""
        }

        <!-- Optional Description -->
        ${
          descriptionBlock
            ? `<div style="margin-top:10px; background-color: #fff; border:1px solid #ddd; border-radius:5px; padding:10px;">
                 ${descriptionBlock}
               </div>`
            : ""
        }

        <!-- Optional Expiration Note -->
        ${expirationBlock}
  
        <!-- Download Link Button -->
        <div style="text-align: center; margin-top: 20px;">
          <a href="${downloadLink}" target="_blank"
            style="display: inline-block; padding: 10px 20px; background: blue; color: white; text-decoration: none; border-radius: 5px;">
            🔽 Get The File
          </a>
        </div>
  
        <div style="text-align: center; font-size: 12px; color: gray; margin-top: 10px;">
          If you received this message by mistake, please ignore it.
        </div>
      </div>
    </div>
  `;
}
 
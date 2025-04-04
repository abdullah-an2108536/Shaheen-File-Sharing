// pages/api/retrieve.js
import { NextResponse } from "next/server";
import { google } from "googleapis";
import axios from "axios";
import crypto from "crypto";
import { SofaIcon } from "lucide-react";

import { Readable } from "stream";

export const config = {
  runtime: "nodejs"
};

/**
 * Decrypts a buffer encrypted using AES-256-CBC.
 */
function decrypt(buffer, keyHex) {
  const algorithm = "aes-256-cbc";
  const iv = buffer.slice(0, 16);
  const encryptedText = buffer.slice(16);
  const key = Buffer.from(keyHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

/* ===========================================
   Google Drive Helper Functions
   =========================================== */

export async function getGoogleAuth() {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.JWT(
    serviceAccountKey.client_email,
    null,
    serviceAccountKey.private_key,
    ["https://www.googleapis.com/auth/drive"]
  );
  return auth;
}

/**
 * Retrieves the metadata.enc file from Google Drive using the folder ID.
 */
async function retrieveMetadataFromGoogleDrive(auth) {
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = 'metadata.enc' and trashed = false`,
    fields: "files(id, name)"
  });
  if (!res.data.files || res.data.files.length === 0) {
    console.log("metadataFile not found in google");
    throw new Error("metadata.enc file not found in Google Drive");
  }
  const metadataFile = res.data.files[0];
  const fileRes = await drive.files.get(
    { fileId: metadataFile.id, alt: "media" },
    { responseType: "arraybuffer" }
  );
  console.log("Retrieved metadata.enc from Google Drive");

  return Buffer.from(fileRes.data);
}

/**
 * Retrieves a file from Google Drive (within the specified folder) by its name.
 */
export async function retrieveFileFromGoogleDrive(auth, fileName) {
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
    fields: "files(id, name)"
  });
  if (res.data.files && res.data.files.length > 0) {
    const fileId = res.data.files[0].id;
    const fileRes = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );
    return { buffer: Buffer.from(fileRes.data), source: "Google Drive" };
  } else {
    throw new Error("File not found in Google Drive");
  }
}

/**
 * Deletes a file (by name) from Google Drive (within the specified folder).
 */
export async function deleteFileFromGoogleDrive(auth, fileName) {
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
      fields: "files(id)"
    });
    if (res.data.files && res.data.files.length > 0) {
      for (const file of res.data.files) {
        await drive.files.delete({ fileId: file.id });
      }
    }
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
  }
}

/* ===========================================
   OneDrive Helper Functions
   =========================================== */

export async function getOneDriveAccessToken() {
  const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const params = new URLSearchParams();
  params.append("client_id", process.env.MS_CLIENT_ID);
  params.append("client_secret", process.env.MS_CLIENT_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.MS_ONEDRIVE_REFRESH_TOKEN);
  params.append("scope", "Files.ReadWrite offline_access");
  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return response.data.access_token;
}

/**
 * Retrieves the metadata.enc file from OneDrive (assumed to be in the root folder).
 */
export async function retrieveMetadataFromOneDrive(accessToken) {
  const url =
    "https://graph.microsoft.com/v1.0/me/drive/root:/metadata.enc:/content";
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return Buffer.from(response.data);
}

/**
 * Retrieves a file from OneDrive (assumed to be in the root folder) by its name.
 */
export async function retrieveFileFromOneDrive(accessToken, fileName) {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(
    fileName
  )}:/content`;
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return { buffer: Buffer.from(response.data), source: "OneDrive" };
}

/**
 * Deletes a file (by name) from OneDrive (in the root folder).
 */
export async function deleteFileFromOneDrive(accessToken, fileName) {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(
    fileName
  )}:`;
  try {
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error(
      "Error deleting file from OneDrive:",
      error.response?.data || error.message
    );
  }
}

/* ===========================================
   Retrieval via Google Drive and OneDrive
   =========================================== */

/**
 * Uses Google Drive to:
 *  - Retrieve and decrypt metadata.enc.
 *  - Look up the file metadata (by fileName).
 *  - Validate expiration and allowed access.
 *  - Retrieve the file.
 * // NOT USED
 *
 *
 */
export async function retrieveViaGoogle(fileName) {
  const googleAuth = await getGoogleAuth();
  const metadataEncBuffer = await retrieveMetadataFromGoogleDrive(googleAuth);

  const decryptedMetadataBuffer = decrypt(
    metadataEncBuffer,
    process.env.DECRYPTION_KEY
  );
  console.log("Decrypted metadata:", decryptedMetadataBuffer.toString());

  let metadata;
  try {
    metadata = JSON.parse(decryptedMetadataBuffer.toString());
  } catch (err) {
    throw new Error(
      "Failed to parse metadata from Google Drive: " + err.message
    );
  }
  const fileMetadata = metadata[fileName];
  if (!fileMetadata) {
    throw new Error("File metadata not found in Google Drive");
  }

  // Validate expiration.
  const now = new Date();
  if (now > new Date(fileMetadata.expirationDate)) {
    try {
      await deleteFileFromGoogleDrive(googleAuth, fileName);
    } catch (e) {
      console.error("Error deleting expired file from Google Drive", e);
    }
    try {
      const oneDriveToken = await getOneDriveAccessToken();
      await deleteFileFromOneDrive(oneDriveToken, fileName);
    } catch (e) {
      console.error("Error deleting expired file from OneDrive", e);
    }
    throw new Error("File expired");
  }

  // Validate allowed access.
  const hour = now.getHours();
  const isDayTime = hour >= 6 && hour < 10;
  if (
    (fileMetadata.allowedAccess === "day" && !isDayTime) ||
    (fileMetadata.allowedAccess === "night" && isDayTime)
  ) {
    throw new Error("File retrieval not allowed at this time");
  }

  // Retrieve the file from Google Drive.
  const fileResult = await retrieveFileFromGoogleDrive(googleAuth, fileName);
  return {
    googleAuth,
    fileMetadata,
    fileBuffer: fileResult.buffer,
    source: fileResult.source
  };
}

/**
 * Uses OneDrive to:
 *  - Retrieve and decrypt metadata.enc.
 *  - Look up the file metadata (by fileName).
 *  - Validate expiration and allowed access.
 *  - Retrieve the file.
 *
 *
 *  * // NOT USED
 */
export async function retrieveViaOneDrive(fileName) {
  const oneDriveToken = await getOneDriveAccessToken();
  const metadataEncBuffer = await retrieveMetadataFromOneDrive(oneDriveToken);
  const decryptedMetadataBuffer = decrypt(
    metadataEncBuffer,
    process.env.DECRYPTION_KEY
  );
  let metadata;
  try {
    metadata = JSON.parse(decryptedMetadataBuffer.toString());
  } catch (err) {
    throw new Error("Failed to parse metadata from OneDrive: " + err.message);
  }
  const fileMetadata = metadata[fileName];
  if (!fileMetadata) {
    throw new Error("File metadata not found in OneDrive");
  }

  // Validate expiration.
  const now = new Date();
  if (now > new Date(fileMetadata.expirationDate)) {
    try {
      const googleAuth = await getGoogleAuth();
      await deleteFileFromGoogleDrive(googleAuth, fileName);
    } catch (e) {
      console.error("Error deleting expired file from Google Drive", e);
    }
    try {
      await deleteFileFromOneDrive(oneDriveToken, fileName);
    } catch (e) {
      console.error("Error deleting expired file from OneDrive", e);
    }
    throw new Error("File expired");
  }

  // Validate allowed access.
  //const hour = now.getHours();
  //const isDayTime = hour >= 6 && hour < 18;
  //if ((fileMetadata.allowedAccess === "day" && !isDayTime) || (fileMetadata.allowedAccess === "night" && isDayTime)) {
  //    throw new Error("File retrieval not allowed at this time");
  //}

  // Retrieve the file from OneDrive.
  const fileResult = await retrieveFileFromOneDrive(oneDriveToken, fileName);
  return {
    oneDriveToken,
    fileMetadata,
    fileBuffer: fileResult.buffer,
    source: fileResult.source
  };
}

/* ===========================================
   delete-expired-files API 
   =========================================== */

/**
 * List all metadata JSON files in Google Drive.
 * Requires service account authentication.
 */
export async function listAllMetadataFilesFromGoogleDrive() {
  const auth = await getGoogleAuth(); // Assumes your helper exists
  const drive = google.drive({ version: "v3", auth });

  const metadataFiles = [];

  let nextPageToken = null;
  do {
    const res = await drive.files.list({
      q: "name contains '.metadata.json' and trashed = false",
      fields: "files(name), nextPageToken",
      pageSize: 1000,
      pageToken: nextPageToken
    });

    metadataFiles.push(...res.data.files.map((file) => file.name));
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return metadataFiles;
}

/**
 * List all metadata files in OneDrive (root directory only).
 * Requires user token or app credentials.
 */
export async function listAllMetadataFilesFromOneDrive() {
  const accessToken = await getOneDriveAccessToken(); // Assumes your helper exists

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/drive/root/children",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list OneDrive files");
  }

  const data = await response.json();

  return (data.value || [])
    .filter((item) => item.name.endsWith(".metadata.json"))
    .map((item) => item.name);
}

/**
 * Uploads metadata JSON to both Google Drive and OneDrive
 * @param {Buffer} metadataBuffer - Metadata JSON as Buffer
 * @param {string} metadataFileName - Metadata file name (sanitized)
 */

export async function uploadMetadataToClouds(metadataBuffer, metadataFileName) {
  // Sanitize filename helper
  const sanitizeSlashes = (name) => name.replace(/\//g, "__SLASH__");

  const sanitizedMetadataFileName = sanitizeSlashes(metadataFileName);
  let googleMetadataFileId = null;
  let oneDriveMetadataFileInfo = null;

  // --- UPLOAD TO GOOGLE DRIVE ---
  try {
    const serviceAccountKey = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );
    const auth = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      ["https://www.googleapis.com/auth/drive"]
    );
    const drive = google.drive({ version: "v3", auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const metadataStream = Readable.from(metadataBuffer);

    // Step 1: Check if metadata file already exists
    const listResponse = await drive.files.list({
      q: `'${folderId}' in parents and name = '${sanitizedMetadataFileName}' and trashed = false`,
      fields: "files(id)"
    });

    if (listResponse.data.files.length > 0) {
      const existingFileId = listResponse.data.files[0].id;
      // Step 2: Update existing file
      const updateResponse = await drive.files.update({
        fileId: existingFileId,
        media: {
          mimeType: "application/json",
          body: metadataStream
        }
      });
      googleMetadataFileId = updateResponse.data.id;
    } else {
      // Step 3: If not found, create new
      const createResponse = await drive.files.create({
        requestBody: {
          name: sanitizedMetadataFileName,
          parents: [folderId]
        },
        media: {
          mimeType: "application/json",
          body: metadataStream
        },
        fields: "id"
      });
      googleMetadataFileId = createResponse.data.id;
    }
  } catch (error) {
    console.error("Error uploading metadata to Google Drive:", error);
    throw new Error("Failed to upload metadata to Google Drive");
  }

  // --- UPLOAD TO ONEDRIVE ---
  try {
    const tokenUrl =
      "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    const params = new URLSearchParams();
    params.append("client_id", process.env.MS_CLIENT_ID);
    params.append("client_secret", process.env.MS_CLIENT_SECRET);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", process.env.MS_ONEDRIVE_REFRESH_TOKEN);
    params.append("scope", "Files.ReadWrite offline_access");

    const tokenResponse = await axios.post(tokenUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const accessToken = tokenResponse.data.access_token;

    const folderUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/Shaheen`;
    const folderResponse = await axios.get(folderUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const oneDriveFolderId = folderResponse.data.id;

    const metadataUploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${oneDriveFolderId}:/${encodeURIComponent(
      sanitizedMetadataFileName
    )}:/content`;
    const metadataResponse = await axios.put(
      metadataUploadUrl,
      metadataBuffer,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    oneDriveMetadataFileInfo = metadataResponse.data;
  } catch (error) {
    console.error(
      "Error uploading metadata to OneDrive:",
      error.response?.data || error.message
    );
    throw new Error("Failed to upload metadata to OneDrive");
  }

  return {
    googleMetadataFileId,
    oneDriveMetadataFileInfo,
    message: "Metadata uploaded successfully to both clouds."
  };
}

export function isWithinAllowedTimeWindow(metadata) {
  const now = new Date();

  // ✅ Check earliest access date
  if (metadata.startDate) {
    const earliest = new Date(metadata.startDate);
    if (now < earliest) {
      return {
        allowed: false,
        reason: "This file is not yet available for download."
      };
    }
  }

  // ✅ Check expiration date
  if (metadata.expirationDate) {
    const expiration = new Date(metadata.expirationDate);
    if (now > expiration) {
      return {
        allowed: false,
        reason: "This file has expired and cannot be downloaded."
      };
    }
  }

  // ✅ Check access time restriction (e.g., "day" or "all")
  if (
    metadata.accessTimeRestriction &&
    metadata.accessTimeRestriction.toLowerCase() === "day"
  ) {
    const hour = now.getHours(); // Local time
    if (hour < 8 || hour >= 18) {
      return {
        allowed: false,
        reason: "This file is only accessible between 8 AM and 6 PM."
      };
    }
  }

  // ✅ All checks passed
  return { allowed: true };
}



// Admin Status functions

export async function getGoogleDriveStorageUsage(auth) {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.about.get({ fields: "storageQuota" });
  const quota = res.data.storageQuota;

  const used = Number(quota.usageInDrive) || 0;
  const total = Number(quota.limit); // Can be undefined if unlimited

  return {
    used,
    free: total ? total - used : 0, // handle unlimited storage
    total: total || used // fallback to used if unlimited
  };
}


export async function getOneDriveStorageUsage(token) {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const total = Number(data?.quota?.total) || 0;
  const used = Number(data?.quota?.used) || 0;

  return {
    used,
    free: total ? total - used : 0,
    total: total || used
  };
}




/* ===========================================
   Main API Endpoint
   =========================================== */

/**
 * API Endpoint: GET /api/retrieve?codename=<filename>
 *
 * The query parameter "codename" is the file's name.
 * The endpoint first attempts to use Google Drive. If that fails,
 * it falls back to OneDrive. In either case, after retrieval it
 * deletes the file from both clouds.
 */
// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const fileName = searchParams.get("codename");
//         if (!fileName) {
//             return NextResponse.json({ error: "Codename (filename) is required" }, { status: 400 });
//         }

//         let result;
//         let usedStorage = "";
//         try {
//             result = await retrieveViaGoogle(fileName);
//             usedStorage = result.source;
//         } catch (googleError) {
//             console.error("Google Drive retrieval error:", googleError.message);
//             try {
//                 result = await retrieveViaOneDrive(fileName);
//                 usedStorage = result.source;
//             } catch (oneDriveError) {
//                 console.error("OneDrive retrieval error:", oneDriveError.message);
//                 return NextResponse.json({ error: "File retrieval failed on both storages" }, { status: 500 });
//             }
//         }

//         try {
//             const googleAuth = await getGoogleAuth();
//             //await deleteFileFromGoogleDrive(googleAuth, fileName);
//         } catch (e) {
//             console.error("Error deleting file from Google Drive:", e.message);
//         }
//         try {
//             const oneDriveToken = await getOneDriveAccessToken();
//             //await deleteFileFromOneDrive(oneDriveToken, fileName);
//         } catch (e) {
//             console.error("Error deleting file from OneDrive:", e.message);
//         }

//         console.log(`File retrieved from ${usedStorage}.`);
//         return new NextResponse(result.fileBuffer, {
//             headers: {
//                 "Content-Disposition": `attachment; filename="${fileName}"`,
//                 "Content-Type": "application/octet-stream",
//             },
//         });
//     } catch (error) {
//         console.error("Error during file retrieval:", error);
//         return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//     }
// }

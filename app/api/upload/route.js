import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import axios from "axios";

export const config = {
    runtime: "nodejs",
};

export async function POST(req) {
    try {
        // Parse incoming form-data.
        const formData = await req.formData();
        const file = formData.get("file");
        const metadata = formData.get("metadata");
        const senderPublicKey = formData.get("senderPublicKey");

        if (!file || !metadata || !senderPublicKey) {
            return NextResponse.json({ error: "Missing required files or parameters." }, { status: 400 });
        }

        // Convert the files (Blobs) into Node.js Buffers.
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const metadataBuffer = Buffer.from(await metadata.arrayBuffer());

        const fileName = file.name;
        const metadataFileName = metadata.name;

        let googleFileId = null;
        let googleMetadataFileId = null;
        let oneDriveFileInfo = null;
        let oneDriveMetadataFileInfo = null;

        // --- Helper: Sanitize only slashes ("/") in file names ---
        const sanitizeSlashes = (name) => {
            // Replace all "/" with a reversible placeholder (e.g., "__SLASH__")
            return name.replace(/\//g, "__SLASH__");
        };

        const desanitizeSlashes = (name) => name.replace(/__SLASH__/g, "/");

        const sanitizedFileName = sanitizeSlashes(fileName);
        const sanitizedMetadataFileName = sanitizeSlashes(metadataFileName);

        // --- UPLOAD TO GOOGLE DRIVE ---
        try {
            const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            const auth = new google.auth.JWT(serviceAccountKey.client_email, null, serviceAccountKey.private_key, [
                "https://www.googleapis.com/auth/drive",
            ]);

            const drive = google.drive({ version: "v3", auth });
            const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

            // Upload encrypted file to Google Drive
            const fileStream = Readable.from(fileBuffer);
            const driveResponse = await drive.files.create({
                requestBody: {
                    name: sanitizedFileName, // Use sanitized file name
                    parents: [folderId],
                },
                media: {
                    mimeType: file.type || "application/octet-stream",
                    body: fileStream,
                },
                fields: "id",
            });
            googleFileId = driveResponse.data.id;

            // Upload metadata file to Google Drive
            const metadataStream = Readable.from(metadataBuffer);
            const metadataResponse = await drive.files.create({
                requestBody: {
                    name: sanitizedMetadataFileName, // Use sanitized metadata name
                    parents: [folderId],
                },
                media: {
                    mimeType: "application/json",
                    body: metadataStream,
                },
                fields: "id",
            });
            googleMetadataFileId = metadataResponse.data.id;
        } catch (error) {
            console.error("Error uploading to Google Drive:", error);
        }

        // --- GET UPDATED ACCESS TOKEN FOR PERSONAL ONEDRIVE ---
        let accessToken;
        try {
            const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
            const params = new URLSearchParams();
            params.append("client_id", process.env.MS_CLIENT_ID);
            params.append("client_secret", process.env.MS_CLIENT_SECRET);
            params.append("grant_type", "refresh_token");
            params.append("refresh_token", process.env.MS_ONEDRIVE_REFRESH_TOKEN);
            params.append("scope", "Files.ReadWrite offline_access");

            const tokenResponse = await axios.post(tokenUrl, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            accessToken = tokenResponse.data.access_token;
            console.log("Access Token:", accessToken);
        } catch (error) {
            console.error("Error obtaining OneDrive access token:", error.response?.data || error.message);
            throw new Error("Failed to obtain OneDrive access token");
        }

        // --- GET ONEDRIVE FOLDER ID ---
        let oneDriveFolderId;
        try {
            const folderUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/Shaheen`;
            const folderResponse = await axios.get(folderUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            oneDriveFolderId = folderResponse.data.id;
        } catch (error) {
            console.error("Error obtaining OneDrive folder ID:", error.response?.data || error.message);
            throw new Error("Failed to obtain OneDrive folder ID");
        }

        // --- UPLOAD TO ONEDRIVE USING FOLDER ID ---
        try {
            // Upload encrypted file to OneDrive
            const fileUploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${oneDriveFolderId}:/${encodeURIComponent(
                sanitizedFileName
            )}:/content`;
            const fileResponse = await axios.put(fileUploadUrl, fileBuffer, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": file.type || "application/octet-stream",
                },
            });
            console.log("File uploaded successfully to OneDrive:", fileResponse.data);
            oneDriveFileInfo = fileResponse.data;

            // Upload metadata file to OneDrive
            const metadataUploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${oneDriveFolderId}:/${encodeURIComponent(
                sanitizedMetadataFileName
            )}:/content`;
            const metadataResponse = await axios.put(metadataUploadUrl, metadataBuffer, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            console.log("Metadata file uploaded successfully to OneDrive:", metadataResponse.data);
            oneDriveMetadataFileInfo = metadataResponse.data;
        } catch (error) {
            console.error("Error uploading to OneDrive:", error.response?.data || error.message);
            throw new Error("Failed to upload files to OneDrive");
        }

        return NextResponse.json({
            googleFileId,
            googleMetadataFileId,
            oneDriveFileInfo,
            oneDriveMetadataFileInfo,
            message: "Files uploaded to Google Drive and OneDrive successfully.",
        });
    } catch (error) {
        console.error("Error processing upload:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

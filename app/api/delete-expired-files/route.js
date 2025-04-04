import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  getOneDriveAccessToken,
  listAllMetadataFilesFromGoogleDrive,
  retrieveFileFromGoogleDrive,
  retrieveFileFromOneDrive,
  deleteFileFromGoogleDrive,
  deleteFileFromOneDrive,
} from "@/lib/cloudHelper";

export async function POST() {
  try {
    const now = new Date();
    const deletedFiles = [];

    const googleAuth = await getGoogleAuth();
    const oneDriveToken = await getOneDriveAccessToken();

    // 🔍 Step 1: List all metadata files from Google Drive
    const metadataFiles = await listAllMetadataFilesFromGoogleDrive();

    for (const fileName of metadataFiles) {
      if (!fileName.endsWith(".metadata.json")) continue;

      let metadata = null;

      // 📥 Step 2: Try to retrieve metadata from Google Drive
      try {
        const file = await retrieveFileFromGoogleDrive(googleAuth, fileName);
        metadata = JSON.parse(file.buffer.toString("utf-8"));
        console.log(`✅ Retrieved metadata from Google: ${fileName}`);
      } catch (googleErr) {
        console.warn(`⚠️ Google Drive failed for ${fileName}, trying OneDrive...`);

        try {
          const file = await retrieveFileFromOneDrive(oneDriveToken, fileName);
          metadata = JSON.parse(file.buffer.toString("utf-8"));
          console.log(`✅ Retrieved metadata from OneDrive: ${fileName}`);
        } catch (oneDriveErr) {
          console.error(`❌ Failed to retrieve metadata for ${fileName} from both clouds`);
          continue; // Skip to next file
        }
      }

      // 🕒 Step 3: Check expiration date
      const expiryDate = metadata.expirationDate
        ? new Date(metadata.expirationDate)
        : new Date(new Date(metadata.uploadDate).getTime() + 60 * 24 * 60 * 60 * 1000); // +60 days fallback

      if (now > expiryDate) {
        const encryptedFileName = fileName.replace(".metadata.json", ".encrypted");

        // 🗑️ Step 4: Delete from both clouds
        await deleteFileFromGoogleDrive(googleAuth, fileName).catch(() => {});
        await deleteFileFromGoogleDrive(googleAuth, encryptedFileName).catch(() => {});
        await deleteFileFromOneDrive(oneDriveToken, fileName).catch(() => {});
        await deleteFileFromOneDrive(oneDriveToken, encryptedFileName).catch(() => {});

        deletedFiles.push(fileName);
        console.log(`🧹 Deleted expired: ${fileName}`);
      }
    }

    return NextResponse.json(
      { deletedCount: deletedFiles.length, deletedFiles },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error in delete-expired-files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

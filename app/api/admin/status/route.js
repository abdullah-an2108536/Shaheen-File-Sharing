import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  getOneDriveAccessToken,
  listAllMetadataFilesFromGoogleDrive,
  listAllMetadataFilesFromOneDrive,
  retrieveFileFromGoogleDrive,
  retrieveFileFromOneDrive,
  getGoogleDriveStorageUsage,
  getOneDriveStorageUsage
} from "@/lib/cloudHelper";

export async function GET() {
  try {
    const metadataMap = {};
    const uploadDates = [];

    const googleAuth = await getGoogleAuth();
    const oneDriveToken = await getOneDriveAccessToken();

    const googleFiles = await listAllMetadataFilesFromGoogleDrive();
    const oneDriveFiles = await listAllMetadataFilesFromOneDrive();
    const uniqueFiles = new Set([...googleFiles, ...oneDriveFiles]);
    

    const googlePresent = new Set();
    const oneDrivePresent = new Set();

    for (const fileName of uniqueFiles) {
      if (!fileName.endsWith(".metadata.json")) continue;

      const key = fileName
        .replace(".metadata.json", "")
        .replace(/__SLASH__/g, "/");

      if (!metadataMap[key]) {
        metadataMap[key] = {
          senderPublicKey: key,
          metadata: null
        };
      }

      let metadataFound = false;

      // ✅ Check Google Drive first
      if (googleFiles.includes(fileName)) {
        try {
          const file = await retrieveFileFromGoogleDrive(googleAuth, fileName);
          const content = JSON.parse(file.buffer.toString("utf-8"));
          if (content?.name && content?.fileSize && content?.uploadDate) {
            metadataMap[key].metadata = content;
            uploadDates.push(content.uploadDate);
            metadataFound = true;
            googlePresent.add(key);
          }
        } catch (e) {
          console.warn(`⚠️ Google fetch failed for ${fileName}:`, e.message);
        }
      }

      // ✅ Fallback to OneDrive (or also count if present even if not the source)
      if (oneDriveFiles.includes(fileName)) {
        try {
          if (!metadataFound) {
            const file = await retrieveFileFromOneDrive(oneDriveToken, fileName);
            const content = JSON.parse(file.buffer.toString("utf-8"));
            if (content?.name && content?.fileSize && content?.uploadDate) {
              metadataMap[key].metadata = content;
              uploadDates.push(content.uploadDate);
              metadataFound = true;
            }
          }
          oneDrivePresent.add(key); // Always count if exists
        } catch (e) {
          console.warn(`⚠️ OneDrive fetch failed for ${fileName}:`, e.message);
        }
      }
    }

    const validFiles = Object.values(metadataMap).filter((entry) => !!entry.metadata);

    const googleStats = await getGoogleDriveStorageUsage(googleAuth);
    const oneDriveStats = await getOneDriveStorageUsage(oneDriveToken);

    return NextResponse.json({
      totalFiles: validFiles.length,
      filesPerCloud: {
        google: googlePresent.size,
        oneDrive: oneDrivePresent.size
      },
      uploadDates,
      storage: {
        google: googleStats,
        oneDrive: oneDriveStats,
        combined: {
          used: googleStats.used + oneDriveStats.used,
          free: googleStats.free + oneDriveStats.free,
          total: googleStats.total + oneDriveStats.total
        }
      }
    });
  } catch (err) {
    console.error("❌ Error in dashboard-stats:", err);
    return NextResponse.json(
      { error: "Dashboard stats failed" },
      { status: 500 }
    );
  }
}

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

      try {
        if (googleFiles.includes(fileName)) {
          const file = await retrieveFileFromGoogleDrive(googleAuth, fileName);
          metadataMap[key].metadata = JSON.parse(file.buffer.toString("utf-8"));
        }
      } catch {}

      try {
        if (oneDriveFiles.includes(fileName) && !metadataMap[key].metadata) {
          const file = await retrieveFileFromOneDrive(oneDriveToken, fileName);
          metadataMap[key].metadata = JSON.parse(file.buffer.toString("utf-8"));
        }
      } catch {}

      const uploadDate = metadataMap[key].metadata?.uploadDate;
      if (uploadDate) uploadDates.push(uploadDate);
    }

    const googleStats = await getGoogleDriveStorageUsage(googleAuth);
    const oneDriveStats = await getOneDriveStorageUsage(oneDriveToken);

    return NextResponse.json({
      totalFiles: Object.keys(metadataMap).length,
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

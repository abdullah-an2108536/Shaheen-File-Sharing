import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  getOneDriveAccessToken,
  listAllMetadataFilesFromGoogleDrive,
  listAllMetadataFilesFromOneDrive,
  retrieveFileFromGoogleDrive,
  retrieveFileFromOneDrive
} from "@/lib/cloudHelper";

export async function GET() {
  const metadataMap = {}; // key: senderPublicKey, value: metadata + cloud presence
  const now = new Date();

  try {
    const googleAuth = await getGoogleAuth();
    const oneDriveToken = await getOneDriveAccessToken();

    const googleFiles = await listAllMetadataFilesFromGoogleDrive();
    const oneDriveFiles = await listAllMetadataFilesFromOneDrive();

    const uniqueFiles = new Set([...googleFiles, ...oneDriveFiles]);

    for (const fileName of uniqueFiles) {
      if (!fileName.endsWith(".metadata.json")) continue;

      const key = fileName.replace(".metadata.json", "").replace(/__SLASH__/g, "/");

      if (!metadataMap[key]) {
        metadataMap[key] = {
          senderPublicKey: key,
          metadata: null,
          fromGoogle: false,
          fromOneDrive: false
        };
      }

      try {
        if (googleFiles.includes(fileName)) {
          const file = await retrieveFileFromGoogleDrive(googleAuth, fileName);
          metadataMap[key].metadata = JSON.parse(file.buffer.toString("utf-8"));
          metadataMap[key].fromGoogle = true;
        }
      } catch {}

      try {
        if (oneDriveFiles.includes(fileName) && !metadataMap[key].metadata) {
          const file = await retrieveFileFromOneDrive(oneDriveToken, fileName);
          metadataMap[key].metadata = JSON.parse(file.buffer.toString("utf-8"));
          metadataMap[key].fromOneDrive = true;
        } else if (oneDriveFiles.includes(fileName)) {
          metadataMap[key].fromOneDrive = true;
        }
      } catch {}
    }

    return NextResponse.json({ files: Object.values(metadataMap) }, { status: 200 });
  } catch (err) {
    console.error("❌ Admin Metadata Fetch Failed:", err);
    return NextResponse.json({ error: "Failed to load metadata" }, { status: 500 });
  }
}

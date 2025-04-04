import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  deleteFileFromGoogleDrive,
  getOneDriveAccessToken,
  deleteFileFromOneDrive
} from "@/lib/cloudHelper";

// DELETE /api/delete-file?senderPublicKey=<publicKey>
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    let senderPublicKey = searchParams.get("senderPublicKey");

    if (!senderPublicKey) {
      return NextResponse.json(
        { error: "Missing senderPublicKey" },
        { status: 400 }
      );
    }

    // Sanitize senderPublicKey for Google Drive filename
    const sanitizedKey = senderPublicKey.replace(/\//g, "__SLASH__");
    const metadataFileName = `${sanitizedKey}.metadata.json`;
    const encryptedFileName = `${sanitizedKey}.encrypted`; // Assuming the file itself is named the same as the sender's public key

    console.log("Trying to delete:", encryptedFileName, metadataFileName);

    // Try deleting from Google Drive
    try {
      const googleAuth = await getGoogleAuth();
      await deleteFileFromGoogleDrive(googleAuth, encryptedFileName);
      await deleteFileFromGoogleDrive(googleAuth, metadataFileName);
      console.log("✅ Deleted file & metadata from Google Drive");
    } catch (googleError) {
      console.warn("⚠️ Google Drive deletion failed:", googleError.message);
    }

    // Try deleting from OneDrive
    try {
      const oneDriveToken = await getOneDriveAccessToken();
      await deleteFileFromOneDrive(oneDriveToken, encryptedFileName);
      await deleteFileFromOneDrive(oneDriveToken, metadataFileName);
      console.log("✅ Deleted file & metadata from OneDrive");
    } catch (oneDriveError) {
      console.error("❌ OneDrive deletion failed:", oneDriveError.message);
    }

    return NextResponse.json(
      { message: "File deleted from cloud storage" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

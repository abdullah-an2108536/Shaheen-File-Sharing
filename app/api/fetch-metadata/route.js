import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  retrieveFileFromGoogleDrive,
  getOneDriveAccessToken,
  retrieveFileFromOneDrive,
  uploadMetadataToClouds,
  deleteFileFromGoogleDrive,
  deleteFileFromOneDrive
} from "@/lib/cloudHelper";

// const desanitizeSlashes = (name) => name.replace(/_SLASH_/g, "/");

// GET /api/fetch-metadata?senderPublicKey=<publicKey>
// Fetch metadata JSON from Google Drive or OneDrive
export async function GET(req) {
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

  console.log("Trying to fetch metadata:", metadataFileName);

  try {
    // Try fetching from Google Drive
    const googleAuth = await getGoogleAuth();
    const fileResult = await retrieveFileFromGoogleDrive(
      googleAuth,
      metadataFileName
    );
    const metadataContent = JSON.parse(fileResult.buffer.toString("utf-8"));
    console.log("✅ Fetched metadata from Google Drive");
    return NextResponse.json(
      { metadata: metadataContent, source: "Google Drive" },
      { status: 200 }
    );
  } catch (googleError) {
    console.warn("⚠️ Google Drive fetch failed:", googleError.message);
  }

  try {
    // Fallback: Fetch from OneDrive
    const oneDriveToken = await getOneDriveAccessToken();
    const oneDriveResult = await retrieveFileFromOneDrive(
      oneDriveToken,
      `${sanitizedKey}.metadata.json`
    );
    const metadataContent = JSON.parse(oneDriveResult.buffer.toString("utf-8"));
    console.log("✅ Fetched metadata from OneDrive");
    return NextResponse.json(
      { metadata: metadataContent, source: "OneDrive" },
      { status: 200 }
    );
  } catch (oneDriveError) {
    console.error("❌ OneDrive fetch failed:", oneDriveError.message);
    return NextResponse.json(
      { error: "Failed to fetch metadata from both clouds" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const senderPublicKey = searchParams.get("senderPublicKey");
    if (!senderPublicKey) {
      return NextResponse.json(
        { error: "Missing senderPublicKey" },
        { status: 400 }
      );
    }

    const sanitizedKey = senderPublicKey.replace(/\//g, "__SLASH__");
    const metadataFileName = `${sanitizedKey}.metadata.json`;
    const encryptedFileName = `${sanitizedKey}.encrypted`;

    // ✅ Fetch the current metadata
    const googleAuth = await getGoogleAuth();
    const fileResult = await retrieveFileFromGoogleDrive(
      googleAuth,
      metadataFileName
    );
    const metadataContent = JSON.parse(fileResult.buffer.toString("utf-8"));

    const currentCount = metadataContent.accessCount - 1;

    //delete the file automatically if it reached to zero views
    if (currentCount === 0) {
      try {
        const auth = await getGoogleAuth();
        await deleteFileFromGoogleDrive(auth, encryptedFileName);
        await deleteFileFromGoogleDrive(auth, metadataFileName);
        const token = await getOneDriveAccessToken();
        await deleteFileFromOneDrive(token, encryptedFileName);
        await deleteFileFromOneDrive(token, metadataFileName);
        console.log("🗑️ Expired file (testing mode, not deleted)");
      } catch (e) {
        console.warn("Delete error:", e);
      }

      return NextResponse.json({ error: "File has expired" }, { status: 403 });
    }

    // ✅ Perform the decrement safely on the server
    if (metadataContent.accessCount > 0) {
      metadataContent.accessCount -= 1;
    } else {
      return NextResponse.json(
        { error: "Access count is already zero" },
        { status: 400 }
      );
    }

    // ✅ Upload updated metadata back to clouds
    const updatedMetadataBuffer = Buffer.from(JSON.stringify(metadataContent));
    const result = await uploadMetadataToClouds(
      updatedMetadataBuffer,
      metadataFileName
    );

    return NextResponse.json(
      { ...result, newAccessCount: metadataContent.accessCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error decrementing access count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

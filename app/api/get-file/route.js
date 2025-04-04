import { NextResponse } from "next/server";
import {
  getGoogleAuth,
  getOneDriveAccessToken,
  retrieveFileFromGoogleDrive,
  retrieveFileFromOneDrive,
  retrieveFileFromClouds,
  deleteFileFromGoogleDrive,
  deleteFileFromOneDrive,
  retrieveFileFromBothClouds
} from "@/lib/cloudHelper";
// import { retrieveMetadataBySenderPublicKey } from "@/lib/crypto"; // You can abstract this logic

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const senderPublicKey = searchParams.get("senderPublicKey");

    if (!senderPublicKey) {
      return NextResponse.json(
        { error: "Missing senderPublicKey" },
        { status: 400 }
      );
    }

    // 🧼 Step 1: Sanitize for filename safety
    const sanitizedKey = senderPublicKey.replace(/\//g, "__SLASH__");
    const encryptedFileName = `${sanitizedKey}.encrypted`;
    const metadataFileName = `${sanitizedKey}.metadata.json`;

    // ✅ Step 2: Fetch Metadata
    let metadataContent;
    try {
 
      const metaRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/fetch-metadata?senderPublicKey=${encodeURIComponent(senderPublicKey)}`
      );
      
      const { metadata } = await metaRes.json();
      metadataContent = metadata;
    } catch (err) {
      return NextResponse.json(
        { error: "Metadata not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    // ⏳ Step 3: Check earliest access date
    if (metadataContent.startDate) {
      const earliest = new Date(metadataContent.startDate);
      if (now < earliest) {
        return NextResponse.json(
          { error: "File access not allowed yet" },
          { status: 403 }
        );
      }
    }

    // ❗ Step 4: Check expiration
    if (metadataContent.expirationDate) {
      const expiry = new Date(metadataContent.expirationDate);

      if (now > expiry) {
        // 🧪 Optional auto-deletion (commented for testing)
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

        return NextResponse.json(
          { error: "File has expired" },
          { status: 403 }
        );
      }
    }

    // 🕒 Step 5: Check time window
    if (metadataContent.accessTime === "daytime") {
      const hour = now.getHours();
      if (hour < 8 || hour >= 18) {
        return NextResponse.json(
          { error: "File only accessible during daytime (8AM - 6PM)" },
          { status: 403 }
        );
      }
    }

    // ✅ Step 6: Try Google Drive
    try {
      const auth = await getGoogleAuth();
      const file = await retrieveFileFromGoogleDrive(auth, encryptedFileName);
      return new NextResponse(file.buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encryptedFileName}"`,
          "Content-Type": "application/octet-stream"
        }
      });
    } catch (err) {
      console.warn("📁 Google Drive fallback:", err.message);
    }

    // 🔁 Step 7: Try OneDrive
    try {
      const token = await getOneDriveAccessToken();
      const file = await retrieveFileFromOneDrive(token, encryptedFileName);
      return new NextResponse(file.buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encryptedFileName}"`,
          "Content-Type": "application/octet-stream"
        }
      });
    } catch (err) {
      return NextResponse.json(
        { error: "File not found in any cloud" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Unhandled error in get-file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

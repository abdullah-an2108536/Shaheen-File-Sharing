// app/api/retrieveFile/route.js
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("fileName");

        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.JWT(serviceAccountKey.client_email, null, serviceAccountKey.private_key, [
            "https://www.googleapis.com/auth/drive",
        ]);

        const drive = google.drive({ version: "v3", auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        const res = await drive.files.list({
            q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
            fields: "files(id, name)",
        });

        if (!res.data.files.length) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const fileId = res.data.files[0].id;
        const fileRes = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });

        return new NextResponse(fileRes.data, {
            headers: {
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Type": "application/octet-stream",
            },
        });
    } catch (err) {
        console.error("File retrieval error:", err);
        return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }
}

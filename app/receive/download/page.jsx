// app/download/page.jsx
"use client";
import { useEffect, useState, useMemo } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import FileRow from "@/components/og-comp/ui-non-chad/FileRow";
import SearchBar from "@/components/og-comp/ui-non-chad/SearchBar";
import { Filter, SortAsc, Info } from "lucide-react";
import {
  getAllSharedStoredKeys,
  getSharedSecretBySenderPublicKey,
  decryptFile,
  getMacSharedSecretBySenderPublicKey
} from "@/lib/crypto";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast"; // ChadCN toast

// Skeleton shown during loading state
function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

// Sorting + Filtering Logic

// Below setFiles, add this useMemo:
export default function DownloadPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({});

  //for searching and sorting
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState(null); // "name" | "startDate" | "expirationDate"
  const [sortAsc, setSortAsc] = useState(true);

  const sortedFiles = useMemo(() => {
    const filtered = files.filter((file) =>
      file.fileName.toLowerCase().includes(query.toLowerCase())
    );

    if (!sortField) return filtered;

    const sortFn = {
      name: (a, b) =>
        sortAsc
          ? a.fileName.localeCompare(b.fileName)
          : b.fileName.localeCompare(a.fileName),
      startDate: (a, b) =>
        sortAsc
          ? new Date(a.startDate) - new Date(b.startDate)
          : new Date(b.startDate) - new Date(a.startDate),
      expirationDate: (a, b) =>
        sortAsc
          ? new Date(a.expirationDate) - new Date(b.expirationDate)
          : new Date(b.expirationDate) - new Date(a.expirationDate)
    };

    return filtered.sort(sortFn[sortField]);
  }, [files, query, sortField, sortAsc]);

  // Step 1: Fetch all shared keys and build the file list
  useEffect(() => {
    const fetchAndBuildFiles = async () => {
      try {
        const sharedSecrets = await getAllSharedStoredKeys();
        const filesData = [];

        for (const entry of sharedSecrets) {
          const senderPublicKey = entry.senderPublicKey;

          try {
            const res = await fetch(
              `/api/fetch-metadata?senderPublicKey=${encodeURIComponent(
                senderPublicKey
              )}`
            );
            if (!res.ok) throw new Error("Failed to fetch metadata");
            const { metadata } = await res.json();

            const accessCount = Number(metadata.accessCount ?? 0);
            const now = new Date();
            const errors = [];

            // Pre-checks
            if (accessCount <= 0) errors.push("Download limit exceeded");

            if (
              metadata.startDate &&
              new Date(now) < new Date(metadata.startDate)
            ) {
              errors.push(
                `File not accessible until ${new Date(
                  metadata.startDate
                ).toLocaleDateString()}`
              );
            }

            const expiry = metadata.expirationDate
              ? new Date(metadata.expirationDate)
              : new Date(
                  new Date(metadata.uploadDate).getTime() +
                    60 * 24 * 60 * 60 * 1000
                );

            if (now > expiry) errors.push("File has expired");

            if (metadata.accessTime === "daytime") {
              const hour = now.getHours();
              if (hour < 8 || hour >= 18) {
                errors.push("Access allowed only between 8AM–6PM");
              }
            }

            filesData.push({
              id: senderPublicKey,
              fileName: metadata.name,
              description: metadata.description || "No description",
              startDate: metadata.startDate || "",
              expirationDate: metadata.expirationDate || "",
              fileSize: `${(metadata.fileSize / 1024).toFixed(2)} KB`,
              fileType: metadata.fileType,
              uploadDate: new Date(metadata.uploadDate).toLocaleDateString(),
              accessCount,
              accessTime: metadata.accessTime,
              disableDownload: errors.length > 0,
              accessError: errors.length > 0 ? errors.join(" • ") : null,
              status: "ready"
            });
          } catch (err) {
            console.warn(`❌ Skipping ${senderPublicKey}:`, err);
          }
        }

        setFiles(filesData);
      } catch (err) {
        console.error("❌ Error during metadata fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndBuildFiles();
  }, []);

  // Step 2: Download Handler (triggered when download button is clicked)
  const handleDownload = async (file) => {
    try {
      // Disable button immediately
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, disableDownload: true } : f
        )
      );
      setProgressMap((prev) => ({ ...prev, [file.id]: 5 }));

      // Step 2.1: Get MAC shared secret from IndexedDB
      const macSharedSecret = await getMacSharedSecretBySenderPublicKey(
        file.id
      );
      if (!macSharedSecret) throw new Error("Missing MAC shared secret");

      // Step 2.2: Request file (MAC & time checks handled server-side)
      const response = await fetch(
        `/api/get-file?senderPublicKey=${encodeURIComponent(file.id)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Download Denied",
          description: errorText || "Access rules blocked the download",
          variant: "destructive"
        });
        throw new Error(`Server denied file: ${errorText}`);
      }

      // Step 2.3: Get encrypted file buffer
      const encryptedBuffer = await response.arrayBuffer();

      // Step 2.4: Retrieve shared secret from IndexedDB
      const sharedSecret = await getSharedSecretBySenderPublicKey(file.id);
      if (!sharedSecret) throw new Error("Missing shared secret");

      setProgressMap((prev) => ({ ...prev, [file.id]: 50 }));

      // Step 2.5: Decrypt the file
      const decryptedBuffer = await decryptFile(encryptedBuffer, sharedSecret);
      setProgressMap((prev) => ({ ...prev, [file.id]: 80 }));

      // Step 2.6: Trigger download
      const blob = new Blob([decryptedBuffer], { type: file.fileType });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.fileName;
      link.click();

      setProgressMap((prev) => ({ ...prev, [file.id]: 100 }));

      // Step 2.7: Call server to decrement access count
      await fetch(
        `/api/fetch-metadata?senderPublicKey=${encodeURIComponent(file.id)}`,
        {
          method: "PUT"
        }
      );

      // Step 2.8: Update UI state
      setTimeout(() => {
        setProgressMap((prev) => ({ ...prev, [file.id]: 0 }));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  accessCount: f.accessCount - 1,
                  disableDownload: f.accessCount - 1 <= 0
                }
              : f
          )
        );
      }, 1500);
    } catch (err) {
      console.error(`❌ Download failed for ${file.fileName}:`, err);
      setProgressMap((prev) => ({ ...prev, [file.id]: 0 }));
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, disableDownload: false } : f
        )
      );
    }
  };

  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className=" w-full flex-1 py-12">
        <div className="mx-auto max-w-[800px]">
          <h1 className="text-3xl font-bold mb-8">Files Shared With You</h1>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div>

              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                <div>
                  <SearchBar query={query} setQuery={setQuery} />
                </div>

                <div className="flex gap-2">
                  {["name", "startDate", "expirationDate"].map((field) => (
                    <button
                      key={field}
                      onClick={() => {
                        if (sortField === field) {
                          setSortAsc((prev) => !prev);
                        } else {
                          setSortField(field);
                          setSortAsc(true);
                        }
                      }}
                      className={`flex items-center px-3 py-1 rounded-md border ${
                        sortField === field
                          ? "bg-blue-800 text-blue-100"
                          : "bg-slate-400 text-gray-200"
                      }`}
                    >
                      {field === "name" && "Name"}
                      {field === "startDate" && "Start Date"}
                      {field === "expirationDate" && "Expiry"}
                      {sortField === field && (
                        <div className={`ml-1 ${!sortAsc ? "rotate-180" : ""}`}>
                          <SortAsc
                            className={`ml-1 transition-transform ${
                              !sortAsc ? "rotate-270" : ""
                            }`}
                            size={16}
                          />
                        </div>
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setSortField(null);
                      setSortAsc(true);
                    }}
                    className="flex items-center px-3 py-1 rounded-md border bg-slate-400 text-gray-200 active:bg-blue-800 active:text-blue-100"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="flex justify-between border rounded-sm p-4 text-sm text-muted-foreground my-2">
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4 pr-1"/>
                  <span>
                    if you don't see the file you are looking for, then this
                    means the file may not been uploaded or has expired.
                    Refresh the page to see the latest changes!
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                {sortedFiles.length > 0 ? (
                  sortedFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      {...file}
                      fileId={file.id}
                      fileName={file.fileName}
                      description={file.description}
                      fileSize={file.fileSize}
                      fileType={file.fileType}
                      accessCount={file.accessCount}
                      accessTime={file.accessTime}
                      startDate={file.startDate}
                      expirationDate={file.expirationDate}
                      uploadDate={file.uploadDate}
                      progress={progressMap[file.id] || 0}
                      onDownload={() => handleDownload(file)}
                      onRemove={() => handleRemoveFile(file.id)}
                      accessError={file.accessError}
                      disableDownload={file.disableDownload}
                      status={
                        progressMap[file.id] > 0 && progressMap[file.id] < 100
                          ? "downloading"
                          : "completed"
                      }
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    No files available.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

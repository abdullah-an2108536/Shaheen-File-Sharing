"use client";
import React, { useState, useMemo, useEffect } from "react";
import FileRow from "@/components/og-comp/ui-non-chad/FileRow";
import UserCard from "@/components/og-comp/admin/UserCard";
import Navigation from "@/components/navigation";
import SearchBar from "@/components/og-comp/ui-non-chad/SearchBar";
import { Filter, SortAsc } from "lucide-react";
import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast"; // ChadCN toast
// import styles from "./styles.css"; // ← Tailwind/layer styles

export default function AdminDashboard() {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortField, setSortField] = useState(null); // "name" or "date"
  const [sortAsc, setSortAsc] = useState(true); // Toggle direction

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

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdmin = async () => {
      const res = await fetch("/api/check-admin");
      const { isAdmin } = await res.json();
      setIsAdmin(isAdmin);
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true); // Show skeleton
      try {
        const res = await fetch("/api/admin/fetch-all-metadata");
        const { files } = await res.json();

        const formatted = files.map((entry) => {
          const metadata = entry.metadata || {};

          return {
            id: entry.senderPublicKey,
            fileName: metadata.name || "Unknown File",
            description: metadata.description || "",
            fileSize: `${(metadata.fileSize / 1024).toFixed(2)} KB`,
            fileType: metadata.fileType || "Unknown",
            uploadDate: new Date(metadata.uploadDate).toLocaleDateString(),
            accessCount: metadata.accessCount ?? 0,
            accessTime: metadata.accessTime,
            startDate: metadata.startDate || "",
            expirationDate: metadata.expirationDate || "",
            isAdmin: true,
            fromGoogle: entry.fromGoogle,
            fromOneDrive: entry.fromOneDrive
          };
        });

        setFiles(formatted);
      } catch (err) {
        console.error("Failed to load admin metadata:", err);
      } finally {
        setLoading(false); // ✅ Done loading
      }
    };

    fetchMetadata();
  }, []);

  //used for searching
  // const filteredFiles = useMemo(() => {
  //   return files.filter((file) =>
  //     file.fileName.toLowerCase().includes(query.toLowerCase())
  //   );
  // }, [query, files]);

  const sortedFiles = useMemo(() => {
    const base = [...files].filter((file) =>
      file.fileName.toLowerCase().includes(query.toLowerCase())
    );

    if (!sortField) return base;

    if (sortField === "name") {
      base.sort((a, b) => {
        const nameA = a.fileName.toLowerCase();
        const nameB = b.fileName.toLowerCase();
        return sortAsc
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (sortField === "date") {
      base.sort((a, b) => {
        const dateA = new Date(a.uploadDate);
        const dateB = new Date(b.uploadDate);
        return sortAsc ? dateA - dateB : dateB - dateA;
      });
    }

    return base;
  }, [files, query, sortField, sortAsc]);

  // Remove File Handler
  const handleRemove = (id) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <Navigation />

      {/* Main Content */}
      {isAdmin ? (
        <div className="flex-grow p-6">
          {/* Title */}
          <div className="text-3xl font-bold text-center mb-6">
            Admin Dashboard
          </div>

          <div className="flex flex-col justify-between space-y-4">
            {/* File List */}
            <div className="bg-white shadow-md rounded-lg p-2 space-x-4">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <div>
                  <div className="flex flex-row justify-between items-center mb-4">
                    {/* Sort Buttons */}
                    <div>
                      <SearchBar query={query} setQuery={setQuery} />
                    </div>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => {
                          if (sortField === "name") {
                            setSortAsc(!sortAsc);
                          } else {
                            setSortField("name");
                            setSortAsc(true);
                          }
                        }}
                        className={`flex items-center px-3 py-1 rounded-md border ${
                          sortField === "name"
                            ? "bg-blue-800 text-blue-100"
                            : "bg-slate-400 text-gray-200"
                        }`}
                      >
                        Name
                        {sortField === "name" && (
                          <SortAsc
                            className={`ml-1 transition-transform ${
                              !sortAsc ? "rotate-180" : ""
                            }`}
                            size={16}
                          />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (sortField === "date") {
                            setSortAsc(!sortAsc);
                          } else {
                            setSortField("date");
                            setSortAsc(true);
                          }
                        }}
                        className={`flex items-center px-3 py-1 rounded-md border ${
                          sortField === "date"
                            ? "bg-blue-800 text-blue-100"
                            : "bg-slate-400 text-gray-200"
                        }`}
                      >
                        Upload Date
                        {sortField === "date" && (
                          <SortAsc
                            className={`ml-1 transition-transform ${
                              !sortAsc ? "rotate-180" : ""
                            }`}
                            size={16}
                          />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSortField(null);
                          setSortAsc(true);
                        }}
                        className="flex items-center px-3 py-1 rounded-md border bg-slate-400 text-gray-200 active:bg-blue-800 active:text-blue-100"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  {/* Scrollable File Table */}
                  <div>
                    {sortedFiles.map((file) => (
                      <FileRow
                        key={file.id}
                        fileId={file.id} // ✅ Explicitly pass fileId
                        {...file}
                        onRemove={() => handleRemove(file.id)}
                        fromGoogle={file.fromGoogle}
                        fromOneDrive={file.fromOneDrive}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-3xl text-red-600 font-bold text-center mb-6">
          Unauthorized Access - Admin Dash
        </div>
      )}
    </div>
  );
}

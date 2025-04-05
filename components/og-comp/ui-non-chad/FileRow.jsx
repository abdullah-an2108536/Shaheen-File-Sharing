"use client";
import React, { useState } from "react";
import { Download, Trash2, AlertCircle } from "lucide-react";
import CustomButton from "@/components/og-comp/ui-non-chad/CustomButton";
import clsx from "clsx";
import AlertModal from "@/components/AlertModal";

export default function FileRow({
  fileId,
  fileName,
  description,
  fileSize,
  fileType,
  progress = 0,
  accessCount,
  accessTime,
  status = "ready",
  onDownload,
  disableDownload = false,
  onRemove,
  startDate,
  expirationDate,
  uploadDate,
  accessError = null,
  runtimeError = null,

  isAdmin = false,
  fromGoogle,
  fromOneDrive
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      const res = await fetch(
        `/api/delete-file?senderPublicKey=${encodeURIComponent(fileId)}`,
        {
          method: "DELETE"
        }
      );
      if (!res.ok) throw new Error("Failed to delete");
      onRemove();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "—";

  return (
    <div className="bg-white shadow rounded-md p-3 mb-3 text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-gray-800 truncate text-xl">
          🗃️ {fileName}
        </div>
      </div>

      {/* Inline Metadata and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        {/* File Description & Metadata  */}

        <div className="mb-2 text-xs text-gray-600 space-y-1">
          {description && description !== "No description" && (
            <div>📝 {description}</div>
          )}
          <div>📦 Size: {fileSize}</div>
          <div>📄 Type: {fileType}</div>
          {isAdmin && <div>🗓 Uploaded: {uploadDate}</div>}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Access Metadata */}
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>👁 {accessCount} view/s left</span>
            <span>
              ⏰ Available{" "}
              {accessTime === "daytime" ? "8AM – 6PM only" : "24/7"}
            </span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className={fromGoogle ? "text-green-600" : "text-gray-300"}>
                🌐 Google
              </span>
              <span
                className={fromOneDrive ? "text-blue-600" : "text-gray-300"}
              >
                ☁️ OneDrive
              </span>
            </div>
          )}

          {/* Action Buttons */}
          {!isAdmin && (
            <CustomButton
              icon={
                disableDownload || status === "error" ? AlertCircle : Download
              }
              color={
                disableDownload
                  ? "bg-gray-300 text-gray-600"
                  : "bg-green-500 text-white"
              }
              onClick={onDownload}
              disabled={disableDownload}
              className="size-8 p-1 rounded-md"
            />
          )}
          <CustomButton
            icon={Trash2}
            color="bg-red-500 text-white"
            onClick={() => setShowDeleteModal(true)}
            className="size-8 p-1 rounded-md"
          />
        </div>
      </div>

      {/* Access Rules */}
      {!isAdmin && (
        <div>
          <div className="mt-2 bg-gray-50 text-gray-600 text-xs rounded-md px-3 py-2 border border-gray-200 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="mb-1 font-medium">🔒 Access Rules:</div>
              {!isExpanded && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 items-center">
                  {startDate && (
                    <div className="flex items-center gap-1">
                      ⏳ <div>From: {formatDate(startDate)}</div>
                    </div>
                  )}
                  {expirationDate ? (
                    <div className="flex items-center gap-1">
                      ⚠️ <div>Expires: {formatDate(expirationDate)}</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      ⚠️{" "}
                      <div>
                        Expires:{" "}
                        {formatDate(
                          new Date(
                            new Date(uploadDate).getTime() +
                              60 * 24 * 60 * 60 * 1000
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {accessTime === "daytime" && (
                    <div className="flex items-center gap-1">
                      🕒 <div>8AM – 6PM only</div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="text-xs text-gray-500 hover:underline"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            </div>

            {isExpanded && (
              <ul className="list-disc list-inside space-y-1">
                {startDate && (
                  <li>
                    ⏳ Available from: <strong>{formatDate(startDate)}</strong>
                  </li>
                )}
                {expirationDate ? (
                  <li>
                    ⚠️ Expires on: <strong>{formatDate(expirationDate)}</strong>
                  </li>
                ) : (
                  <li>
                    ⚠️ No expiration — auto-expires:{" "}
                    <strong>
                      {formatDate(
                        new Date(
                          new Date(uploadDate).getTime() +
                            60 * 24 * 60 * 60 * 1000
                        )
                      )}
                    </strong>
                  </li>
                )}
                {accessTime === "daytime" && (
                  <li>
                    🕒 Allowed between <strong>8AM – 6PM</strong>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div>
            {/* 🔴 Error Message */}
            {accessError && (
              <div className="mt-2 px-3 py-2 rounded bg-red-100 border border-red-300 text-red-700 text-xs">
                🚫 {accessError}
              </div>
            )}
          </div>
          {runtimeError && (
            <div className="mt-2 p-2 rounded text-sm bg-red-100 text-red-600">
              ❌ ❗ {runtimeError}
            </div>
          )}
        </div>
      )}

      {/* Download Progress */}
      {!isAdmin && progress > 0 && (
        <div className="mt-3 relative h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx("h-full transition-all", {
              "bg-blue-500": status === "downloading",
              "bg-green-500": status === "completed",
              "bg-red-500": status === "error"
            })}
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex justify-center items-center text-[10px] text-gray-700">
            {progress}%
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      {showDeleteModal && (
        <AlertModal
          fileName={fileName}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

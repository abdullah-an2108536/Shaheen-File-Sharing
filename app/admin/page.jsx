"use client";
import React, { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
// import TopBar from "@/components/ui/TopBar";
import StatusCard from "@/components/og-comp/admin/StatusCard";
import TransfersChart from "@/components/og-comp/admin/TransfersChart";
import StorageOverview from "@/components/og-comp/admin/StorageOverview";
import {
  BarChart,
  User,
  Settings,
  HardDrive,
  Database,
  Cloud
} from "lucide-react"; // Importing icons
// import styles from "./styles.css"; // ← Tailwind/layer styles

function groupTransfers(uploadDates) {
  const now = new Date();
  const dates = uploadDates.map((d) => new Date(d));
  if (dates.length === 0) return [];

  const earliest = new Date(Math.min(...dates));
  const diffDays = Math.floor((now - earliest) / (1000 * 60 * 60 * 24));

  const groups = {};

  for (const date of dates) {
    let key;
    if (diffDays <= 7) {
      key = date.toLocaleDateString(); // e.g., 3/30/2025
    } else if (diffDays <= 30) {
      const week = Math.ceil(date.getDate() / 7);
      key = `Week ${week} - ${date.toLocaleString("default", {
        month: "short"
      })}`;
    } else if (diffDays <= 365) {
      key = date.toLocaleString("default", { month: "short" }); // Jan, Feb...
    } else {
      key = date.getFullYear().toString();
    }

    groups[key] = (groups[key] || 0) + 1;
  }

  return Object.entries(groups).map(([key, value]) => ({
    period: key,
    transfers: value
  }));
}

export default function AdminPage() {
  const [status, setStatus] = useState(null);
  const [transferData, setTransferData] = useState([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/status");
        const data = await res.json();

        // 👇 prepare transfer chart data
        const grouped = groupTransfers(data.uploadDates || []);
        setTransferData(grouped);

        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    };
    fetchStatus();
  }, []);

  const formatPieData = (
    used,
    free,
    usedLabel,
    freeLabel,
    usedColor,
    freeColor
  ) => [
    { name: usedLabel, value: used, color: usedColor },
    { name: freeLabel, value: free, color: freeColor }
  ];

  const googlePieData = status
    ? formatPieData(
        status.storage.google.used,
        status.storage.google.free,
        "Used",
        "Free",
        "#2F3EB1",
        "#FF33A1"
      )
    : [];

  const oneDrivePieData = status
    ? formatPieData(
        status.storage.oneDrive.used,
        status.storage.oneDrive.free,
        "Used",
        "Free",
        "#3366CC",
        "#FF33A1"
      )
    : [];

  const combinedPieData = status
    ? formatPieData(
        status.storage.combined.used,
        status.storage.combined.free,
        "Used",
        "Free",
        "#FFA500",
        "#00C49F"
      )
    : [];

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
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/status");
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    };

    fetchStatus();
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <Navigation />
      {/* Main Content */}
      {isAdmin ? (
        <div className="flex-grow p-6">
          {/* Title */}
          <div className="text-3xl font-bold text-center mb-6">Admin Main</div>

          {/* Status Cards */}
          <div className="flex justify-center space-x-6 mb-6">
            <StatusCard
              icon={BarChart}
              iconBgColor="bg-pink-200"
              title="Total Files in Use"
              value={status ? status.totalFiles : "—"}
              showPercentage={false}
            />
            <StatusCard
              icon={Settings}
              iconBgColor="bg-teal-200"
              title="All Storage Remaining"
              value={`${(
                (status?.storage?.combined?.free || 0) /
                1024 ** 3
              ).toFixed(2)} GB`}
              showPercentage={false}
            />

            <StatusCard
              icon={Cloud}
              iconBgColor="bg-yellow-200"
              title="All Storage Used"
              value={`${(
                (status?.storage?.combined?.used || 0) /
                1024 ** 3
              ).toFixed(2)} GB`}
              showPercentage={false}
            />
          </div>

          {/* Grid Layout with 3 Columns (Charts + Status Column) */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Transfers Chart */}
            <div className="bg-white shadow-md rounded-lg p-4 h-auto min-h-[300px] flex items-center justify-center">
              <TransfersChart data={transferData} />
            </div>

            {/* Middle Column - Storage Status Cards */}
            <div className="bg-white shadow-md rounded-lg p-4 flex flex-col space-y-4">
              <div className="text-lg font-semibold text-gray-700">
                Storage Status
              </div>

              {status ? (
                <>
                  <StatusCard
                    icon={HardDrive}
                    width={"full"}
                    iconBgColor="bg-pink-200"
                    title="OneDrive"
                    value={`${(
                      status.storage.oneDrive.free /
                      1024 ** 3
                    ).toFixed(2)} GB`}
                    percentage={Math.round(
                      (status.storage.oneDrive.free /
                        (status.storage.oneDrive.used +
                          status.storage.oneDrive.free)) *
                        100
                    )}
                    showPercentage={true}
                  />

                  <StatusCard
                    icon={Database}
                    width={"full"}
                    iconBgColor="bg-blue-200"
                    title="Google Drive"
                    value={`${(status.storage.google.free / 1024 ** 3).toFixed(
                      2
                    )} GB`}
                    percentage={Math.round(
                      (status.storage.google.free /
                        (status.storage.google.used +
                          status.storage.google.free)) *
                        100
                    )}
                    showPercentage={true}
                  />

                  <StatusCard
                    icon={Cloud}
                    width={"full"}
                    iconBgColor="bg-yellow-200"
                    title="Combined Storage"
                    value={`${(
                      status.storage.combined.free /
                      1024 ** 3
                    ).toFixed(2)} GB`}
                    percentage={Math.round(
                      (status.storage.combined.free /
                        (status.storage.combined.used +
                          status.storage.combined.free)) *
                        100
                    )}
                    showPercentage={true}
                  />
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Loading storage status...
                </div>
              )}
            </div>

            {/* Right Column - Storage Charts */}
            {/* <div className="flex flex-col space-y-4">
 
              <div className="grid grid-cols-1  lg:grid-cols-2 gap-4">
                <div className="bg-white shadow-md rounded-lg p-4">
                  <StorageOverview
                    title="Google Drive"
                    data={googlePieData}
                    size={160}
                  />
                </div>
                <div className="bg-white shadow-md rounded-lg p-4">
                  <StorageOverview
                    title="OneDrive"
                    data={oneDrivePieData}
                    size={160}
                  />
                </div>
              </div>
 
              <div className="bg-white shadow-md rounded-lg p-4">
                <StorageOverview
                  title="Combined Storage"
                  data={combinedPieData}
                  size={200}
                />
              </div>
            </div> */}
          </div>
        </div>
      ) : (
        <div className="text-3xl text-red-600 font-bold text-center mb-6">
          Unauthorized Access - Admin Main
        </div>
      )}
    </div>
  );
}

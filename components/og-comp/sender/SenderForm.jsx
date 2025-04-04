"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import CustomButton from "@/components/ui/CustomButton";
import LoadingComponent from "@/components/ui/LoadingComponent";
import DaySelector from "@/components/ui/DaySelector"; // Import Day Selector Component
import ToggleSwitch from "@/components/ui/ToggleSwitch"; // Import Toggle Switch Component
import { Filter } from "lucide-react";
import { redirect } from "next/dist/server/api-utils";

const generateHashKey = async () => {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 32-byte key
  return [...key].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function SenderForm({ onCancel }) {
  const [receiverEmail, setReceiverEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [includeEmail, setIncludeEmail] = useState(false);
  const [viewDays, setViewDays] = useState(false);
  const [viewHours, setViewHours] = useState(false);
  const [expirationDate, setExpirationDate] = useState(false);
  const [maxViews, setMaxViews] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [maxViewCount, setMaxViewCount] = useState(1);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewFrom, setViewFrom] = useState("");
  const [viewTo, setViewTo] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState({}); // Object to track errors

  const router = useRouter();

  

  // New ** Name of the file must be included
  const [fileName, setfileName] = useState("");

  // Validate email domains (only Gmail, Yahoo, and Live)
  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|live\.com)$/.test(email);
  };

  const handleSend = async () => {
    let newErrors = {};

    // Validate Emails
    if (!isValidEmail(receiverEmail)) {
      newErrors.receiverEmail = "Receiver email must be Gmail, Yahoo, or Live.";
    }
    if (!isValidEmail(senderEmail)) {
      newErrors.senderEmail = "Sender email must be Gmail, Yahoo, or Live.";
    }

    if (!fileName) {
      newErrors.fileName = "A File Name is required.";
    }

    // Validate Required Inputs for Checked Options
    if (viewHours && (!viewFrom || !viewTo)) {
      newErrors.viewHours = "Please select valid view hours.";
    }
    if (expirationDate && !date) {
      newErrors.expirationDate = "Please select an expiration date.";
    }
    if (maxViews && maxViewCount <= 0) {
      newErrors.maxViews = "Max views must be at least 1.";
    }

    // If errors exist, stop sending
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }




    // Collect Data
    const formData = {
      receiverEmail,
      senderEmail,
      includeEmail,
      fileName,
      viewDays: viewDays ? selectedDays : "All Days",
      viewHours: viewHours ? { from: viewFrom, to: viewTo } : "All Day",
      expirationDate: expirationDate ? date : "No Expiration",
      maxViews: maxViews ? maxViewCount : "Unlimited",
      description: descriptionEnabled ? description : "No Description"
    };

    alert(JSON.stringify(formData, null, 2));
    setIsLoading(true);

    // Generate Public & Private Keys
    const publicKey = await generateHashKey();
    const privateKey = await generateHashKey();
    const macPublicKey = await generateHashKey();
    const macPrivateKey = await generateHashKey();

    alert(
      `🔑 Public Key: ${publicKey}\n🔐 Private Key: ${privateKey}\n📎 MAC Public Key: ${macPublicKey}\n📎 MAC Private Key: ${macPrivateKey}`
    );

    try {
      setIsLoading(true);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          receiverEmail,
          senderEmail,
          includeEmail,
          fileName,
          fileDescription: descriptionEnabled ? description : null,
          viewDays: viewDays ? selectedDays : null,
          expirationDate: expirationDate ? date : "No Expiration",
          viewHours: viewHours
            ? `${viewFrom || "--:--"} - ${viewTo || "--:--"}`
            : "All Day",
          maxViews: maxViews ? maxViewCount : null,
          downloadLink: `http://shaheen.com/${publicKey}/${macPublicKey}`
        })
      });

      if (!response.ok) {
        throw new Error(`Error sending email: ${response.statusText}`);
      }

      alert("📩 Email sent successfully!");

      //refresh the page
      window.location.reload();
      // router.replace("/home"); // don't use this didn't work

      // router.push("/home");
     
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingComponent
        title="Email is Sent!"
        status="sent"
        subtitle="Waiting for Receiver to Accept..."
        progressBars={[
          { percentage: 100, color: "bg-gray-500", showText: true }
        ]}
      />
    );
  }

  return (
    <div>
      {/* Title */}
      <div className="text-3xl font-bold text-center mb-2">
        Fill in your information
      </div>
      <div className="text-center text-gray-500 mb-6">
        Get Ready to send your email
      </div>

      {/* Form */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          {/* Receiver Email */}
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">
              Enter Receiver Email
            </label>
            <input
              type="email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
            {errors.receiverEmail && (
              <div className="text-red-500 text-sm mt-1">
                {errors.receiverEmail}
              </div>
            )}
          </div>

          {/* Sender Email (Required) */}
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">
              Enter Your Email (Sender)
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="example@live.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
            {/* Sender Email (Optional) */}
            <div className="mt-4">
              <ToggleSwitch
                label="Include your Email in the Message?"
                checked={includeEmail}
                onChange={setIncludeEmail}
              />
            </div>

            {errors.senderEmail && (
              <div className="text-red-500 text-sm mt-1">{errors.senderEmail}</div>
            )}
          </div>

          {/* provideing a file Name */}
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">
              Provide a File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setfileName(e.target.value)}
              placeholder="example.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
              required
            />
            {errors.fileName && (
              <div className="text-red-500 text-sm mt-1">{errors.fileName}</div>
            )}
          </div>

          {/* Set Options */}
          <div className="text-xl font-bold mt-6 mb-3">Set Options</div>

          <div className="flex items-center space-x-4">
            {/* View Days */}
            <input
              type="checkbox"
              checked={viewDays}
              onChange={() => setViewDays(!viewDays)}
            />
            <label className="text-gray-700">View Days</label>

            {/* View Hours */}
            <input
              type="checkbox"
              checked={viewHours}
              onChange={() => setViewHours(!viewHours)}
            />
            <label className="text-gray-700">View Hours</label>

            {/* Expiration Date */}
            <input
              type="checkbox"
              checked={expirationDate}
              onChange={() => setExpirationDate(!expirationDate)}
            />
            <label className="text-gray-700">Expiration Date</label>

            {/* Max View Times */}
            <input
              type="checkbox"
              checked={maxViews}
              onChange={() => setMaxViews(!maxViews)}
            />

            <label className="text-gray-700">Max View Times</label>
          </div>

          {/* Day Selector */}
          {viewDays && (
            <div className="flex items-center space-x-4  mt-4 mb-4">
              <label className="text-gray-700">Choose View Days</label>
              <DaySelector
                selectedDays={selectedDays}
                onChange={setSelectedDays}
              />
            </div>
          )}

          {/* View Hours Inputs */}
          {viewHours && (
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-gray-700">Choose View Hours</label>

              <input
                type="time"
                value={viewFrom}
                onChange={(e) => setViewFrom(e.target.value)}
                className="w-28 p-2 border rounded-md"
              />
              <input
                type="time"
                value={viewTo}
                onChange={(e) => setViewTo(e.target.value)}
                className="w-28 p-2 border rounded-md"
              />
              {errors.viewHours && (
                <div className="text-red-500 text-sm mt-1">{errors.viewHours}</div>
              )}
            </div>
          )}

          {/* Expiration Date Input */}
          {expirationDate && (
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-gray-700">Choose Expiration Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 p-2 border rounded-md mt-2 mb-4"
                min={new Date().toISOString().split("T")[0]}
                max={
                  new Date(new Date().setDate(new Date().getDate() + 30))
                    .toISOString()
                    .split("T")[0]
                }
              />
              <label className="text-xs text-gray-500">(Max 30 Days) </label>
            </div>
          )}
          {maxViews && (
            <div>
              <label className="text-gray-700">Max View Times</label>
              <button
                type="button"
                onClick={() => setMaxViewCount((prev) => Math.max(prev - 1, 1))}
                className="px-3 mx-2 py-1 bg-gray-200 rounded"
              >
                -
              </button>
              <span>{maxViewCount}</span>
              <button
                type="button"
                onClick={() => setMaxViewCount((prev) => prev + 1)}
                className="px-3 mx-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
            </div>
          )}
          <div>
            {/* Description Toggle */}
            {/* Add Description */}
            <div className="text-xl font-bold mt-6 mb-3">Add Description</div>

            <ToggleSwitch
              label="Include Description"
              checked={descriptionEnabled}
              onChange={() => setDescriptionEnabled(!descriptionEnabled)}
            />
            {descriptionEnabled && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Type your message..."
                className="w-full h-24 p-2 border rounded-md mt-2"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex w-full mt-6">
            <CustomButton
              label="Cancel"
              color="bg-gray-500"
              fullWidth
              onClick={onCancel}
            />
            <CustomButton
              label="Send"
              gradient
              fullWidth
              className="bg-gradient-to-r from-blue-400 to-blue-700 text-white"
              onClick={handleSend}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

// components/QRCodeDisplay.jsx
"use client"

import { QRCodeCanvas } from "qrcode.react"

export default function QRCodeDisplay({ value }) {
  if (!value) return null

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-md border mt-6">
      <h3 className="text-sm font-medium text-gray-700">Scan this QR code to open the link:</h3>
      <QRCodeCanvas value={value} size={192} includeMargin={true} />
    </div>
  )
}

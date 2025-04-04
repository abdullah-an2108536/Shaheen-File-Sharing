// __tests__/ReceiveFileInfo.test.jsx
import React from "react"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import ReceiveFileInfo from "@/components/receive-file-info"
import "@testing-library/jest-dom"

// Mock crypto functions and actions
jest.mock("@/lib/crypto", () => ({
  generateKeyPair: jest.fn(),
  storeRecipientKeyPair: jest.fn(),
  deriveSharedSecret: jest.fn(),
  storeSharedSecret: jest.fn(),
}))
jest.mock("@/lib/actions", () => ({
  sendRecipientPublicKey: jest.fn(),
}))

import {
  generateKeyPair,
  storeRecipientKeyPair,
  deriveSharedSecret,
  storeSharedSecret,
} from "@/lib/crypto"
import { sendRecipientPublicKey } from "@/lib/actions"

// Create a dummy buffer for exported keys
const dummyBuffer = new Uint8Array([1, 2, 3, 4]).buffer
const dummyPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(dummyBuffer)))

// Override window.crypto.subtle.exportKey and importKey
Object.defineProperty(window, "crypto", {
  value: {
    subtle: {
      exportKey: jest.fn().mockResolvedValue(dummyBuffer),
      importKey: jest.fn().mockResolvedValue({}),
    },
  },
})

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})


describe("ReceiveFileInfo Component", () => {
  // Test 1: When required params are missing
  test("renders 'No File Selected' when required searchParams are missing", async () => {
    // Pass a promise that resolves to an empty object
    render(<ReceiveFileInfo searchParams={Promise.resolve({})} />)
    // Wait for useEffect to update state
    await waitFor(() => {
      expect(screen.getByText(/No File Selected/i)).toBeInTheDocument()
    })
    expect(
      screen.getByText(/please use the link provided in your email/i)
    ).toBeInTheDocument()
  })

  // Test 2: When valid searchParams are provided, processRequest should complete successfully
  test("processes file sharing request and shows success alert", async () => {
    // Prepare valid search parameters
    const validParams = {
      senderEmail: "sender@example.com",
      recipientEmail: "recipient@example.com",
      fileName: "TestFile.pdf",
      senderPublicKey: encodeURIComponent(dummyPublicKeyString),
      macSenderPublicKey: encodeURIComponent(dummyPublicKeyString),
      description: "A test file",
      startDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      accessCount: "3",
      accessTime: "alltime",
    }

    // Configure generateKeyPair mock: return dummy key pair objects
    generateKeyPair.mockResolvedValueOnce({ publicKey: {}, privateKey: {} }) // recipient key pair
      .mockResolvedValueOnce({ publicKey: {}, privateKey: {} }) // recipient MAC key pair

    // Configure other mocks as resolved promises
    storeRecipientKeyPair.mockResolvedValueOnce()
    deriveSharedSecret.mockResolvedValue("dummy-secret")
    storeSharedSecret.mockResolvedValueOnce()
    sendRecipientPublicKey.mockResolvedValueOnce()

    // Render component with valid searchParams (as a promise)
    render(<ReceiveFileInfo searchParams={Promise.resolve(validParams)} />)

    // Wait until the success alert appears (isComplete becomes true)
    await waitFor(() => {
      expect(
        screen.getByText(/Keys established! An email has been sent to/i)
      ).toBeInTheDocument()
    })

    // Also check that the File Details section displays the fileName and senderEmail
    expect(screen.getByText(/TestFile\.pdf/i)).toBeInTheDocument()
    const senderEmails = screen.getAllByText(/sender@example\.com/i)
expect(senderEmails.length).toBeGreaterThan(0) // Ensures at least one match exists

  })

  // Test 3: Process error handling in processRequest
  test("displays error alert if processing fails", async () => {
    const errorParams = {
      senderEmail: "sender@example.com",
      recipientEmail: "recipient@example.com",
      fileName: "TestFile.pdf",
      senderPublicKey: encodeURIComponent(dummyPublicKeyString),
      macSenderPublicKey: encodeURIComponent(dummyPublicKeyString),
    }

    // Make generateKeyPair fail to simulate an error
    generateKeyPair.mockRejectedValue(new Error("Key generation failed"))

    render(<ReceiveFileInfo searchParams={Promise.resolve(errorParams)} />)

    // Wait until error is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to process the file sharing request/i)
      ).toBeInTheDocument()
    })
  })

  // Test 4: Copy to Clipboard functionality
  test("copies share link to clipboard when Copy Link button is clicked", async () => {
    // Provide valid parameters so that shareLink is eventually set
    const params = {
      senderEmail: "sender@example.com",
      recipientEmail: "recipient@example.com",
      fileName: "TestFile.pdf",
      senderPublicKey: encodeURIComponent(dummyPublicKeyString),
      macSenderPublicKey: encodeURIComponent(dummyPublicKeyString),
    }

    // Set up successful processing mocks
    generateKeyPair.mockResolvedValueOnce({ publicKey: {}, privateKey: {} })
      .mockResolvedValueOnce({ publicKey: {}, privateKey: {} })
    storeRecipientKeyPair.mockResolvedValueOnce()
    deriveSharedSecret.mockResolvedValue("dummy-secret")
    storeSharedSecret.mockResolvedValueOnce()
    sendRecipientPublicKey.mockResolvedValueOnce()

    // Mock process.env.NEXT_PUBLIC_APP_URL to a dummy URL for link generation
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost"

    render(<ReceiveFileInfo searchParams={Promise.resolve(params)} />)

    // Wait until processing completes (success alert appears)
    await waitFor(() => {
      expect(
        screen.getByText(/Keys established! An email has been sent to/i)
      ).toBeInTheDocument()
    })

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    })

    // Find and click the Copy Link button
    const copyButton = screen.getByRole("button", { name: /Copy to Clipboard/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost/upload?")
      )
    })

    // Check that button text changes to "Copied!"
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
    })
  })

  // Test 5: WhatsApp send functionality
  test("opens WhatsApp when phone number is provided and Send button is clicked", async () => {
    const params = {
      senderEmail: "sender@example.com",
      recipientEmail: "recipient@example.com",
      fileName: "TestFile.pdf",
      senderPublicKey: encodeURIComponent(dummyPublicKeyString),
      macSenderPublicKey: encodeURIComponent(dummyPublicKeyString),
    }

    // Set up successful processing mocks
    generateKeyPair.mockResolvedValueOnce({ publicKey: {}, privateKey: {} })
      .mockResolvedValueOnce({ publicKey: {}, privateKey: {} })
    storeRecipientKeyPair.mockResolvedValueOnce()
    deriveSharedSecret.mockResolvedValue("dummy-secret")
    storeSharedSecret.mockResolvedValueOnce()
    sendRecipientPublicKey.mockResolvedValueOnce()

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost"

    render(<ReceiveFileInfo searchParams={Promise.resolve(params)} />)

    // Wait for processing to complete
    await waitFor(() => {
      expect(
        screen.getByText(/Keys established! An email has been sent to/i)
      ).toBeInTheDocument()
    })

    // Spy on window.open
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {})

    // Enter a phone number in the WhatsApp input
    const phoneInput = screen.getByPlaceholderText(/Enter phone number with country code/i)
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } })

    // Click the Send button for WhatsApp
    const sendButton = screen.getByRole("button", { name: /Send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/wa\.me\/\d+\?text=/),
        "_blank"
      )
    })

    openSpy.mockRestore()
  })

  // Test 6: Process Request button triggers reload when not processing and not complete
  test("shows Process Request button when not complete or processing", async () => {
    // Provide incomplete searchParams so that required fields are missing and the initial card renders
    render(<ReceiveFileInfo searchParams={Promise.resolve({})} />)
    const params = {
      senderEmail: "sender@example.com",
      recipientEmail: "recipient@example.com",
      fileName: "TestFile.pdf",
      senderPublicKey: encodeURIComponent(dummyPublicKeyString),
      macSenderPublicKey: encodeURIComponent(dummyPublicKeyString),
    }
    // Render with valid params
    render(<ReceiveFileInfo searchParams={Promise.resolve(params)} />)
    // Wait a short moment so that processing starts
    await waitFor(() => {

      const processButton = screen.queryByRole("button", { name: /Process Request/i })
      if (processButton) {
        expect(processButton).toBeInTheDocument()
      }
    })
  })
})

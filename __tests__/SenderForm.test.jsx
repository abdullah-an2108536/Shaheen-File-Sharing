// __tests__/SendFileForm.test.jsx
import React from "react"
import { render, fireEvent, waitFor, screen } from "@testing-library/react"
import SendFileForm from "@/components/send-file-form"

// Mock required modules
jest.mock("@/lib/crypto", () => ({
  generateKeyPair: jest.fn(),
  storeKeyPair: jest.fn(),
}))
jest.mock("@/lib/actions", () => ({
  sendFileRequest: jest.fn(),
}))

import { generateKeyPair, storeKeyPair } from "@/lib/crypto"
import { sendFileRequest } from "@/lib/actions"

// Dummy key export buffer and conversion to base64 string
const dummyExportedKey = new Uint8Array([1, 2, 3, 4]).buffer
Object.defineProperty(window, "crypto", {
  value: {
    subtle: {
      exportKey: jest.fn().mockResolvedValue(dummyExportedKey),
    },
  },
})
const dummyPublicKeyString = btoa(String.fromCharCode(...new Uint8Array(dummyExportedKey)))

describe("SendFileForm - Generate Keys Step", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("renders the generate keys step correctly", () => {
    render(<SendFileForm />)
    expect(screen.getByText(/Encryption Key Setup/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Generate Encryption Keys/i })).toBeEnabled()
  })

  test("handles successful key generation and transitions to form step", async () => {
    // Setup generateKeyPair to return dummy key pairs for encryption and MAC
    generateKeyPair
      .mockResolvedValueOnce({ publicKey: {} }) // encryption key pair
      .mockResolvedValueOnce({ publicKey: {} }) // MAC key pair

    render(<SendFileForm />)
    const genButton = screen.getByRole("button", { name: /Generate Encryption Keys/i })
    fireEvent.click(genButton)

    // The button should disable while generating keys
    await waitFor(() => expect(genButton).toBeDisabled())

    // Wait for the form to render
    await waitFor(() => expect(screen.getByText(/File Sharing Request/i)).toBeInTheDocument())

    // Verify mocks are called
    expect(generateKeyPair).toHaveBeenCalledTimes(2)
    expect(storeKeyPair).toHaveBeenCalledTimes(1)
  })

  test("displays error if key generation fails", async () => {
    // Force generateKeyPair to reject
    const errorMsg = "Key generation error"
    generateKeyPair.mockRejectedValueOnce(new Error(errorMsg))

    render(<SendFileForm />)
    const genButton = screen.getByRole("button", { name: /Generate Encryption Keys/i })
    fireEvent.click(genButton)

    // Wait for error message to be displayed
    await waitFor(() => expect(screen.getByText(new RegExp(errorMsg, "i"))).toBeInTheDocument())
    // Remains on the generate keys step
    expect(screen.getByText(/Encryption Key Setup/i)).toBeInTheDocument()
  })
})

describe("SendFileForm - Form Submission", () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Pre-mock key generation so we can get to the form step
    generateKeyPair
      .mockResolvedValueOnce({ publicKey: {} })
      .mockResolvedValueOnce({ publicKey: {} })
    render(<SendFileForm />)
    fireEvent.click(screen.getByRole("button", { name: /Generate Encryption Keys/i }))
    await waitFor(() => expect(screen.getByText(/File Sharing Request/i)).toBeInTheDocument())
  })

  test("shows validation error when required fields are missing", async () => {
    const submitButton = screen.getByRole("button", { name: /Send File Request/i })
    fireEvent.submit(submitButton.closest("form"))

    // Since required fields are missing, we expect an error message to be rendered
    await waitFor(() =>
      expect(screen.queryByText(/Error sending file request/i)).toBeInTheDocument()
    )
  })

  test("submits the form successfully with valid input", async () => {
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/Your Email Address/i), {
      target: { value: "sender@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/Recipient's Email Address/i), {
      target: { value: "recipient@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/File Name/i), {
      target: { value: "Test File" },
    })

    // Mock sendFileRequest to resolve successfully
    sendFileRequest.mockResolvedValueOnce()

    const submitButton = screen.getByRole("button", { name: /Send File Request/i })
    fireEvent.submit(submitButton.closest("form"))

    // Wait for the success step to be rendered
    await waitFor(() =>
      expect(screen.getByText(/Request Sent Successfully/i)).toBeInTheDocument()
    )

    // Verify form data contains the required keys and dummy public keys are attached
    expect(sendFileRequest).toHaveBeenCalledTimes(1)
    const formDataArg = sendFileRequest.mock.calls[0][0]
    expect(formDataArg.get("senderEmail")).toBe("sender@example.com")
    expect(formDataArg.get("recipientEmail")).toBe("recipient@example.com")
    expect(formDataArg.get("fileName")).toBe("Test File")
    expect(formDataArg.get("senderPublicKey")).toBe(dummyPublicKeyString)
    expect(formDataArg.get("macSenderPublicKey")).toBe(dummyPublicKeyString)
  })

  test("resets form when 'Share Another File' is clicked", async () => {
    // Fill out the form to get to the success step
    fireEvent.change(screen.getByLabelText(/Your Email Address/i), {
      target: { value: "sender@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/Recipient's Email Address/i), {
      target: { value: "recipient@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/File Name/i), {
      target: { value: "Test File" },
    })

    sendFileRequest.mockResolvedValueOnce()
    const submitButton = screen.getByRole("button", { name: /Send File Request/i })
    fireEvent.submit(submitButton.closest("form"))

    // Wait for success step to be visible
    await waitFor(() =>
      expect(screen.getByText(/Request Sent Successfully/i)).toBeInTheDocument()
    )

    // Click "Share Another File"
    const shareAnotherButton = screen.getByRole("button", { name: /Share Another File/i })
    fireEvent.click(shareAnotherButton)

    // Check that the component has reset to the generate keys step
    expect(screen.getByText(/Encryption Key Setup/i)).toBeInTheDocument()
  })
})

describe("SendFileForm - Success Step Actions", () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Pre-mock key generation and form submission to get to success step
    generateKeyPair
      .mockResolvedValueOnce({ publicKey: {} })
      .mockResolvedValueOnce({ publicKey: {} })
    render(<SendFileForm />)
    fireEvent.click(screen.getByRole("button", { name: /Generate Encryption Keys/i }))

    await waitFor(() => expect(screen.getByText(/File Sharing Request/i)).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText(/Your Email Address/i), {
      target: { value: "sender@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/Recipient's Email Address/i), {
      target: { value: "recipient@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/File Name/i), {
      target: { value: "Test File" },
    })
    sendFileRequest.mockResolvedValueOnce()
    const submitButton = screen.getByRole("button", { name: /Send File Request/i })
    fireEvent.submit(submitButton.closest("form"))

    await waitFor(() =>
      expect(screen.getByText(/Request Sent Successfully/i)).toBeInTheDocument()
    )
  })

  test("copies share link to clipboard", async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(),
      },
    })

    const copyButton = screen.getByRole("button", { name: /Copy to Clipboard/i })
    fireEvent.click(copyButton)
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.any(String))
    )
    // Check that the button text changes to "Copied!"
    await waitFor(() => expect(screen.getByText(/Copied!/i)).toBeInTheDocument())
  })

  test("sends WhatsApp message when phone number is provided", async () => {
    // Spy on window.open
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {})

    // Enter a phone number and click Send on WhatsApp
    const phoneInput = screen.getByPlaceholderText(
      /Enter phone number with country code/i
    )
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } })

    const whatsappButton = screen.getByRole("button", { name: /Send/i })
    fireEvent.click(whatsappButton)

    // Wait for window.open to have been called with a WhatsApp URL
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/wa\.me\/\d+\?text=/),
        "_blank"
      )
    })
    openSpy.mockRestore()
  })

  test("shows error if WhatsApp send is attempted without phone number", async () => {
    // Clear any phone number if present
    const phoneInput = screen.getByPlaceholderText(
      /Enter phone number with country code/i
    )
    fireEvent.change(phoneInput, { target: { value: "" } })

    const whatsappButton = screen.getByRole("button", { name: /Send/i })
    fireEvent.click(whatsappButton)

    await waitFor(() =>
      expect(screen.getByText(/Please enter a phone number/i)).toBeInTheDocument()
    )
  })
})

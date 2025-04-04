// __tests__/HowItWorksPage.test.jsx
import React from "react"
import { render, screen } from "@testing-library/react"
import HowItWorksPage from "@/app/how-it-works/page"
import "@testing-library/jest-dom"

// Mock Navigation and Footer to isolate page testing
jest.mock("@/components/navigation", () => () => (
  <nav data-testid="navigation">Navigation</nav>
))
jest.mock("@/components/footer", () => () => (
  <footer data-testid="footer">Footer</footer>
))

describe("HowItWorksPage", () => {
  beforeEach(() => {
    render(<HowItWorksPage />)
  })

  test("renders Navigation and Footer components", () => {
    expect(screen.getByTestId("navigation")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })

  test("renders the hero section with correct heading and description", () => {
    const heroHeading = screen.getByRole("heading", {
      name: /How Shaheen Works/i,
    })
    const heroDescription = screen.getByText(
      /Our secure file sharing system uses advanced cryptography/i
    )
    expect(heroHeading).toBeInTheDocument()
    expect(heroDescription).toBeInTheDocument()
  })

  test("renders the encryption process section with all three steps", () => {
    const step1 = screen.getByRole("heading", {
      name: /Step 1: Key Generation/i,
    })
    const step2 = screen.getByRole("heading", {
      name: /Step 2: Key Exchange/i,
    })
    const step3 = screen.getByRole("heading", {
      name: /Step 3: File Encryption & Transfer/i,
    })
    expect(step1).toBeInTheDocument()
    expect(step2).toBeInTheDocument()
    expect(step3).toBeInTheDocument()
  })

  test("renders the key storage section with IndexedDB and Server-Side Storage", () => {
    const indexedDBHeading = screen.getByRole("heading", {
      name: /IndexedDB Storage/i,
    })
    const serverSideHeading = screen.getByRole("heading", {
      name: /Server-Side Storage/i,
    })
    expect(indexedDBHeading).toBeInTheDocument()
    expect(serverSideHeading).toBeInTheDocument()
  })

  test("renders the technical details section with cryptographic algorithms and browser APIs", () => {
    const technicalDetailsHeading = screen.getByRole("heading", {
      name: /Technical Details/i,
    })
    expect(technicalDetailsHeading).toBeInTheDocument()

    const algorithmsHeading = screen.getByRole("heading", {
      name: /Cryptographic Algorithms/i,
    })
    const apisHeading = screen.getByRole("heading", {
      name: /Browser APIs Used/i,
    })
    expect(algorithmsHeading).toBeInTheDocument()
    expect(apisHeading).toBeInTheDocument()
  })

  test("renders the CTA section with buttons linking to send and receive pages", () => {
    const sendFilesButton = screen.getByRole("button", { name: /Send Files/i })
    const receiveFilesButton = screen.getByRole("button", { name: /Receive Files/i })
    expect(sendFilesButton).toBeInTheDocument()
    expect(receiveFilesButton).toBeInTheDocument()

    // Check that the buttons are wrapped in a Link with correct href attributes
    const sendLink = sendFilesButton.closest("a")
    const receiveLink = receiveFilesButton.closest("a")
    expect(sendLink).toHaveAttribute("href", "/send")
    expect(receiveLink).toHaveAttribute("href", "/receive")
  })
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import FileUploadForm from '@/components/file-upload-form'
import { POST as uploadHandler } from '@/app/api/upload/route'
import * as cryptoLib from '@/lib/crypto'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the Next.js router and searchParams
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock NextResponse from next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => {
      const response = new Response(JSON.stringify(data), options);
      response.json = jest.fn().mockResolvedValue(data);
      return response;
    })
  }
}));

// Mock the crypto library
jest.mock('@/lib/crypto', () => ({
  getPrivateKeyBySenderPublicKey: jest.fn(),
  getMacPrivateKeyBySenderPublicKey: jest.fn(),
  importPublicKey: jest.fn(),
  deriveSharedSecret: jest.fn(),
  encryptFile: jest.fn(),
  computeMAC: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()


class FakeFormData {
  constructor() {
    this.fields = {};
  }
  append(key, value) {
    this.fields[key] = value;
  }
  get(key) {
    return this.fields[key];
  }
  has(key) {
    return key in this.fields;
  }
  getAll() {
    return Object.values(this.fields);
  }
  entries() {
    return Object.entries(this.fields)[Symbol.iterator]();
  }
  keys() {
    return Object.keys(this.fields)[Symbol.iterator]();
  }
  values() {
    return Object.values(this.fields)[Symbol.iterator]();
  }
}
global.FormData = FakeFormData;

// Mock the Google APIs and axios
jest.mock('googleapis', () => ({
  google: {
    auth: {
      JWT: jest.fn().mockReturnValue({})
    },
    drive: jest.fn().mockReturnValue({
      files: {
        create: jest.fn().mockResolvedValue({
          data: { id: 'mock-google-file-id' }
        })
      }
    })
  }
}))

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: { access_token: 'mock-token' }
  }),
  get: jest.fn().mockResolvedValue({
    data: { id: 'mock-folder-id' }
  }),
  put: jest.fn().mockResolvedValue({
    data: { id: 'mock-onedrive-file-id' }
  })
}))

// Mock environment variables
process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
  client_email: 'test@example.com',
  private_key: 'mock-private-key'
})
process.env.GOOGLE_DRIVE_FOLDER_ID = 'mock-folder-id'
process.env.MS_CLIENT_ID = 'mock-client-id'
process.env.MS_CLIENT_SECRET = 'mock-client-secret'
process.env.MS_ONEDRIVE_REFRESH_TOKEN = 'mock-refresh-token'

// Mock stream.Readable
jest.mock('stream', () => ({
  Readable: {
    from: jest.fn().mockReturnValue({}),
  }
}))

// Utility to create test files
const createMockFile = (name, type, size) => {
  const file = new File(["test-file-content"], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('FileUploadForm Integration Tests', () => {
  let mockRouter;
  let mockSearchParams;
  
  beforeEach(() => {
    // Setup mocks
    mockRouter = { push: jest.fn() };
    useRouter.mockReturnValue(mockRouter);
    
    // Create a mock Map for searchParams
    const paramsMap = new Map();
    paramsMap.set('fileName', 'test-document.pdf');
    paramsMap.set('description', 'Test description');
    paramsMap.set('senderEmail', 'sender@example.com');
    paramsMap.set('recipientEmail', 'recipient@example.com');
    paramsMap.set('senderPublicKey', 'mock-sender-public-key');
    paramsMap.set('recipientPublicKey', 'mock-recipient-public-key');
    paramsMap.set('macRecipientPublicKey', 'mock-mac-recipient-public-key');
    paramsMap.set('accessCount', '3');
    
    mockSearchParams = {
      get: (key) => paramsMap.get(key) || null,
      has: (key) => paramsMap.has(key),
    };
    
    useSearchParams.mockReturnValue(mockSearchParams);
    
    // Mock crypto functions
    cryptoLib.getPrivateKeyBySenderPublicKey.mockResolvedValue('mock-private-key');
    cryptoLib.getMacPrivateKeyBySenderPublicKey.mockResolvedValue('mock-mac-private-key');
    cryptoLib.importPublicKey.mockResolvedValue('mock-imported-public-key');
    cryptoLib.deriveSharedSecret.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    cryptoLib.encryptFile.mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
    cryptoLib.computeMAC.mockResolvedValue('mock-mac');
    
    // Mock fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        googleFileId: 'mock-google-file-id',
        googleMetadataFileId: 'mock-google-metadata-file-id',
        oneDriveFileInfo: { id: 'mock-onedrive-file-id' },
        oneDriveMetadataFileInfo: { id: 'mock-onedrive-metadata-file-id' },
        message: 'Files uploaded to Google Drive and OneDrive successfully.'
      })
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('uploads a file successfully through component and API', async () => {
    // Render the component
    render(<FileUploadForm />);
    
    // Wait for the component to establish Keys
    await waitFor(() => {
      expect(cryptoLib.deriveSharedSecret).toHaveBeenCalledTimes(2);
    });
    
    // Check that establishment message is shown
    const secureConnectionElement = screen.getByText((content) => content.includes('Secure Connection Established'));
    expect(secureConnectionElement).toBeInTheDocument();
    
    // Create a mock file
    const testFile = createMockFile('test-file.pdf', 'application/pdf', 1024 * 1024); // 1MB file
    
    // Find the file input button and trigger file selection
    const fileInput = screen.getByRole('button', { name: /Select File/i });
    fireEvent.click(fileInput);
    
    await act(async () => {
      const hiddenInput = document.querySelector('input[type="file"]');
      if (!hiddenInput) {
        throw new Error("Hidden file input not found");
      }
      fireEvent.change(hiddenInput, { target: { files: [testFile] } });
    });
    
    // Check that the selected file is displayed
    expect(screen.getByText(/test-file.pdf/i)).toBeInTheDocument();
    
    // Click the upload button
    const uploadButton = screen.getByRole('button', { name: /Encrypt & Upload File/i });
    fireEvent.click(uploadButton);
    
    // Wait for the upload to complete
    await waitFor(() => {
      expect(cryptoLib.encryptFile).toHaveBeenCalled();
      expect(cryptoLib.computeMAC).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith("/api/upload", expect.any(Object));
    });
    
    // Check success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Your file has been encrypted and uploaded successfully!/i)).toBeInTheDocument();
    });
    
    // test the API route directly
    const mockFormData = new FormData();
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      name: 'mock-file.encrypted',
      type: 'application/octet-stream'
    };
    const mockMetadata = {
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      name: 'mock-file.metadata.json',
      type: 'application/json'
    };
    
    mockFormData.append('file', mockFile);
    mockFormData.append('metadata', mockMetadata);
    mockFormData.append('senderPublicKey', 'mock-sender-public-key');
    
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    };
    
    // Call the API handler directly
    const response = await uploadHandler(mockRequest);
    const responseData = await response.json();
    
    // Check the API response
    expect(responseData).toHaveProperty('googleFileId');
    expect(responseData).toHaveProperty('googleMetadataFileId');
    expect(responseData).toHaveProperty('oneDriveFileInfo');
    expect(responseData).toHaveProperty('oneDriveMetadataFileInfo');
    expect(responseData).toHaveProperty('message', 'Files uploaded to Google Drive and OneDrive successfully.');
  });

  
  test('handles file validation errors', async () => {
    render(<FileUploadForm />);
    
    // Wait for the component to establish secure connection
    await waitFor(() => {
      expect(cryptoLib.deriveSharedSecret).toHaveBeenCalledTimes(2);
    });
    
    // Create a mock file that exceeds size limit (60MB)
    const oversizedFile = createMockFile('large-file.pdf', 'application/pdf', 60 * 1024 * 1024);
    
    await act(async () => {
      const hiddenInput = document.querySelector('input[type="file"]');
      if (!hiddenInput) {
        throw new Error("Hidden file input not found");
      }
      fireEvent.change(hiddenInput, { target: { files: [oversizedFile] } });
    });
    
    expect(screen.getByText((content) => content.includes('File size exceeds the maximum limit of 4 MB'))).toBeInTheDocument();
    
    // Create a mock file with invalid type
    const invalidTypeFile = createMockFile('invalid.exe', 'application/exe', 1024 * 1024);
    
    await act(async () => {
      const hiddenInput = document.querySelector('input[type="file"]');
      if (!hiddenInput) {
        throw new Error("Hidden file input not found");
      }
      fireEvent.change(hiddenInput, { target: { files: [invalidTypeFile] } });
    });
    
    expect(screen.getByText((content) => content.includes('Invalid file type. Allowed types are: PDF, DOCX, PNG, JPEG, and TXT'))).toBeInTheDocument();
  });
  
  test('handles API errors correctly', async () => {
    // Override the fetch mock to simulate an error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockResolvedValue({ error: 'Upload failed' })
    });
    
    render(<FileUploadForm />);
    
    await waitFor(() => {
      expect(cryptoLib.deriveSharedSecret).toHaveBeenCalledTimes(2);
    });
    
    const testFile = createMockFile('test-file.pdf', 'application/pdf', 1024 * 1024);
    
    await act(async () => {
      const hiddenInput = document.querySelector('input[type="file"]');
      if (!hiddenInput) {
        throw new Error("Hidden file input not found");
      }
      fireEvent.change(hiddenInput, { target: { files: [testFile] } });
    });
    
    const uploadButton = screen.getByRole('button', { name: /Encrypt & Upload File/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Failed to upload file: Upload failed'))).toBeInTheDocument();
    });
  });
  
  test('API handles missing files correctly', async () => {
    const mockFormData = new FormData();
    // Don't append any files to simulate missing files
    
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    };
    
    // Call the API handler directly
    const response = await uploadHandler(mockRequest);
    const responseData = await response.json();
    
    // Check the API response for expected error
    expect(responseData).toHaveProperty('error', 'Missing required files or parameters.');
    expect(response.status).toBe(400);
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadPage from '@/app/receive/download/page';
import * as crypto from '@/lib/crypto';

document.originalCreateElement = document.createElement;
document.createElement = function (tagName, options) {
    return document.originalCreateElement(tagName, options);
};


// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the components
jest.mock('@/components/navigation', () => {
  return function MockNavigation() {
    return <div data-testid="navigation">Navigation</div>;
  };
});

jest.mock('@/components/footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/og-comp/ui-non-chad/FileRow', () => {
  return function MockFileRow(props) {
    return (
      <div data-testid={`file-row-${props.fileId}`} className="file-row">
        <div data-testid="file-name">{props.fileName}</div>
        <div data-testid="file-size">{props.fileSize}</div>
        <div data-testid="file-type">{props.fileType}</div>
        <div data-testid="file-access-count">{props.accessCount}</div>
        <div data-testid="file-status">{props.status}</div>
        <button
          data-testid="download-button"
          onClick={props.onDownload}
          disabled={props.disableDownload}
        >
          Download
        </button>
        <button data-testid="remove-button" onClick={props.onRemove}>
          Remove
        </button>
        <div data-testid="progress-bar" style={{ width: `${props.progress}%` }}>
          {props.progress}%
        </div>
      </div>
    );
  };
});

// Mock the crypto functions
jest.mock('@/lib/crypto', () => ({
  getAllSharedStoredKeys: jest.fn(),
  getSharedSecretBySenderPublicKey: jest.fn(),
  decryptFile: jest.fn(),
  computeMAC: jest.fn(),
  getMacSharedSecretBySenderPublicKey: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock document.createElement for download link
document.createElement = jest.fn().mockImplementation((tag) => {
  if (tag === 'a') {
    return {
      href: '',
      download: '',
      click: jest.fn(),
    };
  }
  return document.originalCreateElement(tag);
});

describe('DownloadPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSharedSecrets = [
    { senderPublicKey: 'key1' },
    { senderPublicKey: 'key2' },
  ];

  const mockMetadata1 = {
    metadata: {
      name: 'test-file.pdf',
      description: 'Test description',
      fileSize: 1024000, // 1000 KB
      fileType: 'application/pdf',
      uploadDate: '2025-01-01T00:00:00.000Z',
      accessCount: 3,
      accessTime: '2025-01-01T00:00:00.000Z',
      mac: 'mock-mac-value',
    },
  };

  const mockMetadata2 = {
    metadata: {
      name: 'another-file.doc',
      description: 'Another test file',
      fileSize: 512000, // 500 KB
      fileType: 'application/msword',
      uploadDate: '2025-01-02T00:00:00.000Z',
      accessCount: 1,
      accessTime: '2025-01-02T00:00:00.000Z',
      mac: 'another-mock-mac-value',
    },
  };

  test('renders loading skeleton initially', async () => {
    // Setup mocks for initial loading state
    crypto.getAllSharedStoredKeys.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state

    render(<DownloadPage />);

    // Verify loading skeleton is displayed
    expect(screen.getByText('Files Shared With You')).toBeInTheDocument();
    expect(document.querySelector('.h-8')).toBeInTheDocument(); // Skeleton element
  });

  test('displays files shared with the user', async () => {
    // Setup mocks for successful file listing
    crypto.getAllSharedStoredKeys.mockResolvedValue(mockSharedSecrets);
    
    // Mock fetch for the first file metadata
    global.fetch.mockImplementation((url) => {
      if (url.includes('key1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata1),
        });
      } else if (url.includes('key2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata2),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => {
      render(<DownloadPage />);
    });

    // Wait for data to load and component to render files
    await waitFor(() => {
      expect(screen.getByText('Files Shared With You')).toBeInTheDocument();
      expect(screen.queryByTestId('file-row-key1')).toBeInTheDocument();
      expect(screen.queryByTestId('file-row-key2')).toBeInTheDocument();
    });

    // Verify file details are displayed correctly
    expect(screen.getAllByTestId('file-name')[0].textContent).toBe('test-file.pdf');
    expect(screen.getAllByTestId('file-name')[1].textContent).toBe('another-file.doc');
    expect(screen.getAllByTestId('file-size')[0].textContent).toBe('1000.00 KB');
    expect(screen.getAllByTestId('file-size')[1].textContent).toBe('500.00 KB');
  });


  test('handles removing a file from the list', async () => {
    // Setup mocks
    crypto.getAllSharedStoredKeys.mockResolvedValue(mockSharedSecrets);
    
    global.fetch.mockImplementation((url) => {
      if (url.includes('key1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata1),
        });
      } else if (url.includes('key2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata2),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Render the component
    await act(async () => {
      render(<DownloadPage />);
    });

    // Wait for files to load
    await waitFor(() => {
      expect(screen.getByTestId('file-row-key1')).toBeInTheDocument();
      expect(screen.getByTestId('file-row-key2')).toBeInTheDocument();
    });

    // Remove the first file
    const removeButtons = screen.getAllByTestId('remove-button');
    fireEvent.click(removeButtons[0]);

    // Verify the file has been removed from the UI
    await waitFor(() => {
      expect(screen.queryByTestId('file-row-key1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-row-key2')).toBeInTheDocument();
    });
  });

  test('displays no files message when list is empty', async () => {
    // Setup mocks for empty file list
    crypto.getAllSharedStoredKeys.mockResolvedValue([]);

    // Render the component
    await act(async () => {
      render(<DownloadPage />);
    });

    // Verify message is shown when no files
    await waitFor(() => {
      expect(screen.getByText('No files available.')).toBeInTheDocument();
    });
  });

  test('handles metadata fetch failure for a specific file', async () => {
    // Setup mocks - one file succeeds, one fails
    crypto.getAllSharedStoredKeys.mockResolvedValue(mockSharedSecrets);

    global.fetch.mockImplementation((url) => {
      if (url.includes('key1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMetadata1),
        });
      } else if (url.includes('key2')) {
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    
    // Mock console.warn to capture warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Render the component
    await act(async () => {
      render(<DownloadPage />);
    });

    // Verify only the successful file is shown
    await waitFor(() => {
      expect(screen.queryByTestId('file-row-key1')).toBeInTheDocument();
      expect(screen.queryByTestId('file-row-key2')).not.toBeInTheDocument();
    });

    // Verify warning was logged
    expect(console.warn).toHaveBeenCalled();
  });


});
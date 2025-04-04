// __tests__/app/page.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the Next.js components and other dependencies
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({ src, alt, width, height, className }) => {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  };
});

jest.mock('@/components/navigation', () => {
  return function Navigation() {
    return <nav data-testid="navigation">Navigation Component</nav>;
  };
});

jest.mock('@/components/footer', () => {
  return function Footer() {
    return <footer data-testid="footer">Footer Component</footer>;
  };
});

jest.mock('@/components/ui/button', () => {
  return {
    Button: ({ children, className, variant, size }) => {
      return (
        <button className={className} data-variant={variant} data-size={size}>
          {children}
        </button>
      );
    },
  };
});

jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right-icon">→</span>,
  Shield: () => <span data-testid="shield-icon">🛡️</span>,
  Lock: () => <span data-testid="lock-icon">🔒</span>,
  Key: () => <span data-testid="key-icon">🔑</span>,
  FileText: () => <span data-testid="filetext-icon">📄</span>,
  RefreshCw: () => <span data-testid="refreshcw-icon">🔄</span>,
}));

describe('HomePage', () => {
  it('renders the navigation component', () => {
    render(<HomePage />);
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('renders the footer component', () => {
    render(<HomePage />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders the logo', () => {
    render(<HomePage />);
    const logo = screen.getByAltText('Shaheen Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');
  });

  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Secure File Sharing Solution')).toBeInTheDocument();
  });

  it('renders the main description with emphasis on "untrusted Cloud Environments"', () => {
    render(<HomePage />);
    expect(screen.getByText(/Share files with end-to-end encryption in/)).toBeInTheDocument();
    expect(screen.getByText('untrusted Cloud Environments')).toBeInTheDocument();
    expect(screen.getByText(/Your data never leaves your device unencrypted./)).toBeInTheDocument();
  });

  it('renders the "Send Files" and "Receive Files" buttons in the hero section', () => {
    render(<HomePage />);
    
    // Look for the hero section
    const heroSection = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/send' && 
      link.textContent.includes('Send Files')
    );

    expect(heroSection).toBeInTheDocument();
    
    // Check receive files button
    const receiveFiles = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/receive' && 
      link.textContent.includes('Receive Files')
    );
    expect(receiveFiles).toBeInTheDocument();
  });

  it('renders the security badge', () => {
    render(<HomePage />);
    expect(screen.getByText('End-to-end encrypted. Zero knowledge. Anonymous.')).toBeInTheDocument();
  });



  it('renders the "How It Works" section with 3 steps', () => {
    render(<HomePage />);
    
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Secure file sharing in three simple steps.')).toBeInTheDocument();
    
    // Check for the three steps by their distinct headings
    expect(screen.getByText('Generate Keys')).toBeInTheDocument();
    expect(screen.getByText('Exchange Keys')).toBeInTheDocument();
    expect(screen.getByText('Secure Transfer')).toBeInTheDocument();
    
    // Check "Learn More" link
    const learnMoreLink = screen.getAllByRole('link').find(link => 
      link.getAttribute('href') === '/how-it-works' && 
      link.textContent.includes('Learn More About Our Security')
    );
    expect(learnMoreLink).toBeInTheDocument();
  });


});
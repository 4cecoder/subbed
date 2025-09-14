'use client';

import { ReactNode } from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { useTheme } from '@/lib/hooks/use-theme';

interface ClerkThemeProviderProps {
  children: ReactNode;
}

export function ClerkThemeProvider({ children }: ClerkThemeProviderProps) {
  const { resolvedTheme } = useTheme();

  // Clerk appearance configuration that matches your site's theme
  const clerkAppearance = {
    variables: {
      colorPrimary: resolvedTheme === 'dark' ? '#ff4444' : '#dc2626', // YouTube red
      colorBackground: resolvedTheme === 'dark' ? '#141414' : '#ffffff',
      colorInputBackground: resolvedTheme === 'dark' ? '#1f1f1f' : '#f9fafb',
      colorInputText: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
      colorText: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
      colorTextSecondary: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
      colorDanger: resolvedTheme === 'dark' ? '#ef4444' : '#dc2626',
      colorSuccess: resolvedTheme === 'dark' ? '#10b981' : '#059669',
      colorWarning: resolvedTheme === 'dark' ? '#f59e0b' : '#d97706',
      borderRadius: '0.5rem',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    },
    elements: {
      formButtonPrimary: {
        backgroundColor: resolvedTheme === 'dark' ? '#ff4444' : '#dc2626',
        '&:hover': {
          backgroundColor: resolvedTheme === 'dark' ? '#ff3333' : '#b91c1c',
        },
        '&:focus': {
          backgroundColor: resolvedTheme === 'dark' ? '#ff3333' : '#b91c1c',
        },
      },
      card: {
        backgroundColor: resolvedTheme === 'dark' ? '#1f1f1f' : '#ffffff',
        border: resolvedTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow:
          resolvedTheme === 'dark'
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      headerTitle: {
        color: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        fontWeight: '600',
      },
      headerSubtitle: {
        color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      },
      socialButtonsBlockButton: {
        backgroundColor: resolvedTheme === 'dark' ? '#374151' : '#f3f4f6',
        border: resolvedTheme === 'dark' ? '1px solid #4b5563' : '1px solid #d1d5db',
        color: resolvedTheme === 'dark' ? '#ffffff' : '#374151',
        '&:hover': {
          backgroundColor: resolvedTheme === 'dark' ? '#4b5563' : '#e5e7eb',
        },
      },
      formFieldInput: {
        backgroundColor: resolvedTheme === 'dark' ? '#1f1f1f' : '#ffffff',
        border: resolvedTheme === 'dark' ? '1px solid #4b5563' : '1px solid #d1d5db',
        color: resolvedTheme === 'dark' ? '#ffffff' : '#111827',
        '&:focus': {
          borderColor: resolvedTheme === 'dark' ? '#ff4444' : '#dc2626',
          boxShadow:
            resolvedTheme === 'dark'
              ? '0 0 0 3px rgba(255, 68, 68, 0.1)'
              : '0 0 0 3px rgba(220, 38, 38, 0.1)',
        },
      },
      formFieldLabel: {
        color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        fontWeight: '500',
      },
      footerActionLink: {
        color: resolvedTheme === 'dark' ? '#ff4444' : '#dc2626',
        '&:hover': {
          color: resolvedTheme === 'dark' ? '#ff3333' : '#b91c1c',
        },
      },
      identityPreviewText: {
        color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
      },
      userButtonPopoverCard: {
        backgroundColor: resolvedTheme === 'dark' ? '#1f1f1f' : '#ffffff',
        border: resolvedTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow:
          resolvedTheme === 'dark'
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      userButtonPopoverActionButton: {
        color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
        '&:hover': {
          backgroundColor: resolvedTheme === 'dark' ? '#374151' : '#f3f4f6',
        },
      },
      userButtonPopoverActionButtonText: {
        color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      },
      userButtonPopoverFooter: {
        borderTop: resolvedTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
      },
    },
  };

  return (
    <BaseClerkProvider
      appearance={clerkAppearance}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      {children}
    </BaseClerkProvider>
  );
}

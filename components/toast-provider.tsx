"use client";

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '20px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '500',
          maxWidth: '700px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        },
        success: {
          iconTheme: {
            primary: '#ffffff',
            secondary: '#1a1a1a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ffffff',
            secondary: '#1a1a1a',
          },
        },
      }}
    />
  );
}

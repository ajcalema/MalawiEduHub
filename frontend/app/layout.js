import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata = {
  title: 'MalawiEduHub — Malawi\'s Knowledge Library',
  description: 'Download past papers, notes, textbooks and revision guides for MSCE, JCE, Primary and University.',
  keywords: 'Malawi, education, past papers, MSCE, JCE, notes, textbooks',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid #d0e8db',
              },
              success: { iconTheme: { primary: '#0d7a55', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

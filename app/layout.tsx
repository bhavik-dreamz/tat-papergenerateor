import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from 'react-hot-toast'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TAT Paper Generator - AI-Powered Exam Papers',
  description: 'Generate high-quality exam papers using AI with course-specific materials and automated grading. Transform your teaching with intelligent paper creation.',
  keywords: 'AI exam papers, automated grading, course materials, education technology, paper generator, online testing',
  authors: [{ name: 'TAT Paper Generator Team' }],
  creator: 'TAT Paper Generator',
  publisher: 'TAT Paper Generator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tat-paper-generator.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TAT Paper Generator - AI-Powered Exam Papers',
    description: 'Generate high-quality exam papers using AI with course-specific materials and automated grading. Transform your teaching with intelligent paper creation.',
    url: '/',
    siteName: 'TAT Paper Generator',
    images: [
      {
        url: '/og-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'TAT Paper Generator - AI-Powered Education Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAT Paper Generator - AI-Powered Exam Papers',
    description: 'Generate high-quality exam papers using AI with course-specific materials and automated grading.',
    images: ['/og-homepage.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}

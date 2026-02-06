'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApplicationForm } from '@/components/application-form'

function ApplicationPageContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-center">Application Form</h1>
          <p className="text-center text-muted-foreground text-lg">Complete your application information</p>
        </div>
        <ApplicationForm prefillEmail={email} readonlyEmail={!!email} />
      </div>
    </main>
  )
}

export default function ApplicationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading application form...</p>
          </div>
        </main>
      }
    >
      <ApplicationPageContent />
    </Suspense>
  )
}

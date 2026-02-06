'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function SuccessPage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleNewSubmission = () => {
    router.push('/')
  }

  const handleExit = () => {
    window.close()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary py-8 flex items-center justify-center">
      <div className="container mx-auto max-w-2xl px-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl text-center">Application Submitted Successfully!</CardTitle>
            <CardDescription className="text-center text-lg mt-2">
              Thank you for completing your application. Your information has been securely stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>What happens next?</strong> Your application has been submitted and will be reviewed by our team. You will receive a confirmation email shortly.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-center font-semibold text-foreground">Would you like to:</p>
              
              <div className="space-y-3">
                <Button
                  onClick={handleNewSubmission}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  Submit Another Application
                </Button>
                
                <Button
                  onClick={handleExit}
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                >
                  Finish
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompletionStatus {
  phoneSet: boolean
  countrySet: boolean
  termsAccepted: boolean
  profileComplete: boolean
  canProceed: boolean
}

export function ProfileCompletionModal() {
  const router = useRouter()
  const [status, setStatus] = useState<CompletionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkCompletion() {
      try {
        console.log('[v0] Checking profile completion...')
        const response = await fetch('/api/profile/completion-status')
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('[v0] Profile completion status:', data)

        if (data.completion) {
          setStatus(data.completion)
          // Show modal if profile is incomplete or terms not accepted
          if (!data.completion.canProceed) {
            setIsOpen(true)
          }
        }
      } catch (error) {
        console.error('[v0] Error checking profile completion:', error)
        setError('Could not verify profile status')
      } finally {
        setLoading(false)
      }
    }

    checkCompletion()
    
    // Set a timeout to force stop loading after 5 seconds
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[v0] Profile check timeout - stopping loading')
        setLoading(false)
      }
    }, 5000)
    
    return () => clearTimeout(timeout)
  }, [])

  if (loading || !status || !isOpen) {
    return null
  }

  const missingItems = []
  if (!status.phoneSet) missingItems.push('Phone number')
  if (!status.countrySet) missingItems.push('Country')
  if (!status.termsAccepted) missingItems.push('Terms & Conditions agreement')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Complete Your Profile</h2>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Before you can continue, please complete the following:
          </p>

          <div className="space-y-2">
            {/* Phone */}
            <div className="flex items-center gap-3 text-sm">
              {status.phoneSet ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={status.phoneSet ? 'text-foreground' : 'text-muted-foreground'}>
                Add phone number
              </span>
            </div>

            {/* Country */}
            <div className="flex items-center gap-3 text-sm">
              {status.countrySet ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={status.countrySet ? 'text-foreground' : 'text-muted-foreground'}>
                Select your country
              </span>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 text-sm">
              {status.termsAccepted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={status.termsAccepted ? 'text-foreground' : 'text-muted-foreground'}>
                Accept Terms & Conditions
              </span>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded p-4">
          <p className="text-xs text-muted-foreground">
            Your profile information helps us provide you with a personalized learning experience and comply with our requirements.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/profile')}
            className="flex-1"
          >
            Edit Profile
          </Button>
          <Button
            onClick={() => router.push('/terms')}
            className="flex-1"
          >
            Review Terms
          </Button>
        </div>
      </div>
    </div>
  )
}

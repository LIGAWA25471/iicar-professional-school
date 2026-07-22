'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function TermsPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAgree() {
    if (!agreed) return

    setLoading(true)
    try {
      const response = await fetch('/api/profile/accept-terms', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('Failed to accept terms. Please try again.')
      }
    } catch (error) {
      console.error('[v0] Error accepting terms:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Please read and agree to our terms before proceeding</p>
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 space-y-8 max-h-96 overflow-y-auto">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground mb-3">
              By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Use License</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) on IICAR Global College's platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Disclaimer</h2>
            <p className="text-sm text-muted-foreground mb-3">
              The materials on IICAR Global College's platform are provided on an 'as is' basis. IICAR Global College makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Limitations</h2>
            <p className="text-sm text-muted-foreground mb-3">
              In no event shall IICAR Global College or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on IICAR Global College's platform, even if IICAR Global College or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Accuracy of Materials</h2>
            <p className="text-sm text-muted-foreground mb-3">
              The materials appearing on IICAR Global College's platform could include technical, typographical, or photographic errors. IICAR Global College does not warrant that any of the materials on its platform are accurate, complete, or current. IICAR Global College may make changes to the materials contained on its platform at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Links</h2>
            <p className="text-sm text-muted-foreground mb-3">
              IICAR Global College has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by IICAR Global College of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Modifications</h2>
            <p className="text-sm text-muted-foreground mb-3">
              IICAR Global College may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Governing Law</h2>
            <p className="text-sm text-muted-foreground mb-3">
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which IICAR Global College operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-muted/30 border border-border rounded-lg p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">I agree to the Terms and Conditions</p>
              <p className="text-xs text-muted-foreground mt-1">
                I understand and agree to comply with all terms outlined above
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={handleAgree}
            disabled={!agreed || loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Agree & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

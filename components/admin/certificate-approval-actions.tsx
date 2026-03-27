'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Signature {
  id: string
  signature_name: string
  signature_title: string
  is_primary: boolean
}

interface CertificateApprovalActionsProps {
  certificateId: string
  signatures: Signature[]
}

export function CertificateApprovalActions({ certificateId, signatures }: CertificateApprovalActionsProps) {
  const router = useRouter()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [primarySignature, setPrimarySignature] = useState<string>(
    signatures.find(s => s.is_primary)?.id || ''
  )
  const [secondarySignature, setSecondarySignature] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/certificate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId,
          primarySignatureId: primarySignature || null,
          secondarySignatureId: secondarySignature || null,
        }),
      })
      
      if (res.ok) {
        setShowApproveDialog(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/certificate/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId,
          reason: rejectReason,
        }),
      })
      
      if (res.ok) {
        setShowRejectDialog(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => setShowApproveDialog(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-1" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectDialog(true)}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <XCircle className="h-4 w-4 mr-1" /> Reject
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Certificate</DialogTitle>
            <DialogDescription>
              Select the signatures to include on this certificate. The student will be notified via email once approved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Primary Signature</Label>
              <Select value={primarySignature} onValueChange={setPrimarySignature}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select primary signature" />
                </SelectTrigger>
                <SelectContent>
                  {signatures.map((sig) => (
                    <SelectItem key={sig.id} value={sig.id}>
                      {sig.signature_name} ({sig.signature_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Secondary Signature (Optional)</Label>
              <Select value={secondarySignature} onValueChange={setSecondarySignature}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select secondary signature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {signatures.filter(s => s.id !== primarySignature).map((sig) => (
                    <SelectItem key={sig.id} value={sig.id}>
                      {sig.signature_name} ({sig.signature_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {signatures.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                No signatures configured. Please add signatures in the Manage Signatures page first.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading || signatures.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Certificate</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The student will not be notified automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-sm font-medium">Reason for Rejection (Optional)</Label>
            <Textarea
              className="mt-1"
              placeholder="e.g., Incomplete coursework, suspected plagiarism..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              variant="destructive"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

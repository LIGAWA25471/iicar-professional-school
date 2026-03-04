'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Phone, CreditCard } from 'lucide-react'

interface Student {
  id: string
  full_name: string | null
  phone: string | null
}

interface Program {
  id: string
  title: string
  price_cents: number
}

interface Props {
  // Pre-fill one side — either student or program is fixed
  fixedStudentId?: string
  fixedStudentName?: string
  fixedProgramId?: string
  fixedProgramTitle?: string
  fixedPriceCents?: number
  // Data for the un-fixed side
  students?: Student[]
  programs?: Program[]
  trigger?: React.ReactNode
}

export default function AdminManualEnrollModal({
  fixedStudentId,
  fixedStudentName,
  fixedProgramId,
  fixedProgramTitle,
  fixedPriceCents,
  students = [],
  programs = [],
  trigger,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState(fixedStudentId ?? '')
  const [programId, setProgramId] = useState(fixedProgramId ?? '')
  const [paymentMethod, setPaymentMethod] = useState<'already_paid' | 'mpesa_prompt'>('already_paid')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Auto-fill phone from selected student
  useEffect(() => {
    if (!fixedStudentId && studentId) {
      const s = students.find(s => s.id === studentId)
      if (s?.phone) setPhoneNumber(s.phone)
    } else if (fixedStudentId) {
      // phone comes from the page — not auto-filled here
    }
  }, [studentId, students, fixedStudentId])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStudentId(fixedStudentId ?? '')
      setProgramId(fixedProgramId ?? '')
      setPaymentMethod('already_paid')
      setPhoneNumber('')
      setResult(null)
    }
  }, [open, fixedStudentId, fixedProgramId])

  const selectedProgram = fixedProgramId
    ? { id: fixedProgramId, title: fixedProgramTitle ?? '', price_cents: fixedPriceCents ?? 0 }
    : programs.find(p => p.id === programId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: fixedStudentId ?? studentId,
          programId: fixedProgramId ?? programId,
          paymentMethod,
          phoneNumber: paymentMethod === 'mpesa_prompt' ? phoneNumber : undefined,
        }),
      })
      const data = await res.json()
      setResult({ success: res.ok, message: data.message ?? data.error ?? 'Unknown error' })
      if (res.ok) router.refresh()
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = (fixedStudentId || studentId) && (fixedProgramId || programId) &&
    (paymentMethod === 'already_paid' || phoneNumber.trim().length > 0)

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Enroll Student
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Manual Enrollment
            </DialogTitle>
            <DialogDescription>
              Enroll a student into a course manually. Choose whether they have already paid or send an M-Pesa payment prompt.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className={`rounded-lg border p-4 flex gap-3 ${result.success
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'}`}>
              {result.success
                ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                : <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <p className={`text-sm font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Success' : 'Error'}
                </p>
                <p className={`text-sm mt-0.5 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                <div className="mt-3 flex gap-2">
                  {result.success && (
                    <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                    {result.success ? 'Enroll Another' : 'Try Again'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
              {/* Student selector — hidden if fixed */}
              {!fixedStudentId && (
                <div className="flex flex-col gap-1.5">
                  <Label>Student</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student…" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name ?? 'Unknown'} {s.phone ? `· ${s.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fixedStudentId && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Student</Label>
                  <p className="text-sm font-medium text-foreground">{fixedStudentName}</p>
                </div>
              )}

              {/* Program selector — hidden if fixed */}
              {!fixedProgramId && (
                <div className="flex flex-col gap-1.5">
                  <Label>Program</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program…" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} · KES {(p.price_cents / 100).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fixedProgramId && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Program</Label>
                  <p className="text-sm font-medium text-foreground">
                    {fixedProgramTitle}
                    {fixedPriceCents !== undefined && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        · KES {(fixedPriceCents / 100).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Payment method */}
              <div className="flex flex-col gap-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('already_paid')}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      paymentMethod === 'already_paid'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium text-xs text-center">Already Paid</span>
                    <span className="text-xs text-center leading-tight opacity-70">Activate immediately</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa_prompt')}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      paymentMethod === 'mpesa_prompt'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Phone className="h-5 w-5" />
                    <span className="font-medium text-xs text-center">Send M-Pesa Prompt</span>
                    <span className="text-xs text-center leading-tight opacity-70">Student pays via STK</span>
                  </button>
                </div>
              </div>

              {/* Phone number — only for M-Pesa */}
              {paymentMethod === 'mpesa_prompt' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678 or 254712345678"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedProgram && `KES ${(selectedProgram.price_cents / 100).toLocaleString()} will be charged.`}
                    {' '}Student enters their M-Pesa PIN on their phone.
                  </p>
                </div>
              )}

              {paymentMethod === 'already_paid' && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border">
                  The student will be enrolled immediately with <strong>active</strong> status and granted full access to the course.
                </p>
              )}

              <Button type="submit" disabled={loading || !canSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                ) : paymentMethod === 'already_paid' ? (
                  <><UserPlus className="h-4 w-4 mr-2" />Enroll Now</>
                ) : (
                  <><Phone className="h-4 w-4 mr-2" />Send M-Pesa Prompt</>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

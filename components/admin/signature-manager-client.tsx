'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignatureManager } from '@/components/admin/signature-pad'

interface Signature {
  id: string
  signature_name: string
  signature_title: string
  signature_data: string
  is_primary: boolean
}

interface SignatureManagerClientProps {
  initialSignatures: Signature[]
}

export function SignatureManagerClient({ initialSignatures }: SignatureManagerClientProps) {
  const router = useRouter()
  const [signatures, setSignatures] = useState<Signature[]>(initialSignatures)

  const handleAdd = async (signatureData: string, name: string, title: string) => {
    const res = await fetch('/api/admin/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureData, name, title }),
    })
    
    if (res.ok) {
      const newSig = await res.json()
      setSignatures(prev => [newSig, ...prev])
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/admin/signatures', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureId: id }),
    })
    
    if (res.ok) {
      setSignatures(prev => prev.filter(s => s.id !== id))
      router.refresh()
    }
  }

  const handleSetPrimary = async (id: string) => {
    const res = await fetch('/api/admin/signatures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureId: id }),
    })
    
    if (res.ok) {
      setSignatures(prev => prev.map(s => ({
        ...s,
        is_primary: s.id === id
      })))
      router.refresh()
    }
  }

  return (
    <SignatureManager
      signatures={signatures}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onSetPrimary={handleSetPrimary}
    />
  )
}

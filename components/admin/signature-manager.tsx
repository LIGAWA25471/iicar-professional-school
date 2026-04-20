'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PenTool, Upload, Type, Trash2, Check, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Signature {
  id: string
  signature_name: string
  is_primary: boolean
  created_at: string
}

export default function SignatureManager() {
  const [open, setOpen] = useState(false)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [typedName, setTypedName] = useState('')
  const [signatureName, setSignatureName] = useState('')

  // Fetch signatures when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      fetchSignatures()
    }
  }

  // Fetch signatures on mount
  const fetchSignatures = async () => {
    try {
      const res = await fetch('/api/admin/signatures')
      if (res.ok) {
        const data = await res.json()
        setSignatures(data)
      }
    } catch (err) {
      console.error('[v0] Error fetching signatures:', err)
    }
  }

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      await saveSignature('upload', base64, signatureName)
      setSignatureName('')
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    const ctx = canvasRef.current.getContext('2d')
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx?.lineTo(x, y)
    ctx?.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const saveDrawnSignature = async () => {
    if (!canvasRef.current) return
    const base64 = canvasRef.current.toDataURL('image/png')
    await saveSignature('drawn', base64, signatureName)
    clearCanvas()
    setSignatureName('')
  }

  const saveTypedSignature = async () => {
    if (!typedName.trim()) return
    await saveSignature('typed', typedName, typedName)
    setTypedName('')
    setSignatureName('')
  }

  const saveSignature = async (type: 'upload' | 'drawn' | 'typed', data: string, name: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: data,
          signature_name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Signature`,
        }),
      })

      const newSignature = await res.json()
      console.log('[v0] Save response:', newSignature)

      if (res.ok) {
        setSignatures([newSignature, ...signatures])
        setOpen(false)
        alert('Signature saved successfully!')
      } else {
        console.error('[v0] Save error:', newSignature)
        alert(`Failed to save signature: ${newSignature.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('[v0] Error saving signature:', err)
      alert(err instanceof Error ? err.message : 'Error saving signature')
    } finally {
      setLoading(false)
    }
  }

  const deleteSignature = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/signatures/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSignatures(signatures.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error('[v0] Error deleting signature:', err)
    }
  }

  const setActiveSignature = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/signatures/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })

      if (res.ok) {
        setSignatures(signatures.map(s => ({
          ...s,
          is_primary: s.id === id
        })))
      }
    } catch (err) {
      console.error('[v0] Error setting active signature:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchSignatures}>
          <PenTool className="h-4 w-4 mr-2" />
          Manage Signatures
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Document Signatures</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="draw">
              <PenTool className="h-4 w-4 mr-2" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type">
              <Type className="h-4 w-4 mr-2" />
              Type
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, or WebP format
              </p>
            </div>
            <input
              type="text"
              placeholder="Signature name (optional)"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </TabsContent>

          {/* Draw Tab */}
          <TabsContent value="draw" className="space-y-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-border rounded-lg cursor-crosshair bg-white"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCanvas}>
                Clear
              </Button>
              <Button
                onClick={saveDrawnSignature}
                disabled={loading}
                className="flex-1"
              >
                Save Signature
              </Button>
            </div>
            <input
              type="text"
              placeholder="Signature name (optional)"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </TabsContent>

          {/* Type Tab */}
          <TabsContent value="type" className="space-y-4">
            <input
              type="text"
              placeholder="Enter name for signature"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground italic">{typedName}</p>
            </div>
            <Button
              onClick={saveTypedSignature}
              disabled={loading || !typedName.trim()}
              className="w-full"
            >
              Save Signature
            </Button>
          </TabsContent>
        </Tabs>

        {/* Saved Signatures */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 text-sm">Saved Signatures</h3>
          {signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signatures saved yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {signatures.map((sig) => (
                <div key={sig.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sig.signature_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sig.is_primary && <Badge className="ml-0 h-5" variant="default">Active</Badge>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!sig.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveSignature(sig.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSignature(sig.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PenTool, Upload, Type, Trash2, Check, Loader2 } from 'lucide-react'

interface Signature {
  id: string
  signature_name: string
  is_primary: boolean
  created_at: string
}

export default function SignaturesPageClient({ initialSignatures }: { initialSignatures: Signature[] }) {
  const [signatures, setSignatures] = useState<Signature[]>(initialSignatures)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [signatureName, setSignatureName] = useState('')
  const [typedName, setTypedName] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(2, 2)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleCanvasMouseUp = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const saveDrawnSignature = async () => {
    if (!signatureName.trim()) {
      alert('Please enter a name for this signature')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    await saveSignature('drawn', imageData, signatureName)
    clearCanvas()
    setSignatureName('')
  }

  const saveTypedSignature = async () => {
    if (!typedName.trim()) {
      alert('Please enter a name for this signature')
      return
    }

    await saveSignature('typed', typedName, typedName)
  }

  const handleFileUpload = async (file: File) => {
    if (!signatureName.trim()) {
      alert('Please enter a signature name before uploading')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      await saveSignature('upload', base64)
    }
    reader.readAsDataURL(file)
  }

  const saveUploadedSignature = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      alert('Please select a file first')
      return
    }
    if (!signatureName.trim()) {
      alert('Please enter a signature name')
      return
    }

    setLoading(true)
    try {
      const file = fileInputRef.current.files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signatureName', signatureName)

      // Upload to Vercel Blob first
      const uploadRes = await fetch('/api/admin/signatures/upload-blob', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const { url } = await uploadRes.json()
      console.log('[v0] File uploaded to Blob:', url)

      // Now save the signature with the blob URL
      await saveSignature('upload', url, signatureName, true)
    } catch (err) {
      console.error('[v0] Error uploading signature:', err)
      alert(err instanceof Error ? err.message : 'Error uploading signature')
    } finally {
      setLoading(false)
    }
  }

  const saveSignature = async (type: 'upload' | 'drawn' | 'typed', data: string, customName?: string, skipLoading = false) => {
    const name = customName || signatureName || typedName || `${type} Signature`
    
    if (!name.trim()) {
      alert('Please enter a name for this signature')
      return
    }

    if (!skipLoading) {
      setLoading(true)
    }

    try {
      const res = await fetch('/api/admin/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_type: type,
          signature_data: data,
          signature_name: name,
        }),
      })

      const responseData = await res.json()
      console.log('[v0] Response from /api/admin/signatures:', responseData)

      if (res.ok && responseData.success) {
        const newSignature = responseData.data
        setSignatures([newSignature, ...signatures])
        setSignatureName('')
        setTypedName('')
        setUploadPreview(null)
        clearCanvas()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        alert('Signature saved successfully!')
      } else {
        const errorMsg = responseData.message || responseData.error || 'Unknown error'
        console.error('[v0] Save failed:', responseData)
        alert(`Failed to save signature: ${errorMsg}`)
      }
    } catch (err) {
      console.error('[v0] Error saving signature:', err)
      alert(err instanceof Error ? err.message : 'Error saving signature')
    } finally {
      if (!skipLoading) {
        setLoading(false)
      }
    }
  }

  const deleteSignature = async (id: string) => {
    if (!confirm('Delete this signature?')) return

    try {
      const res = await fetch(`/api/admin/signatures/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSignatures(signatures.filter((s) => s.id !== id))
      } else {
        alert('Failed to delete signature')
      }
    } catch (err) {
      console.error('[v0] Error deleting signature:', err)
      alert('Error deleting signature')
    }
  }

  const activateSignature = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/signatures/${id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        setSignatures(
          signatures.map((s) => ({
            ...s,
            is_primary: s.id === id,
          }))
        )
      } else {
        alert('Failed to activate signature')
      }
    } catch (err) {
      console.error('[v0] Error activating signature:', err)
      alert('Error activating signature')
    }
  }

  const activeSignature = signatures.find((s) => s.is_primary)

  return (
    <div className="space-y-8">
      {/* Create New Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Signature</CardTitle>
          <CardDescription>Create a signature by uploading an image, drawing, or typing a name</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="drawn" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" /> Draw
              </TabsTrigger>
              <TabsTrigger value="typed" className="flex items-center gap-2">
                <Type className="h-4 w-4" /> Type
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Signature Name</label>
                <Input
                  placeholder="e.g., Julia Thornton"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        setUploadPreview(event.target?.result as string)
                      }
                      reader.readAsDataURL(e.target.files[0])
                    }
                  }}
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
              {fileInputRef.current?.files && fileInputRef.current.files.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    ✓ Selected: <strong>{fileInputRef.current.files[0].name}</strong>
                  </div>
                  {uploadPreview && (
                    <div className="border border-border rounded-lg p-4 bg-white flex flex-col items-center">
                      <p className="text-sm font-medium mb-2">Preview</p>
                      <img
                        src={uploadPreview}
                        alt="Signature preview"
                        className="max-w-full max-h-40 object-contain border border-border rounded p-2"
                      />
                    </div>
                  )}
                </div>
              )}
              <Button 
                onClick={saveUploadedSignature} 
                disabled={loading || !fileInputRef.current?.files?.length || !signatureName.trim()} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Save Uploaded Signature
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Draw Tab */}
            <TabsContent value="drawn" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Signature Name</label>
                <Input
                  placeholder="e.g., Julia Thornton"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Draw Signature</label>
                <canvas
                  ref={canvasRef}
                  className="w-full border border-border rounded-lg cursor-crosshair bg-white"
                  style={{ height: '200px' }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCanvas} type="button">
                  Clear
                </Button>
                <Button onClick={saveDrawnSignature} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Save Signature
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Type Tab */}
            <TabsContent value="typed" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name (Typed Signature)</label>
                <Input
                  placeholder="e.g., Julia Thornton"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="text-lg italic"
                />
              </div>
              <Button onClick={saveTypedSignature} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Save Typed Signature
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Active Signature */}
      {activeSignature && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Active Signature</CardTitle>
            <CardDescription className="text-green-800">This signature will be used on all documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{activeSignature.signature_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeSignature.signature_type === 'typed' ? 'Typed Signature' : activeSignature.signature_type === 'drawn' ? 'Hand-drawn Signature' : 'Uploaded Image'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Added {new Date(activeSignature.created_at).toLocaleDateString()}
                  </p>
                </div>
                {(activeSignature.signature_type === 'drawn' || activeSignature.signature_type === 'upload') && (
                  <div className="w-32 h-16 border border-border rounded bg-white p-2 flex items-center justify-center">
                    {activeSignature.signature_type === 'upload' ? (
                      <img
                        src={activeSignature.signature_data}
                        alt="Signature"
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <img
                        src={activeSignature.signature_data}
                        alt="Signature"
                        className="max-w-full max-h-full"
                      />
                    )}
                  </div>
                )}
                {activeSignature.signature_type === 'typed' && (
                  <div className="w-32 h-16 border border-border rounded bg-white p-2 flex items-center justify-center">
                    <p className="italic text-lg">{activeSignature.signature_data}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>All Signatures</CardTitle>
          <CardDescription>Manage all your saved signatures</CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No signatures yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-24 h-12 border border-border rounded bg-white p-1 flex items-center justify-center flex-shrink-0">
                      {sig.signature_type === 'typed' ? (
                        <p className="italic text-sm">{sig.signature_data}</p>
                      ) : (
                        <img
                          src={sig.signature_data}
                          alt={sig.signature_name}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sig.signature_name}</p>
                        {sig.is_primary && <Badge className="bg-green-600">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sig.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!sig.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateSignature(sig.id)}
                      >
                        <Check className="h-4 w-4 mr-1" /> Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSignature(sig.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

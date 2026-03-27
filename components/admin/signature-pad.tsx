'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Save, RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureData: string, name: string, title: string) => void
  onCancel?: () => void
  initialName?: string
  initialTitle?: string
}

export function SignaturePad({ onSave, onCancel, initialName = '', initialTitle = 'Administrator' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [name, setName] = useState(initialName)
  const [title, setTitle] = useState(initialTitle)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Set canvas style dimensions
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Configure drawing style
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasSignature(false)
  }

  const saveSignature = () => {
    if (!hasSignature || !name.trim()) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL('image/png')
    onSave(signatureData, name.trim(), title.trim())
  }

  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-card">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="sig-name" className="text-sm font-medium">Signatory Name</Label>
          <Input
            id="sig-name"
            placeholder="e.g., Malinar Hellen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="sig-title" className="text-sm font-medium">Title/Position</Label>
          <Input
            id="sig-title"
            placeholder="e.g., Principal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Draw Signature</Label>
        <div className="border-2 border-dashed border-border rounded-lg bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-32 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Draw your signature using mouse or touch</p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Clear
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={saveSignature}
          disabled={!hasSignature || !name.trim()}
          className="bg-primary text-primary-foreground"
        >
          <Save className="h-4 w-4 mr-1" /> Save Signature
        </Button>
      </div>
    </div>
  )
}

interface SavedSignature {
  id: string
  signature_name: string
  signature_title: string
  signature_data: string
  is_primary: boolean
}

interface SignatureManagerProps {
  signatures: SavedSignature[]
  onAdd: (signatureData: string, name: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSetPrimary: (id: string) => Promise<void>
}

export function SignatureManager({ signatures, onAdd, onDelete, onSetPrimary }: SignatureManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async (signatureData: string, name: string, title: string) => {
    setLoading(true)
    try {
      await onAdd(signatureData, name, title)
      setShowAddForm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Certificate Signatures</h3>
        {!showAddForm && (
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-primary-foreground"
          >
            Add Signature
          </Button>
        )}
      </div>

      {showAddForm && (
        <SignaturePad
          onSave={handleSave}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {signatures.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className={`flex flex-col gap-3 p-4 border rounded-lg ${
                sig.is_primary ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{sig.signature_name}</p>
                  <p className="text-sm text-muted-foreground">{sig.signature_title}</p>
                </div>
                {sig.is_primary && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Primary</span>
                )}
              </div>
              
              <div className="bg-white border border-border rounded p-2">
                <img
                  src={sig.signature_data}
                  alt={`Signature of ${sig.signature_name}`}
                  className="h-16 w-auto mx-auto object-contain"
                />
              </div>

              <div className="flex gap-2 justify-end">
                {!sig.is_primary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPrimary(sig.id)}
                    disabled={loading}
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(sig.id)}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <p className="text-sm">No signatures added yet. Add a signature to use on certificates.</p>
          </div>
        )
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  phone: string
  country: string
}

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Kenya',
  'Nigeria',
  'Singapore',
  'India',
  'Germany',
  'France',
  'Other',
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setEmail(user.email || '')

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[v0] Error loading profile:', profileError)
        setError('Failed to load profile')
        return
      }

      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
      })
      setLoading(false)
    }

    loadProfile()
  }, [router])

  async function handleSave() {
    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }
    if (!formData.country.trim()) {
      setError('Country is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', profile?.id)

      if (updateError) {
        setError('Failed to save profile')
        console.error('[v0] Update error:', updateError)
        return
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError('An error occurred while saving')
      console.error('[v0] Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your account information</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Email (Read-only) */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
          <Input
            type="email"
            value={email}
            disabled
            className="bg-muted/50 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="text-sm font-medium text-foreground mb-2 block">
            Full Name
          </label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter your full name"
            className="bg-background"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-foreground mb-2 block">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g., +1 (555) 123-4567"
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">Required to complete your profile</p>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="text-sm font-medium text-foreground mb-2 block">
            Country <span className="text-destructive">*</span>
          </label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Required to complete your profile</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-2">Why we need this information:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Phone number for account recovery and important notifications</li>
            <li>Country information to provide localized support and compliance</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

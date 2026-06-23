'use client'

import { Mail, MessageCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const ZohoSalesIQChat = dynamic(() => import('@/components/zoho-salesiq-widget'), { ssr: false })

export default function SupportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
        <p className="mt-2 text-muted-foreground">Get help with your programs, payments, and certificates</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Options */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">How Can We Help?</h2>

          {/* Live Chat */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <MessageCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Live Chat Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">Chat with our support team in real-time using the widget on this page</p>
                <p className="mt-2 text-xs text-muted-foreground">Available during business hours</p>
              </div>
            </div>
          </div>

          {/* Email Support */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Email Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">Email us at</p>
                <Button asChild variant="link" className="p-0 h-auto text-primary mt-1">
                  <a href="mailto:support@iicar.org">support@iicar.org</a>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">Response time: 24-48 hours</p>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">FAQ</h3>
                <p className="mt-1 text-sm text-muted-foreground">Find answers to common questions about programs, enrollment, and certificates</p>
                <Button asChild variant="link" className="p-0 h-auto text-primary mt-2">
                  <Link href="/faq">View FAQ</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Support Hours</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM EAT<br />
                  <strong>Saturday:</strong> 10:00 AM - 2:00 PM EAT<br />
                  <strong>Sunday:</strong> Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat Widget */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Chat with Us</h2>
          <div className="min-h-96">
            <ZohoSalesIQChat />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function ZohoSalesIQChat() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Initialize Zoho SalesIQ if not already loaded
    const initZoho = () => {
      if (typeof window !== 'undefined') {
        // Initialize the global Zoho object
        window.$zoho = window.$zoho || {}
        window.$zoho.salesiq = window.$zoho.salesiq || { ready: function () {} }

        // Check if script is already loaded
        if (!document.getElementById('zoho-siq-widget')) {
          const script = document.createElement('script')
          script.type = 'text/javascript'
          script.id = 'zoho-siq-widget'
          script.src = 'https://salesiq.zoho.com/widget'
          script.async = true
          
          script.onload = () => {
            console.log('[v0] Zoho SalesIQ widget loaded successfully')
            setIsLoaded(true)
          }
          
          script.onerror = () => {
            console.error('[v0] Failed to load Zoho SalesIQ widget')
          }
          
          document.body.appendChild(script)
        } else {
          // Script already exists, mark as loaded
          setIsLoaded(true)
        }
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initZoho()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-4">
        Our support team is online and ready to help. Start chatting below or reach out via email at support@iicar.org
      </p>
      <div className="bg-muted/20 rounded-lg p-6 text-center min-h-80 flex flex-col items-center justify-center border border-border">
        {isLoaded ? (
          <p className="text-muted-foreground">Chat widget is ready. Look for the chat bubble on the page.</p>
        ) : (
          <p className="text-muted-foreground">Initializing chat widget...</p>
        )}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    $zoho?: any
  }
}

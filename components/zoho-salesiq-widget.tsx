'use client'

import { useEffect } from 'react'

export default function ZohoSalesIQChat() {
  useEffect(() => {
    // Initialize Zoho SalesIQ
    const initZoho = () => {
      window.$zoho = window.$zoho || {}
      window.$zoho.salesiq = window.$zoho.salesiq || { ready: function () {} }

      // Load the Zoho SalesIQ script
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.id = 'ZohoSalesIQInit'
      script.src = 'https://salesiq.zoho.com/widget'
      script.async = true
      document.head.appendChild(script)
    }

    // Check if Zoho is already loaded
    if (!window.ZohoSalesIQInit) {
      window.ZohoSalesIQInit = true
      initZoho()
    }
  }, [])

  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-4">
        Our support team is online and ready to help. Start chatting below or reach out via email at support@iicar.org
      </p>
      <div className="bg-muted/20 rounded-lg p-6 text-center min-h-80 flex flex-col items-center justify-center border border-border">
        <p className="text-muted-foreground">Loading chat widget...</p>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    $zoho?: any
    ZohoSalesIQInit?: boolean
  }
}

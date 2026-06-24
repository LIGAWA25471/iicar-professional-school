'use client'

import Script from 'next/script'

export default function ZohoSalesIQChat() {
  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-4">
        Our support team is online and ready to help. Start chatting below or reach out via email at support@iicar.org
      </p>
      <div className="bg-muted/20 rounded-lg p-6 text-center min-h-80 flex flex-col items-center justify-center border border-border">
        <p className="text-muted-foreground">Chat widget ready. Look for the chat bubble on the page.</p>
      </div>

      {/* Zoho SalesIQ Widget for Support Page */}
      <Script
        id="zoho-support-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.$zoho = window.$zoho || {};
            window.$zoho.salesiq = window.$zoho.salesiq || { ready: function() {} };
          `,
        }}
      />
      <Script
        id="zoho-support-widget"
        src="https://salesiq.zoho.com/widget"
        strategy="lazyOnload"
        onError={() => {
          console.log('[v0] Chat widget optional - email support available at support@iicar.org')
        }}
      />
    </div>
  )
}

declare global {
  interface Window {
    $zoho?: any
  }
}

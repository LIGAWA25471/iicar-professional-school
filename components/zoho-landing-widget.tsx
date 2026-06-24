'use client'

import Script from 'next/script'

export function ZohoLandingWidget() {
  return (
    <>
      <Script
        id="zoho-landing-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.$zoho = window.$zoho || {};
            window.$zoho.salesiq = window.$zoho.salesiq || { ready: function() {} };
          `,
        }}
      />
      <Script
        id="zoho-landing-widget"
        src="https://salesiq.zoho.com/widget"
        strategy="lazyOnload"
        onError={() => {
          console.log('[v0] Zoho widget optional - not critical for functionality')
        }}
      />
    </>
  )
}

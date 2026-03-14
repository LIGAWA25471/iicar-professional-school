import Link from 'next/link'
import Image from 'next/image'
import { Mail, Download, MapPin, Phone, Mail as MailIcon, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'
import { NewsletterSubscription } from '@/components/newsletter-subscription'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-50 mt-20">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-blue-100">Get notified about new programs, promotions, and exclusive updates.</p>
            </div>
            <NewsletterSubscription />
          </div>
        </div>
      </div>

      {/* Mobile App Download Section */}
      <div className="bg-slate-800 py-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Download Our Mobile App</h4>
              <p className="text-slate-300 text-sm">Access your courses and certificates on the go</p>
            </div>
            <a
              href="https://median.co/share/odmyyym#apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              <Download className="h-5 w-5" />
              Download APK
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.jpg" alt="IICAR" width={40} height={40} className="rounded-lg" />
              <span className="font-bold text-lg">IICAR</span>
            </div>
            <p className="text-slate-400 text-sm">
              International Institute for Certified Administrative Resources — Professional certification programs recognised globally.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-slate-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/dashboard/programs" className="text-slate-400 hover:text-white transition">Programs</Link></li>
              <li><Link href="/verify" className="text-slate-400 hover:text-white transition">Verify Certificate</Link></li>
              <li><Link href="/auth/login" className="text-slate-400 hover:text-white transition">Sign In</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/certificates" className="text-slate-400 hover:text-white transition">My Certificates</Link></li>
              <li><Link href="/dashboard" className="text-slate-400 hover:text-white transition">Dashboard</Link></li>
              <li><a href="https://median.co/share/odmyyym#apk" className="text-slate-400 hover:text-white transition">Mobile App</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-blue-400" />
                <span className="text-slate-400">Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <a href="tel:+254" className="text-slate-400 hover:text-white transition">+254</a>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <a href="mailto:info@iicar.org" className="text-slate-400 hover:text-white transition">info@iicar.org</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><Linkedin className="h-5 w-5" /></a>
            <a href="#" className="text-slate-400 hover:text-white transition"><Instagram className="h-5 w-5" /></a>
          </div>
          <p className="text-slate-500 text-sm">© 2024 IICAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const faqs = [
    {
      id: 'what-is-iicar',
      category: 'About IICAR',
      question: 'What is IICAR Global College?',
      answer: 'IICAR Global College is a USA-accredited professional educational institution offering self-paced certification programs for working professionals. We are registered in California, USA and deliver industry-aligned courses that are recognized globally.'
    },
    {
      id: 'accreditation',
      category: 'About IICAR',
      question: 'Is IICAR accredited?',
      answer: 'Yes, IICAR is a USA-accredited institution registered as Acclaim Academic Institute, Inc. in the State of California. All our programs meet professional accreditation standards and deliver certifications recognized internationally.'
    },
    {
      id: 'how-to-enroll',
      category: 'Enrollment',
      question: 'How do I enroll in a program?',
      answer: 'Visit our Programs page, select the course you want to take, and click "Enroll". You\'ll be guided to checkout where you can choose your preferred payment method (Card, M-Pesa, Airtel Money, or Bank Transfer via Paystack). After payment, you\'ll get instant access to the course.'
    },
    {
      id: 'payment-methods',
      category: 'Payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept multiple payment methods through Paystack: Credit/Debit Cards, M-Pesa, Airtel Money, and Bank Transfers. All prices are displayed in USD with KES conversion shown for reference. You can pay from anywhere in the world.'
    },
    {
      id: 'payment-processing',
      category: 'Payments',
      question: 'How long does payment processing take?',
      answer: 'Payment processing is instant. Once your payment is verified, you\'ll immediately receive access to your course materials and can begin learning right away. You\'ll receive a confirmation email with your enrollment details.'
    },
    {
      id: 'refund-policy',
      category: 'Payments',
      question: 'What is your refund policy?',
      answer: 'We offer a 14-day money-back guarantee from the date of purchase if you\'re not satisfied with the course content. To request a refund, contact our support team at support@iicar.org with your order details. Refunds are processed within 7-10 business days.'
    },
    {
      id: 'course-duration',
      category: 'Programs',
      question: 'How long does it take to complete a program?',
      answer: 'Program duration varies by course, typically ranging from 4 to 12 weeks. However, since our programs are completely self-paced, you can complete them faster or take longer based on your schedule. There\'s no fixed deadline.'
    },
    {
      id: 'free-time-access',
      category: 'Programs',
      question: 'Can I access the course materials anytime?',
      answer: 'Yes! All our programs are completely self-paced. You have 24/7 access to course materials from any device - desktop, tablet, or mobile. Study whenever and wherever it\'s convenient for you.'
    },
    {
      id: 'course-support',
      category: 'Programs',
      question: 'Will I get support while taking the course?',
      answer: 'Absolutely! We provide comprehensive support through multiple channels: live chat on our support page, email (support@iicar.org), and our FAQ. Our support team responds within 24-48 hours. We\'re here to help you succeed.'
    },
    {
      id: 'certificate-issuance',
      category: 'Certificates',
      question: 'How do I get my certificate after completion?',
      answer: 'After successfully completing all course modules and passing the final assessment with the required passing score, your certificate is automatically generated. You can download it immediately from your dashboard and receive a copy via email.'
    },
    {
      id: 'certificate-verification',
      category: 'Certificates',
      question: 'Can employers verify my certificate?',
      answer: 'Yes! All certificates include a unique verification ID. Visit our Verify Certificate page and employers can instantly confirm the authenticity of your credential. This ensures your achievement is recognized worldwide.'
    },
    {
      id: 'certificate-value',
      category: 'Certificates',
      question: 'Are these certificates recognized by employers?',
      answer: 'Our certificates are recognized by employers globally. They demonstrate professional competency in your chosen field and are valued by organizations worldwide. Our programs are designed to give you practical skills that employers are looking for.'
    },
    {
      id: 'learning-materials',
      category: 'Learning',
      question: 'What type of learning materials are included?',
      answer: 'Our programs include comprehensive learning materials: video lectures, reading materials, case studies, practical assignments, and interactive quizzes. All content is professionally developed and regularly updated to reflect industry best practices.'
    },
    {
      id: 'grading-system',
      category: 'Learning',
      question: 'How is performance evaluated?',
      answer: 'We use a transparent grading system with module-based assessments and a final examination. Each module includes quizzes and assignments that prepare you for the final assessment. You need to achieve the required passing score to earn your certificate.'
    },
    {
      id: 'retake-exam',
      category: 'Learning',
      question: 'Can I retake the final exam if I don\'t pass?',
      answer: 'Yes, you can retake the exam. We typically allow up to 3 attempts to pass the final assessment. Each attempt helps you improve your understanding of the material. If you need guidance, our support team can help.'
    },
    {
      id: 'login-issues',
      category: 'Technical',
      question: 'I can\'t log into my account. What should I do?',
      answer: 'First, ensure you\'re using the correct email and password. If you forgot your password, use the "Forgot Password" link on the login page. If issues persist, contact our support team at support@iicar.org or use the live chat on our Support page.'
    },
    {
      id: 'browser-requirements',
      category: 'Technical',
      question: 'What are the technical requirements to access courses?',
      answer: 'Our platform works on all modern browsers (Chrome, Firefox, Safari, Edge). You need a stable internet connection. We recommend a desktop or tablet for optimal learning experience, though mobile access is also available.'
    },
    {
      id: 'mobile-access',
      category: 'Technical',
      question: 'Can I access courses on my mobile phone?',
      answer: 'Yes! All course materials are fully responsive and optimized for mobile devices. However, for the best learning experience and exam-taking, we recommend using a desktop or tablet.'
    },
    {
      id: 'multiple-programs',
      category: 'Programs',
      question: 'Can I enroll in multiple programs at the same time?',
      answer: 'Absolutely! You can enroll in and study multiple programs simultaneously. This allows you to pursue several certifications based on your interests and career goals. Each program is independent and can be done at your own pace.'
    },
    {
      id: 'career-support',
      category: 'Programs',
      question: 'Do you provide career support or job placement?',
      answer: 'While we don\'t directly provide job placement, our certificates significantly enhance your professional profile. We regularly update our programs to align with current job market demands. Consider joining professional networks and leveraging your new credentials with recruiters and employers.'
    },
  ]

  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  return (
    <div className="min-h-screen bg-background py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Find answers to common questions about our programs, payments, and certificates</p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 p-6 bg-card border border-border rounded-lg">
          <p className="text-sm font-semibold text-muted-foreground mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <a
                key={category}
                href={`#${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                {category}
              </a>
            ))}
          </div>
        </div>

        {/* FAQs by Category */}
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category}>
              <h2 id={category.toLowerCase().replace(/\s+/g, '-')} className="text-2xl font-bold text-foreground mb-6">{category}</h2>
              <div className="space-y-4">
                {faqs.filter(faq => faq.category === category).map(faq => (
                  <div
                    key={faq.id}
                    className="border border-border rounded-lg bg-card overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="font-semibold text-foreground text-left">{faq.question}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                          expandedId === faq.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedId === faq.id && (
                      <div className="px-6 py-4 bg-muted/30 border-t border-border">
                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-16 p-8 bg-card border border-border rounded-lg text-center">
          <h3 className="text-xl font-bold text-foreground mb-3">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">Our support team is here to help. Contact us through any of these channels:</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard/support">Live Chat Support</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:support@iicar.org">Email us</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PROGRAMS = [
  { title: 'Certificate in Project Management', description: 'Master the fundamentals of project planning, execution, monitoring and closure using globally recognised frameworks including PMI and PRINCE2. Ideal for professionals stepping into leadership roles.', duration_weeks: 10, level: 'intermediate', price_cents: 1500000, passing_score: 70 },
  { title: 'Diploma in Human Resource Management', description: 'Comprehensive study of recruitment, employee relations, payroll administration, performance management and labour law. Equips HR professionals for modern workplace challenges.', duration_weeks: 16, level: 'intermediate', price_cents: 2000000, passing_score: 70 },
  { title: 'Certificate in Financial Accounting', description: 'Covers the full accounting cycle, financial statement preparation, bookkeeping principles, and interpretation of financial reports for business decision-making.', duration_weeks: 12, level: 'beginner', price_cents: 1200000, passing_score: 70 },
  { title: 'Advanced Diploma in Business Administration', description: 'Strategic business management covering operations, finance, marketing and organisational behaviour. Designed for senior managers and aspiring executives.', duration_weeks: 24, level: 'advanced', price_cents: 3500000, passing_score: 75 },
  { title: 'Certificate in Supply Chain Management', description: 'End-to-end supply chain operations including procurement, logistics, warehousing, inventory control and supplier relationship management.', duration_weeks: 10, level: 'intermediate', price_cents: 1500000, passing_score: 70 },
  { title: 'Certificate in Digital Marketing', description: 'Practical training in SEO, social media marketing, email campaigns, Google Ads, content strategy and analytics for modern businesses.', duration_weeks: 8, level: 'beginner', price_cents: 1000000, passing_score: 65 },
  { title: 'Diploma in Information Technology', description: 'Foundational and intermediate IT skills including networking, cybersecurity basics, database management and cloud computing fundamentals.', duration_weeks: 20, level: 'intermediate', price_cents: 2500000, passing_score: 70 },
  { title: 'Certificate in Customer Service Excellence', description: 'Build world-class customer service skills covering communication, complaint handling, CRM systems and service quality standards.', duration_weeks: 6, level: 'beginner', price_cents: 800000, passing_score: 65 },
  { title: 'Certificate in Public Relations', description: 'Media relations, press release writing, crisis communication, event management and stakeholder engagement for communications professionals.', duration_weeks: 8, level: 'intermediate', price_cents: 1100000, passing_score: 70 },
  { title: 'Diploma in Entrepreneurship & Business Development', description: 'From ideation to market entry: business planning, funding strategies, product development, marketing and scaling a startup in African markets.', duration_weeks: 16, level: 'intermediate', price_cents: 2200000, passing_score: 70 },
  { title: 'Certificate in Data Analysis', description: 'Introduction to data collection, cleaning, visualisation and interpretation using Excel, Google Sheets and basic SQL. No programming experience required.', duration_weeks: 10, level: 'beginner', price_cents: 1300000, passing_score: 70 },
  { title: 'Certificate in Healthcare Administration', description: 'Hospital and clinic management, health policy, medical records, patient experience and healthcare financing for health sector administrators.', duration_weeks: 12, level: 'intermediate', price_cents: 1600000, passing_score: 70 },
  { title: 'Certificate in Early Childhood Education', description: 'Child development theories, curriculum planning, classroom management and assessment strategies for nursery and primary school educators.', duration_weeks: 10, level: 'beginner', price_cents: 1000000, passing_score: 65 },
  { title: 'Diploma in Logistics & Transport Management', description: 'Fleet management, freight forwarding, customs procedures, route optimisation and last-mile delivery management for logistics professionals.', duration_weeks: 18, level: 'intermediate', price_cents: 2200000, passing_score: 70 },
  { title: 'Certificate in Cyber Security Fundamentals', description: 'Network security, threat analysis, ethical hacking basics, data protection laws and incident response procedures for IT professionals.', duration_weeks: 10, level: 'intermediate', price_cents: 1500000, passing_score: 70 },
  { title: 'Certificate in Hotel & Hospitality Management', description: 'Front office operations, food and beverage management, housekeeping, revenue management and guest experience for hospitality professionals.', duration_weeks: 10, level: 'beginner', price_cents: 1200000, passing_score: 65 },
  { title: 'Certificate in Legal Studies', description: 'Introduction to contract law, business law, employment law and dispute resolution mechanisms for non-lawyers in professional environments.', duration_weeks: 12, level: 'intermediate', price_cents: 1400000, passing_score: 70 },
  { title: 'Diploma in Social Work & Community Development', description: 'Case management, community mobilisation, child protection, counselling techniques and NGO programme management.', duration_weeks: 20, level: 'intermediate', price_cents: 2000000, passing_score: 70 },
  { title: 'Certificate in Event Management', description: 'Event planning, budgeting, vendor management, marketing, on-site coordination and post-event evaluation for corporate and social events.', duration_weeks: 8, level: 'beginner', price_cents: 900000, passing_score: 65 },
  { title: 'Certificate in Agricultural Business Management', description: 'Agri-business models, farm financial management, market linkages, value chain development and agricultural policy for agri-entrepreneurs.', duration_weeks: 10, level: 'beginner', price_cents: 1100000, passing_score: 65 },
  { title: 'Advanced Certificate in Strategic Management', description: 'Advanced frameworks for competitive analysis, corporate strategy, change management and strategic decision-making for senior leaders.', duration_weeks: 14, level: 'advanced', price_cents: 2800000, passing_score: 75 },
  { title: 'Certificate in Environmental Management', description: 'Environmental impact assessment, sustainability reporting, waste management, climate change adaptation and green business practices.', duration_weeks: 10, level: 'intermediate', price_cents: 1400000, passing_score: 70 },
  { title: 'Certificate in Sales Management', description: 'Sales strategy, pipeline management, team leadership, negotiation techniques and CRM tools for sales managers and business development officers.', duration_weeks: 8, level: 'intermediate', price_cents: 1200000, passing_score: 70 },
  { title: 'Diploma in Banking & Finance', description: 'Commercial banking operations, credit analysis, treasury management, Islamic banking and financial regulation for banking professionals.', duration_weeks: 20, level: 'intermediate', price_cents: 2500000, passing_score: 75 },
  { title: 'Certificate in Records & Archives Management', description: 'Document lifecycle management, digital recordkeeping, archival science, compliance frameworks and file management systems.', duration_weeks: 8, level: 'beginner', price_cents: 900000, passing_score: 65 },
  { title: 'Certificate in Monitoring & Evaluation', description: 'Designing M&E frameworks, data collection tools, log frames, results-based management and impact reporting for development organisations.', duration_weeks: 10, level: 'intermediate', price_cents: 1400000, passing_score: 70 },
  { title: 'Diploma in Media & Journalism', description: 'News writing, broadcast production, investigative journalism, digital media, media ethics and press freedom for aspiring journalists.', duration_weeks: 18, level: 'intermediate', price_cents: 2200000, passing_score: 70 },
  { title: 'Certificate in Procurement & Contract Management', description: 'Public and private procurement processes, tender evaluation, contract drafting, supplier due diligence and compliance.', duration_weeks: 10, level: 'intermediate', price_cents: 1500000, passing_score: 70 },
  { title: 'Certificate in Insurance & Risk Management', description: 'Insurance products, underwriting, claims management, actuarial basics and enterprise risk frameworks for insurance sector professionals.', duration_weeks: 10, level: 'intermediate', price_cents: 1400000, passing_score: 70 },
  { title: 'Certificate in Leadership & Management', description: 'Leadership styles, team dynamics, emotional intelligence, performance coaching and organisational culture for emerging and established leaders.', duration_weeks: 8, level: 'beginner', price_cents: 1000000, passing_score: 65 },
]

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if programs already exist
    const { count } = await supabase.from('programs').select('id', { count: 'exact', head: true })

    if (count && count >= 30) {
      return NextResponse.json({ message: `Already seeded — ${count} programs exist.` })
    }

    const { data, error } = await supabase
      .from('programs')
      .upsert(PROGRAMS.map(p => ({ ...p, is_published: true })), { onConflict: 'title' })
      .select('id')

    if (error) throw error

    return NextResponse.json({ message: `Successfully seeded ${data?.length ?? 0} programs.` })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

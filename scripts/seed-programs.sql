-- Seed 30 professional certification programs for IICAR
-- Only insert if table is empty to avoid duplicates

INSERT INTO programs (title, description, duration_weeks, level, price_cents, passing_score, is_published)
SELECT * FROM (VALUES
  ('Certificate in Project Management', 'Master the fundamentals of project planning, execution, monitoring and closure using globally recognised frameworks including PMI and PRINCE2. Ideal for professionals stepping into leadership roles.', 10, 'intermediate', 1500000, 70, true),
  ('Diploma in Human Resource Management', 'Comprehensive study of recruitment, employee relations, payroll administration, performance management and labour law. Equips HR professionals for modern workplace challenges.', 16, 'intermediate', 2000000, 70, true),
  ('Certificate in Financial Accounting', 'Covers the full accounting cycle, financial statement preparation, bookkeeping principles, and interpretation of financial reports for business decision-making.', 12, 'beginner', 1200000, 70, true),
  ('Advanced Diploma in Business Administration', 'Strategic business management covering operations, finance, marketing and organisational behaviour. Designed for senior managers and aspiring executives.', 24, 'advanced', 3500000, 75, true),
  ('Certificate in Supply Chain Management', 'End-to-end supply chain operations including procurement, logistics, warehousing, inventory control and supplier relationship management.', 10, 'intermediate', 1500000, 70, true),
  ('Certificate in Digital Marketing', 'Practical training in SEO, social media marketing, email campaigns, Google Ads, content strategy and analytics for modern businesses.', 8, 'beginner', 1000000, 65, true),
  ('Diploma in Information Technology', 'Foundational and intermediate IT skills including networking, cybersecurity basics, database management and cloud computing fundamentals.', 20, 'intermediate', 2500000, 70, true),
  ('Certificate in Customer Service Excellence', 'Build world-class customer service skills covering communication, complaint handling, CRM systems and service quality standards.', 6, 'beginner', 800000, 65, true),
  ('Certificate in Public Relations', 'Media relations, press release writing, crisis communication, event management and stakeholder engagement for communications professionals.', 8, 'intermediate', 1100000, 70, true),
  ('Diploma in Entrepreneurship & Business Development', 'From ideation to market entry: business planning, funding strategies, product development, marketing and scaling a startup in African markets.', 16, 'intermediate', 2200000, 70, true),
  ('Certificate in Data Analysis', 'Introduction to data collection, cleaning, visualisation and interpretation using Excel, Google Sheets and basic SQL. No programming experience required.', 10, 'beginner', 1300000, 70, true),
  ('Certificate in Healthcare Administration', 'Hospital and clinic management, health policy, medical records, patient experience and healthcare financing for health sector administrators.', 12, 'intermediate', 1600000, 70, true),
  ('Certificate in Early Childhood Education', 'Child development theories, curriculum planning, classroom management and assessment strategies for nursery and primary school educators.', 10, 'beginner', 1000000, 65, true),
  ('Diploma in Logistics & Transport Management', 'Fleet management, freight forwarding, customs procedures, route optimisation and last-mile delivery management for logistics professionals.', 18, 'intermediate', 2200000, 70, true),
  ('Certificate in Cyber Security Fundamentals', 'Network security, threat analysis, ethical hacking basics, data protection laws and incident response procedures for IT professionals.', 10, 'intermediate', 1500000, 70, true),
  ('Certificate in Hotel & Hospitality Management', 'Front office operations, food and beverage management, housekeeping, revenue management and guest experience for hospitality professionals.', 10, 'beginner', 1200000, 65, true),
  ('Certificate in Legal Studies', 'Introduction to contract law, business law, employment law and dispute resolution mechanisms for non-lawyers in professional environments.', 12, 'intermediate', 1400000, 70, true),
  ('Diploma in Social Work & Community Development', 'Case management, community mobilisation, child protection, counselling techniques and NGO programme management.', 20, 'intermediate', 2000000, 70, true),
  ('Certificate in Event Management', 'Event planning, budgeting, vendor management, marketing, on-site coordination and post-event evaluation for corporate and social events.', 8, 'beginner', 900000, 65, true),
  ('Certificate in Agricultural Business Management', 'Agri-business models, farm financial management, market linkages, value chain development and agricultural policy for agri-entrepreneurs.', 10, 'beginner', 1100000, 65, true),
  ('Advanced Certificate in Strategic Management', 'Advanced frameworks for competitive analysis, corporate strategy, change management and strategic decision-making for senior leaders.', 14, 'advanced', 2800000, 75, true),
  ('Certificate in Environmental Management', 'Environmental impact assessment, sustainability reporting, waste management, climate change adaptation and green business practices.', 10, 'intermediate', 1400000, 70, true),
  ('Certificate in Sales Management', 'Sales strategy, pipeline management, team leadership, negotiation techniques and CRM tools for sales managers and business development officers.', 8, 'intermediate', 1200000, 70, true),
  ('Diploma in Banking & Finance', 'Commercial banking operations, credit analysis, treasury management, Islamic banking and financial regulation for banking professionals.', 20, 'intermediate', 2500000, 75, true),
  ('Certificate in Records & Archives Management', 'Document lifecycle management, digital recordkeeping, archival science, compliance frameworks and file management systems.', 8, 'beginner', 900000, 65, true),
  ('Certificate in Monitoring & Evaluation', 'Designing M&E frameworks, data collection tools, log frames, results-based management and impact reporting for development organisations.', 10, 'intermediate', 1400000, 70, true),
  ('Diploma in Media & Journalism', 'News writing, broadcast production, investigative journalism, digital media, media ethics and press freedom for aspiring journalists.', 18, 'intermediate', 2200000, 70, true),
  ('Certificate in Procurement & Contract Management', 'Public and private procurement processes, tender evaluation, contract drafting, supplier due diligence and compliance.', 10, 'intermediate', 1500000, 70, true),
  ('Certificate in Insurance & Risk Management', 'Insurance products, underwriting, claims management, actuarial basics and enterprise risk frameworks for insurance sector professionals.', 10, 'intermediate', 1400000, 70, true),
  ('Certificate in Leadership & Management', 'Leadership styles, team dynamics, emotional intelligence, performance coaching and organisational culture for emerging and established leaders.', 8, 'beginner', 1000000, 65, true)
) AS v(title, description, duration_weeks, level, price_cents, passing_score, is_published)
WHERE NOT EXISTS (SELECT 1 FROM programs LIMIT 1);

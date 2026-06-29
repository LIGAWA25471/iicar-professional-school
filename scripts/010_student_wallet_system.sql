-- Student Wallet System Tables

-- Create student_wallets table
CREATE TABLE IF NOT EXISTS student_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  total_credited_cents BIGINT NOT NULL DEFAULT 0,
  total_spent_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES student_wallets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'credit' or 'debit'
  amount_cents BIGINT NOT NULL,
  description TEXT,
  reference_id UUID, -- Links to payments, enrollments, etc.
  reference_type VARCHAR(50), -- 'topup', 'enrollment', 'admin_credit', 'admin_debit'
  balance_after_cents BIGINT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For admin actions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_cost_cents BIGINT NOT NULL,
  installments INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payment_plan_installments table
CREATE TABLE IF NOT EXISTS payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  amount_cents BIGINT NOT NULL,
  due_date DATE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create student_payment_plans table
CREATE TABLE IF NOT EXISTS student_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  total_amount_cents BIGINT NOT NULL,
  amount_paid_cents BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'defaulted'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create wallet_topup_orders table for tracking topup payments
CREATE TABLE IF NOT EXISTS wallet_topup_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  paystack_reference VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_student_wallets_student_id ON student_wallets(student_id);
CREATE INDEX idx_wallet_transactions_student_id ON wallet_transactions(student_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_payment_plans_program_id ON payment_plans(program_id);
CREATE INDEX idx_student_payment_plans_student_id ON student_payment_plans(student_id);
CREATE INDEX idx_student_payment_plans_enrollment_id ON student_payment_plans(enrollment_id);
CREATE INDEX idx_wallet_topup_orders_student_id ON wallet_topup_orders(student_id);

-- Enable RLS (Row Level Security)
ALTER TABLE student_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_topup_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_wallets
CREATE POLICY "Students can view own wallet"
  ON student_wallets FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Only admin can update wallet balance"
  ON student_wallets FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for wallet_transactions
CREATE POLICY "Students can view own transactions"
  ON wallet_transactions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for payment_plans (public read)
CREATE POLICY "Everyone can view payment plans"
  ON payment_plans FOR SELECT
  USING (is_active = TRUE);

-- RLS Policies for student_payment_plans
CREATE POLICY "Students can view own payment plans"
  ON student_payment_plans FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can create payment plans"
  ON student_payment_plans FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for wallet_topup_orders
CREATE POLICY "Students can view own topup orders"
  ON wallet_topup_orders FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create topup orders"
  ON wallet_topup_orders FOR INSERT
  WITH CHECK (student_id = auth.uid());

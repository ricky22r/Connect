-- ================================================================
-- CONNECT PRO - UPDATED DATABASE SETUP
-- ADD THESE TABLES FOR EXPENSE BUDGET MANAGEMENT
-- Run in Supabase SQL Editor
-- ================================================================

-- 1. Employee Budgets Table
CREATE TABLE IF NOT EXISTS public.employee_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_budget DECIMAL(12,2) NOT NULL DEFAULT 50000,
  reimbursement_rate_per_km DECIMAL(8,2) NOT NULL DEFAULT 5,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('conveyance', 'travel', 'meals', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  distance_km DECIMAL(8,2),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.employee_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_budgets
CREATE POLICY "p_budgets_admin_read" ON public.employee_budgets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "p_budgets_admin_write" ON public.employee_budgets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "p_budgets_admin_update" ON public.employee_budgets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "p_budgets_admin_delete" ON public.employee_budgets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for expenses
CREATE POLICY "p_expenses_select" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "p_expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "p_expenses_update" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "p_expenses_delete" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_budgets_employee_id ON public.employee_budgets(employee_id);

-- Trigger to update spent_amount in employee_budgets
CREATE OR REPLACE FUNCTION public.update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.employee_budgets
  SET spent_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.expenses
    WHERE user_id = NEW.user_id AND status = 'approved'
  )
  WHERE employee_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_budget_spent ON public.expenses;
CREATE TRIGGER trg_update_budget_spent
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_budget_spent_amount();

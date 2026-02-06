-- Create enum for admin roles
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'state_admin');

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  state VARCHAR(255), -- Required for state_admin role
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_state ON public.admins(state);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
-- Super admin can do everything
CREATE POLICY "Super admin full access" ON public.admins
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()::uuid AND role = 'super_admin'
  )
);

-- Admin can read all admins but can only update/delete non-super admins
CREATE POLICY "Admin read access" ON public.admins
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()::uuid AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin update access" ON public.admins
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid()::uuid 
    AND a.role = 'admin'
    AND public.admins.role != 'super_admin'
  )
);

-- State admin can only read their own profile
CREATE POLICY "State admin self access" ON public.admins
FOR SELECT USING (
  id = auth.uid()::uuid AND role = 'state_admin'
);

-- Any admin can update their own profile
CREATE POLICY "Admin update self" ON public.admins
FOR UPDATE USING (id = auth.uid()::uuid);

-- Update applications table for admin access
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public to check email existence" ON public.applications;
DROP POLICY IF EXISTS "Allow public to insert applications" ON public.applications;
DROP POLICY IF EXISTS "Allow update by email" ON public.applications;

-- Recreate policies with admin access
-- Allow anyone to check if email exists
CREATE POLICY "Allow public to check email existence" ON public.applications
FOR SELECT USING (TRUE);

-- Allow anyone to insert applications
CREATE POLICY "Allow public to insert applications" ON public.applications
FOR INSERT WITH CHECK (TRUE);

-- Allow updates to own submission (by email)
CREATE POLICY "Allow update by email" ON public.applications
FOR UPDATE USING (TRUE);

-- Super admin and admin can view all applications
CREATE POLICY "Admin full access to applications" ON public.applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()::uuid 
    AND role IN ('super_admin', 'admin')
  )
);

-- State admin can only view applications from their state
CREATE POLICY "State admin view own state applications" ON public.applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.id = auth.uid()::uuid 
    AND a.role = 'state_admin'
    AND a.state = public.applications.state_of_residence
  )
);

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admin and admin can view audit logs
CREATE POLICY "Admin view audit logs" ON public.admin_audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()::uuid 
    AND role IN ('super_admin', 'admin')
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admins table
CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for applications table
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

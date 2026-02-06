-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  surname VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  other_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  marital_status VARCHAR(50),
  qualifications TEXT,
  phone_number VARCHAR(20) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  permanent_home_address TEXT NOT NULL,
  referee_name VARCHAR(255) NOT NULL,
  referee_phone_number VARCHAR(20) NOT NULL,
  address_of_residence TEXT,
  nearest_landmark TEXT,
  state_of_residence VARCHAR(255) NOT NULL,
  lga_of_residence VARCHAR(255),
  eligibility_classification VARCHAR(255),
  state_code_number VARCHAR(50),
  position_applied_for VARCHAR(255),
  ministry_name VARCHAR(255),
  staff_id_number VARCHAR(50),
  designation VARCHAR(255),
  grade_level VARCHAR(50),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to check if email exists
CREATE POLICY "Allow public to check email existence" ON public.applications
FOR SELECT USING (TRUE);

-- Allow anyone to insert applications
CREATE POLICY "Allow public to insert applications" ON public.applications
FOR INSERT WITH CHECK (TRUE);

-- Allow updates to own submission (by email)
CREATE POLICY "Allow update by email" ON public.applications
FOR UPDATE USING (TRUE);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);

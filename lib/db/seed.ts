/**
 * Database seeding utility that runs automatically on app startup
 * This ensures the super admin exists without manual intervention
 */

import { createClient } from '@supabase/supabase-js'

let isSeeded = false

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 10)
}

export async function seedDatabase() {
  // Only run once per app lifecycle
  if (isSeeded) {
    return
  }

  // Only run in development or if explicitly enabled
  const shouldSeed = process.env.AUTO_SEED === 'true' || process.env.NODE_ENV === 'development'
  
  if (!shouldSeed) {
    return
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️  Missing Supabase credentials for auto-seeding')
      return
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if super admin already exists
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', 'superadmin@admin.com')
      .single()

    if (existing) {
      console.log('✅ Super admin already exists')
      isSeeded = true
      return
    }

    // Create super admin with default credentials
    const password = 'Password@001'
    const passwordHash = await hashPassword(password)

    const { data, error } = await supabase
      .from('admins')
      .insert({
        email: 'superadmin@admin.com',
        password_hash: passwordHash,
        role: 'super_admin',
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error seeding super admin:', error)
      return
    }

    console.log('✅ Super admin created successfully!')
    console.log('\n📧 Login credentials:')
    console.log(`   Email: superadmin@admin.com`)
    console.log(`   Password: ${password}`)
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!\n')

    isSeeded = true
  } catch (error) {
    console.error('❌ Error during database seeding:', error)
  }
}

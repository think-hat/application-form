import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Insert application data into Supabase
    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          email: body.email,
          surname: body.surname,
          first_name: body.firstName,
          other_name: body.otherName,
          date_of_birth: body.dateOfBirth,
          gender: body.gender,
          marital_status: body.maritalStatus,
          qualifications: body.qualifications,
          phone_number: body.phoneNumber,
          bank_name: body.bankName,
          account_name: body.accountName,
          account_number: body.accountNumber,
          permanent_home_address: body.permanentHomeAddress,
          referee_name: body.refereeName,
          referee_phone_number: body.refereePhoneNumber,
          address_of_residence: body.addressOfResidence,
          nearest_landmark: body.nearestLandmark,
          state_of_residence: body.stateOfResidence,
          lga_of_residence: body.lgaOfResidence,
          eligibility_classification: body.eligibilityClassification,
          state_code_number: body.stateCodeNumber,
          position_applied_for: body.positionAppliedFor,
          ministry_name: body.ministryName,
          staff_id_number: body.staffIdNumber,
          designation: body.designation,
          grade_level: body.gradeLevel,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to submit application' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data, success: true },
      { status: 201 }
    )
  } catch (err) {
    console.error('[v0] Submission error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

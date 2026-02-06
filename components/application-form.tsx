'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface FormErrors {
  [key: string]: string
}

interface FormData {
  surname: string
  firstName: string
  otherName: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  qualifications: string
  email: string
  phoneNumber: string
  bankName: string
  accountName: string
  accountNumber: string
  permanentHomeAddress: string
  refereeName: string
  refereePhoneNumber: string
  addressOfResidence: string
  nearestLandmark: string
  stateOfResidence: string
  lgaOfResidence: string
  eligibilityClassification: string
  stateCodeNumber: string
  positionAppliedFor: string
  ministryName: string
  staffIdNumber: string
  designation: string
  gradeLevel: string
}

interface ApplicationFormProps {
  prefillEmail?: string
  readonlyEmail?: boolean
}

export function ApplicationForm({ prefillEmail = '', readonlyEmail = false }: ApplicationFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    surname: '',
    firstName: '',
    otherName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    qualifications: '',
    email: '',
    phoneNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    permanentHomeAddress: '',
    refereeName: '',
    refereePhoneNumber: '',
    addressOfResidence: '',
    nearestLandmark: '',
    stateOfResidence: '',
    lgaOfResidence: '',
    eligibilityClassification: '',
    stateCodeNumber: '',
    positionAppliedFor: '',
    ministryName: '',
    staffIdNumber: '',
    designation: '',
    gradeLevel: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Update email field after client-side mount to prevent hydration mismatch
  useEffect(() => {
    if (prefillEmail) {
      setFormData((prev) => ({ ...prev, email: prefillEmail }))
    }
    setIsMounted(true)
  }, [prefillEmail])

  const requiredFields = [
    'phoneNumber',
    'bankName',
    'accountName',
    'accountNumber',
    'permanentHomeAddress',
    'refereeName',
    'refereePhoneNumber',
    'nearestLandmark',
    'stateOfResidence',
    'lgaOfResidence',
    'eligibilityClassification',
    'stateCodeNumber',
    'positionAppliedFor',
    'email',
  ]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phoneNumber || !/^\d{10,}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'This field is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      console.log('[v0] Application submitted successfully')
      setSubmitted(true)

      // Redirect to success page after 1.5 seconds
      setTimeout(() => {
        router.push('/success')
      }, 1500)
    } catch (error) {
      console.error('[v0] Submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application'
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Submission Successful!</h2>
                <p className="text-sm text-muted-foreground">
                  Your application has been received. We will review your information and contact you shortly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl">Application Form</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Please fill out all required fields marked with an asterisk (*)
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {errors.submit && (
            <Alert className="mb-6 border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{errors.submit}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <FormSection title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Surname"
                  name="surname"
                  type="text"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Enter your surname"
                />
                <FormField
                  label="First Name"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
                <FormField
                  label="Other Name"
                  name="otherName"
                  type="text"
                  value={formData.otherName}
                  onChange={handleInputChange}
                  placeholder="Enter other names (if any)"
                />
                <FormField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  placeholder="Select date"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormSelect
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={[{ value: '', label: 'Select Gender' }, { value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]}
                />
                <FormSelect
                  label="Marital Status"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  options={[
                    { value: '', label: 'Select Status' },
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' },
                  ]}
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Qualifications"
                    name="qualifications"
                    type="text"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    placeholder="List your educational qualifications"
                  />
                </div>
              </div>
            </FormSection>

            {/* Contact Information Section */}
            <FormSection title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Email Address *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={readonlyEmail ? undefined : handleInputChange}
                  placeholder="your.email@example.com"
                  error={errors.email}
                  disabled={readonlyEmail}
                  required
                />
                <FormField
                  label="Phone Number *"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  error={errors.phoneNumber}
                  required
                />
              </div>
            </FormSection>

            {/* Banking Information Section */}
            <FormSection title="Banking Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Bank Name *"
                  name="bankName"
                  type="text"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Enter your bank name"
                  error={errors.bankName}
                  required
                />
                <FormField
                  label="Account Name *"
                  name="accountName"
                  type="text"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="Enter account holder name"
                  error={errors.accountName}
                  required
                />
                <FormField
                  label="Account Number *"
                  name="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your account number"
                  error={errors.accountNumber}
                  required
                />
              </div>
            </FormSection>

            {/* Address Information Section */}
            <FormSection title="Address Information">
              <div className="space-y-4">
                <FormField
                  label="Permanent Home Address *"
                  name="permanentHomeAddress"
                  type="text"
                  value={formData.permanentHomeAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your permanent home address"
                  error={errors.permanentHomeAddress}
                  required
                />
                <FormField
                  label="Address of Residence"
                  name="addressOfResidence"
                  type="text"
                  value={formData.addressOfResidence}
                  onChange={handleInputChange}
                  placeholder="Enter your current residential address"
                />
                <FormField
                  label="Nearest Landmark *"
                  name="nearestLandmark"
                  type="text"
                  value={formData.nearestLandmark}
                  onChange={handleInputChange}
                  placeholder="Describe nearest landmark"
                  error={errors.nearestLandmark}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormSelect
                  label="State of Residence/NYSC Deployment *"
                  name="stateOfResidence"
                  value={formData.stateOfResidence}
                  onChange={handleInputChange}
                  error={errors.stateOfResidence}
                  options={[
                    { value: '', label: 'Select State' },
                    { value: 'Abia', label: 'Abia' },
                    { value: 'Adamawa', label: 'Adamawa' },
                    { value: 'Akwa Ibom', label: 'Akwa Ibom' },
                    { value: 'Anambra', label: 'Anambra' },
                    { value: 'Bauchi', label: 'Bauchi' },
                    { value: 'Bayelsa', label: 'Bayelsa' },
                    { value: 'Borno', label: 'Borno' },
                    { value: 'Cross River', label: 'Cross River' },
                    { value: 'Delta', label: 'Delta' },
                    { value: 'Ebonyi', label: 'Ebonyi' },
                    { value: 'Edo', label: 'Edo' },
                    { value: 'Ekiti', label: 'Ekiti' },
                    { value: 'Enugu', label: 'Enugu' },
                    { value: 'FCT', label: 'Federal Capital Territory (FCT)' },
                    { value: 'Gombe', label: 'Gombe' },
                    { value: 'Imo', label: 'Imo' },
                    { value: 'Jigawa', label: 'Jigawa' },
                    { value: 'Kaduna', label: 'Kaduna' },
                    { value: 'Kano', label: 'Kano' },
                    { value: 'Katsina', label: 'Katsina' },
                    { value: 'Kebbi', label: 'Kebbi' },
                    { value: 'Kogi', label: 'Kogi' },
                    { value: 'Kwara', label: 'Kwara' },
                    { value: 'Lagos', label: 'Lagos' },
                    { value: 'Nasarawa', label: 'Nasarawa' },
                    { value: 'Niger', label: 'Niger' },
                    { value: 'Ogun', label: 'Ogun' },
                    { value: 'Ondo', label: 'Ondo' },
                    { value: 'Osun', label: 'Osun' },
                    { value: 'Oyo', label: 'Oyo' },
                    { value: 'Plateau', label: 'Plateau' },
                    { value: 'Rivers', label: 'Rivers' },
                    { value: 'Sokoto', label: 'Sokoto' },
                    { value: 'Taraba', label: 'Taraba' },
                    { value: 'Yobe', label: 'Yobe' },
                    { value: 'Zamfara', label: 'Zamfara' },
                  ]}
                  required
                />
                <FormField
                  label="LGA of Residence *"
                  name="lgaOfResidence"
                  type="text"
                  value={formData.lgaOfResidence}
                  onChange={handleInputChange}
                  placeholder="Enter Local Government Area"
                  error={errors.lgaOfResidence}
                  required
                />
              </div>
            </FormSection>

            {/* Referee Information Section */}
            <FormSection title="Referee Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Referee Name *"
                  name="refereeName"
                  type="text"
                  value={formData.refereeName}
                  onChange={handleInputChange}
                  placeholder="Enter referee full name"
                  error={errors.refereeName}
                  required
                />
                <FormField
                  label="Referee Phone Number *"
                  name="refereePhoneNumber"
                  type="tel"
                  value={formData.refereePhoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter referee phone number"
                  error={errors.refereePhoneNumber}
                  required
                />
              </div>
            </FormSection>

            {/* Employment Information Section */}
            <FormSection title="Employment Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Position Applied For *"
                  name="positionAppliedFor"
                  type="text"
                  value={formData.positionAppliedFor}
                  onChange={handleInputChange}
                  placeholder="Enter position title"
                  error={errors.positionAppliedFor}
                  required
                />
                <FormField
                  label="Name of Federal Ministry/Department/Agency"
                  name="ministryName"
                  type="text"
                  value={formData.ministryName}
                  onChange={handleInputChange}
                  placeholder="Enter ministry or agency name"
                />
                <FormField
                  label="Staff ID Number"
                  name="staffIdNumber"
                  type="text"
                  value={formData.staffIdNumber}
                  onChange={handleInputChange}
                  placeholder="Enter staff ID (if applicable)"
                />
                <FormField
                  label="Designation"
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Enter current designation"
                />
                <FormField
                  label="Grade Level"
                  name="gradeLevel"
                  type="text"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  placeholder="Enter grade level"
                />
                <FormField
                  label="State Code Number/Student ID Number *"
                  name="stateCodeNumber"
                  type="text"
                  value={formData.stateCodeNumber}
                  onChange={handleInputChange}
                  placeholder="Enter code or ID number"
                  error={errors.stateCodeNumber}
                  required
                />
              </div>

              <div className="mt-4">
                <FormField
                  label="Eligibility Classification *"
                  name="eligibilityClassification"
                  type="text"
                  value={formData.eligibilityClassification}
                  onChange={handleInputChange}
                  placeholder="e.g., Graduate, Diploma, HND"
                  error={errors.eligibilityClassification}
                  required
                />
              </div>
            </FormSection>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                type="reset"
                variant="outline"
                className="flex-1 h-11 bg-transparent"
                onClick={() => {
                  setFormData({
                    surname: '',
                    firstName: '',
                    otherName: '',
                    dateOfBirth: '',
                    gender: '',
                    maritalStatus: '',
                    qualifications: '',
                    email: '',
                    phoneNumber: '',
                    bankName: '',
                    accountName: '',
                    accountNumber: '',
                    permanentHomeAddress: '',
                    refereeName: '',
                    refereePhoneNumber: '',
                    addressOfResidence: '',
                    nearestLandmark: '',
                    stateOfResidence: '',
                    lgaOfResidence: '',
                    eligibilityClassification: '',
                    stateCodeNumber: '',
                    positionAppliedFor: '',
                    ministryName: '',
                    staffIdNumber: '',
                    designation: '',
                    gradeLevel: '',
                  })
                  setErrors({})
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b-2 border-primary/20">{title}</h2>
      {children}
    </div>
  )
}

interface FormFieldProps {
  label: string
  name: string
  type: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

function FormField({ label, name, type, value, onChange, placeholder, error, required, disabled }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`border ${error ? 'border-red-500 focus:ring-red-500' : 'border-border'} rounded-md px-3 py-2 text-sm ${disabled ? 'bg-muted opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <div className="flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  error?: string
  required?: boolean
}

function FormSelect({ label, name, value, onChange, options, error, required }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border ${error ? 'border-red-500 focus:ring-red-500' : 'border-border'} rounded-md px-3 py-2 text-sm bg-background text-foreground cursor-pointer`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </div>
  )
}

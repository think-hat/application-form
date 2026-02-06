'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Eye, Trash2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import * as XLSX from 'xlsx'

interface Application {
  id: string
  email: string
  surname: string
  first_name: string
  other_name?: string
  phone_number: string
  state_of_residence: string
  lga_of_residence?: string
  position_applied_for?: string
  created_at: string
  date_of_birth?: string
  gender?: string
  marital_status?: string
  qualifications?: string
  bank_name?: string
  account_name?: string
  account_number?: string
  permanent_home_address?: string
  referee_name?: string
  referee_phone_number?: string
  address_of_residence?: string
  nearest_landmark?: string
  eligibility_classification?: string
  state_code_number?: string
  ministry_name?: string
  staff_id_number?: string
  designation?: string
  grade_level?: string
}

export default function ApplicationsPage() {
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search
      })

      const response = await fetch(`/api/admin/applications?${params}`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data.applications)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch applications',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching applications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchApplications()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchApplications()
  }, [page])

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app)
    setDetailsDialogOpen(true)
  }

  const handleExportToExcel = () => {
    try {
      setExporting(true)
      
      // Map applications to Excel format with proper labels
      const exportData = applications.map(app => ({
        'Surname': app.surname || '',
        'First Name': app.first_name || '',
        'Other Name': app.other_name || '',
        'Date of Birth': app.date_of_birth || '',
        'Gender': app.gender || '',
        'Marital Status': app.marital_status || '',
        'Qualifications': app.qualifications || '',
        'Email Address': app.email || '',
        'Phone Number': app.phone_number || '',
        'Bank Name': app.bank_name || '',
        'Account Name': app.account_name || '',
        'Account Number': app.account_number || '',
        'Permanent Home Address': app.permanent_home_address || '',
        'Referee Name': app.referee_name || '',
        'Referee Phone Number': app.referee_phone_number || '',
        'Address of Residence': app.address_of_residence || '',
        'Nearest Landmark': app.nearest_landmark || '',
        'State of Residence/NYSC Deployment': app.state_of_residence || '',
        'LGA of Residence': app.lga_of_residence || '',
        'Eligibility Classification': app.eligibility_classification || '',
        'State Code Number/Student ID Number': app.state_code_number || '',
        'Position Applied For': app.position_applied_for || '',
        'Name of Federal Ministry/Department/Agency': app.ministry_name || '',
        'Staff ID Number': app.staff_id_number || '',
        'Designation': app.designation || '',
        'Grade Level': app.grade_level || '',
        'Submitted Date': new Date(app.created_at).toLocaleString()
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Applications')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `applications_${timestamp}.xlsx`

      // Download file
      XLSX.writeFile(wb, filename)

      toast({
        title: 'Success',
        description: 'Applications exported successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export applications',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAppId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/applications/${selectedAppId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Application deleted successfully'
        })
        fetchApplications()
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete application',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the application',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedAppId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage all submitted applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>
                View and manage application submissions
              </CardDescription>
            </div>
            <Button
              onClick={handleExportToExcel}
              disabled={exporting || applications.length === 0}
              variant="outline"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : applications.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.surname} {app.first_name} {app.other_name}
                        </TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell>{app.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.state_of_residence}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {app.position_applied_for || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(app)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAppId(app.id)
                                setDeleteDialogOpen(true)
                              }}
                              title="Delete application"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">
              No applications found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedApp?.surname} {selectedApp?.first_name}
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Surname" value={selectedApp.surname} />
                  <DetailField label="First Name" value={selectedApp.first_name} />
                  <DetailField label="Other Name" value={selectedApp.other_name} />
                  <DetailField label="Date of Birth" value={selectedApp.date_of_birth} />
                  <DetailField label="Gender" value={selectedApp.gender} />
                  <DetailField label="Marital Status" value={selectedApp.marital_status} />
                  <div className="md:col-span-2">
                    <DetailField label="Qualifications" value={selectedApp.qualifications} />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Email Address" value={selectedApp.email} />
                  <DetailField label="Phone Number" value={selectedApp.phone_number} />
                </div>
              </div>

              {/* Banking Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Bank Name" value={selectedApp.bank_name} />
                  <DetailField label="Account Name" value={selectedApp.account_name} />
                  <DetailField label="Account Number" value={selectedApp.account_number} />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <DetailField label="Permanent Home Address" value={selectedApp.permanent_home_address} />
                  </div>
                  <div className="md:col-span-2">
                    <DetailField label="Address of Residence" value={selectedApp.address_of_residence} />
                  </div>
                  <div className="md:col-span-2">
                    <DetailField label="Nearest Landmark" value={selectedApp.nearest_landmark} />
                  </div>
                  <DetailField label="State of Residence" value={selectedApp.state_of_residence} />
                  <DetailField label="LGA of Residence" value={selectedApp.lga_of_residence} />
                </div>
              </div>

              {/* Referee Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Referee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Referee Name" value={selectedApp.referee_name} />
                  <DetailField label="Referee Phone Number" value={selectedApp.referee_phone_number} />
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Position Applied For" value={selectedApp.position_applied_for} />
                  <DetailField label="Ministry/Department/Agency" value={selectedApp.ministry_name} />
                  <DetailField label="Staff ID Number" value={selectedApp.staff_id_number} />
                  <DetailField label="Designation" value={selectedApp.designation} />
                  <DetailField label="Grade Level" value={selectedApp.grade_level} />
                  <DetailField label="State Code Number" value={selectedApp.state_code_number} />
                  <div className="md:col-span-2">
                    <DetailField label="Eligibility Classification" value={selectedApp.eligibility_classification} />
                  </div>
                </div>
              </div>

              {/* Submission Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Submission Information</h3>
                <DetailField 
                  label="Submitted At" 
                  value={new Date(selectedApp.created_at).toLocaleString()}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface DetailFieldProps {
  label: string
  value?: string
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-sm text-foreground">{value || 'N/A'}</p>
    </div>
  )
}

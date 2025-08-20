'use client'


import { Button } from '@/components/ui/button'

interface RosterShift {
  id: string
  employeeName: string
  role: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed'
}

// Sample roster data for a single day
const sampleDayShifts: RosterShift[] = [
  {
    id: '1',
    employeeName: 'John Smith',
    role: 'Taking Orders',
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed'
  },
  {
    id: '1b',
    employeeName: 'Emma Thompson',
    role: 'Taking Orders',
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed'
  },
  {
    id: '2',
    employeeName: 'Sarah Johnson',
    role: 'Dish Washing',
    startTime: '10:00',
    endTime: '18:00',
    status: 'scheduled'
  },
  {
    id: '3',
    employeeName: 'Mike Davis',
    role: 'Food Preparation',
    startTime: '08:00',
    endTime: '16:00',
    status: 'confirmed'
  },
  {
    id: '4',
    employeeName: 'Lisa Wilson',
    role: 'Cleaning',
    startTime: '14:00',
    endTime: '22:00',
    status: 'scheduled'
  }
]

// Generate time slots from 6 AM to 11 PM (18 hours)
const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6
  return hour < 24 ? `${hour.toString().padStart(2, '0')}:00` : `${(hour - 24).toString().padStart(2, '0')}:00`
})



export function RosterDisplay() {
  const currentDate = new Date()
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })

  // Group shifts by role
  const shiftsByRole = sampleDayShifts.reduce((acc, shift) => {
    if (!acc[shift.role]) {
      acc[shift.role] = []
    }
    acc[shift.role].push(shift)
    return acc
  }, {} as Record<string, RosterShift[]>)

  const uniqueRoles = Object.keys(shiftsByRole)

  return (
    <div className="space-y-4">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dayName}, {dateString}</h2>
          <p className="text-sm text-muted-foreground">{sampleDayShifts.length} employees scheduled</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            ← Previous Day
          </Button>
          <Button variant="outline" size="sm">
            Next Day →
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="outline" size="sm" title="Export Today's Schedule">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" title="Print Schedule">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" title="Share with Team">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
              {/* Header Row with Job Roles */}
              <div className="flex border-b border-border">
                <div className="w-20 flex-shrink-0 py-2 px-2 font-medium text-xs border-r border-border bg-muted/30">
                  Time
                </div>
                {uniqueRoles.map((role) => (
                  <div 
                    key={role}
                    className="flex-1 py-1 px-2 text-center text-xs font-medium border-r border-border bg-muted/20"
                  >
                    <div className="font-medium">{role}</div>
                  </div>
                ))}
              </div>

              {/* Grid Container */}
              <div className="relative">
                {/* Time Rows Background */}
                {timeSlots.map((time) => (
                  <div key={time} className="flex border-b border-border hover:bg-muted/20">
                    {/* Time Info Column */}
                    <div className="w-20 flex-shrink-0 py-1 px-2 border-r border-border bg-muted/10">
                      <div className="font-medium text-xs">{time}</div>
                    </div>

                    {/* Empty Grid Columns for positioning */}
                    {uniqueRoles.map((role) => (
                      <div 
                        key={role}
                        className="flex-1 border-r border-border/30 h-8"
                      />
                    ))}
                  </div>
                ))}

                {/* Shift Blocks - Positioned Absolutely */}
                {uniqueRoles.map((role, roleIndex) => {
                  const roleShifts = shiftsByRole[role]
                  
                  return roleShifts.map((shift, employeeIndex) => {
                    const shiftStartHour = parseInt(shift.startTime.split(':')[0])
                    const shiftEndHour = parseInt(shift.endTime.split(':')[0])
                    
                    // Handle overnight shifts
                    let adjustedEndHour = shiftEndHour
                    if (shiftEndHour < shiftStartHour) {
                      adjustedEndHour = shiftEndHour + 24
                    }
                    
                    // Calculate position and height
                    const startRowIndex = shiftStartHour - 6 // 6 AM is index 0
                    const endRowIndex = adjustedEndHour - 6
                    const totalRows = timeSlots.length
                    
                    // Only show if shift is within our time range
                    if (startRowIndex < 0 || startRowIndex >= totalRows) return null
                    
                    const top = `calc(${(startRowIndex / totalRows) * 100}% + 2px)`
                    const height = `calc(${((endRowIndex - startRowIndex) / totalRows) * 100}% - 4px)`
                    const columnWidth = `calc((100% - 80px) / ${uniqueRoles.length})`
                    
                    // Position employees side by side within their role column
                    const employeesInRole = roleShifts.length
                    const employeeWidth = `calc(${columnWidth} / ${employeesInRole} - 8px)`
                    const left = `calc(80px + ${columnWidth} * ${roleIndex} + ${employeeWidth} * ${employeeIndex} + 4px + ${4 * employeeIndex}px)`
                    
                    return (
                      <div
                        key={shift.id}
                        className="absolute bg-primary/20 border border-primary/30 rounded-md shadow-sm flex items-center justify-center"
                        style={{
                          top,
                          height,
                          left,
                          width: employeeWidth,
                          zIndex: 10
                        }}
                      >
                        <div className="text-xs font-medium text-primary text-center p-1">
                          <div className="text-xs">{shift.employeeName}</div>
                          <div className="text-xs opacity-75">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </div>
                      </div>
                    )
                  })
                }).flat()}
              </div>
            </div>
          </div>


    </div>
  )
}

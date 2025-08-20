'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import type { CompanyFunctionView, EmployeeFunctionView } from '@/types/database'

interface RosterShift {
  id: string
  employeeName: string
  role: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed'
  functionColor?: string
}

interface RosterDisplayProps {
  companyId: string
}

export function RosterDisplay({ companyId }: RosterDisplayProps) {
  const [functions, setFunctions] = useState<CompanyFunctionView[]>([])
  const [employees, setEmployees] = useState<EmployeeFunctionView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shifts, setShifts] = useState<RosterShift[]>([])

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [functionsData, employeesData] = await Promise.all([
        CompanyFunctionsService.getCompanyFunctions(companyId),
        CompanyFunctionsService.getAllEmployeesWithFunctions(companyId),
      ])
      setFunctions(functionsData)
      setEmployees(employeesData)
      
      // Generate sample shifts based on real functions and employees
      generateSampleShifts(functionsData, employeesData)
    } catch (error) {
      console.error('Error loading roster data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSampleShifts = (functionsData: CompanyFunctionView[], employeesData: EmployeeFunctionView[]) => {
    if (functionsData.length === 0 || employeesData.length === 0) return

    const sampleShifts: RosterShift[] = []
    let shiftId = 1

    // Generate shifts for each function
    functionsData.forEach((func) => {
      const employeesInFunction = employeesData.filter(emp => emp.function_id === func.id)
      
      if (employeesInFunction.length > 0) {
        // Create shifts for employees in this function
        employeesInFunction.forEach((employee, index) => {
          const startHour = 6 + (index * 2) // Stagger start times
          const endHour = startHour + 8 // 8-hour shifts
          
          sampleShifts.push({
            id: shiftId.toString(),
            employeeName: `${employee.first_name} ${employee.last_name}`,
            role: func.name,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            status: index % 2 === 0 ? 'confirmed' : 'scheduled',
            functionColor: func.color,
          })
          shiftId++
        })
      }
    })

    setShifts(sampleShifts)
  }

  // Generate time slots from 6 AM to 11 PM (18 hours)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6
    return hour < 24 ? `${hour.toString().padStart(2, '0')}:00` : `${(hour - 24).toString().padStart(2, '0')}:00`
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading roster...</div>
      </div>
    )
  }

  if (functions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          No company functions created yet. Company owners need to create functions first.
        </div>
        <div className="text-sm text-muted-foreground">
          Functions like &quot;Dish Washing&quot;, &quot;Food Preparation&quot;, etc. need to be created before employees can be scheduled.
        </div>
      </div>
    )
  }

  const currentDate = new Date()
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })

  // Group shifts by role
  const shiftsByRole = shifts.reduce((acc, shift) => {
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
          <p className="text-sm text-muted-foreground">{shifts.length} employees scheduled</p>
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
                {uniqueRoles.map((role) => {
                  const functionData = functions.find(f => f.name === role)
                  return (
                    <div 
                      key={role}
                      className="flex-1 py-1 px-2 text-center text-xs font-medium border-r border-border bg-muted/20"
                    >
                      <div className="font-medium">{role}</div>
                      {functionData?.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {functionData.description}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                  const functionData = functions.find(f => f.name === role)
                  
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
                        className="absolute border rounded-md shadow-sm flex items-center justify-center"
                        style={{
                          top,
                          height,
                          left,
                          width: employeeWidth,
                          zIndex: 10,
                          backgroundColor: `${shift.functionColor || '#3b82f6'}20`,
                          borderColor: `${shift.functionColor || '#3b82f6'}30`,
                        }}
                      >
                        <div className="text-xs font-medium text-center p-1">
                          <div className="text-xs" style={{ color: shift.functionColor || '#3b82f6' }}>
                            {shift.employeeName}
                          </div>
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

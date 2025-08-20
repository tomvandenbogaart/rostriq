'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import { CompanyService } from '@/lib/company-service'
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database'

interface RosterShift {
  id: string
  employeeName: string
  role: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed'
  functionColor?: string
  isWorkingToday: boolean
}

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface RosterDisplayProps {
  companyId: string
}

export function RosterDisplay({ companyId }: RosterDisplayProps) {
  const [functions, setFunctions] = useState<CompanyFunctionView[]>([])
  const [employees, setEmployees] = useState<EmployeeFunctionView[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shifts, setShifts] = useState<RosterShift[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [functionsData, employeesData, teamMembersData] = await Promise.all([
        CompanyFunctionsService.getCompanyFunctions(companyId),
        CompanyFunctionsService.getAllEmployeesWithFunctions(companyId),
        CompanyService.getCompanyTeamMembers(companyId),
      ])
      setFunctions(functionsData)
      setEmployees(employeesData)
      setTeamMembers(teamMembersData.members || [])
      
      // Generate shifts based on actual working schedules
      generateShiftsFromWorkingSchedules(functionsData, employeesData, teamMembersData.members || [])
    } catch (error) {
      console.error('Error loading roster data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateShiftsFromWorkingSchedules = (
    functionsData: CompanyFunctionView[], 
    employeesData: EmployeeFunctionView[], 
    teamMembers: TeamMemberWithProfile[]
  ) => {
    const selectedDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    const shifts: RosterShift[] = []
    let shiftId = 1

    // If no functions or employees, create empty structure
    if (functionsData.length === 0 || employeesData.length === 0) {
      // Create empty slots to show the calendar structure
      shifts.push({
        id: 'empty-1',
        employeeName: 'No employees assigned',
        role: 'No functions created',
        startTime: '--',
        endTime: '--',
        status: 'scheduled',
        functionColor: '#6b7280',
        isWorkingToday: false,
      })
    } else {
      // Generate shifts for each function based on working schedules
      functionsData.forEach((func) => {
        const employeesInFunction = employeesData.filter(emp => emp.function_id === func.id)
        
        if (employeesInFunction.length > 0) {
          // Create shifts for employees in this function
          employeesInFunction.forEach((employee) => {
            // Find the team member's working schedule
            const teamMember = teamMembers.find(member => 
              member.user_profile.email === employee.email
            )
            
            if (teamMember && teamMember.daily_schedule) {
              const daySchedule = teamMember.daily_schedule[selectedDay as keyof DailySchedule]
              
              if (daySchedule?.enabled && daySchedule.start_time && daySchedule.end_time) {
                // Employee is working on the selected day
                shifts.push({
                  id: shiftId.toString(),
                  employeeName: `${employee.first_name} ${employee.last_name}`,
                  role: func.name,
                  startTime: daySchedule.start_time.substring(0, 5), // Remove seconds
                  endTime: daySchedule.end_time.substring(0, 5), // Remove seconds
                  status: 'confirmed',
                  functionColor: func.color,
                  isWorkingToday: true,
                })
                shiftId++
              } else {
                // Employee is not working on the selected day
                shifts.push({
                  id: shiftId.toString(),
                  employeeName: `${employee.first_name} ${employee.last_name}`,
                  role: func.name,
                  startTime: '--',
                  endTime: '--',
                  status: 'scheduled',
                  functionColor: func.color,
                  isWorkingToday: false,
                })
                shiftId++
              }
            } else {
              // No working schedule found, show as unavailable
              shifts.push({
                id: shiftId.toString(),
                employeeName: `${employee.first_name} ${employee.last_name}`,
                role: func.name,
                startTime: '--',
                endTime: '--',
                status: 'scheduled',
                functionColor: func.color,
                isWorkingToday: false,
              })
              shiftId++
            }
          })
        }
      })
    }

    setShifts(shifts)
  }

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Regenerate shifts when selected date changes
  useEffect(() => {
    if (functions.length > 0 && employees.length > 0 && teamMembers.length > 0) {
      generateShiftsFromWorkingSchedules(functions, employees, teamMembers)
    }
  }, [selectedDate, functions, employees, teamMembers])

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

  // Check if any team members have working schedules set up
  const hasWorkingSchedules = teamMembers.some(member => 
    member.daily_schedule && Object.values(member.daily_schedule).some(day => day?.enabled)
  )

  // Always show the schedule structure, even when empty
  // If no working schedules, we'll show empty slots

  // Always show the schedule structure, even when empty
  // If no employees assigned, we'll show empty slots

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Group shifts by role
  const shiftsByRole = shifts.reduce((acc, shift) => {
    if (!acc[shift.role]) {
      acc[shift.role] = []
    }
    acc[shift.role].push(shift)
    return acc
  }, {} as Record<string, RosterShift[]>)

  const uniqueRoles = Object.keys(shiftsByRole)

  // Count working employees today
  const workingEmployeesCount = shifts.filter(shift => shift.isWorkingToday).length

  // Note: We'll always show the schedule, even when no one is working

  return (
    <div className="space-y-4">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dayName}, {dateString}</h2>
          <p className="text-sm text-muted-foreground">
            {workingEmployeesCount} of {shifts.length} employees working {isToday ? 'today' : 'on ' + dayName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
            ← Previous Day
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextDay}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Help Message for Empty Schedules */}
      {!hasWorkingSchedules && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">No working schedules configured yet</p>
              <p className="text-xs text-muted-foreground">
                Team members need to have their working hours and days configured to see the schedule.
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 ml-1 text-xs"
                  onClick={() => window.location.href = '/team'}
                >
                  Go to Team Directory →
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
              {/* Header Row with Job Roles */}
              <div className="flex border-b border-border">
                <div className="w-16 flex-shrink-0 py-1 px-1 font-medium text-xs border-r border-border bg-muted/30">
                  Time
                </div>
                {uniqueRoles.map((role) => {
                  return (
                    <div 
                      key={role}
                      className="flex-1 py-1 px-1 text-center text-xs font-medium border-r border-border bg-muted/20"
                    >
                      {role}
                    </div>
                  )
                })}
              </div>

              {/* Grid Container */}
              <div className="relative" style={{ minHeight: `${timeSlots.length * 32}px` }}>
                {/* Time Rows Background */}
                {timeSlots.map((time) => (
                  <div key={time} className="flex border-b border-border hover:bg-muted/20">
                    {/* Time Info Column */}
                    <div className="w-16 flex-shrink-0 py-1 px-1 border-r border-border bg-muted/10">
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
                {workingEmployeesCount === 0 ? (
                  // Show message when no one is working
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-muted-foreground mb-2">
                        No one is scheduled to work on {dayName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        All employees are off today
                      </div>
                    </div>
                  </div>
                ) : (
                  uniqueRoles.map((role, roleIndex) => {
                    const roleShifts = shiftsByRole[role]
                    const workingShifts = roleShifts.filter(shift => shift.isWorkingToday)
                    
                    // Always position employees side by side within their role column for consistency
                    if (workingShifts.length === 0) return null
                    
                    // Calculate column width and positioning
                    const columnWidthCalc = `calc((100% - 64px) / ${uniqueRoles.length})`
                    const gap = `4px`
                    const totalGaps = Math.max(0, (workingShifts.length - 1) * 4) // 4px gap between employees
                    
                    // Calculate consistent employee width
                    const employeeWidth = workingShifts.length === 1 
                      ? `calc(${columnWidthCalc} - 8px)` // Full width minus margins
                      : `calc((${columnWidthCalc} - ${totalGaps}px - 8px) / ${workingShifts.length})`
                    
                    return workingShifts.map((shift, employeeIndex) => {
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
                      
                      // Position employees side by side within their role column
                      const left = workingShifts.length === 1
                        ? `calc(64px + ${columnWidthCalc} * ${roleIndex} + 4px)` // Centered in column
                        : `calc(64px + ${columnWidthCalc} * ${roleIndex} + 4px + ${employeeIndex} * (${employeeWidth} + 4px))` // Side by side
                      
                      return (
                        <div
                          key={shift.id}
                          className="absolute border rounded-lg shadow-md flex items-center justify-center"
                          style={{
                            top,
                            height,
                            left,
                            width: employeeWidth,
                            zIndex: 10,
                            backgroundColor: `${shift.functionColor || '#3b82f6'}15`,
                            borderColor: `${shift.functionColor || '#3b82f6'}40`,
                          }}
                        >
                          <div className="text-xs font-medium text-center p-2">
                            <div className="text-sm font-semibold" style={{ color: shift.functionColor || '#3b82f6' }}>
                              {shift.employeeName}
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }).flat()
                )}
              </div>
            </div>
          </div>

      {/* Employee Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueRoles.map((role) => {
          const roleShifts = shiftsByRole[role]
          const workingEmployees = roleShifts.filter(shift => shift.isWorkingToday)
          const totalEmployees = roleShifts.length
          
          return (
            <div key={role} className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">{role}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Working {isToday ? 'today' : 'on ' + dayName}:</span>
                  <span className="font-medium">{workingEmployees.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total employees:</span>
                  <span className="font-medium">{totalEmployees}</span>
                </div>
                {workingEmployees.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">{isToday ? 'Today\'s' : `${dayName}'s`} shifts:</div>
                    {workingEmployees.map((shift) => (
                      <div key={shift.id} className="text-xs flex justify-between">
                        <span>{shift.employeeName}</span>
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

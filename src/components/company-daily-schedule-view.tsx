'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Printer, Share2, User, Users } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database';

interface CompanyDailyScheduleViewProps {
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  companyFunctions: CompanyFunctionView[];
  employees: EmployeeFunctionView[];
  teamMembers: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[];
  userRole?: 'owner' | 'admin' | 'member';
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

interface ScheduleSlot {
  employeeName: string;
  functionName: string;
  functionColor: string;
  startTime: string;
  endTime: string;
  email: string;
  totalHours: number;
  startHour: number;
  endHour: number;
}

export function CompanyDailyScheduleView({ 
  currentDate = new Date(),
  onDateChange,
  companyFunctions,
  employees,
  teamMembers,
  userRole
}: CompanyDailyScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [searchQuery, setSearchQuery] = useState('');

  // Get the day key for the selected date
  const dayKey = useMemo(() => {
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return dayName as keyof DailySchedule;
  }, [selectedDate]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange?.(today);
  };

  // Get schedule data for a specific employee
  const getEmployeeDaySchedule = (employee: EmployeeFunctionView): ScheduleSlot | null => {
    const teamMember = teamMembers.find(member => 
      member.user_profile.email === employee.email
    );
    
    if (!teamMember || !teamMember.daily_schedule) return null;
    
    const daySchedule = teamMember.daily_schedule[dayKey];
    if (!daySchedule?.enabled || !daySchedule.start_time || !daySchedule.end_time) return null;
    
    const startHour = parseInt(daySchedule.start_time.split(':')[0]);
    const endHour = parseInt(daySchedule.end_time.split(':')[0]);
    
    const functionData = companyFunctions.find(f => f.id === employee.function_id);
    
    // Calculate total hours for the day
    const totalHours = endHour - startHour;
    
    return {
      employeeName: `${employee.first_name} ${employee.last_name}`,
      functionName: functionData?.name || 'Unknown Function',
      functionColor: functionData?.color || '#6b7280',
      startTime: daySchedule.start_time.substring(0, 5),
      endTime: daySchedule.end_time.substring(0, 5),
      email: employee.email,
      totalHours,
      startHour,
      endHour
    };
  };

  // Get all employees with their daily schedules
  const employeesWithSchedules = useMemo(() => {
    let filteredEmployees = employees;
    
    // Filter employees based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredEmployees = employees.filter(employee => 
        employee.first_name?.toLowerCase().includes(query) ||
        employee.last_name?.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        companyFunctions.find(f => f.id === employee.function_id)?.name.toLowerCase().includes(query)
      );
    }
    
    return filteredEmployees.map(employee => {
      const daySchedule = getEmployeeDaySchedule(employee);
      
      return {
        ...employee,
        daySchedule,
        totalDailyHours: daySchedule?.totalHours || 0
      };
    });
  }, [employees, dayKey, teamMembers, companyFunctions, searchQuery]);

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-bold">
                {dayName}, {dateString}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <Button variant="outline" size="sm" title="Print Schedule">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" title="Share with Team">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Schedule Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {/* Header Row - Time slots */}
            <div className="flex border-b border-border">
              <div className="w-32 flex-shrink-0 py-2 px-2 font-medium text-sm border-r border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Team</span>
                </div>
              </div>
              {TIME_SLOTS.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="w-12 flex-shrink-0 py-2 px-1 font-medium text-xs border-r border-border bg-muted/30 text-center"
                >
                  <div className="font-medium">{timeSlot}</div>
                </div>
              ))}
            </div>

            {/* Employee Rows */}
            {employeesWithSchedules.map((employee, employeeIndex) => (
              <div key={employee.email} className="flex border-b border-border last:border-b-0 relative">
                {/* Employee Info Column */}
                <div className="w-32 flex-shrink-0 py-2 px-2 border-r border-border bg-muted/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.totalDailyHours} uur
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Slot Columns */}
                <div className="flex flex-1 relative">
                  {TIME_SLOTS.map((timeSlot, timeIndex) => {
                    const timeHour = parseInt(timeSlot.split(':')[0]);
                    const schedule = employee.daySchedule;
                    
                    // Check if this time slot is within the employee's schedule
                    const isInSchedule = schedule && timeHour >= schedule.startHour && timeHour < schedule.endHour;
                    const isStartTime = schedule && timeHour === schedule.startHour;
                    
                    return (
                      <div
                        key={`${employee.email}-${timeSlot}`}
                        className="w-12 flex-shrink-0 py-2 px-1 border-r border-border min-h-[40px] flex items-center justify-center relative"
                      >
                        {/* Show schedule card only at the start time, spanning multiple columns */}
                        {isStartTime && schedule && (
                          <div 
                            className="absolute inset-0 rounded border shadow-sm flex flex-col justify-center items-center text-center p-1 z-10"
                            style={{ 
                              backgroundColor: `${schedule.functionColor}20`,
                              borderColor: schedule.functionColor,
                              left: '2px',
                              right: '2px',
                              top: '2px',
                              bottom: '2px',
                              width: `calc(${schedule.totalHours * 48}px - 4px)`, // 48px per hour (12px * 4)
                            }}
                          >
                            <div className="text-xs font-medium text-foreground">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {schedule.functionName}
                            </div>
                          </div>
                        )}
                        
                        {/* Show dash for time slots outside of schedule */}
                        {!isInSchedule && (
                          <div className="text-xs text-muted-foreground">
                            -
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

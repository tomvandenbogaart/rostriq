'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, User } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database';

interface CompanyMonthlyScheduleViewProps {
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  companyFunctions: CompanyFunctionView[];
  employees: EmployeeFunctionView[];
  teamMembers: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[];
  userRole?: 'owner' | 'admin' | 'member';
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', shortName: 'Ma', key: 'monday' },
  { value: 'tuesday', label: 'Tuesday', shortName: 'Di', key: 'tuesday' },
  { value: 'wednesday', label: 'Wednesday', shortName: 'Wo', key: 'wednesday' },
  { value: 'thursday', label: 'Thursday', shortName: 'Do', key: 'thursday' },
  { value: 'friday', label: 'Friday', shortName: 'Vr', key: 'friday' },
  { value: 'saturday', label: 'Saturday', shortName: 'Za', key: 'saturday' },
  { value: 'sunday', label: 'Sunday', shortName: 'Zo', key: 'sunday' },
];

interface ScheduleSlot {
  employeeName: string;
  functionName: string;
  functionColor: string;
  startTime: string;
  endTime: string;
  email: string;
  totalHours: number;
}

export function CompanyMonthlyScheduleView({ 
  currentMonth = new Date(),
  onMonthChange,
  companyFunctions,
  employees,
  teamMembers,
  userRole
}: CompanyMonthlyScheduleViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get start of week (Monday) for first day
    const startOfWeek = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    // Get end of week (Sunday) for last day
    const endOfWeek = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const lastDiff = lastDay.getDate() - lastDayOfWeek + (lastDayOfWeek === 0 ? 0 : 7);
    endOfWeek.setDate(lastDiff);
    
    const days = [];
    const currentDate = new Date(startOfWeek);
    
    while (currentDate <= endOfWeek) {
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        dayKey: DAYS_OF_WEEK[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1].key as keyof DailySchedule,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [selectedMonth]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  // Go to current month
  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now);
    onMonthChange?.(now);
  };

  // Get schedule data for a specific day
  const getDayScheduleData = (dayKey: keyof DailySchedule) => {
    const daySchedules: Array<{
      employeeName: string;
      functionName: string;
      functionColor: string;
      startTime: string;
      endTime: string;
      email: string;
      totalHours: number;
    }> = [];
    
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
    
    filteredEmployees.forEach(employee => {
      const teamMember = teamMembers.find(member => 
        member.user_profile.email === employee.email
      );
      
      if (!teamMember || !teamMember.daily_schedule) return;
      
      const daySchedule = teamMember.daily_schedule[dayKey];
      if (!daySchedule?.enabled || !daySchedule.start_time || !daySchedule.end_time) return;
      
      const functionData = companyFunctions.find(f => f.id === employee.function_id);
      const startHour = parseInt(daySchedule.start_time.split(':')[0]);
      const endHour = parseInt(daySchedule.end_time.split(':')[0]);
      const totalHours = endHour - startHour;
      
      daySchedules.push({
        employeeName: `${employee.first_name} ${employee.last_name}`,
        functionName: functionData?.name || 'Unknown Function',
        functionColor: functionData?.color || '#6b7280',
        startTime: daySchedule.start_time.substring(0, 5),
        endTime: daySchedule.end_time.substring(0, 5),
        email: employee.email,
        totalHours
      });
    });
    
    return daySchedules;
  };

  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-bold">
                {monthName}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
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
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Header - Day names */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border bg-muted/30 rounded-t-lg"
            >
              {day.shortName}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const daySchedules = day.isCurrentMonth ? getDayScheduleData(day.dayKey) : [];
            
            return (
              <div
                key={index}
                className={`
                  min-h-[140px] p-3 border rounded-lg text-sm relative transition-colors
                  ${day.isCurrentMonth 
                    ? 'bg-background hover:bg-muted/30' 
                    : 'bg-muted/20 text-muted-foreground'
                  }
                  ${day.isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                  ${day.isWeekend ? 'bg-muted/10' : ''}
                `}
              >
                {/* Date number */}
                <div className={`
                  text-right font-medium mb-3 text-lg
                  ${day.isToday ? 'text-primary font-bold' : ''}
                  ${!day.isCurrentMonth ? 'text-muted-foreground/50' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                {/* Schedule content for current month days */}
                {day.isCurrentMonth && daySchedules.length > 0 ? (
                  <div className="space-y-2">
                    {daySchedules.slice(0, 3).map((schedule, scheduleIndex) => (
                      <div
                        key={`${schedule.email}-${scheduleIndex}`}
                        className="text-xs p-2 rounded-lg border shadow-sm"
                        style={{ 
                          backgroundColor: `${schedule.functionColor}20`,
                          borderColor: schedule.functionColor 
                        }}
                      >
                        <div className="font-medium text-xs truncate text-foreground">
                          {schedule.employeeName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {schedule.functionName}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show more indicator if there are more schedules */}
                    {daySchedules.length > 3 && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                          +{daySchedules.length - 3} more
                        </div>
                      </div>
                    )}
                  </div>
                ) : day.isCurrentMonth ? (
                  <div className="text-center py-6">
                    <div className="text-muted-foreground mb-2">
                      <Clock className="h-6 w-6 mx-auto opacity-50" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      No schedule
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-xs text-muted-foreground/30">
                      -
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted rounded-full"></div>
              <span>Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted/20 rounded-full"></div>
              <span>Other month</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>No schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Employee scheduled</span>
            </div>
          </div>
        </div>
        
        {/* Month Summary */}
        {userRole === 'owner' && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center py-4">
              <h4 className="text-sm font-medium mb-2">Month Overview</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Showing schedule for {companyFunctions.length} company function{companyFunctions.length !== 1 ? 's' : ''} and {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  • Color-coded by function type
                </div>
                <div className="text-xs text-muted-foreground">
                  • Hover over calendar days for better interaction
                </div>
                <div className="text-xs text-muted-foreground">
                  • Today&apos;s date is highlighted with primary color
                </div>
                <div className="text-xs text-muted-foreground">
                  • Weekend days are subtly shaded
                </div>
                <div className="text-xs text-muted-foreground">
                  • Shows up to 3 schedules per day with &quot;+more&quot; indicator
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

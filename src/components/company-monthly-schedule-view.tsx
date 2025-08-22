'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database';

interface CompanyMonthlyScheduleViewProps {
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  companyFunctions: CompanyFunctionView[];
  employees: EmployeeFunctionView[];
  teamMembers: CompanyMember[];
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', shortName: 'Mon', key: 'monday' },
  { value: 'tuesday', label: 'Tuesday', shortName: 'Tue', key: 'tuesday' },
  { value: 'wednesday', label: 'Wednesday', shortName: 'Wed', key: 'wednesday' },
  { value: 'thursday', label: 'Thursday', shortName: 'Thu', key: 'thursday' },
  { value: 'friday', label: 'Friday', shortName: 'Fri', key: 'friday' },
  { value: 'saturday', label: 'Saturday', shortName: 'Sat', key: 'saturday' },
  { value: 'sunday', label: 'Sunday', shortName: 'Sun', key: 'sunday' },
];

export function CompanyMonthlyScheduleView({ 
  currentMonth = new Date(),
  onMonthChange,
  companyFunctions,
  employees,
  teamMembers
}: CompanyMonthlyScheduleViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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
    }> = [];
    
    employees.forEach(employee => {
      const teamMember = teamMembers.find(member => 
        member.user_profile.email === employee.email
      );
      
      if (!teamMember || !teamMember.daily_schedule) return;
      
      const daySchedule = teamMember.daily_schedule[dayKey];
      if (!daySchedule?.enabled || !daySchedule.start_time || !daySchedule.end_time) return;
      
      const functionData = companyFunctions.find(f => f.id === employee.function_id);
      
      daySchedules.push({
        employeeName: `${employee.first_name} ${employee.last_name}`,
        functionName: functionData?.name || 'Unknown Function',
        functionColor: functionData?.color || '#6b7280',
        startTime: daySchedule.start_time.substring(0, 5),
        endTime: daySchedule.end_time.substring(0, 5),
        email: employee.email
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
              <CardTitle>Monthly Schedule</CardTitle>
              <CardDescription>
                {monthName}
              </CardDescription>
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
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
            >
              {day.label}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const daySchedules = day.isCurrentMonth ? getDayScheduleData(day.dayKey) : [];
            
            return (
              <div
                key={index}
                className={`
                  min-h-[160px] p-2 border rounded-lg text-sm relative
                  ${day.isCurrentMonth 
                    ? 'bg-background hover:bg-muted/50' 
                    : 'bg-muted/30 text-muted-foreground'
                  }
                  ${isToday ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Date number */}
                <div className={`
                  text-right font-medium mb-2
                  ${isToday ? 'text-primary font-bold' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                {/* Schedule content for current month days */}
                {day.isCurrentMonth && daySchedules.length > 0 ? (
                  <div className="space-y-1">
                    {daySchedules.map((schedule, scheduleIndex) => (
                      <div
                        key={`${schedule.email}-${scheduleIndex}`}
                        className="text-xs p-2 rounded border shadow-sm"
                        style={{ 
                          backgroundColor: `${schedule.functionColor}20`,
                          borderColor: schedule.functionColor 
                        }}
                      >
                        <div className="font-medium text-xs truncate">
                          {schedule.employeeName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {schedule.functionName}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : day.isCurrentMonth ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      <Clock className="h-8 w-8 mx-auto opacity-50" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      No schedule data
                    </div>
                  </div>
                ) : null}
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
              <span>Other month</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>No schedule data</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Employee scheduled</span>
            </div>
          </div>
        </div>
        
        {/* Month Summary */}
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
                • Click on days to see detailed schedules
              </div>
              <div className="text-xs text-muted-foreground">
                • Today's date is highlighted
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

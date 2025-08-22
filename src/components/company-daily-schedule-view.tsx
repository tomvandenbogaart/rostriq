'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Printer, Share2 } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database';

interface CompanyDailyScheduleViewProps {
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  companyFunctions: CompanyFunctionView[];
  employees: EmployeeFunctionView[];
  teamMembers: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[];
  userRole?: 'owner' | 'admin' | 'member';
}

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

interface ScheduleSlot {
  employeeName: string;
  functionName: string;
  functionColor: string;
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
  email: string;
  columnIndex: number;
  totalColumns: number;
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

  // Get schedule data for the selected day with proper stacking
  const getDayScheduleData = (): ScheduleSlot[] => {
    const daySchedules: Array<{
      employeeName: string;
      functionName: string;
      functionColor: string;
      startHour: number;
      endHour: number;
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
      
      const startHour = parseInt(daySchedule.start_time.split(':')[0]);
      const endHour = parseInt(daySchedule.end_time.split(':')[0]);
      
      const functionData = companyFunctions.find(f => f.id === employee.function_id);
      
      daySchedules.push({
        employeeName: `${employee.first_name} ${employee.last_name}`,
        functionName: functionData?.name || 'Unknown Function',
        functionColor: functionData?.color || '#6b7280',
        startHour,
        endHour,
        startTime: daySchedule.start_time.substring(0, 5),
        endTime: daySchedule.end_time.substring(0, 5),
        email: employee.email
      });
    });

    console.log('Raw day schedules:', daySchedules);

    // Sort schedules by start time
    daySchedules.sort((a, b) => a.startHour - b.startHour);

    // Calculate overlapping schedules and assign column positions
    const scheduleSlots: ScheduleSlot[] = [];
    
    // For now, let's assign each schedule to a different column to test the layout
    daySchedules.forEach((schedule, index) => {
      scheduleSlots.push({
        ...schedule,
        columnIndex: index, // Each schedule gets its own column
        totalColumns: daySchedules.length
      });
    });

    const maxColumns = daySchedules.length;
    console.log('Processed schedule slots:', scheduleSlots);
    console.log('Max columns needed:', maxColumns);
    
    return scheduleSlots;
  };

  // Check if a time slot should show a schedule card
  const shouldShowScheduleCard = (timeHour: number) => {
    const daySchedules = getDayScheduleData();
    return daySchedules.some(schedule => 
      timeHour >= schedule.startHour && timeHour < schedule.endHour
    );
  };

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const daySchedules = getDayScheduleData();
  const maxColumns = Math.max(...daySchedules.map(s => s.totalColumns), 1);

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
            {/* Header Row */}
            <div className="flex border-b border-border">
              <div className="w-20 flex-shrink-0 py-2 px-2 font-medium text-xs border-r border-border bg-muted/30">
                Time
              </div>
              <div className="flex-1 py-2 px-2 font-medium text-xs border-r border-border bg-muted/30 text-center">
                {dayName}
              </div>
            </div>

            {/* Grid Container */}
            <div 
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gridTemplateRows: `repeat(${TIME_SLOTS.length}, 32px)`,
                position: 'relative'
              }}
            >
              {/* Time Labels */}
              {TIME_SLOTS.map((time, timeIndex) => (
                <div
                  key={`time-${time}`}
                  className="py-1 px-2 border-r border-b border-border bg-muted/10 flex items-center"
                  style={{ gridColumn: 1, gridRow: timeIndex + 1 }}
                >
                  <div className="font-medium text-xs">{time}</div>
                </div>
              ))}

              {/* Background Grid Cells */}
              {TIME_SLOTS.map((time, timeIndex) => {
                const timeHour = parseInt(time.split(':')[0]);
                const isInSchedule = shouldShowScheduleCard(timeHour);
                
                return (
                  <div
                    key={`bg-${time}`}
                    className={`
                      border-r border-b border-border/30 min-h-[32px]
                      ${isInSchedule ? '' : 'hover:bg-muted/20'}
                    `}
                    style={{ 
                      gridColumn: 2, 
                      gridRow: timeIndex + 1 
                    }}
                  />
                );
              })}

              {/* Schedule Cards */}
              {daySchedules.map((schedule) => {
                const startRowIndex = TIME_SLOTS.findIndex(slot => 
                  parseInt(slot.split(':')[0]) === schedule.startHour
                );
                const endRowIndex = TIME_SLOTS.findIndex(slot => 
                  parseInt(slot.split(':')[0]) === schedule.endHour
                );
                
                if (startRowIndex === -1) return null;
                
                const duration = endRowIndex === -1 ? 
                  TIME_SLOTS.length - startRowIndex : 
                  endRowIndex - startRowIndex;
                
                // Calculate card width and position for side-by-side layout with spacing
                const gap = 4; // 4px gap between cards
                const sidePadding = 4; // 4px padding on left and right sides
                const totalGaps = maxColumns - 1;
                const availableWidth = `calc(100% - ${totalGaps * gap}px - ${sidePadding * 2}px)`;
                const cardWidth = maxColumns > 1 ? `calc(${availableWidth} / ${maxColumns})` : '100%';
                const leftOffset = maxColumns > 1 ? `calc(${sidePadding}px + ${schedule.columnIndex} * (${cardWidth} + ${gap}px))` : '0';
                
                return (
                  <div
                    key={`schedule-${schedule.email}`}
                    className="p-1 z-10"
                    style={{
                      gridColumn: '2 / span 1',
                      gridRow: `${startRowIndex + 1} / span ${duration}`,
                      position: 'relative'
                    }}
                  >
                    <div 
                      className="rounded border p-2 flex flex-col justify-center shadow-sm"
                      style={{ 
                        backgroundColor: `${schedule.functionColor}20`,
                        borderColor: schedule.functionColor,
                        position: 'absolute',
                        left: leftOffset,
                        width: cardWidth,
                        top: '4px',
                        height: `calc(${duration * 32}px - 8px)`
                      }}
                    >
                      <div className="font-medium text-sm truncate">
                        {schedule.employeeName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {schedule.functionName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        {userRole === 'owner' || userRole === 'admin' ? (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center py-2">
              <h4 className="text-sm font-medium mb-2">Day Overview</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Showing schedule for {companyFunctions.length} company function{companyFunctions.length !== 1 ? 's' : ''} and {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </p>
              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    • {daySchedules.length} employee{daySchedules.length !== 1 ? 's' : ''} working today
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Color-coded by function type
                  </div>
                  {maxColumns > 1 && (
                    <div className="text-xs text-muted-foreground">
                      • {maxColumns} employee{maxColumns !== 1 ? 's' : ''} working simultaneously at peak times
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No employees scheduled for {dayName}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

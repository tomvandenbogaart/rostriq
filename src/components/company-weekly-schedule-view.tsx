'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CompanyMember, DailySchedule } from '@/types/database';

interface CompanyWeeklyScheduleViewProps {
  currentWeek?: Date;
  onWeekChange?: (date: Date) => void;
  companyFunctions: CompanyFunctionView[];
  employees: EmployeeFunctionView[];
  teamMembers: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[];
  userRole?: 'owner' | 'admin' | 'member';
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

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

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

export function CompanyWeeklyScheduleView({ 
  currentWeek = new Date(),
  onWeekChange,
  companyFunctions,
  employees,
  teamMembers,
  userRole
}: CompanyWeeklyScheduleViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // Get the start of the week (Monday)
  const weekStart = useMemo(() => {
    const date = new Date(selectedWeek);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }, [selectedWeek]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date,
        dayName: DAYS_OF_WEEK[i].label,
        shortName: DAYS_OF_WEEK[i].shortName,
        dayKey: DAYS_OF_WEEK[i].key as keyof DailySchedule,
        isToday: date.toDateString() === new Date().toDateString(),
        isWeekend: i === 5 || i === 6, // Saturday or Sunday
      });
    }
    return days;
  }, [weekStart]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
    onWeekChange?.(newWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
    onWeekChange?.(newWeek);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    const now = new Date();
    setSelectedWeek(now);
    onWeekChange?.(now);
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()} - ${endOfWeek.getDate()}, ${weekStart.getFullYear()}`;
    } else {
      return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${weekStart.getFullYear()}`;
    }
  };

  // Get schedule data for a specific day with proper stacking
  const getDayScheduleData = (dayKey: keyof DailySchedule): ScheduleSlot[] => {
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

    // Update totalColumns for all schedules based on the maximum found
    const maxColumns = daySchedules.length;

    console.log('Processed schedule slots for', dayKey, ':', scheduleSlots);
    console.log('Max columns needed for', dayKey, ':', maxColumns);
    
    return scheduleSlots;
  };

  // Check if a time slot should show a schedule card
  const shouldShowScheduleCard = (dayKey: keyof DailySchedule, timeHour: number) => {
    const daySchedules = getDayScheduleData(dayKey);
    return daySchedules.some(schedule => 
      timeHour >= schedule.startHour && timeHour < schedule.endHour
    );
  };

  // Get the schedule card for a specific time slot (only show at start time)
  const getScheduleCard = (dayKey: keyof DailySchedule, timeHour: number) => {
    const daySchedules = getDayScheduleData(dayKey);
    const schedule = daySchedules.find(s => timeHour === s.startHour);
    
    if (!schedule) return null;
    
    const duration = schedule.endHour - schedule.startHour;
    const rowSpan = Math.max(1, duration);
    
    return {
      ...schedule,
      rowSpan
    };
  };

  // Calculate maximum columns needed across all days
  const maxColumnsPerDay = useMemo(() => {
    const maxColumns = weekDays.map(day => {
      const daySchedules = getDayScheduleData(day.dayKey);
      return Math.max(...daySchedules.map(s => s.totalColumns), 1);
    });
    return Math.max(...maxColumns, 1);
  }, [weekDays]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-bold">
                {formatWeekRange()}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {/* Header Row - Day names */}
            <div className="flex border-b border-border">
              <div className="w-20 flex-shrink-0 py-2 px-2 font-medium text-xs border-r border-border bg-muted/30">
                Time
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={`
                    flex-1 py-2 px-2 font-medium text-xs border-r border-border bg-muted/30 text-center
                    ${day.isToday ? 'bg-primary/10 text-primary font-bold' : ''}
                    ${day.isWeekend ? 'bg-muted/20' : ''}
                  `}
                >
                  <div className="font-medium">{day.shortName}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {day.date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Container */}
            <div 
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px repeat(7, 1fr)',
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
              {TIME_SLOTS.map((time, timeIndex) => 
                weekDays.map((day, dayIndex) => {
                  const timeHour = parseInt(time.split(':')[0]);
                  const isInSchedule = shouldShowScheduleCard(day.dayKey, timeHour);
                  
                  return (
                    <div
                      key={`bg-${time}-${day.date.toISOString()}`}
                      className={`
                        border-r border-b border-border/30 min-h-[32px]
                        ${day.isToday ? 'bg-primary/5' : ''}
                        ${day.isWeekend ? 'bg-muted/10' : ''}
                        ${isInSchedule ? '' : 'hover:bg-muted/20'}
                      `}
                      style={{ 
                        gridColumn: dayIndex + 2, 
                        gridRow: timeIndex + 1 
                      }}
                    />
                  );
                })
              )}

              {/* Schedule Cards */}
              {weekDays.map((day, dayIndex) => {
                const daySchedules = getDayScheduleData(day.dayKey);
                const dayMaxColumns = Math.max(...daySchedules.map(s => s.totalColumns), 1);
                
                return daySchedules.map((schedule) => {
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
                  const totalGaps = dayMaxColumns - 1;
                  const availableWidth = `calc(100% - ${totalGaps * gap}px - ${sidePadding * 2}px)`;
                  const cardWidth = dayMaxColumns > 1 ? `calc(${availableWidth} / ${dayMaxColumns})` : '100%';
                  const leftOffset = dayMaxColumns > 1 ? `calc(${sidePadding}px + ${schedule.columnIndex} * (${cardWidth} + ${gap}px))` : '0';
                  
                  return (
                    <div
                      key={`schedule-${schedule.email}-${day.date.toISOString()}`}
                      className="p-1 z-10"
                      style={{
                        gridColumn: `${dayIndex + 2} / span 1`,
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
                    </div>
                  );
                });
              })}
            </div>
          </div>
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
              <Clock className="h-3 w-3" />
              <span>No schedule data</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Employee working</span>
            </div>
          </div>
        </div>

        {/* Week Summary */}
        {userRole === 'owner' || userRole === 'admin' ? (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center py-4">
              <h4 className="text-sm font-medium mb-2">Week Overview</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Showing schedule for {companyFunctions.length} company function{companyFunctions.length !== 1 ? 's' : ''} and {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  • Color-coded by function type
                </div>
                <div className="text-xs text-muted-foreground">
                  • Hover over time slots to see details
                </div>
                <div className="text-xs text-muted-foreground">
                  • Today&apos;s column is highlighted
                </div>
                {maxColumnsPerDay > 1 && (
                  <div className="text-xs text-muted-foreground">
                    • Up to {maxColumnsPerDay} employee{maxColumnsPerDay !== 1 ? 's' : ''} working simultaneously at peak times
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

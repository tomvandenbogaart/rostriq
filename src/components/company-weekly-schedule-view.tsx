'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, User } from 'lucide-react';
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
  { value: 'monday', label: 'Monday', shortName: 'Ma', key: 'monday' },
  { value: 'tuesday', label: 'Tuesday', shortName: 'Di', key: 'tuesday' },
  { value: 'wednesday', label: 'Wednesday', shortName: 'Wo', key: 'wednesday' },
  { value: 'thursday', label: 'Thursday', shortName: 'Do', key: 'thursday' },
  { value: 'friday', label: 'Friday', shortName: 'Vr', key: 'friday' },
  { value: 'saturday', label: 'Saturday', shortName: 'Za', key: 'saturday' },
  { value: 'sunday', label: 'Sunday', shortName: 'Zo', key: 'sunday' },
];

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
  startTime: string;
  endTime: string;
  email: string;
  totalHours: number;
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

  // Get schedule data for a specific employee and day
  const getEmployeeDaySchedule = (employee: EmployeeFunctionView, dayKey: keyof DailySchedule): ScheduleSlot | null => {
    const teamMember = teamMembers.find(member => 
      member.user_profile.email === employee.email
    );
    
    if (!teamMember || !teamMember.daily_schedule) return null;
    
    const daySchedule = teamMember.daily_schedule[dayKey];
    if (!daySchedule?.enabled || !daySchedule.start_time || !daySchedule.end_time) return null;
    
    const functionData = companyFunctions.find(f => f.id === employee.function_id);
    
    // Calculate total hours for the week
    let totalHours = 0;
    Object.values(teamMember.daily_schedule).forEach(schedule => {
      if (schedule?.enabled && schedule.start_time && schedule.end_time) {
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const endHour = parseInt(schedule.end_time.split(':')[0]);
        totalHours += endHour - startHour;
      }
    });
    
    return {
      employeeName: `${employee.first_name} ${employee.last_name}`,
      functionName: functionData?.name || 'Unknown Function',
      functionColor: functionData?.color || '#6b7280',
      startTime: daySchedule.start_time.substring(0, 5),
      endTime: daySchedule.end_time.substring(0, 5),
      email: employee.email,
      totalHours
    };
  };

  // Get all employees with their weekly schedules
  const employeesWithSchedules = useMemo(() => {
    return employees.map(employee => {
      const weeklySchedule: Record<string, ScheduleSlot | null> = {};
      let totalWeeklyHours = 0;
      
      weekDays.forEach(day => {
        const daySchedule = getEmployeeDaySchedule(employee, day.dayKey);
        weeklySchedule[day.dayKey] = daySchedule;
        if (daySchedule) {
          const startHour = parseInt(daySchedule.startTime.split(':')[0]);
          const endHour = parseInt(daySchedule.endTime.split(':')[0]);
          totalWeeklyHours += endHour - startHour;
        }
      });
      
      return {
        ...employee,
        weeklySchedule,
        totalWeeklyHours
      };
    });
  }, [employees, weekDays, teamMembers, companyFunctions]);

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
        {/* Schedule Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {/* Header Row - Day names */}
            <div className="flex border-b border-border">
              <div className="w-48 flex-shrink-0 py-3 px-4 font-medium text-sm border-r border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Team Members</span>
                </div>
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={`
                    flex-1 py-3 px-2 font-medium text-sm border-r border-border bg-muted/30 text-center
                    ${day.isToday ? 'bg-primary/10 text-primary font-bold' : ''}
                    ${day.isWeekend ? 'bg-muted/20' : ''}
                  `}
                >
                  <div className="font-medium">{day.shortName}</div>
                  <div className="text-xs text-muted-foreground">
                    {day.date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Employee Rows */}
            {employeesWithSchedules.map((employee, employeeIndex) => (
              <div key={employee.email} className="flex border-b border-border last:border-b-0">
                {/* Employee Info Column */}
                <div className="w-48 flex-shrink-0 py-3 px-4 border-r border-border bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.totalWeeklyHours} uur
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Columns for each day */}
                {weekDays.map((day, dayIndex) => {
                  const schedule = employee.weeklySchedule[day.dayKey];
                  
                  return (
                    <div
                      key={`${employee.email}-${day.date.toISOString()}`}
                      className={`
                        flex-1 py-3 px-2 border-r border-border min-h-[60px] flex items-center justify-center
                        ${day.isToday ? 'bg-primary/5' : ''}
                        ${day.isWeekend ? 'bg-muted/10' : ''}
                      `}
                    >
                      {schedule ? (
                        <div 
                          className="w-full max-w-[120px] rounded-lg border p-2 text-center shadow-sm"
                          style={{ 
                            backgroundColor: `${schedule.functionColor}20`,
                            borderColor: schedule.functionColor,
                          }}
                        >
                          <div className="text-xs font-medium text-foreground">
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 truncate">
                            {schedule.functionName}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          -
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
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
              <span>No schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Employee working</span>
            </div>
          </div>
        </div>

        {/* Week Summary */}
        {userRole === 'owner' && (
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
                  • Total hours shown per employee
                </div>
                <div className="text-xs text-muted-foreground">
                  • Today&apos;s column is highlighted
                </div>
                <div className="text-xs text-muted-foreground">
                  • Weekend columns are shaded
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

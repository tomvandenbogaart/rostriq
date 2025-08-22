'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { CompanyFunctionView } from '@/types/database';

interface MonthlyScheduleViewProps {
  functions: CompanyFunctionView[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon', short: 'M' },
  { value: 'tuesday', label: 'Tue', short: 'T' },
  { value: 'wednesday', label: 'Wed', short: 'W' },
  { value: 'thursday', label: 'Thu', short: 'T' },
  { value: 'friday', label: 'Fri', short: 'F' },
  { value: 'saturday', label: 'Sat', short: 'S' },
  { value: 'sunday', label: 'Sun', short: 'S' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthlyScheduleView({ 
  functions, 
  currentMonth = new Date(),
  onMonthChange 
}: MonthlyScheduleViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Generate calendar days for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Convert to Monday-based week (0 = Monday, 1 = Tuesday, etc.)
    const mondayBasedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add days from previous month to fill the first week
    const prevMonth = new Date(year, month, 0);
    for (let i = mondayBasedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
        dayOfWeek: i
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        dayOfWeek: (mondayBasedFirstDay + day - 1) % 7
      });
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          date: new Date(year, month + 1, day),
          isCurrentMonth: false,
          dayOfWeek: (days.length % 7)
        });
      }
    }
    
    return days;
  }, [selectedMonth]);

  // Check if any functions are active on a specific date
  const getActiveFunctions = (date: Date) => {
    // For now, we'll show all functions as active every day
    // In the future, this could be enhanced to show function-specific schedules
    return functions.filter(func => func.is_active);
  };

  // Calculate total functions for a specific date
  const calculateTotalFunctions = (date: Date) => {
    return getActiveFunctions(date).length;
  };

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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle>Monthly Schedule</CardTitle>
              <CardDescription>
                {MONTHS[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
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
            const activeFunctions = getActiveFunctions(day.date);
            const totalFunctions = calculateTotalFunctions(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`
                  min-h-[160px] p-2 border rounded-lg text-sm
                  ${day.isCurrentMonth 
                    ? 'bg-background hover:bg-muted/50' 
                    : 'bg-muted/30 text-muted-foreground'
                  }
                  ${isToday ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Date number */}
                <div className={`
                  text-right font-medium mb-1
                  ${isToday ? 'text-primary font-bold' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                {/* Company functions info */}
                {day.isCurrentMonth && activeFunctions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {activeFunctions.length} function{activeFunctions.length !== 1 ? 's' : ''} active
                    </div>
                    
                    {/* Show all functions with better layout */}
                    <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      {activeFunctions.map((func) => (
                        <div key={func.id} className="text-xs p-1 rounded bg-muted/20 border-l-2" style={{ borderLeftColor: func.color }}>
                          <div className="font-medium truncate" style={{ color: func.color }}>
                            {func.name}
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            {func.assigned_employees_count} employee{func.assigned_employees_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total functions */}
                    <div className="pt-1 border-t">
                      <Badge variant="secondary" className="text-xs">
                        {totalFunctions} active
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* No functions indicator */}
                {day.isCurrentMonth && activeFunctions.length === 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    No functions active
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
              <span>Other month</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">X active</Badge>
              <span>Active functions</span>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Month Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Functions</div>
              <div className="font-medium">{functions.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Active Days</div>
              <div className="font-medium">
                {calendarDays.filter(day => 
                  day.isCurrentMonth && getActiveFunctions(day.date).length > 0
                ).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Functions with Employees</div>
              <div className="font-medium">
                {functions.filter(f => f.assigned_employees_count > 0).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Unassigned Functions</div>
              <div className="font-medium">
                {functions.filter(f => f.assigned_employees_count === 0).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

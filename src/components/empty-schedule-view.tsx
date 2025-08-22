'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';

interface EmptyScheduleViewProps {
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

export function EmptyScheduleView({ 
  currentMonth = new Date(),
  onMonthChange 
}: EmptyScheduleViewProps) {
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
                
                {/* Empty state for current month days */}
                {day.isCurrentMonth && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      <Clock className="h-8 w-8 mx-auto opacity-50" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      No schedule data
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
              <span>Other month</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>No schedule data</span>
            </div>
          </div>
        </div>
        
        {/* Empty State Summary */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h4 className="text-sm font-medium mb-2">No Schedule Data</h4>
            <p className="text-xs text-muted-foreground mb-4">
              This schedule view is empty because you haven't joined a company yet.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                • Join a company to see team schedules
              </div>
              <div className="text-xs text-muted-foreground">
                • Create your own company to start scheduling
              </div>
              <div className="text-xs text-muted-foreground">
                • Wait for a company invitation
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

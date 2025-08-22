'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface WeeklyScheduleViewProps {
  currentWeek?: Date;
  onWeekChange?: (date: Date) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', shortName: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', shortName: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', shortName: 'Wed' },
  { value: 'thursday', label: 'Thursday', shortName: 'Thu' },
  { value: 'friday', label: 'Friday', shortName: 'Fri' },
  { value: 'saturday', label: 'Saturday', shortName: 'Sat' },
  { value: 'sunday', label: 'Sunday', shortName: 'Sun' },
];

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export function WeeklyScheduleView({ 
  currentWeek = new Date(),
  onWeekChange 
}: WeeklyScheduleViewProps) {
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
        shortName: DAYS_OF_WEEK[i].short,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                {formatWeekRange()}
              </CardDescription>
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
            <div className="w-64">
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
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

            {/* Time Rows */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="flex border-b border-border hover:bg-muted/20">
                {/* Time Column */}
                <div className="w-20 flex-shrink-0 py-1 px-2 border-r border-border bg-muted/10">
                  <div className="font-medium text-xs">{time}</div>
                </div>
                
                {/* Day Columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={`
                      flex-1 border-r border-border/30 h-8 flex items-center justify-center
                      ${day.isToday ? 'bg-primary/5' : ''}
                      ${day.isWeekend ? 'bg-muted/10' : ''}
                    `}
                  >
                    {/* Empty state - no schedule data */}
                    <div className="text-center">
                      <div className="text-muted-foreground">
                        <Clock className="h-3 w-3 mx-auto opacity-30" />
                      </div>
                    </div>
                  </div>
                ))}
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
              <span>No schedule data</span>
            </div>
          </div>
        </div>

        {/* Week Summary */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center py-4">
            <h4 className="text-sm font-medium mb-2">Week Overview</h4>
            <p className="text-xs text-muted-foreground mb-4">
              This week's schedule is empty because you haven't joined a company yet.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                • Join a company to see your weekly schedule
              </div>
              <div className="text-xs text-muted-foreground">
                • Create your own company to start scheduling
              </div>
              <div className="text-xs text-muted-foreground">
                • Contact company owner to be added
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Calendar, Printer, Share2 } from 'lucide-react';

interface EmptyDailyScheduleViewProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export function EmptyDailyScheduleView({ 
  selectedDate = new Date(),
  onDateChange 
}: EmptyDailyScheduleViewProps) {
  const [currentDate] = useState(selectedDate);

  // Generate time slots from 6 AM to 10 PM
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = currentDate.toLocaleDateString('en-US', { 
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
              <CardTitle>Daily Schedule</CardTitle>
              <CardDescription>
                {dayName}, {dateString}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              <div className="w-16 flex-shrink-0 py-1 px-1 font-medium text-xs border-r border-border bg-muted/30">
                Time
              </div>
              <div className="flex-1 py-1 px-1 font-medium text-xs border-r border-border bg-muted/30 text-center">
                Schedule
              </div>
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

                  {/* Empty Function Column */}
                  <div className="flex-1 border-r border-border/30 h-8" />
                </div>
              ))}

              {/* Empty State Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-muted-foreground mb-2">
                    <Users className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <div className="text-muted-foreground mb-2">
                    No schedule data available
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Join a company or create one to see schedules
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}

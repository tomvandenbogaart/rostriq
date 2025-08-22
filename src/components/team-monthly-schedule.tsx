'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock } from 'lucide-react';
import { MonthlyScheduleView } from './monthly-schedule-view';
import type { CompanyMember, DailySchedule } from '@/types/database';

interface TeamMonthlyScheduleProps {
  companyId: string;
  members: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[];
  isLoading?: boolean;
}

interface ScheduleData {
  id: string;
  name: string;
  daily_schedule: DailySchedule;
  is_part_time: boolean;
  working_schedule_notes?: string;
}

export function TeamMonthlySchedule({ 
  companyId, 
  members, 
  isLoading = false 
}: TeamMonthlyScheduleProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);

  // Transform team members data to schedule format
  useEffect(() => {
    if (members && members.length > 0) {
      const transformedData: ScheduleData[] = members
        .filter(member => member.daily_schedule) // Only show members with schedules
        .map(member => ({
          id: member.user_id,
          name: `${member.user_profile?.first_name || ''} ${member.user_profile?.last_name || ''}`.trim() || 'Unknown Employee',
          daily_schedule: member.daily_schedule || {},
          is_part_time: member.is_part_time || false,
          working_schedule_notes: member.working_schedule_notes
        }))
        .filter(data => data.name !== 'Unknown Employee'); // Filter out members without names
      
      setScheduleData(transformedData);
    }
  }, [members]);

  // Calculate month statistics
  const monthStats = {
    totalEmployees: scheduleData.length,
    partTimeEmployees: scheduleData.filter(s => s.is_part_time).length,
    fullTimeEmployees: scheduleData.filter(s => !s.is_part_time).length,
    employeesWithSchedules: scheduleData.filter(s => 
      Object.values(s.daily_schedule).some(day => day?.enabled)
    ).length
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Monthly Schedule</CardTitle>
          <CardDescription>Loading team schedules...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Monthly Schedule</CardTitle>
          <CardDescription>No team members found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members available to display schedules for.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scheduleData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Monthly Schedule</CardTitle>
          <CardDescription>No working schedules configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members have working schedules configured yet.</p>
            <p className="text-sm mt-2">Configure individual schedules in the team directory.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle>Team Monthly Schedule</CardTitle>
              <CardDescription>
                {scheduleData.length} employee{scheduleData.length !== 1 ? 's' : ''} • {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newMonth = new Date(selectedMonth);
                newMonth.setMonth(selectedMonth.getMonth() - 1);
                setSelectedMonth(newMonth);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newMonth = new Date(selectedMonth);
                newMonth.setMonth(selectedMonth.getMonth() + 1);
                setSelectedMonth(newMonth);
              }}
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
            <Button variant="outline" size="sm" title="Print Schedule">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{monthStats.totalEmployees}</div>
            <div className="text-xs text-muted-foreground">Total Employees</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{monthStats.fullTimeEmployees}</div>
            <div className="text-xs text-muted-foreground">Full-time</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{monthStats.partTimeEmployees}</div>
            <div className="text-xs text-muted-foreground">Part-time</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{monthStats.employeesWithSchedules}</div>
            <div className="text-xs text-muted-foreground">With Schedules</div>
          </div>
        </div>

        {/* Monthly Schedule View */}
        <MonthlyScheduleView 
          schedules={scheduleData}
          currentMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Additional Team Insights */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Team Schedule Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most common start time:</span>
              <span className="font-medium">
                {(() => {
                  const startTimes = scheduleData
                    .flatMap(s => Object.values(s.daily_schedule))
                    .filter(day => day?.enabled && day.start_time)
                    .map(day => day!.start_time!.substring(0, 5));
                  
                  if (startTimes.length === 0) return 'N/A';
                  
                  const timeCounts = startTimes.reduce((acc, time) => {
                    acc[time] = (acc[time] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const mostCommon = Object.entries(timeCounts)
                    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
                  
                  return mostCommon ? mostCommon[0] : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most common end time:</span>
              <span className="font-medium">
                {(() => {
                  const endTimes = scheduleData
                    .flatMap(s => Object.values(s.daily_schedule))
                    .filter(day => day?.enabled && day.end_time)
                    .map(day => day!.end_time!.substring(0, 5));
                  
                  if (endTimes.length === 0) return 'N/A';
                  
                  const timeCounts = endTimes.reduce((acc, time) => {
                    acc[time] = (acc[time] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const mostCommon = Object.entries(timeCounts)
                    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
                  
                  return mostCommon ? mostCommon[0] : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekend workers:</span>
              <span className="font-medium">
                {scheduleData.filter(s => 
                  s.daily_schedule.saturday?.enabled || s.daily_schedule.sunday?.enabled
                ).length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { MonthlyScheduleView } from '@/components/monthly-schedule-view';

// Sample data for demonstration
const sampleSchedules = [
  {
    id: '1',
    name: 'John Smith',
    daily_schedule: {
      monday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      tuesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      wednesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      thursday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      friday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      saturday: { enabled: false },
      sunday: { enabled: false },
    },
    is_part_time: false,
    working_schedule_notes: 'Full-time employee'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    daily_schedule: {
      monday: { enabled: true, start_time: '10:00:00', end_time: '16:00:00' },
      tuesday: { enabled: true, start_time: '10:00:00', end_time: '16:00:00' },
      wednesday: { enabled: true, start_time: '10:00:00', end_time: '16:00:00' },
      thursday: { enabled: true, start_time: '10:00:00', end_time: '16:00:00' },
      friday: { enabled: true, start_time: '10:00:00', end_time: '16:00:00' },
      saturday: { enabled: false },
      sunday: { enabled: false },
    },
    is_part_time: true,
    working_schedule_notes: 'Part-time employee'
  },
  {
    id: '3',
    name: 'Mike Wilson',
    daily_schedule: {
      monday: { enabled: true, start_time: '08:00:00', end_time: '18:00:00' },
      tuesday: { enabled: true, start_time: '08:00:00', end_time: '18:00:00' },
      wednesday: { enabled: true, start_time: '08:00:00', end_time: '18:00:00' },
      thursday: { enabled: true, start_time: '08:00:00', end_time: '18:00:00' },
      friday: { enabled: true, start_time: '08:00:00', end_time: '18:00:00' },
      saturday: { enabled: true, start_time: '09:00:00', end_time: '15:00:00' },
      sunday: { enabled: false },
    },
    is_part_time: false,
    working_schedule_notes: 'Full-time with Saturday shifts'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    daily_schedule: {
      monday: { enabled: true, start_time: '12:00:00', end_time: '20:00:00' },
      tuesday: { enabled: true, start_time: '12:00:00', end_time: '20:00:00' },
      wednesday: { enabled: true, start_time: '12:00:00', end_time: '20:00:00' },
      thursday: { enabled: true, start_time: '12:00:00', end_time: '20:00:00' },
      friday: { enabled: true, start_time: '12:00:00', end_time: '20:00:00' },
      saturday: { enabled: false },
      sunday: { enabled: false },
    },
    is_part_time: false,
    working_schedule_notes: 'Evening shift employee'
  },
  {
    id: '5',
    name: 'David Brown',
    daily_schedule: {
      monday: { enabled: false },
      tuesday: { enabled: true, start_time: '09:00:00', end_time: '14:00:00' },
      wednesday: { enabled: true, start_time: '09:00:00', end_time: '14:00:00' },
      thursday: { enabled: true, start_time: '09:00:00', end_time: '14:00:00' },
      friday: { enabled: true, start_time: '09:00:00', end_time: '14:00:00' },
      saturday: { enabled: false },
      sunday: { enabled: false },
    },
    is_part_time: true,
    working_schedule_notes: 'Part-time, no Mondays'
  }
];

export default function MonthlyScheduleDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Monthly Schedule View Demo</h1>
        <p className="text-muted-foreground">
          This demonstrates the monthly calendar view for working schedules. 
          The calendar shows which employees are working on each day and their scheduled hours.
        </p>
      </div>
      
      <MonthlyScheduleView 
        schedules={sampleSchedules}
        currentMonth={new Date()}
        onMonthChange={(date) => {
          console.log('Month changed to:', date);
        }}
      />
      
      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Monthly calendar view with navigation</li>
          <li>• Shows working employees for each day</li>
          <li>• Displays start/end times for each employee</li>
          <li>• Calculates total working hours per day</li>
          <li>• Highlights current day</li>
          <li>• Month summary with employee counts</li>
          <li>• Responsive design for mobile and desktop</li>
        </ul>
      </div>
    </div>
  );
}

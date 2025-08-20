# Monthly Schedule View

The Monthly Schedule View is a comprehensive calendar interface that displays team working schedules in a monthly format. It provides an intuitive way to visualize when team members are working and manage workforce planning.

## Features

### 📅 Monthly Calendar View
- **Full Month Display**: Shows complete month with proper week alignment
- **Navigation**: Previous/next month navigation with "Today" button
- **Visual Indicators**: Highlights current day and distinguishes current month from adjacent months

### 👥 Employee Schedule Display
- **Working Status**: Shows which employees are working on each day
- **Time Information**: Displays start and end times for each employee
- **Employee Count**: Shows total number of employees working per day
- **Overflow Handling**: Gracefully handles multiple employees with "+X more" indicator

### ⏰ Working Hours Calculation
- **Daily Totals**: Calculates total working hours per day
- **Overnight Shift Support**: Handles shifts that span midnight
- **Accurate Calculations**: Uses proper time arithmetic for precise hour calculations

### 📊 Team Insights
- **Employee Statistics**: Total, full-time, and part-time employee counts
- **Schedule Coverage**: Shows how many employees have configured schedules
- **Common Patterns**: Identifies most common start/end times and weekend workers

## Components

### 1. MonthlyScheduleView
The core calendar component that renders the monthly grid and handles date calculations.

**Props:**
- `schedules`: Array of employee schedules
- `currentMonth`: Currently displayed month (optional, defaults to current month)
- `onMonthChange`: Callback when month changes

**Features:**
- Responsive grid layout
- Proper calendar day generation
- Working schedule integration
- Visual feedback and hover states

### 2. TeamMonthlySchedule
A wrapper component that integrates with team data and provides additional team-level insights.

**Props:**
- `companyId`: Company identifier
- `members`: Array of company members
- `isLoading`: Loading state indicator

**Features:**
- Team statistics dashboard
- Schedule insights and analytics
- Integration with existing team data
- Error handling and empty states

### 3. TeamPageContent
Updated team management interface that includes tabs for both team directory and monthly schedule view.

**Features:**
- Tabbed interface for different views
- Quick stats dashboard
- Seamless navigation between views
- Consistent UI/UX

## Usage

### Basic Implementation
```tsx
import { MonthlyScheduleView } from '@/components/monthly-schedule-view';

const schedules = [
  {
    id: '1',
    name: 'John Smith',
    daily_schedule: {
      monday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
      // ... other days
    },
    is_part_time: false
  }
];

<MonthlyScheduleView 
  schedules={schedules}
  currentMonth={new Date()}
  onMonthChange={(date) => console.log('Month changed:', date)}
/>
```

### Team Integration
```tsx
import { TeamMonthlySchedule } from '@/components/team-monthly-schedule';

<TeamMonthlySchedule
  companyId={companyId}
  members={teamMembers}
  isLoading={isLoading}
/>
```

## Data Structure

The monthly schedule expects schedules in the following format:

```typescript
interface ScheduleData {
  id: string;
  name: string;
  daily_schedule: DailySchedule;
  is_part_time: boolean;
  working_schedule_notes?: string;
}

interface DailySchedule {
  monday?: DailyScheduleEntry;
  tuesday?: DailyScheduleEntry;
  wednesday?: DailyScheduleEntry;
  thursday?: DailyScheduleEntry;
  friday?: DailyScheduleEntry;
  saturday?: DailyScheduleEntry;
  sunday?: DailyScheduleEntry;
}

interface DailyScheduleEntry {
  enabled: boolean;
  start_time?: string; // HH:MM:SS format
  end_time?: string;   // HH:MM:SS format
}
```

## Demo Pages

### 1. Monthly Schedule Demo
**Route:** `/demo-functions/monthly-schedule`
**Purpose:** Standalone demonstration of the monthly schedule view with sample data

### 2. Demo Functions Index
**Route:** `/demo-functions`
**Purpose:** Overview of all available demo components including the monthly schedule

### 3. Team Management
**Route:** `/team`
**Purpose:** Full team management interface with integrated monthly schedule view

## Technical Details

### Calendar Generation
- Uses Monday-based week calculation for business applications
- Properly handles month boundaries and leap years
- Generates calendar grid with adjacent month days for complete weeks

### Time Calculations
- Handles overnight shifts by adding 24 hours when end time < start time
- Uses precise time arithmetic for accurate hour calculations
- Formats times for display (HH:MM from HH:MM:SS)

### Responsive Design
- Mobile-first approach with responsive grid layouts
- Adaptive sizing for different screen sizes
- Touch-friendly navigation controls

### Performance
- Memoized calendar day generation
- Efficient filtering and calculations
- Optimized re-renders with proper state management

## Future Enhancements

### Planned Features
- **Weekly View**: Alternative weekly schedule display
- **Shift Templates**: Pre-configured shift patterns
- **Conflict Detection**: Identify scheduling conflicts
- **Export Options**: PDF/Excel export capabilities
- **Mobile App**: Native mobile application support

### Integration Opportunities
- **Time Tracking**: Integration with time clock systems
- **Payroll**: Automatic hour calculation for payroll
- **Notifications**: Schedule change alerts
- **API Endpoints**: RESTful API for external integrations

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: CSS Grid, Flexbox, ES2020+ JavaScript features

## Dependencies

- **React**: 18+ with hooks support
- **TypeScript**: 4.5+ for type safety
- **Tailwind CSS**: 3.0+ for styling
- **Lucide React**: For icons
- **Date API**: Native JavaScript Date object support

## Contributing

When contributing to the monthly schedule feature:

1. **Follow Patterns**: Maintain consistent component structure
2. **Type Safety**: Use proper TypeScript interfaces
3. **Testing**: Test with various schedule configurations
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Performance**: Monitor calendar generation performance with large datasets

## Support

For issues or questions related to the monthly schedule view:

1. Check the demo pages for usage examples
2. Review the component props and interfaces
3. Test with sample data to isolate issues
4. Check browser console for error messages
5. Verify data structure matches expected format

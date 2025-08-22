'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { DailySchedule } from '@/types/database';

interface WorkingSchedule {
  daily_schedule: DailySchedule;
  is_part_time: boolean;
  working_schedule_notes?: string;
}

interface WorkingScheduleEditorProps {
  schedule: WorkingSchedule;
  onSave: (schedule: WorkingSchedule) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function WorkingScheduleEditor({ 
  schedule, 
  onSave, 
  onCancel, 
  isLoading = false 
}: WorkingScheduleEditorProps) {
  const [localSchedule, setLocalSchedule] = useState<WorkingSchedule>(schedule);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  // Calculate total weekly hours
  const totalWeeklyHours = useMemo(() => {
    let total = 0;
    DAYS_OF_WEEK.forEach(day => {
      const daySchedule = localSchedule.daily_schedule[day.value as keyof DailySchedule];
      if (daySchedule?.enabled && daySchedule.start_time && daySchedule.end_time) {
        const startTime = new Date(`2024-01-01T${daySchedule.start_time}`);
        const endTime = new Date(`2024-01-01T${daySchedule.end_time}`);
        
        let diff = endTime.getTime() - startTime.getTime();
        
        // Handle overnight shifts
        if (diff < 0) {
          diff += 24 * 60 * 60 * 1000; // Add 24 hours
        }
        
        total += diff / (1000 * 60 * 60); // Convert to hours
      }
    });
    return total;
  }, [localSchedule.daily_schedule]);

  const validateSchedule = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasAtLeastOneDay = false;

    DAYS_OF_WEEK.forEach(day => {
      const daySchedule = localSchedule.daily_schedule[day.value as keyof DailySchedule];
      if (daySchedule?.enabled) {
        hasAtLeastOneDay = true;
        if (!daySchedule.start_time) {
          newErrors[`${day.value}_start`] = 'Start time is required';
        }
        if (!daySchedule.end_time) {
          newErrors[`${day.value}_end`] = 'End time is required';
        }
        if (daySchedule.start_time === daySchedule.end_time) {
          newErrors[`${day.value}_equal`] = 'Start and end time cannot be the same';
        }
      }
    });

    if (!hasAtLeastOneDay) {
      newErrors.no_days = 'At least one working day must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSchedule()) {
      return;
    }

    try {
      await onSave(localSchedule);
    } catch (error) {
      console.error('Error saving working schedule:', error);
    }
  };

  const toggleDay = (day: string, enabled: boolean) => {
    setLocalSchedule(prev => ({
      ...prev,
      daily_schedule: {
        ...prev.daily_schedule,
        [day]: {
          enabled,
          start_time: enabled ? '09:00:00' : undefined,
          end_time: enabled ? '17:00:00' : undefined,
        }
      }
    }));
  };

  const updateDayTime = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      daily_schedule: {
        ...prev.daily_schedule,
        [day]: {
          ...prev.daily_schedule[day as keyof DailySchedule],
          [field]: value ? `${value}:00` : undefined,
        }
      }
    }));
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  const getActiveDays = () => {
    return DAYS_OF_WEEK.filter(day => 
      localSchedule.daily_schedule[day.value as keyof DailySchedule]?.enabled
    );
  };

  // Helpers for compact UI
  const calculateDayHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(`2024-01-01T${start}`);
    const endDate = new Date(`2024-01-01T${end}`);
    let diff = endDate.getTime() - startDate.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    return diff / (1000 * 60 * 60);
  };

  const applyPresetWeekdays = () => {
    setLocalSchedule(prev => ({
      ...prev,
      daily_schedule: {
        ...prev.daily_schedule,
        monday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
        tuesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
        wednesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
        thursday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
        friday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
        saturday: { enabled: false },
        sunday: { enabled: false },
      },
    }));
  };

  const applyPresetAllDays = () => {
    setLocalSchedule(prev => ({
      ...prev,
      daily_schedule: DAYS_OF_WEEK.reduce((acc, d) => {
        acc[d.value as keyof DailySchedule] = { enabled: true, start_time: '09:00:00', end_time: '17:00:00' };
        return acc;
      }, { ...prev.daily_schedule } as DailySchedule),
    }));
  };

  const clearAllDays = () => {
    setLocalSchedule(prev => ({
      ...prev,
      daily_schedule: DAYS_OF_WEEK.reduce((acc, d) => {
        acc[d.value as keyof DailySchedule] = { enabled: false };
        return acc;
      }, { ...prev.daily_schedule } as DailySchedule),
    }));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Working Schedule</CardTitle>
        <CardDescription>
          Set individual working hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header with presets and summary card */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Label className="text-base font-medium">Daily Working Hours</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={applyPresetWeekdays}>Mon–Fri 09:00–17:00</Button>
              <Button type="button" variant="outline" size="sm" onClick={applyPresetAllDays}>All days 09:00–17:00</Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAllDays}>Clear all</Button>
            </div>
          </div>
        </div>

        {/* Compact table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2">Day</th>
                <th className="text-left py-1 px-2">On</th>
                <th className="text-left py-1 px-2">Start</th>
                <th className="text-left py-1 px-2">End</th>
                <th className="text-left py-1 px-2">Hours</th>
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = localSchedule.daily_schedule[day.value as keyof DailySchedule];
                const isEnabled = daySchedule?.enabled || false;
                const dayHours = isEnabled ? calculateDayHours(daySchedule?.start_time, daySchedule?.end_time) : 0;
                return (
                  <tr key={day.value} className="border-b hover:bg-muted/30">
                    <td className="py-1 px-2 font-medium">{day.label}</td>
                    <td className="py-1 px-2">
                      <Switch checked={isEnabled} onCheckedChange={(checked) => toggleDay(day.value, checked)} />
                    </td>
                    <td className="py-1 px-2">
                      <Input
                        type="time"
                        value={formatTime(daySchedule?.start_time)}
                        onChange={(e) => updateDayTime(day.value, 'start_time', e.target.value)}
                        disabled={!isEnabled}
                        className={`w-28 ${errors[`${day.value}_start`] ? 'border-red-500' : ''}`}
                      />
                    </td>
                    <td className="py-1 px-2">
                      <Input
                        type="time"
                        value={formatTime(daySchedule?.end_time)}
                        onChange={(e) => updateDayTime(day.value, 'end_time', e.target.value)}
                        disabled={!isEnabled}
                        className={`w-28 ${errors[`${day.value}_end`] ? 'border-red-500' : ''}`}
                      />
                    </td>
                    <td className="py-1 px-2 text-muted-foreground">
                      {isEnabled && daySchedule?.start_time && daySchedule?.end_time ? `${dayHours.toFixed(1)}h` : '-'}
                      {errors[`${day.value}_equal`] && (
                        <span className="ml-2 text-xs text-red-600">Times equal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {errors.no_days && (
            <p className="mt-2 text-sm text-red-600">{errors.no_days}</p>
          )}
        </div>

        {/* Part Time Toggle and Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="part-time"
              checked={localSchedule.is_part_time}
              onCheckedChange={(checked) => setLocalSchedule(prev => ({
                ...prev,
                is_part_time: checked
              }))}
            />
            <Label htmlFor="part-time">Part-time employee</Label>
          </div>
          
          {/* Schedule Summary */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Total Hours:</span>
              <Badge variant="outline" className="font-bold">
                {totalWeeklyHours.toFixed(1)}h
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>Days:</span>
              <span>
                {getActiveDays().length > 0 ? (
                  getActiveDays().map(day => day.short).join(', ')
                ) : (
                  'None'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

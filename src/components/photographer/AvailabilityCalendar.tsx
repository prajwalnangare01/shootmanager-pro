import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfToday, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export function AvailabilityCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user, currentMonth]);

  const fetchAvailability = async () => {
    if (!user) return;

    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('availability')
      .select('available_date')
      .eq('user_id', user.id)
      .gte('available_date', start)
      .lte('available_date', end);

    if (error) {
      console.error('Error fetching availability:', error);
    } else {
      const dates = new Set(data.map((a) => a.available_date));
      setAvailableDates(dates);
    }
    setLoading(false);
  };

  const toggleDate = async (date: Date) => {
    if (!user || isBefore(date, startOfToday())) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const isAvailable = availableDates.has(dateStr);

    if (isAvailable) {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('user_id', user.id)
        .eq('available_date', dateStr);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update availability.',
          variant: 'destructive',
        });
      } else {
        const newDates = new Set(availableDates);
        newDates.delete(dateStr);
        setAvailableDates(newDates);
        toast({
          title: 'Marked Unavailable',
          description: format(date, 'MMMM d, yyyy'),
        });
      }
    } else {
      const { error } = await supabase
        .from('availability')
        .insert({ user_id: user.id, available_date: dateStr });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update availability.',
          variant: 'destructive',
        });
      } else {
        const newDates = new Set(availableDates);
        newDates.add(dateStr);
        setAvailableDates(newDates);
        toast({
          title: 'Marked Available',
          description: format(date, 'MMMM d, yyyy'),
        });
      }
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Availability
            </CardTitle>
            <CardDescription>
              Tap dates to mark yourself available (green) or unavailable
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isAvailable = availableDates.has(dateStr);
            const isPast = isBefore(day, startOfToday());
            const isCurrentDay = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(day)}
                disabled={isPast || loading}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                  isPast
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : isAvailable
                    ? 'bg-status-completed text-status-completed-foreground shadow-sm hover:opacity-90'
                    : 'bg-muted hover:bg-muted/80',
                  isCurrentDay && !isAvailable && 'ring-2 ring-primary ring-offset-2',
                  isCurrentDay && isAvailable && 'ring-2 ring-status-completed-foreground ring-offset-2'
                )}
              >
                <span>{format(day, 'd')}</span>
                {isAvailable && !isPast && (
                  <Check className="h-3 w-3 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-status-completed" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm text-muted-foreground">Unavailable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

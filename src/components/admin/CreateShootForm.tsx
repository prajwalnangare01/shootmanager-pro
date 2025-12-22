import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, MapPin, Building2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { sendSMS, smsTemplates } from '@/lib/sms';

interface CreateShootFormProps {
  onShootCreated?: () => void;
}

export function CreateShootForm({ onShootCreated }: CreateShootFormProps) {
  const [loading, setLoading] = useState(false);
  const [photographers, setPhotographers] = useState<Profile[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<Profile[]>([]);
  const { toast } = useToast();

  const [form, setForm] = useState({
    merchantName: '',
    location: '',
    date: '',
    time: '',
    photographerId: '',
  });

  useEffect(() => {
    fetchPhotographers();
  }, []);

  useEffect(() => {
    if (form.date) {
      fetchAvailablePhotographers(form.date);
    } else {
      setAvailablePhotographers([]);
    }
  }, [form.date, photographers]);

  const fetchPhotographers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'photographer');

    if (error) {
      console.error('Error fetching photographers:', error);
    } else {
      setPhotographers(data as Profile[]);
    }
  };

  const fetchAvailablePhotographers = async (date: string) => {
    const { data: availabilityData, error } = await supabase
      .from('availability')
      .select('user_id')
      .eq('available_date', date);

    if (error) {
      console.error('Error fetching availability:', error);
      return;
    }

    const availableIds = availabilityData.map((a) => a.user_id);
    const available = photographers.filter((p) => availableIds.includes(p.id));
    setAvailablePhotographers(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.from('shoots').insert({
      merchant_name: form.merchantName,
      location: form.location,
      shoot_date: form.date,
      shoot_time: form.time,
      photographer_id: form.photographerId || null,
    }).select().single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create shoot. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Shoot Created!',
        description: `Shoot scheduled for ${format(new Date(form.date), 'MMMM d, yyyy')}`,
      });

      // Send SMS notification if photographer is assigned
      if (form.photographerId) {
        const photographer = photographers.find(p => p.id === form.photographerId);
        if (photographer?.phone) {
          const message = smsTemplates.shootAssigned(
            form.location,
            format(new Date(form.date), 'MMMM d, yyyy')
          );
          await sendSMS(photographer.phone, message, 'shoot_assigned');
        }
      }

      setForm({
        merchantName: '',
        location: '',
        date: '',
        time: '',
        photographerId: '',
      });

      onShootCreated?.();
    }

    setLoading(false);
  };

  return (
    <Card className="shadow-md max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Create New Shoot
        </CardTitle>
        <CardDescription>
          Schedule a new restaurant photoshoot. Only photographers available on the selected date will be shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="merchantName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Merchant Name
              </Label>
              <Input
                id="merchantName"
                placeholder="e.g., Pizza Palace"
                value={form.merchantName}
                onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Koramangala, Bangalore"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photographer" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Assign Photographer
              {form.date && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({availablePhotographers.length} available)
                </span>
              )}
            </Label>
            <Select
              value={form.photographerId}
              onValueChange={(value) => setForm({ ...form, photographerId: value })}
              disabled={!form.date}
            >
              <SelectTrigger>
                <SelectValue placeholder={form.date ? 'Select a photographer' : 'Select a date first'} />
              </SelectTrigger>
              <SelectContent>
                {availablePhotographers.length === 0 && form.date ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No photographers available on this date
                  </div>
                ) : (
                  availablePhotographers.map((photographer) => (
                    <SelectItem key={photographer.id} value={photographer.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {photographer.name.charAt(0)}
                        </div>
                        {photographer.name}
                        {photographer.phone && (
                          <span className="text-muted-foreground">({photographer.phone})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shoot'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

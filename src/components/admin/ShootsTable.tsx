import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shoot, Profile } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Calendar, Clock, User, Loader2 } from 'lucide-react';

export function ShootsTable() {
  const [shoots, setShoots] = useState<(Shoot & { photographer: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoots();
  }, []);

  const fetchShoots = async () => {
    const { data, error } = await supabase
      .from('shoots')
      .select(`
        *,
        photographer:profiles!shoots_photographer_id_fkey(*)
      `)
      .order('shoot_date', { ascending: true });

    if (error) {
      console.error('Error fetching shoots:', error);
    } else {
      setShoots(data as (Shoot & { photographer: Profile | null })[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          All Shoots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Merchant</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Photographer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shoots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No shoots scheduled yet. Create your first shoot!
                  </TableCell>
                </TableRow>
              ) : (
                shoots.map((shoot) => (
                  <TableRow key={shoot.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{shoot.merchant_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {shoot.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(shoot.shoot_date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {shoot.shoot_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shoot.photographer ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {shoot.photographer.name.charAt(0)}
                          </div>
                          <span className="text-sm">{shoot.photographer.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shoot.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {shoot.qc_link && (
                          <a
                            href={shoot.qc_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            QC
                          </a>
                        )}
                        {shoot.raw_link && (
                          <a
                            href={shoot.raw_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Raw
                          </a>
                        )}
                        {!shoot.qc_link && !shoot.raw_link && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shoot, Profile } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Calendar, User, IndianRupee } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const RATE_PER_SHOOT = 500; // ₹500 per completed shoot

export function InvoiceView() {
  const [shoots, setShoots] = useState<(Shoot & { photographer: Profile | null })[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedShoots();
  }, [selectedMonth]);

  const fetchCompletedShoots = async () => {
    setLoading(true);
    const monthDate = parseISO(`${selectedMonth}-01`);
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('shoots')
      .select(`
        *,
        photographer:profiles!shoots_photographer_id_fkey(*)
      `)
      .in('status', ['Completed', 'QC_Uploaded', 'Approved'])
      .gte('shoot_date', startDate)
      .lte('shoot_date', endDate)
      .order('photographer_id');

    if (error) {
      console.error('Error fetching shoots:', error);
    } else {
      setShoots(data as (Shoot & { photographer: Profile | null })[]);
    }
    setLoading(false);
  };

  // Group by photographer
  const photographerStats = shoots.reduce((acc, shoot) => {
    if (!shoot.photographer) return acc;
    
    const id = shoot.photographer.id;
    if (!acc[id]) {
      acc[id] = {
        photographer: shoot.photographer,
        shootCount: 0,
        totalPayout: 0,
      };
    }
    acc[id].shootCount++;
    acc[id].totalPayout = acc[id].shootCount * RATE_PER_SHOOT;
    return acc;
  }, {} as Record<string, { photographer: Profile; shootCount: number; totalPayout: number }>);

  const stats = Object.values(photographerStats);
  const totalPayout = stats.reduce((sum, s) => sum + s.totalPayout, 0);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    };
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Monthly Invoices
              </CardTitle>
              <CardDescription>
                View completed shoots and calculate photographer payouts
              </CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No completed shoots for {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden mb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Photographer</TableHead>
                      <TableHead className="text-center">Completed Shoots</TableHead>
                      <TableHead className="text-center">Rate per Shoot</TableHead>
                      <TableHead className="text-right">Total Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map(({ photographer, shootCount, totalPayout }) => (
                      <TableRow key={photographer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {photographer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{photographer.name}</p>
                              {photographer.phone && (
                                <p className="text-xs text-muted-foreground">{photographer.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{shootCount}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          ₹{RATE_PER_SHOOT}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 font-semibold text-status-completed">
                            <IndianRupee className="h-4 w-4" />
                            {totalPayout.toLocaleString('en-IN')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-6 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <span>{stats.length} photographer(s)</span>
                  <span className="mx-2">•</span>
                  <span>{shoots.length} total shoots</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Payout:</span>
                  <span className="text-2xl font-display font-bold text-primary flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {totalPayout.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

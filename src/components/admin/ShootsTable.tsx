import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shoot, Profile, ShootStatus } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Calendar, Clock, Loader2, CheckCircle2, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ShootsTable() {
  const [shoots, setShoots] = useState<(Shoot & { photographer: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [approving, setApproving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShoots();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('shoots-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shoots' },
        () => {
          fetchShoots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const openApproveDialog = (shoot: Shoot) => {
    setSelectedShoot(shoot);
    setPayoutAmount('');
    setApproveDialogOpen(true);
  };

  const approveShoot = async () => {
    if (!selectedShoot || !payoutAmount) return;
    
    const payout = parseFloat(payoutAmount);
    if (isNaN(payout) || payout <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payout amount.',
        variant: 'destructive',
      });
      return;
    }

    setApproving(true);
    const { error } = await supabase
      .from('shoots')
      .update({ 
        status: 'Approved' as ShootStatus,
        payout: payout
      })
      .eq('id', selectedShoot.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve shoot.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Approved!',
        description: `Shoot approved with ₹${payout.toLocaleString('en-IN')} payout.`,
      });
      setApproveDialogOpen(false);
      fetchShoots();
    }
    setApproving(false);
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
    <>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shoots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                    <TableCell>
                      {shoot.status === 'QC_Uploaded' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openApproveDialog(shoot)}
                          className="text-status-completed border-status-completed hover:bg-status-completed hover:text-status-completed-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-status-completed" />
            Approve Shoot
          </DialogTitle>
          <DialogDescription>
            Enter the payout amount for this shoot before approving.
          </DialogDescription>
        </DialogHeader>
        {selectedShoot && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Merchant:</span>{' '}
                <span className="font-medium">{selectedShoot.merchant_name}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Date:</span>{' '}
                <span className="font-medium">{format(new Date(selectedShoot.shoot_date), 'MMM d, yyyy')}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout">Payout Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payout"
                  type="number"
                  placeholder="500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={approveShoot} 
            disabled={!payoutAmount || approving}
            className="bg-status-completed hover:bg-status-completed/90"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shoot, ShootStatus } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Calendar, Clock, Check, Navigation, Play, Camera, Link, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { sendSMS, smsTemplates } from '@/lib/sms';

interface ShootCardProps {
  shoot: Shoot;
  onUpdate: () => void;
}

const statusFlow: { status: ShootStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'Accepted', label: 'Accept Shoot', icon: Check },
  { status: 'Reached', label: 'Reached Location', icon: Navigation },
  { status: 'Started', label: 'Shoot Started', icon: Play },
  { status: 'Completed', label: 'Shoot Completed', icon: Camera },
];

export function ShootCard({ shoot, onUpdate }: ShootCardProps) {
  const [loading, setLoading] = useState(false);
  const [qcLink, setQcLink] = useState(shoot.qc_link || '');
  const [rawLink, setRawLink] = useState(shoot.raw_link || '');
  const { toast } = useToast();
  const { profile } = useAuth();

  const currentStatusIndex = statusFlow.findIndex((s) => s.status === shoot.status);
  const nextStatus = statusFlow[currentStatusIndex + 1];

  const updateStatus = async (newStatus: ShootStatus) => {
    setLoading(true);

    const { error } = await supabase
      .from('shoots')
      .update({ status: newStatus })
      .eq('id', shoot.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `Shoot marked as ${newStatus}`,
      });

      // Send SMS notification when photographer reaches location
      if (newStatus === 'Reached' && profile) {
        const message = smsTemplates.photographerReached(shoot.merchant_name, profile.name);
        // In production, this would go to admin's phone
        console.log('SMS would be sent to admin:', message);
      }

      onUpdate();
    }

    setLoading(false);
  };

  const uploadLinks = async () => {
    if (!qcLink && !rawLink) {
      toast({
        title: 'Missing Links',
        description: 'Please provide at least one link.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('shoots')
      .update({
        qc_link: qcLink || null,
        raw_link: rawLink || null,
        status: 'QC_Uploaded' as ShootStatus,
      })
      .eq('id', shoot.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload links. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Links Uploaded',
        description: 'Your deliverables have been submitted.',
      });

      // Send SMS notification when QC is uploaded
      if (qcLink) {
        const message = smsTemplates.qcUploaded(shoot.merchant_name, qcLink);
        console.log('SMS would be sent to admin:', message);
      }

      onUpdate();
    }

    setLoading(false);
  };

  return (
    <Card className="shadow-md overflow-hidden animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold">{shoot.merchant_name}</h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
              <MapPin className="h-4 w-4" />
              {shoot.location}
            </div>
          </div>
          <StatusBadge status={shoot.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {format(new Date(shoot.shoot_date), 'EEE, MMM d')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{shoot.shoot_time}</span>
          </div>
        </div>

        {/* Status Flow Buttons */}
        {shoot.status !== 'QC_Uploaded' && shoot.status !== 'Approved' && nextStatus && (
          <Button
            variant="mobile"
            size="mobile"
            className="w-full"
            onClick={() => updateStatus(nextStatus.status)}
            disabled={loading}
          >
            <nextStatus.icon className="h-5 w-5 mr-2" />
            {loading ? 'Updating...' : nextStatus.label}
          </Button>
        )}

        {/* Completed - Show upload form */}
        {shoot.status === 'Completed' && (
          <div className="space-y-4 pt-2 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Link className="h-4 w-4 text-primary" />
              Upload Deliverables
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  QC Photos Link (Google Drive)
                </label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={qcLink}
                  onChange={(e) => setQcLink(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Raw Footage Link (Google Drive)
                </label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={rawLink}
                  onChange={(e) => setRawLink(e.target.value)}
                />
              </div>
              <Button
                variant="status"
                size="mobile"
                className="w-full"
                onClick={uploadLinks}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Submit Deliverables'}
              </Button>
            </div>
          </div>
        )}

        {/* QC Uploaded or Approved - Show links */}
        {(shoot.status === 'QC_Uploaded' || shoot.status === 'Approved') && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">Submitted Links</h4>
            <div className="flex flex-wrap gap-2">
              {shoot.qc_link && (
                <a
                  href={shoot.qc_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  QC Photos
                </a>
              )}
              {shoot.raw_link && (
                <a
                  href={shoot.raw_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Raw Footage
                </a>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-1 pt-2">
          {statusFlow.map((step, index) => {
            const isCompleted = currentStatusIndex >= index;

            return (
              <div
                key={step.status}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  isCompleted ? 'bg-status-completed' : 'bg-muted'
                }`}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { ShootStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ShootStatus;
  className?: string;
}

const statusConfig: Record<ShootStatus, { label: string; className: string }> = {
  Assigned: {
    label: 'Assigned',
    className: 'bg-status-assigned text-status-assigned-foreground',
  },
  Accepted: {
    label: 'Accepted',
    className: 'bg-status-accepted text-status-accepted-foreground',
  },
  Reached: {
    label: 'Reached',
    className: 'bg-status-reached text-status-reached-foreground',
  },
  Started: {
    label: 'Started',
    className: 'bg-status-started text-status-started-foreground',
  },
  Completed: {
    label: 'Completed',
    className: 'bg-status-completed text-status-completed-foreground',
  },
  QC_Uploaded: {
    label: 'QC Uploaded',
    className: 'bg-status-qc text-status-qc-foreground',
  },
  Approved: {
    label: 'Approved',
    className: 'bg-status-approved text-status-approved-foreground',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

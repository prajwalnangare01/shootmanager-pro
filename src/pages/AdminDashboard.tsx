import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ShootsTable } from '@/components/admin/ShootsTable';
import { CreateShootForm } from '@/components/admin/CreateShootForm';
import { InvoiceView } from '@/components/admin/InvoiceView';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Users, CheckCircle2, Clock } from 'lucide-react';

interface Stats {
  totalShoots: number;
  completedShoots: number;
  pendingShoots: number;
  photographers: number;
}

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalShoots: 0,
    completedShoots: 0,
    pendingShoots: 0,
    photographers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [shootsResult, photographersResult] = await Promise.all([
      supabase.from('shoots').select('status'),
      supabase.from('profiles').select('id').eq('role', 'photographer'),
    ]);

    if (shootsResult.data) {
      const shoots = shootsResult.data;
      const completed = shoots.filter((s) =>
        ['Completed', 'QC_Uploaded', 'Approved'].includes(s.status)
      ).length;
      const pending = shoots.filter((s) =>
        ['Assigned', 'Accepted', 'Reached', 'Started'].includes(s.status)
      ).length;

      setStats({
        totalShoots: shoots.length,
        completedShoots: completed,
        pendingShoots: pending,
        photographers: photographersResult.data?.length || 0,
      });
    }
  };

  const statCards = [
    {
      title: 'Total Shoots',
      value: stats.totalShoots,
      icon: Camera,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Completed',
      value: stats.completedShoots,
      icon: CheckCircle2,
      color: 'text-status-completed',
      bg: 'bg-status-completed/10',
    },
    {
      title: 'Pending',
      value: stats.pendingShoots,
      icon: Clock,
      color: 'text-status-assigned',
      bg: 'bg-status-assigned/10',
    },
    {
      title: 'Photographers',
      value: stats.photographers,
      icon: Users,
      color: 'text-status-reached',
      bg: 'bg-status-reached/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="pl-64">
        <div className="p-8">
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Overview of your photoshoot operations
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                  <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <ShootsTable />
            </div>
          )}

          {activeView === 'create' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Create Shoot</h1>
                <p className="text-muted-foreground mt-1">
                  Schedule a new restaurant photoshoot
                </p>
              </div>
              <CreateShootForm />
            </div>
          )}

          {activeView === 'invoices' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
                <p className="text-muted-foreground mt-1">
                  Track completed shoots and photographer payouts
                </p>
              </div>
              <InvoiceView />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

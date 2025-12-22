import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shoot } from '@/types/database';
import { AvailabilityCalendar } from '@/components/photographer/AvailabilityCalendar';
import { ShootCard } from '@/components/photographer/ShootCard';
import { Button } from '@/components/ui/button';
import { Camera, Calendar, Briefcase, LogOut, Loader2 } from 'lucide-react';

type ViewType = 'shoots' | 'availability';

export default function PhotographerDashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('shoots');
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShoots();
    }
  }, [user]);

  const fetchShoots = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .eq('photographer_id', user.id)
      .order('shoot_date', { ascending: true });

    if (error) {
      console.error('Error fetching shoots:', error);
    } else {
      setShoots(data as Shoot[]);
    }
    setLoading(false);
  };

  const pendingShoots = shoots.filter((s) =>
    ['Assigned', 'Accepted', 'Reached', 'Started'].includes(s.status)
  );
  const completedShoots = shoots.filter((s) =>
    ['Completed', 'QC_Uploaded', 'Approved'].includes(s.status)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-foreground">
                  Hi, {profile?.name?.split(' ')[0] || 'Photographer'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {pendingShoots.length} active shoot{pendingShoots.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {activeView === 'shoots' && (
          <div className="space-y-6 animate-fade-in">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : shoots.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">No Shoots Yet</h2>
                <p className="text-muted-foreground">
                  Mark your availability so the agency can assign shoots to you.
                </p>
                <Button
                  variant="gradient"
                  className="mt-4"
                  onClick={() => setActiveView('availability')}
                >
                  Set Availability
                </Button>
              </div>
            ) : (
              <>
                {pendingShoots.length > 0 && (
                  <section>
                    <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-status-assigned animate-pulse" />
                      Active Shoots
                    </h2>
                    <div className="space-y-4">
                      {pendingShoots.map((shoot) => (
                        <ShootCard key={shoot.id} shoot={shoot} onUpdate={fetchShoots} />
                      ))}
                    </div>
                  </section>
                )}

                {completedShoots.length > 0 && (
                  <section>
                    <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-status-completed" />
                      Completed ({completedShoots.length})
                    </h2>
                    <div className="space-y-4">
                      {completedShoots.slice(0, 3).map((shoot) => (
                        <ShootCard key={shoot.id} shoot={shoot} onUpdate={fetchShoots} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {activeView === 'availability' && (
          <div className="animate-fade-in">
            <AvailabilityCalendar />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="grid grid-cols-2 h-16">
          <button
            onClick={() => setActiveView('shoots')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeView === 'shoots'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs font-medium">My Shoots</span>
          </button>
          <button
            onClick={() => setActiveView('availability')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeView === 'availability'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">Availability</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

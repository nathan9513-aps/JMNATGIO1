import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, BarChart3, DollarSign } from "lucide-react";
import QuickTimeEntry from "@/components/time-tracking/quick-time-entry";
import ActiveTimers from "@/components/time-tracking/active-timers";
import MappingTable from "@/components/projects/mapping-table";
import TimeReports from "@/components/reports/time-reports";
import TimerDisplay from "@/components/time-tracking/timer-display";

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ["/api/reports/time-summary"],
    select: (data) => data || {
      totalSeconds: 0,
      billableSeconds: 0,
      totalEntries: 0,
      activeProjects: 0,
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
  });

  // Calculate today's total
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = entries.filter((entry: any) => {
    const entryDate = new Date(entry.startTime);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  const todayTotal = todayEntries.reduce((sum: number, entry: any) => 
    sum + (entry.durationSeconds || 0), 0
  );

  // Calculate this week's total
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEntries = entries.filter((entry: any) => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= weekStart;
  });
  const weekTotal = weekEntries.reduce((sum: number, entry: any) => 
    sum + (entry.durationSeconds || 0), 0
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Time Tracking Dashboard</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Total</p>
                  <TimerDisplay 
                    durationSeconds={todayTotal} 
                    className="text-3xl font-bold timer-display" 
                  />
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <TimerDisplay 
                    durationSeconds={weekTotal} 
                    className="text-3xl font-bold timer-display" 
                  />
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-teal-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-3xl font-bold" data-testid="active-projects-stat">
                    {summary?.activeProjects || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-blue-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
                  <TimerDisplay 
                    durationSeconds={summary?.billableSeconds || 0} 
                    className="text-3xl font-bold timer-display" 
                  />
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-yellow-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Time Entry and Active Timers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <QuickTimeEntry />
        <ActiveTimers />
      </div>

      {/* Client-Project Mapping Section */}
      <div className="mb-8">
        <MappingTable />
      </div>

      {/* Reporting Section */}
      <TimeReports />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, BarChart3, DollarSign } from "lucide-react";
import QuickTimeEntry from "@/components/time-tracking/quick-time-entry";
import ActiveTimers from "@/components/time-tracking/active-timers";
import MappingTable from "@/components/projects/mapping-table";
import TimeReports from "@/components/reports/time-reports";
import TimerDisplay from "@/components/time-tracking/timer-display";
import IssueManagement from "@/components/jira/issue-management";

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
          <div className="stat-card rounded-2xl p-6 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Today's Total</p>
                <TimerDisplay 
                  durationSeconds={todayTotal} 
                  className="text-3xl font-bold timer-display" 
                />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="stat-card rounded-2xl p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">This Week</p>
                <TimerDisplay 
                  durationSeconds={weekTotal} 
                  className="text-3xl font-bold timer-display" 
                />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="stat-card rounded-2xl p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold" data-testid="active-projects-stat">
                  {summary?.activeProjects || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="stat-card rounded-2xl p-6 fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Billable Hours</p>
                <TimerDisplay 
                  durationSeconds={summary?.billableSeconds || 0} 
                  className="text-3xl font-bold timer-display" 
                />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Time Entry and Active Timers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <QuickTimeEntry />
        </div>
        <div className="xl:col-span-1">
          <ActiveTimers />
        </div>
      </div>

      {/* Jira Issue Management */}
      <div className="mb-8">
        <IssueManagement />
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

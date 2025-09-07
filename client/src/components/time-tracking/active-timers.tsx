import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TimerDisplay from "./timer-display";

export default function ActiveTimers() {
  const { data: runningEntry } = useQuery({
    queryKey: ["/api/time-entries/running/default-user"],
    refetchInterval: 1000,
  });

  const { data: recentEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
    select: (data) => 
      data
        .filter((entry: any) => !entry.isRunning)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Timer */}
        {runningEntry && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{runningEntry.jiraIssueKey}</span>
              </div>
              <TimerDisplay 
                startTime={runningEntry.startTime} 
                className="text-lg font-bold text-primary" 
              />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {runningEntry.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Client: {runningEntry.clientId}</span>
              <span>Started: {new Date(runningEntry.startTime).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Recent Activities</h4>
          
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activities
            </p>
          ) : (
            recentEntries.map((entry: any) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.jiraIssueKey}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.clientId} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <TimerDisplay 
                  durationSeconds={entry.durationSeconds} 
                  className="font-medium text-sm" 
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

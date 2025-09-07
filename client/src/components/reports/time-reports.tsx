import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import TimerDisplay from "@/components/time-tracking/timer-display";

export default function TimeReports() {
  const { data: summary } = useQuery({
    queryKey: ["/api/reports/time-summary"],
    select: (data) => data || {
      totalSeconds: 0,
      billableSeconds: 0,
      totalEntries: 0,
      activeProjects: 0,
      entries: [],
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const clientDistribution = summary?.entries?.reduce((acc: Record<string, number>, entry: any) => {
    if (entry.clientId) {
      acc[entry.clientId] = (acc[entry.clientId] || 0) + (entry.durationSeconds || 0);
    }
    return acc;
  }, {}) || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Reports</CardTitle>
          <div className="flex space-x-2">
            <Select defaultValue="last-7-days">
              <SelectTrigger className="w-40" data-testid="date-range-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" data-testid="export-button">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-2xl font-bold timer-display" data-testid="total-logged">
              {formatTime(summary?.totalSeconds || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Logged</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-2xl font-bold timer-display" data-testid="billable-hours">
              {formatTime(summary?.billableSeconds || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Billable Hours</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-2xl font-bold" data-testid="active-projects-count">
              {summary?.activeProjects || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Projects</div>
          </div>
        </div>

        {/* Time by Client Chart Area */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-medium mb-4">Time Distribution by Client</h4>
          <div className="space-y-3">
            {Object.entries(clientDistribution).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No time entries found for the selected period
              </p>
            ) : (
              Object.entries(clientDistribution).map(([clientId, seconds], index) => (
                <div 
                  key={clientId} 
                  className="flex items-center justify-between py-2"
                  data-testid={`client-time-${clientId}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded bg-chart-${(index % 5) + 1}`}></div>
                    <span>{clientId}</span>
                  </div>
                  <TimerDisplay 
                    durationSeconds={seconds as number} 
                    className="font-medium" 
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Edit, Trash2 } from "lucide-react";
import QuickTimeEntry from "@/components/time-tracking/quick-time-entry";
import TimerDisplay from "@/components/time-tracking/timer-display";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TimeTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["/api/time-entries"],
    select: (data) =>
      data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
  });

  const { data: runningEntry } = useQuery({
    queryKey: ["/api/time-entries/running/default-user"],
    refetchInterval: 1000,
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const endTime = new Date();
      const entry = entries.find((e: any) => e.id === entryId);
      const startTime = new Date(entry.startTime);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      await apiRequest("PUT", `/api/time-entries/${entryId}`, {
        endTime: endTime.toISOString(),
        durationSeconds,
        isRunning: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Timer stopped",
        description: "Time entry has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/time-entries/${entryId}`);
    },
    onSuccess: () => {
      toast({
        title: "Entry deleted",
        description: "Time entry has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading time entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Time Tracking</h2>

      {/* Active Timer Alert */}
      {runningEntry && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">Currently tracking: {runningEntry.jiraIssueKey}</p>
                  <p className="text-sm text-muted-foreground">{runningEntry.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <TimerDisplay 
                  startTime={runningEntry.startTime} 
                  className="text-2xl font-bold text-primary" 
                />
                <Button
                  variant="destructive"
                  onClick={() => stopTimerMutation.mutate(runningEntry.id)}
                  disabled={stopTimerMutation.isPending}
                  data-testid="stop-active-timer"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Time Entry */}
      <QuickTimeEntry />

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No time entries found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first time entry using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
                  data-testid={`time-entry-${entry.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge 
                        variant={entry.isRunning ? "destructive" : "default"}
                        data-testid={`entry-status-${entry.id}`}
                      >
                        {entry.isRunning ? "Running" : "Completed"}
                      </Badge>
                      <span className="font-medium">{entry.jiraIssueKey}</span>
                      {entry.isBillable && (
                        <Badge variant="secondary">Billable</Badge>
                      )}
                    </div>
                    <p className="text-sm mb-2">{entry.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Client: {entry.clientId}</span>
                      <span>Started: {new Date(entry.startTime).toLocaleString()}</span>
                      {entry.endTime && (
                        <span>Ended: {new Date(entry.endTime).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {entry.isRunning ? (
                        <TimerDisplay 
                          startTime={entry.startTime} 
                          className="text-lg font-bold text-primary" 
                        />
                      ) : (
                        <TimerDisplay 
                          durationSeconds={entry.durationSeconds} 
                          className="text-lg font-bold" 
                        />
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {entry.isRunning && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => stopTimerMutation.mutate(entry.id)}
                          disabled={stopTimerMutation.isPending}
                          data-testid={`stop-timer-${entry.id}`}
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`edit-entry-${entry.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntryMutation.mutate(entry.id)}
                        disabled={deleteEntryMutation.isPending}
                        data-testid={`delete-entry-${entry.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

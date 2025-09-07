import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Play } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const timeEntrySchema = z.object({
  jiraIssueKey: z.string().min(1, "Jira issue is required"),
  clientId: z.string().min(1, "Client is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type TimeEntryData = z.infer<typeof timeEntrySchema>;

export default function QuickTimeEntry() {
  const [issueSearch, setIssueSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TimeEntryData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      jiraIssueKey: "",
      clientId: "",
      description: "",
      startTime: "09:00",
      endTime: "11:30",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["/api/jira/search-issues", issueSearch],
    enabled: issueSearch.length > 2,
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: TimeEntryData) => {
      const startDateTime = new Date();
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      
      startDateTime.setHours(startHour, startMinute, 0, 0);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      const durationSeconds = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);

      const response = await apiRequest("POST", "/api/time-entries", {
        userId: "default-user",
        jiraIssueKey: data.jiraIssueKey,
        clientId: data.clientId,
        description: data.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationSeconds,
        isBillable: true,
        isRunning: false,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Time entry created",
        description: "Time has been logged successfully",
      });
      form.reset();
      setSelectedIssue(null);
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive",
      });
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/time-entries", {
        userId: "default-user",
        jiraIssueKey: form.getValues("jiraIssueKey"),
        clientId: form.getValues("clientId"),
        description: form.getValues("description"),
        startTime: new Date().toISOString(),
        isRunning: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer started",
        description: "Time tracking has begun",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
  });

  const onSubmit = (data: TimeEntryData) => {
    createTimeEntryMutation.mutate(data);
  };

  const handleStartTimer = () => {
    const values = form.getValues();
    if (!values.jiraIssueKey || !values.clientId || !values.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields before starting timer",
        variant: "destructive",
      });
      return;
    }
    startTimerMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Time Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Issue Search */}
            <FormField
              control={form.control}
              name="jiraIssueKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jira Issue</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Search issues... (e.g., PROJ-123)"
                        value={issueSearch}
                        onChange={(e) => {
                          setIssueSearch(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        data-testid="issue-search-input"
                      />
                      <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  {selectedIssue && (
                    <div className="mt-2 bg-muted rounded border p-2 text-sm">
                      <div className="font-medium">{selectedIssue.key}: {selectedIssue.fields.summary}</div>
                      <div className="text-muted-foreground">
                        {selectedIssue.fields.issuetype.name} • {selectedIssue.fields.status.name}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (FileMaker)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="client-select">
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Input */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="start-time-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="end-time-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work performed..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="description-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={createTimeEntryMutation.isPending}
                data-testid="submit-time-entry-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Time to Jira
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleStartTimer}
                disabled={startTimerMutation.isPending}
                data-testid="start-timer-button"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

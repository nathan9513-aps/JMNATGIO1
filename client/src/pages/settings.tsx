import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  jiraDomain: z.string().min(1, "Jira domain is required"),
  jiraUsername: z.string().email("Valid email is required"),
  jiraApiToken: z.string().min(1, "API token is required"),
  filemakerHost: z.string().min(1, "FileMaker host is required"),
  filemakerDatabase: z.string().min(1, "Database name is required"),
  filemakerUsername: z.string().min(1, "Username is required"),
  filemakerPassword: z.string().min(1, "Password is required"),
});

type SettingsData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/user/default-user"],
    enabled: false,
  });

  const form = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      jiraDomain: user?.jiraDomain || "",
      jiraUsername: user?.jiraUsername || "",
      jiraApiToken: user?.jiraApiToken || "",
      filemakerHost: user?.filemakerHost || "",
      filemakerDatabase: user?.filemakerDatabase || "",
      filemakerUsername: user?.filemakerUsername || "",
      filemakerPassword: user?.filemakerPassword || "",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      const response = await apiRequest("PUT", "/api/user/default-user/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/default-user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsData) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Jira Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Jira Cloud Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="jiraDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira Domain</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your-domain (without .atlassian.net)" 
                        {...field}
                        data-testid="jira-domain-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jiraUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira Username (Email)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your.email@company.com" 
                        {...field}
                        data-testid="jira-username-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jiraApiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira API Token</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Your Jira API token" 
                        {...field}
                        data-testid="jira-api-token-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* FileMaker Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>FileMaker Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="filemakerHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FileMaker Server Host</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your-filemaker-server.com" 
                        {...field}
                        data-testid="filemaker-host-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filemakerDatabase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ClientDatabase" 
                        {...field}
                        data-testid="filemaker-database-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filemakerUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="filemaker-username" 
                        {...field}
                        data-testid="filemaker-username-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filemakerPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="filemaker-password" 
                        {...field}
                        data-testid="filemaker-password-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full"
            disabled={updateSettingsMutation.isPending}
            data-testid="save-settings-button"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

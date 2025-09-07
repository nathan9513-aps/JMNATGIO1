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

const jiraCredentialsSchema = z.object({
  jiraDomain: z.string().min(1, "Jira domain is required"),
  jiraUsername: z.string().email("Valid email is required"),
  jiraApiToken: z.string().min(1, "API token is required"),
});

type JiraCredentialsData = z.infer<typeof jiraCredentialsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jiraCredentials, isLoading } = useQuery({
    queryKey: ["/api/jira/credentials"],
  });

  const form = useForm<JiraCredentialsData>({
    resolver: zodResolver(jiraCredentialsSchema),
    defaultValues: {
      jiraDomain: "",
      jiraUsername: "",
      jiraApiToken: "",
    },
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: async (data: JiraCredentialsData) => {
      return await apiRequest("/api/jira/credentials", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Credentials saved",
        description: "Your Jira configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jira/credentials"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save Jira credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JiraCredentialsData) => {
    updateCredentialsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Jira Configuration</h2>
        <p>Loading credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Jira Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure your Jira Cloud credentials to enable issue management and time tracking.
        </p>
        {jiraCredentials?.configured && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Jira credentials are configured and working
            </p>
          </div>
        )}
      </div>
      
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
                    <p className="text-sm text-muted-foreground">
                      Create an API token at:{" "}
                      <a 
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        https://id.atlassian.com/manage-profile/security/api-tokens
                      </a>
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>


          <Button 
            type="submit" 
            className="w-full"
            disabled={updateCredentialsMutation.isPending}
            data-testid="save-jira-credentials-button"
          >
            {updateCredentialsMutation.isPending ? "Saving..." : "Save Jira Credentials"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

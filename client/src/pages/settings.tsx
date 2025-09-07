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
import { ExternalLink, Shield, Check } from "lucide-react";
import { useState, useEffect } from "react";

const jiraCredentialsSchema = z.object({
  jiraDomain: z.string().min(1, "Jira domain is required"),
  jiraUsername: z.string().email("Valid email is required"),
  jiraApiToken: z.string().min(1, "API token is required"),
});

type JiraCredentialsData = z.infer<typeof jiraCredentialsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOAuthFlow, setIsOAuthFlow] = useState(false);

  const { data: jiraCredentials, isLoading } = useQuery({
    queryKey: ["/api/jira/credentials"],
  });

  const { data: oauthStatus } = useQuery({
    queryKey: ["/api/jira/oauth/status"],
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

  // OAuth flow mutations
  const oauthAuthMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/jira/oauth/auth-url");
    },
    onSuccess: (data: any) => {
      window.open(data.authUrl, '_blank', 'width=600,height=700');
      setIsOAuthFlow(true);
      toast({
        title: "OAuth Login",
        description: "Please complete the login in the popup window.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to start OAuth flow",
        variant: "destructive",
      });
    },
  });

  const handleOAuthCallback = async (code: string) => {
    try {
      const result = await apiRequest("/api/jira/oauth/callback", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      
      toast({
        title: "Success!",
        description: `Connected to ${result.siteName}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/jira/oauth/status"] });
      setIsOAuthFlow(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "OAuth authentication failed",
        variant: "destructive",
      });
    }
  };

  // Listen for OAuth callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'JIRA_OAUTH_CALLBACK' && event.data.code) {
        handleOAuthCallback(event.data.code);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
        {jiraCredentials && (jiraCredentials as any).configured && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Jira API Token credentials are configured and working
            </p>
          </div>
        )}
        {oauthStatus && (oauthStatus as any).authenticated && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              ✓ Jira OAuth authentication is active
            </p>
          </div>
        )}
      </div>
      
      {/* OAuth Authentication Section */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            OAuth 2.0 Authentication (Recommended)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use OAuth for secure, token-free authentication with your Jira account.
            No need to manage API tokens - just login once with your Jira credentials.
          </p>
          
          {(oauthStatus as any)?.oauthConfigured ? (
            <div className="space-y-3">
              {(oauthStatus as any)?.authenticated ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>OAuth authentication active</span>
                </div>
              ) : (
                <Button 
                  onClick={() => oauthAuthMutation.mutate()}
                  disabled={oauthAuthMutation.isPending || isOAuthFlow}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="oauth-login-button"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {oauthAuthMutation.isPending || isOAuthFlow ? "Connecting..." : "Connect with Jira OAuth"}
                </Button>
              )}
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                OAuth is not configured. Administrator needs to set up Jira OAuth Client ID and Secret.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* API Token Authentication Section */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Token Authentication (Legacy)</CardTitle>
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

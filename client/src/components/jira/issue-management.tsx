import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Edit, 
  Plus, 
  Search, 
  ExternalLink, 
  Clock, 
  User, 
  Tag,
  AlertCircle,
  CheckCircle,
  Clock4
} from "lucide-react";

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: { name: string };
    status: { name: string };
    assignee?: { displayName: string };
    project: { key: string; name: string };
    labels?: string[];
    priority?: { name: string };
  };
}

const updateIssueSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  description: z.string().optional(),
  labels: z.string().optional(),
});

const createIssueSchema = z.object({
  projectKey: z.string().min(1, "Project is required"),
  summary: z.string().min(1, "Summary is required"),
  description: z.string().optional(),
  issueType: z.string().min(1, "Issue type is required"),
  labels: z.string().optional(),
});

type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;
type CreateIssueFormData = z.infer<typeof createIssueSchema>;

interface IssueManagementProps {
  jiraConfig?: {
    domain: string;
    username: string;
    apiToken: string;
  };
}

export default function IssueManagement({ jiraConfig }: IssueManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search issues
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/jira/search-issues', searchQuery],
    queryFn: async () => {
      const response = await apiRequest('/api/jira/search-issues', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery, jiraConfig })
      });
      return response;
    },
    enabled: !!searchQuery && !!jiraConfig,
  });

  // Get projects for create form
  const { data: projects } = useQuery({
    queryKey: ['/api/jira/projects'],
    queryFn: async () => {
      return await fetch(`/api/jira/projects?jiraConfig=${encodeURIComponent(JSON.stringify(jiraConfig))}`).then(r => r.json());
    },
    enabled: !!jiraConfig,
  });

  // Update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: async (data: { issueKey: string; updateData: any }) => {
      const response = await apiRequest('/api/jira/update-issue', {
        method: 'POST',
        body: JSON.stringify({ ...data, jiraConfig })
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Issue updated successfully!" });
      setShowUpdateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/jira/search-issues'] });
    },
    onError: () => {
      toast({ 
        title: "Failed to update issue", 
        description: "Please check your Jira configuration and try again.",
        variant: "destructive" 
      });
    },
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (data: { issueData: any }) => {
      const response = await apiRequest('/api/jira/create-issue', {
        method: 'POST',
        body: JSON.stringify({ ...data, jiraConfig })
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Issue created successfully!",
        description: `Created issue ${data.key || 'New Issue'}`
      });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/jira/search-issues'] });
    },
    onError: () => {
      toast({ 
        title: "Failed to create issue", 
        description: "Please check your Jira configuration and try again.",
        variant: "destructive" 
      });
    },
  });

  const updateForm = useForm<UpdateIssueFormData>({
    resolver: zodResolver(updateIssueSchema),
  });

  const createForm = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
  });

  const onUpdateSubmit = (data: UpdateIssueFormData) => {
    if (!selectedIssue) return;
    
    const updateData = {
      fields: {
        summary: data.summary,
        ...(data.description && { description: data.description }),
        ...(data.labels && { labels: data.labels.split(',').map(l => l.trim()) }),
      }
    };

    updateIssueMutation.mutate({ 
      issueKey: selectedIssue.key, 
      updateData 
    });
  };

  const onCreateSubmit = (data: CreateIssueFormData) => {
    const issueData = {
      fields: {
        project: { key: data.projectKey },
        summary: data.summary,
        issuetype: { name: data.issueType },
        ...(data.description && { description: data.description }),
        ...(data.labels && { labels: data.labels.split(',').map(l => l.trim()) }),
      }
    };

    createIssueMutation.mutate({ issueData });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in progress':
      case 'in development':
        return <Clock4 className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in progress':
      case 'in development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  if (!jiraConfig) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Jira Configuration Required</h3>
            <p className="text-muted-foreground">
              Please configure your Jira settings in the Settings page to manage issues.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Jira Issue Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search issues by key or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-issues-input"
              />
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary hover-lift" data-testid="create-issue-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Jira Issue</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                    <FormField
                      control={createForm.control}
                      name="projectKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="project-select">
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(projects) && projects.map((project: any) => (
                                <SelectItem key={project.key} value={project.key}>
                                  {project.name} ({project.key})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="issueType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="issue-type-select">
                                <SelectValue placeholder="Select issue type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Task">Task</SelectItem>
                              <SelectItem value="Bug">Bug</SelectItem>
                              <SelectItem value="Story">Story</SelectItem>
                              <SelectItem value="Improvement">Improvement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="issue-summary-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4} 
                              placeholder="Describe the issue in detail..."
                              data-testid="issue-description-input" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="labels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labels (comma separated)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="label1, label2" data-testid="issue-labels-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="gradient-primary"
                        disabled={createIssueMutation.isPending}
                        data-testid="submit-create-issue"
                      >
                        {createIssueMutation.isPending ? 'Creating...' : 'Create Issue'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2">Searching issues...</span>
              </div>
            ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((issue: JiraIssue) => (
                  <div key={issue.key} className="border border-border/60 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {issue.key}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(issue.fields.status.name)}`}>
                            {getStatusIcon(issue.fields.status.name)}
                            <span className="ml-1">{issue.fields.status.name}</span>
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {issue.fields.issuetype.name}
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
                          {issue.fields.summary}
                        </h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{issue.fields.project.name}</span>
                          </div>
                          {issue.fields.assignee && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{issue.fields.assignee.displayName}</span>
                            </div>
                          )}
                        </div>

                        {issue.fields.labels && issue.fields.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {issue.fields.labels.map((label, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://${jiraConfig.domain}.atlassian.net/browse/${issue.key}`, '_blank')}
                          data-testid={`view-issue-${issue.key}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        
                        <Dialog open={showUpdateDialog && selectedIssue?.key === issue.key} onOpenChange={(open) => {
                          setShowUpdateDialog(open);
                          if (open) {
                            setSelectedIssue(issue);
                            updateForm.reset({
                              summary: issue.fields.summary,
                              description: issue.fields.description || "",
                              labels: issue.fields.labels?.join(', ') || "",
                            });
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="gradient-primary hover-lift"
                              data-testid={`edit-issue-${issue.key}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Issue {issue.key}</DialogTitle>
                            </DialogHeader>
                            <Form {...updateForm}>
                              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-6">
                                <FormField
                                  control={updateForm.control}
                                  name="summary"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Summary</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="update-summary-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={updateForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={4} data-testid="update-description-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={updateForm.control}
                                  name="labels"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Labels (comma separated)</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="label1, label2" data-testid="update-labels-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button type="button" variant="outline" onClick={() => setShowUpdateDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    className="gradient-primary"
                                    disabled={updateIssueMutation.isPending}
                                    data-testid="submit-update-issue"
                                  >
                                    {updateIssueMutation.isPending ? 'Updating...' : 'Update Issue'}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No issues found for "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
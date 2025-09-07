import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Link as LinkIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MappingTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["/api/client-project-mappings"],
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/client-project-mappings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Mapping deleted",
        description: "Client-project mapping has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client-project-mappings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete mapping",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client-Project Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading mappings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Client-Project Mappings</span>
          </CardTitle>
          <Button data-testid="add-mapping-button">
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No client-project mappings found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create mappings to associate FileMaker clients with Jira projects
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    FileMaker Client
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Jira Project
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Default Assignee
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping: any) => (
                  <tr 
                    key={mapping.id} 
                    className="border-b border-border hover:bg-muted/50"
                    data-testid={`mapping-row-${mapping.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {mapping.client?.name || "Unknown Client"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {mapping.clientId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {mapping.project?.name || "Unknown Project"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Key: {mapping.project?.jiraProjectKey}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {mapping.defaultAssignee ? (
                        <div>
                          <div className="font-medium">{mapping.defaultAssignee}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={mapping.isActive ? "default" : "secondary"}
                        data-testid={`mapping-status-${mapping.id}`}
                      >
                        {mapping.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`edit-mapping-${mapping.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMappingMutation.mutate(mapping.id)}
                          disabled={deleteMappingMutation.isPending}
                          data-testid={`delete-mapping-${mapping.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

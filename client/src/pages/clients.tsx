import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, FolderSync } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: localClients = [], isLoading: isLoadingLocal } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: filemakerClients = [], isLoading: isLoadingFilemaker } = useQuery({
    queryKey: ["/api/filemaker/clients"],
    enabled: false, // Only fetch when explicitly requested
  });

  const syncFilemakerMutation = useMutation({
    mutationFn: async () => {
      // This would typically sync with FileMaker
      // For now, we'll just refetch the local clients
      await queryClient.refetchQueries({ queryKey: ["/api/filemaker/clients"] });
    },
    onSuccess: () => {
      toast({
        title: "FolderSync completed",
        description: "FileMaker clients have been synchronized",
      });
    },
    onError: () => {
      toast({
        title: "FolderSync failed",
        description: "Failed to synchronize with FileMaker",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "Client has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const filteredClients = localClients.filter((client: any) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.fileMakerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingLocal) {
    return (
      <div className="text-center py-8">
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Management</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => syncFilemakerMutation.mutate()}
            disabled={syncFilemakerMutation.isPending}
            data-testid="sync-filemaker-button"
          >
            <FolderSync className="w-4 h-4 mr-2" />
            FolderSync FileMaker
          </Button>
          <Button data-testid="add-client-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="client-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Local Clients ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No clients found matching your search" : "No clients found"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add clients manually or sync from FileMaker
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client: any) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
                  data-testid={`client-${client.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium">{client.name}</h3>
                      <Badge 
                        variant={client.isActive ? "default" : "secondary"}
                        data-testid={`client-status-${client.id}`}
                      >
                        {client.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {client.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {client.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      {client.fileMakerId && (
                        <span>FileMaker ID: {client.fileMakerId}</span>
                      )}
                      {client.contactEmail && (
                        <span>Contact: {client.contactEmail}</span>
                      )}
                      <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`edit-client-${client.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteClientMutation.mutate(client.id)}
                      disabled={deleteClientMutation.isPending}
                      data-testid={`delete-client-${client.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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

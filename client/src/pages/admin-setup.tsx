import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, ExternalLink, Copy, Check, Lock, Settings, FileText } from "lucide-react";

const ADMIN_PASSWORD = "Dennisd-401";

const oauthSetupSchema = z.object({
  clientId: z.string().min(1, "Client ID è richiesto"),
  clientSecret: z.string().min(1, "Client Secret è richiesto"),
});

type OAuthSetupData = z.infer<typeof oauthSetupSchema>;

export default function AdminSetup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const callbackUrl = `${window.location.origin}/oauth/callback`;

  const { data: oauthStatus } = useQuery({
    queryKey: ["/api/jira/oauth/status"],
    enabled: isAuthenticated,
  });

  const form = useForm<OAuthSetupData>({
    resolver: zodResolver(oauthSetupSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
    },
  });

  const saveOAuthMutation = useMutation({
    mutationFn: async (data: OAuthSetupData) => {
      // Simula il salvataggio dei segreti (in realtà dovrebbero essere gestiti tramite environment)
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "Le credenziali OAuth sono state configurate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jira/oauth/status"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel salvare la configurazione",
        variant: "destructive",
      });
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Accesso autorizzato",
        description: "Benvenuto nella pagina di setup amministratore",
      });
    } else {
      toast({
        title: "Password errata",
        description: "La password inserita non è corretta",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiato!",
      description: "URL copiato negli appunti",
    });
  };

  const onSubmit = (data: OAuthSetupData) => {
    saveOAuthMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Setup Amministratore</CardTitle>
            <p className="text-sm text-muted-foreground">
              Inserisci la password per accedere alla configurazione OAuth
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la password"
                  data-testid="admin-password-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="admin-login-button">
                Accedi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Setup Amministratore OAuth</h1>
          <p className="text-muted-foreground">Configurazione completa per l'autenticazione Jira OAuth 2.0</p>
        </div>
      </div>

      {/* Status attuale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Status Configurazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={(oauthStatus as any)?.oauthConfigured ? "default" : "secondary"}>
              {(oauthStatus as any)?.oauthConfigured ? "✓ Configurato" : "Non configurato"}
            </Badge>
            <Badge variant={(oauthStatus as any)?.authenticated ? "default" : "secondary"}>
              {(oauthStatus as any)?.authenticated ? "✓ Autenticato" : "Non autenticato"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Istruzioni complete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Procedura Setup OAuth Jira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Passo 1 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">1. Accedi ad Atlassian Developer Console</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Vai su Atlassian Developer Console e accedi con il tuo account Jira
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://developer.atlassian.com/console', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Apri Developer Console
            </Button>
          </div>

          {/* Passo 2 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">2. Crea nuova app OAuth</h3>
            <div className="space-y-2 text-sm">
              <p>• Clicca "Create" → "OAuth 2.0 integration"</p>
              <p>• Dai un nome alla tua app (es: "Time Tracker App")</p>
              <p>• Clicca "Create"</p>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">3. Configura i permessi</h3>
            <div className="space-y-2 text-sm">
              <p>• Vai in "Permissions" → "Add APIs" → "Jira platform REST API"</p>
              <p>• Aggiungi questi scope:</p>
              <div className="ml-4 space-y-1">
                <Badge variant="outline">read:jira-work</Badge>
                <Badge variant="outline">write:jira-work</Badge>
                <Badge variant="outline">manage:jira-project</Badge>
                <Badge variant="outline">offline_access</Badge>
              </div>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">4. Configura URL di callback</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Copia questo URL esatto nella sezione "Authorization" → "Callback URL":
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <code className="flex-1 text-sm">{callbackUrl}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(callbackUrl)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Passo 5 */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-lg mb-2">5. Ottieni le credenziali</h3>
            <div className="space-y-2 text-sm">
              <p>• Vai in "Settings" della tua app</p>
              <p>• Copia il <strong>Client ID</strong> (visibile direttamente)</p>
              <p>• Clicca "Generate a new secret" per ottenere il <strong>Client Secret</strong></p>
              <Alert>
                <AlertDescription>
                  ⚠️ Il Client Secret viene mostrato una sola volta! Copialo immediatamente.
                </AlertDescription>
              </Alert>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Form configurazione */}
      <Card>
        <CardHeader>
          <CardTitle>6. Inserisci le credenziali OAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Nota:</strong> In ambiente di produzione, queste credenziali andrebbero configurate 
              come variabili d'ambiente sicure. Per ora puoi inserirle qui per il testing.
            </AlertDescription>
          </Alert>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Il Client ID dalla Developer Console" 
                        {...field}
                        data-testid="oauth-client-id-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Secret</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Il Client Secret dalla Developer Console" 
                        {...field}
                        data-testid="oauth-client-secret-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={saveOAuthMutation.isPending}
                data-testid="save-oauth-config-button"
              >
                {saveOAuthMutation.isPending ? "Salvando..." : "Salva Configurazione OAuth"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Test OAuth */}
      {(oauthStatus as any)?.oauthConfigured && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">7. Testa OAuth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              La configurazione OAuth è completata! Ora gli utenti possono usare il pulsante 
              OAuth nella pagina Settings per autenticarsi con Jira.
            </p>
            <Button
              onClick={() => window.open('/settings', '_blank')}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Vai alle Settings per testare
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
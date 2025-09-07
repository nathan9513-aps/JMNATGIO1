import { useEffect } from "react";
import { useLocation } from "wouter";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get the authorization code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    console.log("🔐 OAuth callback page loaded:", { 
      code: !!code, 
      error: !!error, 
      hasOpener: !!window.opener,
      isPopup: window.opener !== null 
    });

    if (error) {
      console.error("OAuth error received:", error);
      
      // Try to send error to parent window if it's a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'JIRA_OAUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      } else {
        // Not a popup - redirect with error
        setLocation(`/settings?error=${encodeURIComponent(error)}`);
      }
      return;
    }

    if (code) {
      console.log("✅ Authorization code received");
      
      // Try to send the code to the parent window if it's a popup
      if (window.opener) {
        console.log("📨 Sending code to parent window");
        window.opener.postMessage({
          type: 'JIRA_OAUTH_CALLBACK',
          code: code,
          state: state
        }, window.location.origin);
        
        // Close the popup window
        window.close();
      } else {
        // Not a popup - handle directly by redirecting to server endpoint
        console.log("🔄 Not a popup, redirecting to server callback");
        window.location.href = `/oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
      }
    } else {
      console.error("No authorization code received");
      // No code received, redirect to settings
      setLocation('/settings?error=no_code');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing OAuth...</h2>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
}
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

    if (error) {
      // Send error to parent window and close
      if (window.opener) {
        window.opener.postMessage({
          type: 'JIRA_OAUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }

    if (code) {
      // Send the code to the parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'JIRA_OAUTH_CALLBACK',
          code: code,
          state: state
        }, window.location.origin);
      }
      
      // Close the popup window
      window.close();
    } else {
      // No code received, redirect to settings
      setLocation('/settings');
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
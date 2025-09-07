import { useState } from "react";
import { Menu, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimerDisplay from "@/components/time-tracking/timer-display";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: runningEntry } = useQuery({
    queryKey: ["/api/time-entries/running/default-user"],
    refetchInterval: 1000,
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar?.classList.toggle('mobile-open');
    overlay?.classList.toggle('hidden');
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMobileMenu}
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            {/* Current Timer Display */}
            {runningEntry && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Currently Tracking</span>
                  </div>
                  <TimerDisplay 
                    startTime={runningEntry.startTime} 
                    className="text-2xl font-bold text-primary" 
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    data-testid="stop-timer-button"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">JD</span>
              </div>
              <span className="text-sm font-medium">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden hidden" 
        id="mobile-overlay"
        onClick={toggleMobileMenu}
      />
    </>
  );
}

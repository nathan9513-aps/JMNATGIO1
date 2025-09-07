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
      <header className="bg-card border-b border-border px-4 py-4 w-full">
        <div className="flex items-center justify-between w-full">
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
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full running-indicator"></div>
                    <span className="text-sm font-semibold">Currently Tracking</span>
                  </div>
                  <TimerDisplay 
                    startTime={runningEntry.startTime} 
                    className="text-2xl font-bold timer-glow" 
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shadow-md hover:shadow-lg transition-shadow"
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

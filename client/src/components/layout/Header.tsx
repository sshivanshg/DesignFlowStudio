import { useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useLocation } from "wouter";
import { Bell, MessageSquare, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NotificationsModal from "@/components/common/NotificationsModal";
import MessagesModal from "@/components/common/MessagesModal";

interface HeaderProps {
  title: string;
}

const pageMap: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/crm": "CRM",
  "/proposals": "Proposals",
  "/estimates": "Estimates",
  "/moodboard": "Moodboard",
  "/clients": "Clients",
  "/settings": "Settings"
};

export default function Header({ title }: HeaderProps) {
  const { toggle } = useSidebar();
  const [location] = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  
  const pageTitle = title || pageMap[location] || "Dashboard";
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={toggle}
              variant="ghost"
              size="icon"
              className="mr-4 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="w-64 pl-8 text-sm"
              />
            </div>
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">3</span>
            </Button>
            
            {/* Messages */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsMessagesOpen(true)}
              aria-label="Messages"
            >
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">5</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
      
      <MessagesModal 
        isOpen={isMessagesOpen} 
        onClose={() => setIsMessagesOpen(false)} 
      />
    </header>
  );
}

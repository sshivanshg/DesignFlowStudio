import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "@/hooks/use-sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { isOpen, close } = useSidebar();
  
  // Close the overlay when clicking outside of sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById("sidebar");
        const target = event.target as Node;
        
        if (sidebar && !sidebar.contains(target)) {
          close();
        }
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close]);
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div id="sidebar">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={close}
        />
      )}
    </div>
  );
}

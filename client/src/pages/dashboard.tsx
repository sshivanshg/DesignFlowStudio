import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentProjects from "@/components/dashboard/RecentProjects";
import RecentProposals from "@/components/dashboard/RecentProposals";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ClientActivity from "@/components/dashboard/ClientActivity";
import AIAssistant from "@/components/dashboard/AIAssistant";

export default function Dashboard() {
  return (
    <>
      {/* Quick Stats */}
      <StatsOverview />
      
      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentProjects />
          <RecentProposals />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <UpcomingTasks />
          <ClientActivity />
          <AIAssistant />
        </div>
      </div>
    </>
  );
}

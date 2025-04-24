import PageHeader from "@/components/layout/page-header";
import StatisticsCards from "@/components/dashboard/statistics-cards";
import RecentTrainings from "@/components/dashboard/recent-trainings";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentDocuments from "@/components/dashboard/recent-documents";
import ModuleCards from "@/components/dashboard/module-cards";

export default function Dashboard() {
  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description="Pregled sistema za bezbednost i zdravlje na radu" 
      />
      
      <StatisticsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <RecentTrainings />
        
        <div className="space-y-6">
          <QuickActions />
          <RecentDocuments />
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Moduli sistema</h2>
        <ModuleCards />
      </div>
    </>
  );
}

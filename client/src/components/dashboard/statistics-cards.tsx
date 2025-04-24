import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

export default function StatisticsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  const stats: StatCard[] = [
    {
      title: "Ukupan broj zaposlenih",
      value: data?.employeeCount || 0,
      icon: "fas fa-user-shield",
      color: "text-primary-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Obuke završeno",
      value: data?.completedTrainings || 0,
      icon: "fas fa-clipboard-check",
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Obuke u toku",
      value: data?.inProgressTrainings || 0,
      icon: "fas fa-exclamation-circle",
      color: "text-yellow-500",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Dokumenti",
      value: data?.documentCount || 0,
      icon: "fas fa-file-pdf",
      color: "text-red-500",
      bgColor: "bg-red-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card className="p-5" key={index}>
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card className="p-5" key={index}>
          <div className="flex items-center">
            <div className={`rounded-full ${stat.bgColor} p-3`}>
              <i className={`${stat.icon} ${stat.color}`}></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

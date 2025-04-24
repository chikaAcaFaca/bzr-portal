import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor, formatDate } from "@/lib/utils";
import { EmployeeTraining, TrainingType, Employee, JobPosition } from "@shared/schema";
import { Link } from "wouter";

export default function RecentTrainings() {
  const { data: trainings, isLoading: isLoadingTrainings } = useQuery({
    queryKey: ['/api/employee-trainings'],
  });
  
  const { data: trainingTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/training-types'],
  });
  
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  const { data: jobPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });
  
  const isLoading = isLoadingTrainings || isLoadingTypes || isLoadingEmployees || isLoadingPositions;
  
  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Nepoznato';
  };
  
  const getEmployeeEmail = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? employee.email : '';
  };
  
  const getTrainingTypeName = (typeId: number) => {
    const type = trainingTypes?.find(t => t.id === typeId);
    return type ? `${type.code} - ${type.name}` : 'Nepoznato';
  };
  
  const getJobPosition = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    if (!employee) return 'Nepoznato';
    
    const position = jobPositions?.find(p => p.id === employee.jobPositionId);
    return position ? position.title : 'Nepoznato';
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader className="border-b">
          <CardTitle>Nedavne obuke zaposlenih</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zaposleni</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radno mesto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip obuke</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32 mt-1" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // Sort trainings by date, most recent first
  const sortedTrainings = trainings ? [...trainings].sort((a, b) => 
    new Date(b.trainingDate).getTime() - new Date(a.trainingDate).getTime()
  ).slice(0, 4) : [];

  return (
    <Card className="col-span-2">
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">Nedavne obuke zaposlenih</CardTitle>
        <Link href="/employee-training">
          <a className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Pogledaj sve <i className="fas fa-arrow-right ml-1"></i>
          </a>
        </Link>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zaposleni
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Radno mesto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip obuke
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTrainings.map((training) => {
              const statusColors = getStatusColor(training.status);
              
              return (
                <tr key={training.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          <i className="fas fa-user"></i>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{getEmployeeName(training.employeeId)}</div>
                        <div className="text-sm text-gray-500">{getEmployeeEmail(training.employeeId)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getJobPosition(training.employeeId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTrainingTypeName(training.trainingTypeId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(training.trainingDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bgColor} ${statusColors.textColor}`}>
                      {training.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {sortedTrainings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nema dostupnih podataka o obukama
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Prikazano <span className="font-medium">1</span> do <span className="font-medium">{sortedTrainings.length}</span> od{" "}
            <span className="font-medium">{trainings?.length || 0}</span> rezultata
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

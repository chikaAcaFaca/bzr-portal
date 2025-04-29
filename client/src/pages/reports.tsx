import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileDown, BarChart2, PieChart, File, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EmployeeTraining, Employee, JobPosition, TrainingType } from "@shared/schema";

export default function Reports() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract the type from the URL query parameter or default to "trainings"
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const defaultReportType = urlParams.get('type') || "trainings";
  
  const [activeTab, setActiveTab] = useState<string>(defaultReportType);
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel">("pdf");
  const [dateRange, setDateRange] = useState<"all" | "month" | "quarter" | "year">("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch data for reports
  const { data: trainings, isLoading: isLoadingTrainings } = useQuery({
    queryKey: ['/api/employee-trainings'],
  });
  
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  const { data: positions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/job-positions'],
  });
  
  const { data: trainingTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/training-types'],
  });
  
  const isLoading = isLoadingTrainings || isLoadingEmployees || isLoadingPositions || isLoadingTypes;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/reports${value !== "trainings" ? `?type=${value}` : ""}`);
  };

  const handleGenerateReport = () => {
    // This would generate and download the actual report in a real application
    toast({
      title: "Generisanje izveštaja",
      description: `Izveštaj o ${activeTab === 'trainings' ? 'obukama' : 'dokumentima'} se generiše u ${reportFormat === 'pdf' ? 'PDF' : 'Excel'} formatu.`,
    });
  };

  // Helper functions to get related data
  const getEmployeeName = (employeeId: number) => {
    if (!employees) return "Nepoznato";
    const employee = employees.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Nepoznato";
  };

  const getJobPositionTitle = (employeeId: number) => {
    if (!employees || !positions) return "Nepoznato";
    const employee = employees.find((emp: Employee) => emp.id === employeeId);
    if (!employee) return "Nepoznato";
    
    const position = positions.find((pos: JobPosition) => pos.id === employee.jobPositionId);
    return position ? position.title : "Nepoznato";
  };

  const getTrainingTypeName = (typeId: number) => {
    if (!trainingTypes) return "Nepoznato";
    const type = trainingTypes.find((t: TrainingType) => t.id === typeId);
    return type ? `${type.code} - ${type.name}` : "Nepoznato";
  };

  // Filter trainings based on the selected filters
  const getFilteredTrainings = () => {
    if (!trainings) return [];
    
    let filtered = [...trainings];
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.trainingDate) >= startDate);
    }
    
    // Filter by employee name
    if (employeeFilter) {
      filtered = filtered.filter(t => {
        const name = getEmployeeName(t.employeeId).toLowerCase();
        return name.includes(employeeFilter.toLowerCase());
      });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    return filtered;
  };

  // Calculate statistics for the dashboard
  const calculatedStats = () => {
    if (!trainings || !employees) return {
      totalTrainings: 0,
      completedTrainings: 0,
      inProgressTrainings: 0,
      scheduledTrainings: 0,
      coveragePercentage: 0
    };
    
    const total = trainings.length;
    const completed = trainings.filter(t => t.status === 'Završeno').length;
    const inProgress = trainings.filter(t => t.status === 'U toku').length;
    const scheduled = trainings.filter(t => t.status === 'Zakazano').length;
    
    // Calculate percentage of employees who have completed at least one training
    const totalEmployees = employees.length;
    const employeesWithTraining = new Set(
      trainings.filter(t => t.status === 'Završeno').map(t => t.employeeId)
    ).size;
    
    const coverage = totalEmployees > 0 ? (employeesWithTraining / totalEmployees) * 100 : 0;
    
    return {
      totalTrainings: total,
      completedTrainings: completed,
      inProgressTrainings: inProgress,
      scheduledTrainings: scheduled,
      coveragePercentage: Math.round(coverage)
    };
  };

  const filteredTrainings = getFilteredTrainings();
  const stats = calculatedStats();

  return (
    <>
      <PageHeader
        title="Izveštaji"
        description="Pregled i generisanje izveštaja o bezbednosti i zaštiti na radu"
      />

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList>
          <TabsTrigger value="trainings">Obuke zaposlenih</TabsTrigger>
          <TabsTrigger value="documents">Dokumenti</TabsTrigger>
          <TabsTrigger value="statistics">Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="trainings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Izveštaj o obukama zaposlenih</CardTitle>
              <CardDescription>
                Generišite izveštaj o sprovedenim obukama zaposlenih za bezbedan i zdrav rad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Period izveštaja</label>
                  <Select defaultValue={dateRange} onValueChange={(value) => setDateRange(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Sve obuke</SelectItem>
                      <SelectItem value="month">Poslednjih mesec dana</SelectItem>
                      <SelectItem value="quarter">Poslednja tri meseca</SelectItem>
                      <SelectItem value="year">Poslednja godina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Status obuke</label>
                  <Select defaultValue={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Svi statusi</SelectItem>
                      <SelectItem value="Završeno">Završeno</SelectItem>
                      <SelectItem value="U toku">U toku</SelectItem>
                      <SelectItem value="Zakazano">Zakazano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Format izveštaja</label>
                  <Select defaultValue={reportFormat} onValueChange={(value) => setReportFormat(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF dokument</SelectItem>
                      <SelectItem value="excel">Excel tabela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Pretraga po imenu zaposlenog</label>
                <Input
                  placeholder="Unesite ime zaposlenog"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                />
              </div>

              <div className="border rounded-md mt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zaposleni</TableHead>
                        <TableHead>Radno mesto</TableHead>
                        <TableHead>Tip obuke</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredTrainings.length > 0 ? (
                        // Actual data
                        filteredTrainings.map((training: EmployeeTraining) => (
                          <TableRow key={training.id}>
                            <TableCell>{getEmployeeName(training.employeeId)}</TableCell>
                            <TableCell>{getJobPositionTitle(training.employeeId)}</TableCell>
                            <TableCell>{getTrainingTypeName(training.trainingTypeId)}</TableCell>
                            <TableCell>{formatDate(training.trainingDate)}</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(training.status).bgColor} ${getStatusColor(training.status).textColor}`}>
                                {training.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        // No data
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            Nema podataka koji odgovaraju definisanim filterima
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleGenerateReport} className="flex items-center gap-2">
                  {reportFormat === 'pdf' ? (
                    <File className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span>Generiši izveštaj</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Izveštaj o dokumentima</CardTitle>
              <CardDescription>
                Generišite izveštaj o dokumentima, uputstvima i merama zaštite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tip dokumenta</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite tip dokumenta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Svi dokumenti</SelectItem>
                      <SelectItem value="riskAssessment">Akt o proceni rizika</SelectItem>
                      <SelectItem value="form6">Obrazac 6 - Evidencija o zaposlenima osposobljenim za bezbedan i zdrav rad</SelectItem>
                      <SelectItem value="form3">Obrazac 3 - Evidencija o povredama na radu</SelectItem>
                      <SelectItem value="form11">Obrazac 11 - Izveštaj o povredi na radu</SelectItem>
                      <SelectItem value="injuryReport">Prijava povrede inspektoru rada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Format izveštaja</label>
                  <Select defaultValue={reportFormat} onValueChange={(value) => setReportFormat(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF dokument</SelectItem>
                      <SelectItem value="excel">Excel tabela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                  <FileDown className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Za generisanje izveštaja o dokumentima izaberite tip i format dokumenta i kliknite na dugme ispod.</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleGenerateReport} className="flex items-center gap-2">
                  {reportFormat === 'pdf' ? (
                    <File className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span>Generiši izveštaj</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistika obuka</CardTitle>
                <CardDescription>
                  Pregled statistike obuka zaposlenih
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-600">Ukupno obuka</p>
                        <p className="text-2xl font-bold">{stats.totalTrainings}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-md">
                        <p className="text-sm text-green-600">Završene obuke</p>
                        <p className="text-2xl font-bold">{stats.completedTrainings}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-sm text-yellow-600">Obuke u toku</p>
                        <p className="text-2xl font-bold">{stats.inProgressTrainings}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-md">
                        <p className="text-sm text-purple-600">Zakazane obuke</p>
                        <p className="text-2xl font-bold">{stats.scheduledTrainings}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-32 w-32 mx-auto text-gray-300" />
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Obuhvat zaposlenih obukama</p>
                          <p className="text-3xl font-bold text-primary-600">{stats.coveragePercentage}%</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Statistika po tipu obuke</CardTitle>
                <CardDescription>
                  Raspodela obuka po tipu i statusu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="text-center">
                        <PieChart className="h-32 w-32 mx-auto text-gray-300" />
                        <p className="text-sm text-gray-500 mt-2">Raspodela po tipu obuke</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tip obuke</TableHead>
                            <TableHead className="text-right">Broj obuka</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainingTypes?.map((type: TrainingType) => {
                            const count = trainings?.filter(t => t.trainingTypeId === type.id).length || 0;
                            return (
                              <TableRow key={type.id}>
                                <TableCell>{type.code} - {type.name}</TableCell>
                                <TableCell className="text-right">{count}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

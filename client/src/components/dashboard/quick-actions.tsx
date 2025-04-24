import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      title: "Nova obuka zaposlenog",
      description: "Zakaži novu obuku za zaposlene",
      icon: "fas fa-plus",
      href: "/employee-training/new",
    },
    {
      title: "Dodaj novi dokument",
      description: "Otpremi i kategorizuj novo uputstvo",
      icon: "fas fa-file-upload",
      href: "/base-documents/new",
    },
    {
      title: "Dodaj radno mesto",
      description: "Dodaj novo radno mesto u sistematizaciju",
      icon: "fas fa-clipboard-list",
      href: "/job-positions/new",
    },
    {
      title: "Generiši izveštaj",
      description: "Kreiraj izveštaj o obukama",
      icon: "fas fa-file-alt",
      href: "/reports?type=trainings",
    },
  ];

  return (
    <Card>
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Brze akcije
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {actions.map((action, index) => (
          <Link href={action.href} key={index}>
            <a className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="rounded-full bg-primary-100 p-2 mr-3">
                <i className={`${action.icon} text-primary-600`}></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </a>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

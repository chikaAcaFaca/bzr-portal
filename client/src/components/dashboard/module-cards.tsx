import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  stats: string;
  href: string;
}

export default function ModuleCards() {
  const modules: ModuleCard[] = [
    {
      title: "Sistematizacija radnih mesta",
      description: "Upravljanje sistematizacijom radnih mesta i opisima poslova. Kreiranje strukture radnih mesta.",
      icon: "fas fa-sitemap",
      iconBg: "bg-blue-100",
      iconColor: "text-primary-500",
      stats: "Radna mesta i opisi",
      href: "/job-positions",
    },
    {
      title: "Rizici i kategorije",
      description: "Identifikacija i klasifikacija rizika za svako radno mesto. Grupisanje sličnih radnih mesta u kategorije rizika.",
      icon: "fas fa-exclamation-triangle",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
      stats: "5 kategorija rizika",
      href: "/risk-categories",
    },
    {
      title: "Obuke zaposlenih",
      description: "Praćenje obuka i osposobljavanja za bezbedan rad. Evidencija završenih obuka i provera znanja zaposlenih.",
      icon: "fas fa-clipboard-check",
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
      stats: "8 tipova obuka",
      href: "/employee-training",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {modules.map((module, index) => (
        <Card key={index} className="overflow-hidden bg-white dark:bg-gray-800 mt-4">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`rounded-full ${module.iconBg} p-3`}>
                <i className={`${module.icon} ${module.iconColor}`}></i>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                {module.title}
              </h3>
            </div>
            <p className="mt-4 text-gray-700 dark:text-gray-300 text-sm">
              {module.description}
            </p>
            <div className="mt-5 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {module.stats}
              </span>
              <Link href={module.href}>
                <span className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer">
                  Pristupi modulu <i className="fas fa-arrow-right ml-1"></i>
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getFileIconClass } from "@/lib/utils";

export default function RecentDocuments() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Nedavni dokumenti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="divide-y divide-gray-200">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 mr-3" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3 border-t text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
        </CardFooter>
      </Card>
    );
  }

  // Sort documents by upload date, most recent first
  const recentDocuments = documents && Array.isArray(documents)
    ? [...documents]
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 4)
    : [];

  return (
    <Card>
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Nedavni dokumenti
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="divide-y divide-gray-200">
          {recentDocuments.map((document) => (
            <li key={document.id} className="py-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <i className={`${getFileIconClass(document.fileType)} text-xl`}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dodato: {formatDate(document.uploadDate)}
                  </p>
                </div>
                <div>
                  <button className="p-1 text-gray-400 hover:text-gray-500">
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>
            </li>
          ))}
          
          {recentDocuments.length === 0 && (
            <li className="py-3 text-center text-sm text-gray-500">
              Nema dostupnih dokumenata
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 border-t text-center">
        <Link href="/base-documents">
          <span className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
            Prikaži sve dokumente
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}

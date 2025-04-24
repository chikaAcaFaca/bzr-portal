import { Link } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Header() {
  // This would be dynamic in a full implementation
  const userProfile = {
    name: "Korisnik Petrović",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };

  return (
    <>
      {/* Mobile Navbar Toggle - Fixed position */}
      <div className="lg:hidden fixed z-50 top-4 left-4">
        <button
          id="mobile-toggle"
          className="bg-white p-2 rounded-md shadow-md text-gray-600"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>
      
      {/* Top navigation */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ol className="flex text-sm">
                <li className="flex items-center">
                  <Link href="/">
                    <a className="text-gray-500 hover:text-primary-600">Početna</a>
                  </Link>
                  <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                </li>
                <li className="text-primary-600 font-medium">Dashboard</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-bell"></i>
            </button>
            <div className="relative">
              <button className="flex items-center text-sm focus:outline-none">
                <img
                  className="h-8 w-8 rounded-full"
                  src={userProfile.imageUrl}
                  alt="Profilna slika"
                />
                <span className="ml-2 hidden md:block">{userProfile.name}</span>
                <i className="fas fa-chevron-down ml-1 hidden md:block"></i>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

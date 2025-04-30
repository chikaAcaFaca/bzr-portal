import { createContext, useState, useEffect, useContext, ReactNode } from "react";

// Osnovni tip korisnika
interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Context tip
interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock podaci za autentikaciju
const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    password: "admin123", // U stvarnoj primeni, lozinke bi bile heširane
    roles: ["admin", "user"]
  },
  {
    id: 2,
    username: "user",
    email: "user@example.com",
    password: "user123",
    roles: ["user"]
  }
];

// Kreiranje konteksta
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Inicijalno učitavanje korisnika iz local storage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Error loading user from localStorage:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Funkcija za prijavu
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulacija mrežnog zahteva
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Proveri kredencijale
      const foundUser = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!foundUser) {
        throw new Error("Invalid username or password");
      }

      // Izdvoj lozinku iz objekta korisnika
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Postavi korisnika u state i localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error during login"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcija za odjavu
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Kontekst vrednosti
  const value: AuthContextProps = {
    user,
    isLoading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook za korišćenje auth konteksta
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
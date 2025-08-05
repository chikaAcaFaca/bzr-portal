import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any,
  options?: RequestInit
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  let requestBody = body;
  if (body && body instanceof FormData) {
    // Za FormData ne postavljamo Content-Type, browser će automatski postaviti
  } else if (body && typeof body !== 'string') {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }
  
  const res = await fetch(url, {
    method,
    body: requestBody,
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    credentials: "include",
  });
  
  return res;
}

// Pomoćna funkcija koja obavlja API zahtev i vraća podatke
export async function apiRequestWithData<T = any>(
  method: string,
  url: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  const res = await apiRequest(method, url, body, options);
  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Automatski osvežiti nakon vraćanja fokusa na prozor
      staleTime: 60000, // 1 minut, nakon toga podaci se smatraju zastarelim
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

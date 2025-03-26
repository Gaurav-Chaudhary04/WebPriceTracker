import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type ApiRequestOptions = {
  url: string;
  method: string;
  body?: unknown;
};

export async function apiRequest(options: ApiRequestOptions): Promise<Response>;
export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response>;
export async function apiRequest(
  methodOrOptions: string | ApiRequestOptions,
  url?: string,
  data?: unknown,
): Promise<Response> {
  let method: string;
  let endpoint: string;
  let body: unknown | undefined;

  // Handle the options object format
  if (typeof methodOrOptions === 'object') {
    method = methodOrOptions.method;
    endpoint = methodOrOptions.url;
    body = methodOrOptions.body;
  } else {
    // Handle the individual parameters format
    method = methodOrOptions;
    endpoint = url!;
    body = data;
  }

  const res = await fetch(endpoint, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

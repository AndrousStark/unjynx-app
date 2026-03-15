import type { DataProvider } from "@refinedev/core";
import { API_BASE_URL, API_ADMIN_PREFIX } from "../utils/constants";
import { userManager } from "./auth-provider";

function buildUrl(resource: string, params?: Record<string, string>): string {
  const base = `${API_BASE_URL}${API_ADMIN_PREFIX}/${resource}`;
  if (!params) return base;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const user = await userManager.getUser();
    if (user?.access_token) {
      headers["Authorization"] = `Bearer ${user.access_token}`;
    }
  } catch {
    // Fall through without auth header
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok) {
    const error: Error & { statusCode?: number } = new Error(
      json.error ?? `HTTP ${response.status}`,
    );
    error.statusCode = response.status;
    throw error;
  }

  return json;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const current = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    const queryParams: Record<string, string> = {
      page: String(current),
      limit: String(pageSize),
    };

    // Map Refine filters to query params
    if (filters) {
      for (const filter of filters) {
        if ("field" in filter && filter.value !== undefined && filter.value !== null && filter.value !== "") {
          queryParams[filter.field] = String(filter.value);
        }
      }
    }

    if (sorters && sorters.length > 0) {
      const { field, order } = sorters[0];
      queryParams["sortBy"] = field;
      queryParams["sortOrder"] = order;
    }

    const url = buildUrl(resource, queryParams);
    const response = await fetch(url, { headers: await authHeaders() });
    const json = await handleResponse<{
      success: boolean;
      data: unknown[];
      meta?: { total: number; page: number; limit: number };
    }>(response);

    return {
      data: json.data as never[],
      total: json.meta?.total ?? (json.data?.length ?? 0),
    };
  },

  getOne: async ({ resource, id }) => {
    const url = buildUrl(`${resource}/${id}`);
    const response = await fetch(url, { headers: await authHeaders() });
    const json = await handleResponse<{ success: boolean; data: unknown }>(response);

    return { data: json.data as never };
  },

  create: async ({ resource, variables }) => {
    const url = buildUrl(resource);
    const response = await fetch(url, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(variables),
    });
    const json = await handleResponse<{ success: boolean; data: unknown }>(response);

    return { data: json.data as never };
  },

  update: async ({ resource, id, variables }) => {
    const url = buildUrl(`${resource}/${id}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(variables),
    });
    const json = await handleResponse<{ success: boolean; data: unknown }>(response);

    return { data: json.data as never };
  },

  deleteOne: async ({ resource, id }) => {
    const url = buildUrl(`${resource}/${id}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: unknown }>(response);

    return { data: json.data as never };
  },

  getApiUrl: () => `${API_BASE_URL}${API_ADMIN_PREFIX}`,

  custom: async ({ url, method = "get", payload, headers: customHeaders, query }) => {
    const finalUrl = query
      ? buildUrl(url.replace(`${API_BASE_URL}${API_ADMIN_PREFIX}/`, ""), query as Record<string, string>)
      : url;

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        ...(await authHeaders()),
        ...(customHeaders as Record<string, string>),
      },
    };

    if (payload && method !== "get") {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(finalUrl, fetchOptions);
    const json = await handleResponse<{ success: boolean; data: unknown }>(response);

    return { data: json.data as never };
  },
};

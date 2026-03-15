// ============================================================
// UNJYNX Dev Portal - Data Provider (REST API)
// ============================================================

import type { DataProvider } from "@refinedev/core";
import { API_BASE_URL, API_PREFIX } from "@/utils/constants";
import { userManager } from "./auth-provider";

export const apiUrl = `${API_BASE_URL}${API_PREFIX}`;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const user = await userManager.getUser();
    if (user?.access_token) {
      return { Authorization: `Bearer ${user.access_token}` };
    }
  } catch {
    // Fall through to return empty headers
  }
  return {};
};

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API Error ${response.status}: ${body || response.statusText}`
    );
  }

  return response;
};

const buildQueryString = (
  params: Record<string, unknown>
): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const query: Record<string, unknown> = {};

    if (pagination) {
      query.page = pagination.current ?? 1;
      query.pageSize = pagination.pageSize ?? 20;
    }

    if (sorters && sorters.length > 0) {
      query.sort = sorters[0].field;
      query.order = sorters[0].order;
    }

    if (filters) {
      for (const filter of filters) {
        if ("field" in filter) {
          query[filter.field] = filter.value;
        }
      }
    }

    const url = `${apiUrl}/${resource}${buildQueryString(query)}`;
    const response = await fetchWithAuth(url);
    const json = await response.json();

    return {
      data: json.data ?? json,
      total: json.total ?? json.data?.length ?? 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const url = `${apiUrl}/${resource}/${id}`;
    const response = await fetchWithAuth(url);
    const json = await response.json();
    return { data: json.data ?? json };
  },

  create: async ({ resource, variables }) => {
    const url = `${apiUrl}/${resource}`;
    const response = await fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    const json = await response.json();
    return { data: json.data ?? json };
  },

  update: async ({ resource, id, variables }) => {
    const url = `${apiUrl}/${resource}/${id}`;
    const response = await fetchWithAuth(url, {
      method: "PATCH",
      body: JSON.stringify(variables),
    });
    const json = await response.json();
    return { data: json.data ?? json };
  },

  deleteOne: async ({ resource, id }) => {
    const url = `${apiUrl}/${resource}/${id}`;
    const response = await fetchWithAuth(url, { method: "DELETE" });
    const json = await response.json();
    return { data: json.data ?? json };
  },

  getApiUrl: () => apiUrl,

  custom: async ({ url, method = "get", payload, headers: customHeaders, query }) => {
    const fullUrl = `${url.startsWith("http") ? url : `${apiUrl}/${url}`}${
      query ? buildQueryString(query as Record<string, unknown>) : ""
    }`;

    const response = await fetchWithAuth(fullUrl, {
      method: method.toUpperCase(),
      body: payload ? JSON.stringify(payload) : undefined,
      headers: customHeaders as Record<string, string>,
    });
    const json = await response.json();
    return { data: json.data ?? json };
  },
};

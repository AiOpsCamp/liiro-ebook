import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "@/lib/utils";

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

export const mainApi = createApi({
  reducerPath: "mainApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");
      try {
        const token = await getToken("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch (err) {
        console.warn("Failed to retrieve auth token for API request", err);
      }
      return headers;
    },
  }),
  tagTypes: ["Story", "StoryDashboard", "EbookCategory", "EbookAuthor", "User", "UserLibrary", "Whispersync"],
  endpoints: () => ({}),
});

export default mainApi;

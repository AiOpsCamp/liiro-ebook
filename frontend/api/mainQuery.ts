import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5012/api/v1";
const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

export const mainApi = createApi({
  reducerPath: "mainApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Story", "StoryDashboard", "EbookCategory", "EbookAuthor", "User"],
  endpoints: () => ({}),
});

export default mainApi;

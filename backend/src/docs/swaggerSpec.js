"use strict";

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Liiro Ebook & Audiobook Production API",
    version: "1.0.0",
    description: "High-performance Ebook Reading, DRM Audio Streaming, Whispersync Bi-directional Alignment, and OPDS Catalog Microservice.",
    contact: {
      name: "AiOpsCamp / Liiro Engineering",
      url: "https://liiro.app",
      email: "engineering@liiro.app"
    }
  },
  servers: [
    {
      url: "http://127.0.0.1:5012",
      description: "Local / Development Gateway"
    },
    {
      url: "https://api.ebook.liiro.app",
      description: "Production Server (Hetzner K3s Cluster)"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      GuestHeader: {
        type: "apiKey",
        in: "header",
        name: "x-guest-id"
      }
    },
    schemas: {
      Story: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "object", properties: { en: { type: "string" } } },
          slug: { type: "string" },
          author: { type: "object", properties: { name: { type: "string" }, slug: { type: "string" } } },
          description: { type: "object", properties: { en: { type: "string" } } },
          coverUrl: { type: "string" },
          seriesName: { type: "string" },
          seriesOrder: { type: "number" },
          hasAudio: { type: "boolean" },
          audioVoices: { type: "object" },
          totalChapters: { type: "number" }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "healthy" },
          service: { type: "string", example: "liiro-ebook-backend" },
          version: { type: "string", example: "1.0.0" },
          uptimeSeconds: { type: "number", example: 120 },
          database: {
            type: "object",
            properties: {
              name: { type: "string", example: "liiro_prod" },
              connected: { type: "boolean", example: true },
              latencyMs: { type: "number", example: 42 }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "System Health & APM Metrics",
        description: "Returns database connectivity, latency, memory usage, and uptime.",
        responses: {
          "200": {
            description: "System is healthy and responsive",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } }
          }
        }
      }
    },
    "/api/v1/auth/register": {
      post: {
        summary: "User Registration",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "User registered successfully with JWT token" },
          "400": { description: "Missing email/password or email already registered" }
        }
      }
    },
    "/api/v1/auth/login": {
      post: {
        summary: "User Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful with JWT token" },
          "401": { description: "Invalid email or password" }
        }
      }
    },
    "/api/v1/auth/account": {
      delete: {
        summary: "GDPR Right to Erasure / Account Permanent Deletion",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "User account and all reading/progress/activity data permanently erased" },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/api/v1/stories": {
      get: {
        summary: "List Stories / Books Catalog",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "hasAudio", in: "query", schema: { type: "boolean" } }
        ],
        responses: {
          "200": { description: "Paginated list of stories" }
        }
      }
    },
    "/api/v1/stories/slug/{slug}": {
      get: {
        summary: "Get Story Details & Chapters",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Story details with embedded chapter metadata" },
          "404": { description: "Story not found" }
        }
      }
    },
    "/api/v1/stories/slug/{slug}/chapters/{chapterId}": {
      get: {
        summary: "Get Chapter Content & Whispersync Timestamps",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "chapterId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Full chapter HTML/text and sentence-level timestamp alignment array" }
        }
      }
    },
    "/api/v1/stories/slug/{slug}/stream-token": {
      get: {
        summary: "Generate 2-Hour DRM HMAC Stream Token",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "chapterNumber", in: "query", schema: { type: "integer" } },
          { name: "voice", in: "query", schema: { type: "string", default: "michael" } }
        ],
        responses: {
          "200": { description: "Signed stream token and secure S3/HLS URL" },
          "402": { description: "Monthly streaming quota exceeded" }
        }
      }
    },
    "/api/v1/stories/whispersync": {
      post: {
        summary: "Sync Whispersync Bi-Directional Position",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["storySlug", "chapterNumber"],
                properties: {
                  storySlug: { type: "string" },
                  chapterNumber: { type: "number" },
                  paragraphIndex: { type: "number" },
                  audioTimestampSeconds: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Whispersync position updated successfully" }
        }
      }
    },
    "/opds/v2/catalog": {
      get: {
        summary: "OPDS 2.0 Root Navigation Feed",
        responses: {
          "200": { description: "OPDS 2.0 JSON Catalog" }
        }
      }
    },
    "/opds/v2/publications": {
      get: {
        summary: "OPDS 2.0 Publications Feed",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          "200": { description: "OPDS 2.0 Paginated Publications" }
        }
      }
    }
  }
};

module.exports = swaggerSpec;

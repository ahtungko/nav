import { verifyAdminSessionToken } from "./lib/auth";
import { jsonError } from "./lib/response";
import { handleAdminCategoriesRequest } from "./routes/admin-categories";
import { handleAdminPublishRequest } from "./routes/admin-publish";
import { handleAdminWebsitesRequest } from "./routes/admin-websites";
import { handleAuthRequest } from "./routes/auth";
import { handlePublicSiteRequest } from "./routes/public-site";
import type { Env } from "./types";

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) {
      return value.join("=");
    }
  }

  return null;
}

async function isAuthenticatedAdminRequest(request: Request, env: Env): Promise<boolean> {
  const token = readCookie(request, "vyxolabs_admin_session");
  if (!token) {
    return false;
  }

  return verifyAdminSessionToken(token, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/login") {
      return handleAuthRequest(request, env);
    }

    if (url.pathname === "/api/public/site") {
      return handlePublicSiteRequest(request, env);
    }

    if (url.pathname.startsWith("/api/admin/")) {
      if (!(await isAuthenticatedAdminRequest(request, env))) {
        return jsonError("unauthorized", 401);
      }

      if (url.pathname === "/api/admin/categories") {
        return handleAdminCategoriesRequest(request, env);
      }

      if (url.pathname.startsWith("/api/admin/categories/")) {
        return handleAdminCategoriesRequest(request, env, url.pathname.slice("/api/admin/categories/".length));
      }

      if (url.pathname === "/api/admin/websites") {
        return handleAdminWebsitesRequest(request, env);
      }

      if (url.pathname.startsWith("/api/admin/websites/")) {
        return handleAdminWebsitesRequest(request, env, url.pathname.slice("/api/admin/websites/".length));
      }

      if (url.pathname === "/api/admin/publish") {
        return handleAdminPublishRequest(request, env);
      }
    }

    return new Response("Not found", { status: 404 });
  },
};



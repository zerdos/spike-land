import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { createAuth, type Env } from "../db-auth/auth";
import * as schema from "../db/schema";

interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

export interface AuthResult {
  user: SuperAdminUser;
  impersonating?: SuperAdminUser;
}

export async function requireSuperAdmin(
  request: Request,
  env: Env,
): Promise<AuthResult | Response> {
  const auth = createAuth(env);
  const isApi =
    request.headers.get("Accept")?.includes("application/json") ||
    new URL(request.url).pathname.startsWith("/dashboard/api/");

  let sessionResult: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    sessionResult = await auth.api.getSession({ headers: request.headers });
  } catch {
    sessionResult = null;
  }

  if (!sessionResult?.user) {
    if (isApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(renderAuthGate(), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const db = drizzle(env.AUTH_DB, { schema });
  const dbUser = await db.query.user.findFirst({
    where: eq(schema.user.id, sessionResult.user.id),
  });

  if (!dbUser || dbUser.role !== "super_admin") {
    if (isApi) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(renderForbidden(), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const adminUser: SuperAdminUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role ?? "user",
    image: dbUser.image ?? null,
  };

  const result: AuthResult = { user: adminUser };

  // Impersonation support (read-only)
  const impersonateId = request.headers.get("X-Impersonate-User");
  if (impersonateId) {
    const targetUser = await db.query.user.findFirst({
      where: eq(schema.user.id, impersonateId),
    });
    if (targetUser) {
      result.impersonating = {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role ?? "user",
        image: targetUser.image ?? null,
      };
    }
  }

  return result;
}

function renderAuthGate(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auth Dashboard - Sign In</title>
<style>*{box-sizing:border-box;margin:0}body{min-height:100vh;background:#06100c;color:#e9f8ef;font-family:"Rubik",system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
.gate{text-align:center;padding:40px}h2{font-size:1.4rem;margin-bottom:12px}p{color:#7a9e8e;margin-bottom:24px}
a{display:inline-flex;padding:12px 24px;border-radius:999px;background:#82f9c8;color:#06100c;font-weight:700;text-decoration:none}a:hover{opacity:.85}</style></head>
<body><div class="gate"><h2>Authentication Required</h2><p>Sign in with your spike.land account to access the admin dashboard.</p>
<a href="https://spike.land/login?redirect=${encodeURIComponent("https://auth-mcp.spike.land/dashboard")}">Sign in</a></div></body></html>`;
}

function renderForbidden(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Access Denied</title>
<style>*{box-sizing:border-box;margin:0}body{min-height:100vh;background:#06100c;color:#e9f8ef;font-family:"Rubik",system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
.gate{text-align:center;padding:40px}h2{font-size:1.4rem;margin-bottom:12px;color:#ff7b72}p{color:#7a9e8e}</style></head>
<body><div class="gate"><h2>Access Denied</h2><p>This dashboard is restricted to super administrators.</p></div></body></html>`;
}

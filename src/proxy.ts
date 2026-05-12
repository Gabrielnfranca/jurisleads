import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|favicon\\.ico|.*\\..*).*)" ],
};

async function getSession(req: NextRequest) {
  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { session, response };
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const host = hostname.split(":")[0];
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
  const isVercelHost = host.endsWith(".vercel.app");

  // ─── Roteamento por subdomínio (produção) ────────────────────────────────
  if (rootDomain && host !== rootDomain && host !== `www.${rootDomain}`) {
    const isRootSubdomain = host.endsWith(`.${rootDomain}`);
    const subdomain = isRootSubdomain ? host.replace(`.${rootDomain}`, "") : "";

    if (subdomain === "admin") {
      if (url.pathname === "/" || url.pathname === "") {
        url.pathname = "/admin";
      } else if (!url.pathname.startsWith("/admin")) {
        url.pathname = `/admin${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    // Subdomínio da plataforma (ex: lp.seudominio-base.com): usa slug direto.
    if (isRootSubdomain && subdomain && subdomain !== "localhost") {
      url.pathname = `/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    // Em domínios da própria Vercel (produção/preview), mantém rota padrão /slug.
    if (isVercelHost) {
      return NextResponse.next();
    }

    // Domínio customizado com subdomínio de captura (ex: lp.cliente.com.br)
    if (!isRootSubdomain && !host.startsWith("localhost")) {
      const parts = host.split(".");
      if (parts.length >= 3) {
        const slug = parts[0];
        const customDomain = parts.slice(1).join(".");
        url.pathname = `/${slug}/${customDomain}`;
      } else {
        // fallback para domínio sem subdomínio (ex: cliente.com.br)
        url.pathname = `/captacao/${host}`;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ─── Proteção de rotas ────────────────────────────────────────────────────
  const isAdminPath =
    url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login");
  const isDashboardPath = url.pathname.startsWith("/dashboard");
  const isCrmConfigPath = url.pathname.startsWith("/configuracoes");

  if (!isAdminPath && !isDashboardPath && !isCrmConfigPath) {
    return NextResponse.next();
  }

  const { session, response } = await getSession(req);

  if (!session) {
    const loginUrl = isAdminPath
      ? new URL("/admin/login", req.url)
      : new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // /admin/* exige ser o administrador
  if (isAdminPath) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && session.user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return response;
}

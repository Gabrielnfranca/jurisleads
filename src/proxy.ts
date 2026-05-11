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

  // ─── Roteamento por subdomínio (produção) ────────────────────────────────
  if (rootDomain && host !== rootDomain && host !== `www.${rootDomain}`) {
    const subdomain = host.replace(`.${rootDomain}`, "");

    if (subdomain === "admin") {
      if (url.pathname === "/" || url.pathname === "") {
        url.pathname = "/admin";
      } else if (!url.pathname.startsWith("/admin")) {
        url.pathname = `/admin${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    if (subdomain && !subdomain.includes(".") && subdomain !== "localhost") {
      url.pathname = `/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    // Domínio customizado via CNAME (ex: captacao.escritoriodacarol.com.br)
    // O host não é subdomínio do rootDomain → passa o host completo como parâmetro de rota
    if (subdomain.includes(".") && !host.startsWith("localhost")) {
      url.pathname = `/${host}`;
      return NextResponse.rewrite(url);
    }
  }

  // ─── Proteção de rotas ────────────────────────────────────────────────────
  const isAdminPath =
    url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login");
  const isDashboardPath = url.pathname.startsWith("/dashboard");

  if (!isAdminPath && !isDashboardPath) {
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

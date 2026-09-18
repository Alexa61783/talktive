import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;

  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch (error) {
            console.error(
              "Cookie error:",
              error
            );
          }
        },
      },
    }
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );

  if (error) {
    console.error(
      "Auth callback error:",
      error
    );

    return NextResponse.redirect(
      `${origin}/login?error=auth`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
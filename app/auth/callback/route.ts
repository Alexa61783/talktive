import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
const { searchParams, origin } = new URL(request.url);

const code = searchParams.get("code");
const next = searchParams.get("next") || "/";

if (!code) {
return NextResponse.redirect(`${origin}/login?error=auth`);
}

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const { error } = await supabase.auth.exchangeCodeForSession(code);

if (error) {
console.error("Auth callback error:", error);


return NextResponse.redirect(
  `${origin}/login?error=auth`
);


}

return NextResponse.redirect(
`${origin}${next.startsWith("/") ? next : "/"}`
);
}

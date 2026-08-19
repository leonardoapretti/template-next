import { signOut } from "@/auth";
import { NextResponse } from "next/server";

const AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function limparCookiesAuth(response: NextResponse) {
  for (const cookieName of AUTH_COOKIES) {
    response.cookies.delete(cookieName);
  }

  return response;
}

export async function GET(request: Request) {
  await signOut({ redirect: false });

  const url = new URL("/login", request.url);
  url.searchParams.set("erro", "sessao-invalida");

  const response = NextResponse.redirect(url);

  return limparCookiesAuth(response);
}

export async function POST() {
  await signOut({ redirect: false });

  const response = NextResponse.json({ success: true });

  return limparCookiesAuth(response);
}

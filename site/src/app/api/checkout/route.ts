import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polar, POLAR_PRODUCTS } from "@/lib/polar";

export const dynamic = "force-dynamic";

/**
 * GET /api/checkout?plan=pro|pro-yearly
 * Creates a Polar checkout tied to the signed-in user
 * (externalCustomerId = Neon Auth user id) and redirects to it.
 * Signed-out visitors are sent to /account, which signs them in and
 * comes back here via its ?buy= handling.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") ?? "pro";
  const productId = POLAR_PRODUCTS[plan];
  if (!productId) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.redirect(
      new URL(`/account?buy=${plan}`, url.origin),
    );
  }

  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: session.user.id,
    customerEmail: session.user.email ?? undefined,
    successUrl: new URL("/account?checkout=success", url.origin).toString(),
  });

  return NextResponse.redirect(checkout.url);
}

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

  // First-touch acquisition (vx-utm cookie, set by AcquisitionTracking):
  // stamped into the checkout metadata so Polar shows, for every paying
  // customer, the channel that originally brought them.
  const attribution: Record<string, string> = {};
  try {
    const m = /(?:^|;\s*)vx-utm=([^;]+)/.exec(req.headers.get("cookie") || "");
    if (m) {
      const d = JSON.parse(decodeURIComponent(m[1]));
      for (const k of ["source", "medium", "campaign", "referrer", "landing"]) {
        if (typeof d[k] === "string" && d[k])
          attribution["attr_" + k] = String(d[k]).slice(0, 100);
      }
    }
  } catch {
    /* malformed cookie: checkout proceeds untagged */
  }

  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: session.user.id,
    customerEmail: session.user.email ?? undefined,
    metadata: attribution,
    successUrl: new URL("/account?checkout=success", url.origin).toString(),
  });

  return NextResponse.redirect(checkout.url);
}

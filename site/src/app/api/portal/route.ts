import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polar } from "@/lib/polar";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal — opens Polar's customer portal (invoices, cancel,
 * payment method) for the signed-in user.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/account", url.origin));
  }

  try {
    const portal = await polar.customerSessions.create({
      externalCustomerId: session.user.id,
    });
    return NextResponse.redirect(portal.customerPortalUrl);
  } catch {
    // No Polar customer yet (never checked out): nothing to manage.
    return NextResponse.redirect(new URL("/account", url.origin));
  }
}

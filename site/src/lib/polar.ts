import { Polar } from "@polar-sh/sdk";

/** Polar API client + the product catalog exposed to checkout. */
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
});

export const POLAR_PRODUCTS: Record<string, string | undefined> = {
  pro: process.env.POLAR_PRODUCT_PRO_ID,
  "pro-yearly": process.env.POLAR_PRODUCT_PRO_YEARLY_ID,
};

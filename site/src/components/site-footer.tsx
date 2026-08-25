import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { GitHubIcon } from "@/components/github-icon";
import { GITHUB_URL } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

const WAVE_HEIGHTS = [8, 14, 10, 16, 9, 13, 7];

export function SiteFooter() {
  const t = useTranslations("Footer");

  const product = [
    { href: "#features", label: t("links.features") },
    { href: "#how-it-works", label: t("links.howItWorks") },
    { href: "#install", label: t("links.install") },
    { href: "#faq", label: t("links.faq") },
  ];
  const resources = [
    { href: GITHUB_URL, label: "GitHub", external: true },
    {
      href: `${GITHUB_URL}/blob/master/LICENSE`,
      label: t("links.license"),
      external: true,
    },
    {
      href: `${GITHUB_URL}/issues`,
      label: t("links.issues"),
      external: true,
    },
  ];

  return (
    <footer className="border-t border-border bg-card dark:bg-[#050607]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-[15px] font-semibold tracking-tight">
                Voxylio
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
            <div
              className="mt-5 flex h-5 items-end gap-1"
              aria-hidden="true"
            >
              {WAVE_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className="wave-bar w-1 rounded-full bg-primary/70"
                  style={{ height: h, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>

          {/* Link columns */}
          <nav aria-label={t("product")}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("product")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {product.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("resources")}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("resources")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {resources.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("links.privacy")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Voxylio · {t("madeBy")}{" "}
            <a
              href="https://github.com/ln-dev7"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              LN
            </a>
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <GitHubIcon className="size-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

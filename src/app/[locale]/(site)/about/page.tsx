import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");

  return (
    <StaticPageShell
      title={t("title", { name: siteConfig.name })}
      subtitle={t("subtitle")}
    >
      <p>
        {t("p1", { name: siteConfig.name })}
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2SiteContent")}
      </h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>{t("siteContentItem1Label")}</strong>
          {t("siteContentItem1Text")}
        </li>
        <li>
          <strong>{t("siteContentItem2Label")}</strong>
          {t("siteContentItem2Text")}
        </li>
        <li>
          <strong>{t("siteContentItem3Label")}</strong>
          {t("siteContentItem3Text")}
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2AboutSite")}
      </h2>
      <p>
        {t("pAboutSite")}
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Contact")}
      </h2>
      <p>
        {t.rich("contactText", {
          link: (chunks) => (
            <Link href="/contact" className="underline decoration-dotted hover:text-ink">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </StaticPageShell>
  );
}

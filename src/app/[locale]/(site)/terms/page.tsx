import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default async function TermsPage() {
  const t = await getTranslations("termsPage");

  return (
    <StaticPageShell
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <p>
        {t("p1", { name: siteConfig.name })}
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Disclaimer")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("disclaimerItem1")}</li>
        <li>{t("disclaimerItem2")}</li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Ip")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("ipItem1")}</li>
        <li>
          {t.rich("ipItem2", {
            link: (chunks) => (
              <Link href="/contact" className="underline decoration-dotted hover:text-ink">
                {chunks}
              </Link>
            ),
          })}
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Prohibited")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("prohibitedItem1")}</li>
        <li>{t("prohibitedItem2")}</li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Updates")}
      </h2>
      <p>
        {t("pUpdates")}
      </p>
    </StaticPageShell>
  );
}

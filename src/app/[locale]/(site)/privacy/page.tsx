import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig, getSiteHost } from "@/lib/site/config";

export default async function PrivacyPage() {
  const t = await getTranslations("privacyPage");

  return (
    <StaticPageShell
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <p>
        {t("p1", { name: siteConfig.name, host: getSiteHost() })}
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Collect")}
      </h2>
      <h3 className="text-sm font-semibold text-ink font-kalam">
        {t("h3ServerLogs")}
      </h3>
      <p>
        {t("pServerLogs")}
      </p>

      <h3 className="text-sm font-semibold text-ink font-kalam">
        {t("h3Cookies")}
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>{t("cookieItem1Label")}</strong>
          {t("cookieItem1Text")}
        </li>
        <li>
          <strong>{t("cookieItem2Label")}</strong>
          {t("cookieItem2Text")}
        </li>
        <li>
          <strong>{t("cookieItem3Label")}</strong>
          {t("cookieItem3Text")}
        </li>
      </ul>

      <h3 className="text-sm font-semibold text-ink font-kalam">
        {t("h3LocalStorage")}
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>{t("lsItem1Label")}</strong>
          {t("lsItem1Text")}
        </li>
        <li>
          <strong>{t("lsItem2Label")}</strong>
          {t("lsItem2Text")}
        </li>
        <li>
          <strong>{t("lsItem3Label")}</strong>
          {t("lsItem3Text")}
        </li>
        <li>
          <strong>{t("lsItem4Label")}</strong>
          {t("lsItem4Text")}
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Use")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("useItem1")}</li>
        <li>{t("useItem2")}</li>
        <li>{t("useItem3")}</li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2ThirdParty")}
      </h2>
      <p>
        {t("pThirdPartyIntro")}
      </p>
      <ul className="list-disc pl-5">
        <li>
          <strong>{t("tpItem1Label")}</strong>
          {t.rich("tpItem1Text", {
            glink: (chunks) => (
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted hover:text-ink"
              >
                {chunks}
              </a>
            ),
          })}
        </li>
        <li>
          <strong>{t("tpItem2Label")}</strong>
          {t("tpItem2Text")}
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Control")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("controlItem1")}</li>
        <li>{t("controlItem2")}</li>
      </ul>

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

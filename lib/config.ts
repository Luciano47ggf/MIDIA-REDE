/**
 * CONFIGURAÇÃO DA IDENTIDADE VISUAL
 * Altere aqui o nome do sistema, da igreja, o logo e as cores.
 * O logo fica em /public (troque o arquivo public/logo.svg pelo da igreja).
 */
export const siteConfig = {
  appName: "Mídia Igreja",
  churchName: "Igreja",
  logo: "/logo.svg",
  homeTitle: "Mídia",
  homeSubtitle: "Confira os registros dos nossos últimos cultos e eventos.",
  colors: {
    /** Cor principal: botões, links e destaques */
    primary: "#2B45B0",
    /** Cor secundária: seleção e detalhes */
    secondary: "#D9A43B",
  },
  locale: "pt-BR",
} as const;

/**
 * CONFIGURAÇÃO DA IDENTIDADE VISUAL
 * Altere aqui o nome do sistema, da igreja, o logo e as cores.
 * O logo fica em /public (troque o arquivo public/logo.svg pelo da igreja).
 */
export const siteConfig = {
  appName: "Mídia Videira",
  churchName: "Igreja Videira",
  logo: "/logo.jpg",
  /**
   * Foto de fundo do banner da página inicial (opcional).
   * Coloque o arquivo em /public (ex.: public/hero.jpg) e informe o caminho aqui.
   * Sem foto, a página inicial usa um degradê azul-marinho no lugar.
   */
  heroImage: "/hero.png" as string | null,
  homeEyebrow: "Registros que contam histórias",
  homeTitle: "Mídia Videira",
  homeSubtitle: "Confira os registros dos nossos cultos, celebrações e eventos.",
  homeFooterTagline: "Mais que registros, vidas transformadas.",
  colors: {
    /** Cor principal: botões, links e destaques */
    primary: "#2B45B0",
    /** Cor secundária: seleção e detalhes */
    secondary: "#D9A43B",
  },
  locale: "pt-BR",
} as const;

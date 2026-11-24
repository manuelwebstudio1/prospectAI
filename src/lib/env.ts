/**
 * Central environment access. Missing production credentials are treated as
 * disconnected integrations — never as working services.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return undefined;
  return value.trim();
}

export const env = {
  appUrl: read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  appName: read("NEXT_PUBLIC_APP_NAME") ?? "ProspectAI",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
  devPreviewData:
    process.env.NODE_ENV !== "production" &&
    read("NEXT_PUBLIC_DEV_PREVIEW_DATA") === "true",

  supabase: {
    url: read("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  },

  ai: {
    defaultProvider: (read("AI_DEFAULT_PROVIDER") ?? "grok") as "grok" | "openai",
    grokKey: read("GROK_API_KEY"),
    grokBaseUrl: read("GROK_API_BASE_URL") ?? "https://api.x.ai/v1",
    grokModel: read("GROK_MODEL") ?? "grok-4-fast-reasoning",
    openaiKey: read("OPENAI_API_KEY"),
    openaiModel: read("OPENAI_MODEL") ?? "gpt-4.1-mini",
  },

  googlePlacesKey: read("GOOGLE_PLACES_API_KEY"),
  resendKey: read("RESEND_API_KEY"),
  resendFrom: read("RESEND_FROM_EMAIL") ?? "ProspectAI <noreply@localhost>",
  whatsapp: {
    accessToken: read("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: read("WHATSAPP_PHONE_NUMBER_ID"),
  },
  moolre: {
    apiUser: read("MOOLRE_API_USER"),
    publicKey: read("MOOLRE_PUBLIC_KEY"),
    accountNumber: read("MOOLRE_ACCOUNT_NUMBER"),
    walletSecret: read("MOOLRE_WALLET_SECRET"),
    baseUrl: read("MOOLRE_API_BASE_URL") ?? "https://api.moolre.com",
  },
  platformAdminEmails: (read("PLATFORM_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  paystackSecret: read("PAYSTACK_SECRET_KEY"),
  paystackPublic: read("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"),
  stripeSecret: read("STRIPE_SECRET_KEY"),
  stripePublic: read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  triggerSecret: read("TRIGGER_SECRET_KEY"),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

export function integrationStatus() {
  return {
    supabase: isSupabaseConfigured(),
    grok: Boolean(env.ai.grokKey),
    openai: Boolean(env.ai.openaiKey),
    googlePlaces: Boolean(env.googlePlacesKey),
    resend: Boolean(env.resendKey),
    whatsapp: Boolean(env.whatsapp.accessToken && env.whatsapp.phoneNumberId),
    moolre: Boolean(env.moolre?.apiUser && env.moolre?.publicKey && env.moolre?.accountNumber),
    stripe: Boolean(env.stripeSecret),
    trigger: Boolean(env.triggerSecret),
  };
}

import type { CatalogProduct } from "./catalog";

type LocalizedText = Record<string, string>;

type NuvemshopImage = {
  src: string;
  position?: number;
};

type NuvemshopProduct = {
  id: number | string;
  name: LocalizedText | string;
  description?: LocalizedText | string;
  handle?: LocalizedText | string;
  brand?: string | null;
  images?: NuvemshopImage[];
  variants?: Array<{ sku?: string | null; price?: string | null }>;
  categories?: Array<{ name?: LocalizedText | string }>;
};

function localizedValue(value: LocalizedText | string | undefined) {
  if (typeof value === "string") return value;
  if (!value) return "";
  return value.pt ?? value["pt-BR"] ?? value.en ?? Object.values(value)[0] ?? "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getConfiguration() {
  const storeId = process.env.NUVEMSHOP_STORE_ID?.trim();
  const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN?.trim();
  const userAgent = process.env.NUVEMSHOP_USER_AGENT?.trim();
  const baseUrl = (process.env.NUVEMSHOP_API_BASE_URL ?? "https://api.nuvemshop.com.br/2025-03").replace(/\/$/, "");

  if (!storeId || !accessToken || !userAgent) {
    throw new Error("Nuvemshop credentials are incomplete. Configure store ID, access token, and an identifying User-Agent in protected server variables.");
  }

  return { storeId, accessToken, userAgent, baseUrl };
}

export function isNuvemshopConfigured() {
  return Boolean(
    process.env.NUVEMSHOP_STORE_ID?.trim() &&
      process.env.NUVEMSHOP_ACCESS_TOKEN?.trim() &&
      process.env.NUVEMSHOP_USER_AGENT?.trim(),
  );
}

function normalizeProduct(product: NuvemshopProduct): CatalogProduct {
  const name = localizedValue(product.name);
  const descriptionHtml = localizedValue(product.description);
  const category = localizedValue(product.categories?.[0]?.name) || "equipamentos-profissionais";
  const firstVariant = product.variants?.[0];

  return {
    id: String(product.id),
    slug: localizedValue(product.handle) || String(product.id),
    name,
    category,
    brand: product.brand ?? undefined,
    descriptionHtml,
    technicalSummary: stripHtml(descriptionHtml),
    technicalSpecs: [],
    images: (product.images ?? [])
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((image, index) => ({
        src: image.src,
        alt: `${name} — imagem ${index + 1}`,
        position: image.position ?? index + 1,
      })),
    sku: firstVariant?.sku ?? undefined,
    price: firstVariant?.price ?? undefined,
  };
}

/**
 * Reads products through the official Nuvemshop API. This method is server-only:
 * the OAuth token stays in the runtime environment and is never serialized to the client.
 */
export async function listNuvemshopProducts(): Promise<CatalogProduct[]> {
  const { storeId, accessToken, userAgent, baseUrl } = getConfiguration();
  const url = new URL(`${baseUrl}/${encodeURIComponent(storeId)}/products`);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "10");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": userAgent,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Nuvemshop products request failed (${response.status}): ${responseText.slice(0, 500)}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Nuvemshop products response is not an array.");
  }

  return payload.map((product) => normalizeProduct(product as NuvemshopProduct));
}

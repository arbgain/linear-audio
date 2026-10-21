import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { listNuvemshopProducts, isNuvemshopConfigured } from "./nuvemshop";

const productImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  view: z.enum(["front", "rear", "detail"]).optional(),
  position: z.number().int().positive().optional(),
});

const catalogProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  brand: z.string().optional(),
  descriptionHtml: z.string().default(""),
  technicalSummary: z.string().default(""),
  technicalSpecs: z.array(z.string()).default([]),
  images: z.array(productImageSchema).default([]),
  sku: z.string().optional(),
  price: z.string().optional(),
});

const catalogManifestSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default("2025-03"),
    source: z.string().default("PDF CATALOGO BLG (2)"),
    status: z.string().default("ready"),
    message: z.string().nullable().optional(),
    generatedAt: z.string().nullable().optional(),
  }),
  products: z.array(catalogProductSchema),
});

export type CatalogProduct = z.infer<typeof catalogProductSchema>;
export type CatalogManifest = z.infer<typeof catalogManifestSchema>;

const catalogPath = path.resolve(import.meta.dirname, "..", "data", "nuvemshop-products.json");

async function readLocalCatalog(): Promise<CatalogManifest> {
  const content = await readFile(catalogPath, "utf8");
  return catalogManifestSchema.parse(JSON.parse(content));
}

export async function getCatalog(): Promise<CatalogManifest & { integration: "local" | "nuvemshop-api" }> {
  const localCatalog = await readLocalCatalog();

  if (process.env.NUVEMSHOP_CATALOG_SOURCE !== "api" || !isNuvemshopConfigured()) {
    return { ...localCatalog, integration: "local" };
  }

  try {
    const products = await listNuvemshopProducts();
    return {
      meta: {
        schemaVersion: "2025-03",
        source: "Nuvemshop Products API",
        status: "synced",
        message: "Catálogo consultado pela camada segura do servidor.",
        generatedAt: new Date().toISOString(),
      },
      products,
      integration: "nuvemshop-api",
    };
  } catch (error) {
    console.error("[Catalog] Nuvemshop synchronization failed; using local manifest.", error);
    return {
      ...localCatalog,
      meta: {
        ...localCatalog.meta,
        message: "A sincronização com Nuvemshop não respondeu; a vitrine está usando o último manifesto local validado.",
      },
      integration: "local",
    };
  }
}

export function getCatalogIntegrationStatus() {
  return {
    configured: isNuvemshopConfigured(),
    source: process.env.NUVEMSHOP_CATALOG_SOURCE === "api" ? "api" : "local",
  } as const;
}

#!/usr/bin/env python3
"""Gera o manifesto de vitrine e payload compatível com POST /products da Nuvemshop.

Não gera preços, SKUs ou especificações inexistentes. O campo --asset-base-url deve apontar
para uma origem HTTPS dos arquivos tratados; opcionalmente --asset-url-map fornece URLs
públicas individuais quando o repositório de código não é uma origem pública de mídia.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gera o payload de produtos Nuvemshop a partir de um catálogo selecionado.")
    parser.add_argument("--selection", type=Path, required=True)
    parser.add_argument("--asset-base-url", required=True, help="Ex.: https://www.linearaudio.com.br")
    parser.add_argument("--asset-url-map", type=Path, help="JSON opcional: '<slug>/<view>.jpg' -> URL HTTPS pública.")
    parser.add_argument("--assets", type=Path, default=Path("assets/products"))
    parser.add_argument("--output", type=Path, default=Path("data/nuvemshop-products.json"))
    parser.add_argument("--expected-count", type=int, default=10)
    return parser.parse_args()


def validate_base_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("--asset-base-url deve ser uma URL HTTPS absoluta.")
    return value.rstrip("/")


def main() -> None:
    args = parse_args()
    base_url = validate_base_url(args.asset_base_url)
    url_map = json.loads(args.asset_url_map.read_text(encoding="utf-8")) if args.asset_url_map else {}
    selection = json.loads(args.selection.read_text(encoding="utf-8"))
    products = selection.get("products", [])
    if len(products) != args.expected_count:
        raise ValueError(f"São esperados {args.expected_count} produtos; foram recebidos {len(products)}.")

    manifest_products = []
    for product in products:
        required = ("slug", "name", "category", "descriptionHtml")
        missing = [field for field in required if not str(product.get(field, "")).strip()]
        if missing:
            raise ValueError(f"{product.get('slug', 'produto')} sem campos obrigatórios: {', '.join(missing)}")

        images = []
        api_images = []
        for position, view in enumerate(("front", "rear"), start=1):
            asset = args.assets / product["slug"] / f"{view}.jpg"
            if not asset.is_file():
                raise FileNotFoundError(f"Asset tratado ausente: {asset}")
            relative = f"/assets/products/{product['slug']}/{view}.jpg"
            map_key = f"{product['slug']}/{view}.jpg"
            url = url_map.get(map_key, f"{base_url}{relative}")
            if not url.startswith("https://"):
                raise ValueError(f"URL pública inválida para {map_key}: {url}")
            images.append({"src": relative, "alt": f"{product['name']} — vista {('frontal' if view == 'front' else 'traseira')}", "view": view, "position": position})
            api_images.append({"src": url})

        manifest_products.append({
            "id": product.get("id", product["slug"]),
            "slug": product["slug"],
            "name": product["name"],
            "category": product["category"],
            "brand": product.get("brand"),
            "descriptionHtml": product["descriptionHtml"],
            "technicalSummary": product.get("technicalSummary", ""),
            "technicalSpecs": product.get("technicalSpecs", []),
            "images": images,
            "sku": product.get("sku"),
            "nuvemshopPayload": {
                "name": {"pt": product["name"]},
                "description": {"pt": product["descriptionHtml"]},
                "images": api_images,
                "visibility": "hidden",
                "requires_shipping": True,
                "tags": product.get("tags", "som-profissional"),
            },
        })

    payload = {
        "meta": {
            "schemaVersion": "2025-03",
            "source": selection.get("meta", {}).get("sourcePdf", "PDF CATALOGO BLG (2)"),
            "status": "ready_for_nuvemshop_upload",
            "message": "Payload validado a partir de 10 produtos e duas visões tratadas por produto.",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "assetBaseUrl": base_url,
        },
        "products": manifest_products,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {args.output} with {len(manifest_products)} product payloads")


if __name__ == "__main__":
    main()

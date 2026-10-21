#!/usr/bin/env python3
"""Extrai recortes de um PDF e gera imagens de produto em fundo branco sólido.

A seleção deve ser revisada por uma pessoa antes da execução. Cada produto precisa ter
as visões `front` e `rear`, com coordenadas em pontos PDF: [left, top, right, bottom].
Os arquivos são construídos em staging e substituem a pasta de saída somente após todas
as imagens e validações serem concluídas, evitando assets residuais de seleções antigas.
"""
from __future__ import annotations

import argparse
import io
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from PIL import Image, ImageOps
from rembg import remove

CANVAS_SIZE = 2000
WHITE = (255, 255, 255)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extrai e trata visões frontal/traseira de produtos do catálogo.")
    parser.add_argument("--pdf", type=Path, required=True, help="Caminho do PDF CATALOGO BLG (2).")
    parser.add_argument("--selection", type=Path, required=True, help="JSON revisado com 10 produtos e recortes.")
    parser.add_argument("--output", type=Path, default=Path("assets/products"), help="Pasta de saída dos assets tratados.")
    parser.add_argument("--allow-count", type=int, default=10, help="Quantidade esperada de produtos; padrão: 10.")
    return parser.parse_args()


def load_selection(path: Path, expected_count: int) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    products = payload.get("products", [])
    if len(products) != expected_count:
        raise ValueError(f"A seleção deve ter exatamente {expected_count} produtos; recebeu {len(products)}.")

    slugs: set[str] = set()
    for product in products:
        if not product.get("slug") or not product.get("name"):
            raise ValueError("Todo produto precisa ter slug e nome exato do catálogo.")
        if product["slug"] in slugs:
            raise ValueError(f"Slug duplicado na seleção: {product['slug']}.")
        slugs.add(product["slug"])
        views = product.get("views", {})
        for view in ("front", "rear"):
            definition = views.get(view)
            if not definition:
                raise ValueError(f"{product['slug']} não possui a visão obrigatória: {view}.")
            crop = definition.get("crop")
            if not isinstance(crop, list) or len(crop) != 4:
                raise ValueError(f"{product['slug']} / {view} precisa de crop [left, top, right, bottom].")
    return products


def extract_crop(document: fitz.Document, definition: dict[str, Any]) -> Image.Image:
    page_index = int(definition["page"]) - 1
    if page_index < 0 or page_index >= len(document):
        raise ValueError(f"Página inválida: {definition['page']}.")
    clip = fitz.Rect(*definition["crop"])
    if clip.is_empty or clip.is_infinite:
        raise ValueError(f"Recorte inválido: {definition['crop']}.")
    pixmap = document[page_index].get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip, alpha=True)
    return Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGBA")


def remove_background_to_white(image: Image.Image) -> Image.Image:
    subject = remove(image)
    if isinstance(subject, bytes):
        subject = Image.open(io.BytesIO(subject))
    subject = subject.convert("RGBA")
    canvas = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), WHITE)

    contained = ImageOps.contain(subject, (int(CANVAS_SIZE * 0.84), int(CANVAS_SIZE * 0.84)), Image.Resampling.LANCZOS)
    x = (CANVAS_SIZE - contained.width) // 2
    y = (CANVAS_SIZE - contained.height) // 2
    canvas.paste(contained, (x, y), contained)
    return canvas


def assert_white_background(image: Image.Image) -> None:
    corners = ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1))
    if any(image.getpixel(point) != WHITE for point in corners):
        raise RuntimeError("A validação falhou: as bordas do asset não estão em branco sólido.")


def replace_output_atomically(staging: Path, output: Path) -> None:
    backup = output.with_name(f".{output.name}.previous")
    shutil.rmtree(backup, ignore_errors=True)
    if output.exists():
        output.replace(backup)
    try:
        staging.replace(output)
    except Exception:
        if backup.exists() and not output.exists():
            backup.replace(output)
        raise
    shutil.rmtree(backup, ignore_errors=True)


def main() -> None:
    args = parse_args()
    if not args.pdf.is_file():
        raise FileNotFoundError(f"PDF não encontrado: {args.pdf}")
    products = load_selection(args.selection, args.allow_count)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{args.output.name}.staging-", dir=args.output.parent))

    report: list[dict[str, Any]] = []
    try:
        with fitz.open(args.pdf) as document:
            for product in products:
                product_dir = staging / product["slug"]
                product_dir.mkdir(parents=True, exist_ok=True)
                for view in ("front", "rear"):
                    raw = extract_crop(document, product["views"][view])
                    final = remove_background_to_white(raw)
                    assert_white_background(final)
                    destination = product_dir / f"{view}.jpg"
                    final.save(destination, format="JPEG", quality=94, optimize=True, progressive=True, subsampling=0)
                    public_destination = args.output / product["slug"] / f"{view}.jpg"
                    report.append({
                        "product": product["name"],
                        "view": view,
                        "file": public_destination.as_posix(),
                        "size": [final.width, final.height],
                        "background": "#FFFFFF",
                    })
                    print(f"Created {public_destination}")

        report_path = staging / "processing-report.json"
        report_path.write_text(json.dumps({"processed": report}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        replace_output_atomically(staging, args.output)
        print(f"Validated {len(report)} views in {args.output / 'processing-report.json'}")
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


if __name__ == "__main__":
    main()

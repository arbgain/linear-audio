# Pipeline do catálogo BLG

O arquivo fonte precisa ser o `PDF CATALOGO BLG (2)` original. A captura de tela do painel Nuvemshop não contém produto, ficha técnica ou fotos suficientes para substituir o PDF.

1. Revise o PDF e preencha uma cópia de `data/catalog-selection.template.json` com os **10 primeiros produtos de sonorização**, os nomes e especificações presentes no catálogo, e dois recortes em pontos PDF por produto: `front` e `rear`.
2. Instale as dependências isoladas do processamento: `python3 -m venv .venv-images && .venv-images/bin/pip install -r scripts/requirements-images.txt`.
3. Gere os assets: `.venv-images/bin/python scripts/process_catalog_assets.py --pdf "PDF CATALOGO BLG (2).pdf" --selection data/catalog-selection.json`. Cada resultado fica em `assets/products/<slug>/front.jpg` ou `rear.jpg`, com canvas 2000 × 2000 e fundo `#FFFFFF` validado nas quatro bordas.
4. Com o domínio HTTPS definitivo definido, gere o manifesto/payload: `.venv-images/bin/python scripts/build_nuvemshop_payload.py --selection data/catalog-selection.json --asset-base-url https://seu-dominio.example`.
5. Execute `pnpm sync:product-assets`. O build também realiza esta cópia antes de empacotar a vitrine, preservando referências em `/assets/products/...`.

O arquivo `data/nuvemshop-products.json` contém, por produto, a referência relativa usada pela vitrine e `nuvemshopPayload`, que pode ser enviado a `POST /2025-03/{store_id}/products` depois que as imagens estiverem publicamente acessíveis por HTTPS. O valor `visibility: "hidden"` evita que a primeira carga seja publicada involuntariamente; confirme preço, estoque, SKU e visibilidade antes de alterar esse estado.

A integração em execução usa a camada servidor em `server/nuvemshop.ts`. Configure apenas via variáveis protegidas do projeto: `NUVEMSHOP_STORE_ID`, `NUVEMSHOP_ACCESS_TOKEN`, `NUVEMSHOP_USER_AGENT` e, opcionalmente, `NUVEMSHOP_CATALOG_SOURCE=api`. O token OAuth e o ID de loja nunca devem entrar no JSON público ou no bundle React.

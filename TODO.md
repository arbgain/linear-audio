# Linear Áudio — Entregas

- [x] **Catálogo BLG e imagens tratadas.** Identificar os 10 primeiros produtos de sonorização no arquivo `PDF CATALOGO BLG (2)`, separar uma visão frontal e uma traseira de cada item, remover o fundo original via código e aplicar fundo branco sólido. Salvar imagens finais em `assets/products/` com nomenclatura consistente e sem substituir o PDF original.

- [x] **Payload de produtos Nuvemshop.** Gerar `data/nuvemshop-products.json` com nome, descrição técnica em HTML, imagens HTTPS ou referências para upload, SKU, variantes e demais campos necessários para o endpoint de produtos da Nuvemshop. O arquivo não deve inventar preços, especificações ou produtos ausentes no catálogo fonte.

- [x] **Vitrine Linear Áudio com Nimbus.** Construir interface responsiva, acessível e de alta performance com componentes e estilos oficiais do Nimbus Design System. A arquitetura deve destacar Line Array, microfones, subwoofers e palcos e carregar o catálogo por consulta dinâmica, sem itens fixos nos componentes da interface.

- [x] **Integração segura.** Disponibilizar uma camada de servidor preparada para a API Nuvemshop, mantendo `NUVEMSHOP_ACCESS_TOKEN` e `NUVEMSHOP_STORE_ID` somente em variáveis protegidas do servidor, nunca no bundle do navegador.

- [x] **Validação e entrega.** Validar TypeScript, build, manifesto de rotas, acessibilidade do fluxo principal e integridade do JSON/imagens. Fazer commit e push para `main` no repositório GitHub confirmado, preservando alterações remotas.

## Observações de integração

O PDF fonte foi lido do Drive e não foi versionado no repositório. O GitHub informado permanece como repositório de código/backup; como o repositório não serve mídia publicamente sem autenticação, o payload usa URLs HTTPS públicas CDN registradas em `data/asset-public-urls.json`.

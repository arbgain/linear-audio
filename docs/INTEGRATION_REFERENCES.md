# Referências oficiais

A interface usa os pacotes oficiais Nimbus e seus tokens CSS. A documentação de início orienta instalar `@nimbus-ds/styles` e importar componentes de forma isolada quando há poucos componentes: https://nuvemshop.dev/documentation/overview/getting-started

A referência de componentes e tokens é o repositório aberto Nimbus: https://github.com/TiendaNube/nimbus-design-system

A API Nuvemshop `2025-03` usa URLs no formato `https://api.nuvemshop.com.br/2025-03/{store_id}` e exige `Authorization: Bearer ACCESS_TOKEN`, `User-Agent` identificável e JSON para POST/PUT: https://nuvemshop.dev/en-US/api/getting-started

O OAuth retorna `user_id`, usado como ID de loja; os escopos relevantes para a carga inicial são `read_products` e `write_products`: https://nuvemshop.dev/en-US/api/authentication

O recurso de produto aceita nome, descrição localizada, imagens e variantes. Para criação com imagens, a documentação recomenda no máximo nove imagens no objeto inicial; a carga Linear Áudio usa duas imagens por produto: https://tiendanube.github.io/api-documentation/resources/product

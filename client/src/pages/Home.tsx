import { Alert } from "@nimbus-ds/alert";
import { Badge } from "@nimbus-ds/badge";
import { Button } from "@nimbus-ds/button";
import { Card } from "@nimbus-ds/card";
import { Text } from "@nimbus-ds/text";
import { Title } from "@nimbus-ds/title";
import {
  AudioLines,
  Boxes,
  Cable,
  ChevronRight,
  Headphones,
  Menu,
  MicVocal,
  RadioTower,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Speaker,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const categoryDefinitions = [
  { id: "line-array", label: "Line Array", detail: "Cobertura controlada", icon: RadioTower },
  { id: "microfones", label: "Microfones", detail: "Captação crítica", icon: MicVocal },
  { id: "subwoofers", label: "Subwoofers", detail: "Grave de impacto", icon: Speaker },
  { id: "palcos", label: "Palcos", detail: "Estrutura e rigging", icon: Boxes },
];

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ProductCard({ product }: { product: { name: string; category: string; brand?: string | null; technicalSummary: string; descriptionHtml: string; technicalSpecs: string[]; images: Array<{ src: string; alt: string; view?: "front" | "rear" | "detail"; position?: number }>; sku?: string | null; price?: string | null } }) {
  const primaryImage = product.images.find((image) => image.view === "front") ?? product.images[0];
  const summary = product.technicalSummary || stripHtml(product.descriptionHtml) || "Especificação técnica disponível mediante consulta.";
  const hasFrontAndRearViews = product.images.some((image) => image.view === "front") && product.images.some((image) => image.view === "rear");

  return (
    <Card padding="none" className="product-card">
      <div className="product-card__media">
        {primaryImage ? (
          <img src={primaryImage.src} alt={primaryImage.alt} loading="lazy" decoding="async" />
        ) : (
          <div className="product-card__empty-media" aria-label="Imagem de produto indisponível">
            <AudioLines aria-hidden="true" size={28} />
          </div>
        )}
      </div>
      <Card.Body padding="base" className="product-card__body">
        <div className="product-card__eyebrow">
          <span>{product.category}</span>
          {product.brand ? <span>{product.brand}</span> : null}
        </div>
        <Title as="h3" fontSize="h4">{product.name}</Title>
        <Text color="neutral-textLow" lineClamp={3}>{summary}</Text>
        <div className="product-card__meta" aria-label="Dados técnicos">
          {product.sku ? <span>SKU: {product.sku}</span> : <span>Ficha técnica em preparação</span>}
          {hasFrontAndRearViews ? <span>Frontal + traseira</span> : null}
        </div>
        {product.technicalSpecs.length > 0 ? (
          <ul className="product-card__specs">
            {product.technicalSpecs.slice(0, 3).map((spec) => <li key={spec}>{spec}</li>)}
          </ul>
        ) : null}
      </Card.Body>
    </Card>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("todos");
  const catalogQuery = trpc.catalog.list.useQuery(undefined, { staleTime: 60_000 });
  const catalog = catalogQuery.data;
  const products = catalog?.products ?? [];

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(new Set(products.map((product) => product.category)));
    return ["todos", ...Array.from(new Set([...categoryDefinitions.map((category) => category.id), ...dynamicCategories]))];
  }, [products]);

  const filteredProducts = useMemo(
    () => products.filter((product) => activeCategory === "todos" || product.category === activeCategory),
    [activeCategory, products],
  );

  const categoryLabel = (categoryId: string) => categoryDefinitions.find((category) => category.id === categoryId)?.label ?? categoryId.replace(/-/g, " ");
  const isPendingCatalog = catalog?.meta.status === "pending_catalog_pdf";

  return (
    <div className="storefront">
      <a className="skip-link" href="#catalogo">Pular para o catálogo</a>

      <header className="site-header">
        <div className="site-header__utility">
          <div className="content-shell utility-row">
            <span><ShieldCheck size={14} aria-hidden="true" /> Curadoria para locação, instalação e touring</span>
            <span className="utility-row__right"><Cable size={14} aria-hidden="true" /> Atendimento técnico B2B</span>
          </div>
        </div>
        <div className="content-shell site-header__main">
          <a className="brand" href="#inicio" aria-label="Linear Áudio, página inicial">
            <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
            <span>LINEAR <strong>ÁUDIO</strong></span>
          </a>

          <nav className={mobileMenuOpen ? "primary-nav primary-nav--open" : "primary-nav"} aria-label="Navegação principal">
            <a href="#solucoes" onClick={() => setMobileMenuOpen(false)}>Soluções</a>
            <a href="#catalogo" onClick={() => setMobileMenuOpen(false)}>Catálogo</a>
            <a href="#operacao" onClick={() => setMobileMenuOpen(false)}>Operação</a>
          </nav>

          <div className="site-header__actions">
            <button className="icon-action" type="button" aria-label="Pesquisar no catálogo" title="Pesquisa disponível após a carga inicial" disabled>
              <Search size={20} aria-hidden="true" />
            </button>
            <button className="menu-trigger" type="button" aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="hero" aria-labelledby="hero-title">
          <div className="content-shell hero__layout">
            <div className="hero__copy">
              <div className="eyebrow"><span /> Som profissional para operação crítica</div>
              <Title as="h1" id="hero-title" fontSize={{ xs: "h2", lg: "h1" }} className="hero__title" color="neutral-textHigh">
                Sistemas precisos.<br />Projetos que <em>seguram</em> o show.
              </Title>
              <Text className="hero__description" color="neutral-textLow" fontSize="highlight">
                Curadoria técnica para engenheiros, roadies e locadores que precisam de especificação clara, disponibilidade verificável e resposta direta.
              </Text>
              <div className="hero__actions">
                <Button as="a" href="#catalogo" appearance="primary" size="large">Explorar catálogo <ChevronRight size={18} aria-hidden="true" /></Button>
                <Button as="a" href="#operacao" appearance="neutral" size="large" className="hero__secondary-action">Como operamos</Button>
              </div>
              <div className="hero__stats" aria-label="Diferenciais operacionais">
                <div><strong>01</strong><span>Catálogo técnico</span></div>
                <div><strong>02</strong><span>Imagens reais de produto</span></div>
                <div><strong>03</strong><span>Integração Nuvemshop</span></div>
              </div>
            </div>
            <div className="hero__visual" aria-hidden="true">
              <div className="speaker-stack speaker-stack--left"><b /><b /><b /><b /></div>
              <div className="speaker-stack speaker-stack--right"><b /><b /><b /><b /></div>
              <div className="hero__measure hero__measure--top">DISPERSÃO CONTROLADA</div>
              <div className="hero__measure hero__measure--side">SPL · dB · Hz</div>
              <div className="hero__signal"><span /><span /><span /><span /><span /></div>
            </div>
          </div>
        </section>

        <section id="solucoes" className="solution-strip" aria-labelledby="solucoes-title">
          <div className="content-shell">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-kicker">Módulos de sistema</span>
                <Title as="h2" fontSize="h3" id="solucoes-title">O equipamento certo para cada frente.</Title>
              </div>
              <Text color="neutral-textLow">Navegue por famílias técnicas e compare itens pela aplicação.</Text>
            </div>
            <div className="solution-grid">
              {categoryDefinitions.map(({ id, label, detail, icon: Icon }) => (
                <a className="solution-card" href="#catalogo" key={id} onClick={() => setActiveCategory(id)}>
                  <Icon size={23} aria-hidden="true" />
                  <span className="solution-card__title">{label}</span>
                  <span className="solution-card__detail">{detail}</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="catalogo" className="catalog-section" aria-labelledby="catalogo-title">
          <div className="content-shell">
            <div className="catalog-section__header">
              <div>
                <span className="section-kicker">Base técnica</span>
                <Title as="h2" fontSize="h2" id="catalogo-title">Catálogo de equipamentos</Title>
                <Text color="neutral-textLow">Produtos e imagens são carregados do manifesto tratado, sem dados fixos na interface.</Text>
              </div>
              <div className="catalog-status" aria-live="polite">
                <Badge appearance={catalog?.integration === "nuvemshop-api" ? "success" : "primary"} count={catalog?.integration === "nuvemshop-api" ? "API sincronizada" : "Manifesto local"} />
                <span>{catalogQuery.isLoading ? "Atualizando" : `${products.length} itens`}</span>
              </div>
            </div>

            <div className="catalog-toolbar" role="group" aria-label="Filtros de categoria">
              <SlidersHorizontal size={18} aria-hidden="true" />
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "catalog-filter catalog-filter--active" : "catalog-filter"}
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === "todos" ? "Todos" : categoryLabel(category)}
                </button>
              ))}
            </div>

            {catalogQuery.isLoading ? (
              <div className="catalog-loading" role="status"><span className="loading-line" /><span className="loading-line" /><span className="loading-line" /></div>
            ) : null}

            {catalogQuery.isError ? (
              <Alert appearance="danger" title="O catálogo não pôde ser carregado">
                Verifique a camada de catálogo no servidor e tente novamente. Nenhum dado de produto foi exibido como substituto.
              </Alert>
            ) : null}

            {isPendingCatalog ? (
              <Alert appearance="warning" title="Carga inicial aguardando o PDF do catálogo">
                O arquivo fonte ainda não está disponível neste ambiente. A estrutura já está pronta para receber os 10 primeiros produtos, suas visões frontal e traseira e o payload da Nuvemshop sem inventar especificações.
              </Alert>
            ) : null}

            {!catalogQuery.isLoading && !catalogQuery.isError && filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : null}

            {!catalogQuery.isLoading && !catalogQuery.isError && !isPendingCatalog && filteredProducts.length === 0 ? (
              <div className="empty-catalog">
                <Headphones size={32} aria-hidden="true" />
                <Title as="h3" fontSize="h4">Nenhum item nesta família</Title>
                <Text color="neutral-textLow">Ajuste o filtro ou sincronize o manifesto de produtos tratado.</Text>
              </div>
            ) : null}
          </div>
        </section>

        <section id="operacao" className="operation-section" aria-labelledby="operacao-title">
          <div className="content-shell operation-section__layout">
            <div>
              <span className="section-kicker section-kicker--light">Método Linear</span>
              <Title as="h2" color="neutral-textHigh" fontSize="h2" id="operacao-title">Menos ruído. Mais decisão técnica.</Title>
            </div>
            <div className="operation-section__points">
              <div><b>01</b><span><strong>Especificação objetiva</strong><small>Descrição técnica, SKU e atributos de aplicação no mesmo fluxo.</small></span></div>
              <div><b>02</b><span><strong>Imagem sem distração</strong><small>Vista frontal e traseira tratadas em fundo branco sólido para leitura rápida.</small></span></div>
              <div><b>03</b><span><strong>Integração preparada</strong><small>Dados protegidos no servidor e payload alinhado ao endpoint de produtos Nuvemshop.</small></span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="content-shell site-footer__content">
          <div className="brand brand--footer"><span className="brand__mark" aria-hidden="true"><i /><i /><i /></span><span>LINEAR <strong>ÁUDIO</strong></span></div>
          <Text as="span" color="neutral-textLow">Infraestrutura de catálogo para som profissional.</Text>
        </div>
      </footer>
    </div>
  );
}

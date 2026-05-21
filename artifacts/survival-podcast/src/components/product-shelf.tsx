import { useState } from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";

export type ReviewedProduct = {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  externalUrl: string;
  zoneTags: string[];
  categoryTags: string[];
};

function ProductCard({ product }: { product: ReviewedProduct }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!product.imageUrl && !imgFailed;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 w-52 shrink-0 snap-start">
      <div className="w-full h-36 bg-muted flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={product.imageUrl!}
            alt={product.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/40 select-none">
            <ShoppingBag className="w-9 h-9" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">No image</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <h4 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
          {product.title}
        </h4>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed flex-1">
            {product.description}
          </p>
        )}
        <a
          href={product.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    </div>
  );
}

type ProductShelfProps = {
  products: ReviewedProduct[];
  heading?: string;
  subheading?: string;
  compact?: boolean;
};

export function ProductShelf({ products, heading, subheading, compact = false }: ProductShelfProps) {
  if (products.length === 0) return null;

  return (
    <section className={compact ? "" : "py-2"}>
      {heading && (
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-4 h-4 text-muted-foreground shrink-0" />
          <h3 className="font-semibold text-sm text-foreground">{heading}</h3>
        </div>
      )}
      {subheading && (
        <p className="text-xs text-muted-foreground mb-3 ml-6">{subheading}</p>
      )}
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}

type ProductShelfSectionProps = {
  products: ReviewedProduct[];
  heading: string;
  subheading?: string;
  zoneColor?: string;
};

export function ProductShelfSection({ products, heading, subheading, zoneColor }: ProductShelfSectionProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: zoneColor ? `${zoneColor}20` : undefined }}
        >
          <ShoppingBag
            className="w-4 h-4"
            style={{ color: zoneColor ?? "currentColor" }}
          />
        </div>
        <h2
          className="text-base font-bold"
          style={{ color: zoneColor ?? "currentColor" }}
        >
          {heading}
        </h2>
      </div>
      {subheading && (
        <p className="text-sm text-muted-foreground mb-4 ml-9">{subheading}</p>
      )}
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory ml-9"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}

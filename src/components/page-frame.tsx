import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; href?: string };

export function PageFrame({
  title,
  description,
  breadcrumb,
  width = "document",
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  width?: "document" | "wide" | "full";
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const widthClass = {
    document: "max-w-[900px]",
    wide: "max-w-[1200px]",
    full: "max-w-none",
  }[width];

  return (
    <div className={cn("mx-auto w-full px-8 py-10", widthClass, className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          {breadcrumb.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="truncate hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {(title || actions) && (
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

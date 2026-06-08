import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Yatayda taşmaya karşı scroll'lu container içinde stillenmiş bir `<table>`.
 *
 * Kullanım örnekleri:
 *   <Table>
 *     <THead><tr><Th>Daire</Th><Th align="right">Tutar</Th></tr></THead>
 *     <TBody>
 *       <tr><Td>A/1</Td><Td align="right">{tl(750)}</Td></tr>
 *     </TBody>
 *   </Table>
 */
export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto scrollbar-thin">
    <table className={cn("w-full text-sm", className)} {...props} />
  </div>
);

export const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "bg-violet-50/60 text-violet-900",
      "[&_th]:px-4 [&_th]:py-2.5 [&_th]:font-medium",
      className
    )}
    {...props}
  />
);

export const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={cn(
      "[&_tr]:border-t [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle",
      className
    )}
    {...props}
  />
);

type Align = "left" | "right" | "center";

const alignClass: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

/**
 * Tablo başlık hücresi. `align` ile metin yönü belirlenir; bu sayede
 * Td hücreleriyle başlıkları aynı yönde tutmak unutulmaz.
 */
export const Th = ({ align = "left", className, ...props }: ThProps) => (
  <th className={cn(alignClass[align], className)} {...props} />
);

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

/** Tablo değer hücresi. Varsayılan sola; sayısal değerler için `align="right"`. */
export const Td = ({ align = "left", className, ...props }: TdProps) => (
  <td className={cn(alignClass[align], className)} {...props} />
);

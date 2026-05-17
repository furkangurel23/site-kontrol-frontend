import { Inbox } from "lucide-react";

export const Empty = ({ title = "Kayıt yok", subtitle = "Henüz veri eklenmemiş." }:
  { title?: string; subtitle?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-violet-100 p-3 text-violet-600">
      <Inbox className="h-6 w-6" />
    </div>
    <div className="mt-3 font-medium">{title}</div>
    <div className="text-sm text-muted-foreground">{subtitle}</div>
  </div>
);

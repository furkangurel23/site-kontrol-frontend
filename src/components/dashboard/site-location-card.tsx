"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, Phone } from "lucide-react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Site = {
  id: number;
  name: string;
  address: string | null;
  district: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  googleMapsEmbedUrl: string | null;
  googleMapsLink: string | null;
};

export function SiteLocationCard() {
  const { data: site, isLoading } = useQuery<Site>({
    queryKey: ["site", "current"],
    queryFn: async () => (await api.get("/api/sites/current")).data,
    staleTime: 5 * 60_000,
  });

  if (isLoading || !site) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" /> Sitenizin Konumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const addressLine = [
    site.neighborhood,
    site.district,
    site.city,
    site.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-500" />
              {site.name}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{addressLine}</p>
            {site.landmark && (
              <p className="mt-0.5 text-xs text-violet-700">📍 {site.landmark}</p>
            )}
          </div>
          {site.googleMapsLink && (
            <a
              href={site.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
            >
              Haritada aç <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {site.googleMapsEmbedUrl ? (
          <div className="overflow-hidden rounded-xl border">
            <iframe
              title="Site konumu"
              src={site.googleMapsEmbedUrl}
              className="block h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Konum bilgisi henüz tanımlı değil.
          </div>
        )}

        <div className="grid gap-2 text-sm md:grid-cols-2">
          {site.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{site.address}</span>
            </div>
          )}
          {site.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <a href={`tel:${site.phone}`} className="hover:underline">
                {site.phone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

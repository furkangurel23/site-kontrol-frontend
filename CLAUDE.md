# Site Kontrol — Frontend

Yazlık sitesi (Balıkesir / Burhaniye / **Pelitköy**) yönetim sisteminin web arayüzü.
Site yöneticisinin aidat, gider, sakin/daire, duyuru, arıza-talep, toplantı ve
raporlama işlerini yönettiği **renkli, dashboard tarzı** bir panel.

- **GitHub:** https://github.com/furkangurel23/site-kontrol-frontend
- **Backend repo:** https://github.com/furkangurel23/site-kontrol-backend
- **Arayüz dili:** Türkçe · **Kod:** İngilizce
- Backend ile JWT (email + şifre) üzerinden konuşur.

---

## Teknoloji Stack'i

> **ÖNEMLİ:** Tüm bağımlılıklar yakın zamanda en güncel sürümlere yükseltildi.
> En kritik geçiş **Tailwind v3 → v4** (CSS-first config) ve **Next 15 → 16**.
> Aşağıdaki notlar (Tailwind v4 geçişi) yeni session'da tuzağa düşmemek için kritik.

| Bileşen | Sürüm |
|---|---|
| Next.js | **16** (App Router, Turbopack) |
| React / react-dom | **19.2** |
| TypeScript | **6.x** |
| Tailwind CSS | **4.x** (CSS-first, `@tailwindcss/postcss` + `tw-animate-css`) |
| UI primitives | Radix UI (dialog, dropdown, label, select, slot, tabs, toast) |
| Bileşen stili | shadcn benzeri (CVA + `clsx` + `tailwind-merge` v3) |
| İkonlar | lucide-react **1.x** |
| Grafikler | Recharts **3.x** |
| Server state | TanStack Query (react-query) 5 |
| Client state | Zustand 5 |
| HTTP | axios 1.17 |
| Formlar | react-hook-form 7 + zod **4** (`@hookform/resolvers` v5) |
| Toast | sonner **2.x** |
| Tarih | date-fns 4 |
| Lint | ESLint **9** (flat config, `eslint.config.mjs`) + eslint-config-next 16 |

### Yükseltme geçişinde dikkat edilmesi gerekenler (tekrar tuzağa düşme)

- **Tailwind v4** artık CSS-first: `tailwind.config.ts` **kaldırıldı**.
  Tüm tema `src/app/globals.css` içinde `@import "tailwindcss"` + `@theme inline`
  bloğunda yaşıyor. Renkler `--color-*`, animasyonlar `--animate-*` token'ları.
- PostCSS: `postcss.config.mjs` artık sadece `@tailwindcss/postcss` plugin'i
  kullanıyor; `autoprefixer`/`postcss` ayrı paket olarak GEREKMİYOR (v4 dahili).
- `@tailwind base/components/utilities` direktifleri YOK; tek `@import "tailwindcss"`.
- `tailwindcss-animate` → **`tw-animate-css`** (`@import "tw-animate-css"`).
- `darkMode: class` → CSS'te `@custom-variant dark (&:is(.dark *))`.
- **Zod 4:** `z.string().email()` deprecated → **`z.email()`** kullan.
- **Recharts 3:** `Tooltip` `formatter` param tipi sıkılaştı; `(value) => fn(value as number)`
  şeklinde cast et (eski `(value: number | string)` annotasyonu derlenmez).
- **ESLint 10 HENÜZ uyumsuz:** eslint-config-next 16 + ESLint 10 lint'te crash ediyor
  (`scopeManager.addGlobals is not a function`). Bu yüzden eslint **9**'da tutuldu.
  Ekosistem ESLint 10'a yetişince yükseltilebilir.
- `next lint` deprecated → `lint` script'i artık `eslint .`.
- `next.config.mjs`'e `turbopack.root` eklendi (multi-lockfile uyarısını susturur).
- `npm audit`: Next 16'nın transitive `postcss` uyarısı var (moderate) —
  `audit fix --force` Next'i canary'e düşürür, YAPMA; Next patch'leyince düzelir.

---

## Proje Yapısı

```
src/
  app/
    login/page.tsx
    dashboard/
      page.tsx              # ana dashboard (grafikler, özet kartlar, site konumu)
      aidat/page.tsx        # dues — aidat planları, tahakkuk, tahsilat
      giderler/page.tsx     # expenses
      daireler/page.tsx     # apartments
      sakinler/page.tsx     # residents
      duyurular/page.tsx    # announcements
      talepler/page.tsx     # complaints (arıza/talep)
      toplantilar/page.tsx  # meetings (tutanaklar)
      kullanicilar/page.tsx # users (yönetim)
      raporlar/page.tsx     # reports (Excel/Word indirme)
  components/
    ui/        # badge, button, card, dialog, dropdown, empty, field,
               # input, page-header, select, table
    charts/    # Recharts sarmalayıcıları
    dashboard/ # dashboard'a özel bileşenler
    layout/    # sidebar / header / shell
  hooks/       # (şu an boş)
  lib/
    api.ts            # axios instance + JWT interceptor + Page<T> tipi
    status-colors.ts  # statü/rol/öncelik renk haritaları
    utils.ts          # cn(), extractApiError()
  stores/
    auth.ts           # Zustand auth store (token + logout)
```

---

## Önemli Konvansiyonlar

### API katmanı (`src/lib/api.ts`)
- `baseURL` = `process.env.NEXT_PUBLIC_API_URL` (`.env.local`).
- Request interceptor: Zustand store'daki token'ı `Authorization: Bearer ...` ekler.
- Response interceptor: **401**'de otomatik logout + `/login`'e yönlendirme.
- `Page<T>` tipi backend'in sayfalama yanıtıyla birebir (`content`, `page`, `size`,
  `totalElements`, `totalPages`, `first`, `last`).

### Ortak UI primitive'leri (CSS kayması yaşamamak için bunları kullan)
- **`PageHeader`** — her sayfanın başlığı/aksiyonları için.
- **`Field`** — Label + control sarmalayıcı (form alanları).
- **`Select`** — native select + chevron wrapper.
- **`Table`** ile birlikte **`Th` / `Td`** — `align` prop'u alır.
  > Sayısal kolonlarda **`align="right"`** kullan; aksi halde header sola,
  > hücre sağa kayar (daha önce yaşanan hizalama bug'ı bu yüzdendi).
- **`Badge`** — `BadgeColor` tipi export eder.
- Renkler: `lib/status-colors.ts` (CHARGE_STATUS_COLORS, COMPLAINT_STATUS_COLORS,
  PRIORITY_COLORS, ANNOUNCEMENT_CATEGORY_COLORS, RESIDENT_TYPE_COLORS, ROLE_COLORS,
  `balanceTextClass()`).
- Hata mesajı: backend `ApiError`'ından okumak için `extractApiError()` (`lib/utils.ts`).

---

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # prod build — tüm sayfalar tsc-temiz derlenmeli
npm run lint
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080   # backend
```

> **Uyarı (zararsız):** Hem `~/package-lock.json` hem proje kökünde lockfile olunca
> Next.js workspace root konusunda uyarı verir. Build'i etkilemez; istenirse
> `next.config`'e `outputFileTracingRoot` eklenerek susturulabilir.

---

## Git durumu / Yapılacaklar

- Son commit: `cbfddc9 feat(dashboard): site konumu kartı eklendi (Pelitköy harita embed)`
- **Commit'lenmemiş işler var** (~18 dosya): CSS/komponent refactor'u
  (PageHeader/Field/Select/Th/Td/status-colors) + 8+ sayfa migrasyonu, tip
  düzeltmeleri. → Henüz push edilmedi. Son `npm run build` temiz geçti (15 sayfa).

### Olası sonraki adımlar

- [ ] CSS/komponent refactor'unu commit & push et.
- [ ] Mobil sidebar/header drawer (deferred, düşük öncelik).
- [ ] In-app bildirim (SSE) entegrasyonu — backend `/api/notifications` hazır.
- [ ] `hooks/` altına ortak query hook'ları çıkar (tekrar eden useQuery'ler).
- [ ] Erişilebilirlik / loading & empty state'lerin gözden geçirilmesi.

---

## Backend ile ilişki (hızlı referans)

Backend base path'leri: `/api/auth`, `/api/users`, `/api/apartments`,
`/api/residents`, `/api/dues`, `/api/expenses`, `/api/announcements`,
`/api/complaints`, `/api/meetings`, `/api/notifications`, `/api/dashboard`,
`/api/reports`, `/api/sites`.

Default admin (geliştirme): `admin@sitekontrol.local` / `Admin123!`.
Backend stack'i Spring Boot 4 + Java 25 + Kotlin 2.4 + PostgreSQL 17'ye yükseltildi
(detay: backend repo'sundaki `CLAUDE.md`).

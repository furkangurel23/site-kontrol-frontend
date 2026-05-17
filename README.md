# Site Kontrol — Frontend

Renkli dashboard tarzı, **Next.js 15 + React 19 + Tailwind v3 + shadcn-tarzı UI + Recharts** ile yazılmış site/apartman yönetim paneli.

## Özellikler

- 🎨 Renkli, gradient'li modern dashboard tasarımı
- 📊 Recharts ile grafikler (BarChart, PieChart, LineChart)
- 🔐 JWT auth + Zustand persistent state
- 🛎️ Bell ikonu, okunmamış bildirim sayacı (30 sn'de polling)
- 📅 Türkçe arayüz, currency `tr-TR`
- 📥 Excel (`.xlsx`) ve Word (`.docx`) raporu indirme
- ✅ Tüm CRUD'lar role-based gizleme

## Sayfalar

| Yol | Açıklama |
|---|---|
| `/login` | Giriş |
| `/dashboard` | KPI kartları, aylık nakit akışı, gider dağılımı, en borçlu daireler |
| `/dashboard/aidat` | Aidat planı oluştur, tahsilat al |
| `/dashboard/giderler` | Gider gir/sil, kategori bazlı grafik |
| `/dashboard/daireler` | Daire CRUD |
| `/dashboard/sakinler` | Sakin (malik/kiracı) CRUD + arama |
| `/dashboard/duyurular` | Duyuru yayınla |
| `/dashboard/talepler` | Arıza/talep aç ve takip et |
| `/dashboard/toplantilar` | Toplantı tutanağı yönet |
| `/dashboard/raporlar` | Excel/Word indir |
| `/dashboard/kullanicilar` | Kullanıcı CRUD (admin) |

## Çalıştırma

### Geliştirme (npm)

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL doğru olsun
npm install --legacy-peer-deps
npm run dev
```

http://localhost:3000

### Docker

```bash
docker build -t sitekontrol-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8080 sitekontrol-frontend
```

## Konfigürasyon

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL'i (örn. `http://localhost:8080`) |

## Yapı

```
src/
├── app/
│   ├── login/                # Login sayfası (gradient hero + form)
│   ├── dashboard/            # Tüm panel sayfaları
│   ├── layout.tsx, providers.tsx
│   └── globals.css           # Tailwind + renk paleti
├── components/
│   ├── ui/                   # Button, Card, Input, Dialog, Table, Badge
│   ├── layout/               # Sidebar, Header, AuthGuard
│   └── charts/               # StatCard
├── lib/
│   ├── api.ts                # Axios instance, JWT interceptor
│   └── utils.ts              # cn(), tl() (Türk Lirası formatlama)
└── stores/
    └── auth.ts               # Zustand store (persist)
```

## Lisans

MIT

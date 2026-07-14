# 🗂️ ESN Manager — Guide de mise en production

Application de gestion de sous-traitance, CRA et facturation pour ESN.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 App Router + TypeScript |
| Base de données | PostgreSQL (Neon) + Drizzle ORM |
| Authentification | NextAuth v5 (Credentials) |
| Emails transactionnels | Resend + React Email |
| Déploiement | Vercel |
| CI/CD | GitHub Actions |
| Dev local | Docker Compose (PostgreSQL + Mailpit) |

---

## 🚀 Démarrage rapide (développement)

### 1. Cloner et installer

```bash
git clone https://github.com/mon-esn/esn-manager.git
cd esn-manager
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
# Éditer .env.local avec vos vraies valeurs
```

### 3. Base de données locale

```bash
# Lancer PostgreSQL + Mailpit via Docker
docker compose up -d

# Générer et appliquer les migrations
npm run db:generate
npm run db:push

# Peupler la base avec des données de démonstration
npm run db:seed
```

### 4. Lancer le serveur de développement

```bash
npm run dev
# → http://localhost:3000
```

**Comptes de démonstration :**
- Admin : `admin@mon-esn.fr` / `admin1234`
- Consultant : `jean.dupont@mon-esn.fr` / `jean1234`

**Emails locaux :** ouvrir http://localhost:8025 (Mailpit)

---

## 🏗️ Architecture

```
esn-manager/
├── app/
│   ├── api/               # Routes API REST
│   │   ├── auth/          # NextAuth handlers
│   │   ├── cra/           # CRUD CRA + statuts
│   │   ├── consultants/   # CRUD consultants
│   │   ├── factures/      # Génération + envoi factures
│   │   └── email/         # Relances CRA
│   ├── auth/login/        # Page de connexion
│   ├── admin/             # Pages admin (protégées)
│   │   ├── dashboard/     # Vue d'ensemble + KPIs
│   │   ├── consultants/   # Gestion consultants
│   │   ├── annuaire/      # Partenaires & clients
│   │   ├── validation/    # Validation CRA
│   │   ├── factures/      # Suivi factures
│   │   └── notifications/ # Alertes & relances
│   └── consultant/        # Pages consultant (protégées)
│       ├── cra/           # Saisie CRA (calendrier)
│       └── reports/       # Historique CRA
├── db/
│   ├── schema.ts          # Schéma Drizzle complet
│   ├── index.ts           # Client DB singleton
│   ├── seed.ts            # Données de démonstration
│   └── migrations/        # Fichiers de migration SQL
├── lib/
│   ├── auth.ts            # Config NextAuth + helpers RBAC
│   ├── email.ts           # Service Resend
│   ├── validations.ts     # Schémas Zod
│   └── utils.ts           # Utilitaires partagés
├── emails/                # Templates React Email
│   ├── cra-relance.tsx
│   ├── cra-validate.tsx
│   ├── cra-refus.tsx
│   └── facture.tsx
├── components/
│   ├── ui/                # Composants génériques
│   ├── admin/             # Composants admin
│   └── consultant/        # Composants consultant
├── middleware.ts           # Auth + routing RBAC
├── .env.example
├── .github/workflows/ci.yml
└── docker-compose.yml
```

---

## 🔐 Sécurité (RBAC)

| Route | Admin | Consultant |
|-------|-------|-----------|
| `/admin/*` | ✅ | ❌ → redirect |
| `/consultant/*` | ❌ → redirect | ✅ |
| `GET /api/cra?consultantId=X` | ✅ tout | ✅ son propre CRA |
| `PATCH /api/cra` statut valide/refuse | ✅ | ❌ |
| `POST /api/factures` | ✅ | ❌ |
| `POST /api/email/relance` | ✅ | ❌ |

---

## 🌐 Mise en production (Vercel + Neon)

### 1. Base de données Neon

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un projet → copier la **pooled connection string**
3. Lancer les migrations : `DATABASE_URL=... npm run db:migrate`

### 2. Email Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier votre domaine (DNS TXT + MX)
3. Créer une clé API → copier dans `RESEND_API_KEY`
4. Définir `EMAIL_FROM=ESN Manager <noreply@votre-domaine.fr>`

### 3. Déploiement Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Ou via GitHub Actions (automatique sur push `main`) :
- Ajouter les secrets GitHub : `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### 4. Variables Vercel

Configurer dans Vercel → Settings → Environment Variables :

```
DATABASE_URL          → Neon pooled connection string
AUTH_SECRET           → openssl rand -base64 32
NEXT_PUBLIC_APP_URL   → https://votre-app.vercel.app
RESEND_API_KEY        → re_XXXXXXXXXXXX
EMAIL_FROM            → ESN Manager <noreply@votre-domaine.fr>
```

---

## 📧 Emails envoyés automatiquement

| Déclencheur | Destinataire | Template |
|-------------|-------------|----------|
| CRA non soumis le 20 du mois | Consultant | Relance |
| CRA validé par l'admin | Consultant | Validation |
| CRA refusé par l'admin | Consultant | Refus + motif |
| Facture générée et envoyée | Partenaire ESN | Facture + PDF en PJ |

---

## 🛠️ Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run typecheck    # Vérification TypeScript
npm run lint         # ESLint
npm run db:generate  # Générer les fichiers de migration
npm run db:migrate   # Appliquer les migrations (prod)
npm run db:push      # Push direct (dev uniquement)
npm run db:studio    # Drizzle Studio (interface DB)
npm run db:seed      # Peupler la base (dev)
```

---

## 📦 Évolutions suggérées

- [ ] Upload réel des justificatifs (Vercel Blob ou S3)
- [ ] Génération PDF côté serveur (jsPDF) joint à la facture
- [ ] Tableau de bord avec graphiques recharts
- [ ] Export Excel des CRA et factures
- [ ] Notifications push navigateur
- [ ] Application mobile (React Native / Expo)
- [ ] Intégration comptable (FEC, sage, API impots.gouv)
- [ ] Multi-ESN (mode SaaS avec tenant isolation)

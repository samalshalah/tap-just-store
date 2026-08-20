# Run the Tap Rater storefront on your own computer

## What you need (one time)

1. **Node 20 or newer** — https://nodejs.org (the LTS installer)
2. **pnpm** — after Node is installed, open a terminal and run: `npm install -g pnpm`
3. **Docker Desktop** — https://www.docker.com/products/docker-desktop (this runs the database; nothing else needed)

## Start it

Open a terminal in this folder and run:

**Mac / Linux**
```bash
./start-local.sh
```

**Windows (PowerShell)**
```powershell
docker compose up -d
pnpm install
pnpm db:push
Get-Content seed\seed.sql | docker exec -i taprater-db psql -U preview -d preview
pnpm dev
```

First run takes a few minutes (installing packages). After that it starts in seconds.

Then open:

- **Shop:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/login — password `tapjust-admin`

Stop it with `Ctrl+C`. The database keeps running in Docker; `docker compose down` stops it, and your data stays until you run `docker compose down -v`.

## What's in the store right now

- Brand: **Tap Rater** (the only brand)
- Category: **NFC Stands** (the only category)
- Products: **none** — add them at Admin → Products → Add product

Note when adding products: the price field is **whole dollars** (type `40`, not `40.00`). The Strain / THC / CBD fields are cannabis leftovers from the original template — leave them blank; they're already hidden on the storefront.

## Change the admin password

Edit `.env.local`, change `ADMIN_PASSWORD`, restart.

## Files I added

- `start-local.sh` — one-command start
- `docker-compose.yml` — the local Postgres
- `seed/seed.sql` — resets the store to the clean Tap Rater state
- `LOCAL_SETUP.md` — the technical write-up (stack, findings, what to fix before selling)

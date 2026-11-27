# SmartReceipt - MySQL setup

This version keeps the existing UI and API behavior, but replaces the JSON file persistence with MySQL-backed persistence.

## 1. Start MySQL

Using XAMPP, start **MySQL**. Apache is not required by the Node/Express application.

## 2. Create the database

Open phpMyAdmin at `http://localhost/phpmyadmin` and import:

`database/mysql_setup.sql`

Or run the SQL inside that file in the MySQL console.

## 3. Configure `.env`

Copy `.env.example` to `.env` and set:

```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="smartreceipt_db"
```

Keep the existing Gemini/Admin values from your original project.

## 4. Install dependencies

```bash
npm install
```

This installs `mysql2`.

## 5. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

On the first successful startup, if `data/smartreceipt_db.json` exists and the MySQL state table is empty, the application imports that existing JSON data into MySQL automatically. After that, application saves go to MySQL.

## 6. Verify

In phpMyAdmin, open `smartreceipt_db` and check:

`smartreceipt_app_state`

There should be one row with `id = 1`. The `data` column contains the application's persisted state as JSON inside MySQL. This approach intentionally preserves the existing website/API behavior without changing the UI.

## Important

Do not delete `data/smartreceipt_db.json` until you have confirmed the first MySQL startup succeeds. It is used only as the one-time migration source when the MySQL state table is empty.

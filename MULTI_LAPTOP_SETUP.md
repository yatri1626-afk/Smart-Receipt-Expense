# SmartReceipt — 4 Laptop Shared MySQL Setup

> **Important:** The existing SmartReceipt website UI/pages/design are kept as-is. This build only adds the shared-device/database behavior needed for the 4-laptop setup.

## 1. Architecture

Use **one laptop as the Server Laptop**. That laptop runs SmartReceipt + the central MySQL connection.

The other 3 laptops do **not** need their own MySQL database and do **not** need a separate SmartReceipt server. They open the same SmartReceipt server URL in a browser.

```text
                 SERVER LAPTOP
          SmartReceipt + MySQL Server
                       |
             Local Wi-Fi / LAN
          _____ ______|_______ _____
         /           |            \
   Laptop 1      Laptop 2       Laptop 3       Laptop 4
   Account       Receipt         Analysis       Admin
   + Dashboard   + History       + Dashboard   + Admin Panel
```

All four laptops still have the **full website**. The `device` URL only selects the initial working page and, for laptops 2/3, removes the need to log in. The normal website navigation is not removed.

## 2. Laptop roles

Assume the server laptop IPv4 is `192.168.1.50`.

- Laptop 1: `http://192.168.1.50:3000/?device=account`
- Laptop 2: `http://192.168.1.50:3000/?device=receipts`
- Laptop 3: `http://192.168.1.50:3000/?device=analysis`
- Laptop 4: `http://192.168.1.50:3000/?device=admin`

Replace `192.168.1.50` with the actual IPv4 address of your server laptop.

## 3. MySQL Workbench setup (Server Laptop)

### Step 1 — Make sure MySQL Server is installed and running

MySQL Workbench is the management tool; the actual database server is **MySQL Server**.

Open **MySQL Workbench** and connect to your local MySQL connection, normally:

- Hostname: `localhost`
- Port: `3306`
- Username: `root`
- Password: the password you set for MySQL Server

If Workbench cannot connect, start the MySQL Server service first.

### Step 2 — Create the SmartReceipt database

In MySQL Workbench:

1. Open the connection.
2. Click **File → Open SQL Script**.
3. Select:
   `database/mysql_setup.sql`
4. Click the lightning-bolt **Execute** button.
5. Refresh the Schemas panel.
6. You should see:
   `smartreceipt_db`

The SmartReceipt server also creates/updates its application-state table automatically when it starts.

### Step 3 — Configure `.env`

Inside the SmartReceipt project folder, copy:

`.env.example` → `.env`

Then set the MySQL values to match your MySQL Server:

```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="YOUR_MYSQL_PASSWORD"
DB_NAME="smartreceipt_db"
DB_CONNECTION_LIMIT="10"
```

Example if your root password is `1234`:

```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="1234"
DB_NAME="smartreceipt_db"
DB_CONNECTION_LIMIT="10"
```

Do **not** put the server laptop's LAN IP in `DB_HOST`. MySQL is running locally on the server laptop, so SmartReceipt uses `localhost`.

### If MySQL root has no password

Use:

```env
DB_PASSWORD=""
```

## 4. Start SmartReceipt on the Server Laptop

Open Command Prompt / PowerShell in the project folder:

```bash
npm install
npm run dev
```

The server listens on `0.0.0.0:3000`, which allows the other laptops on the same LAN to open it.

Keep this terminal/server running while the other laptops use the website.

## 5. Find the Server Laptop IP

On the Server Laptop, open Command Prompt and run:

```text
ipconfig
```

Find the IPv4 Address of the active Wi-Fi/Ethernet adapter, for example:

```text
IPv4 Address . . . . . . . . . . : 192.168.1.50
```

Use that address in the browser URLs from section 2.

## 6. Windows Firewall

If another laptop cannot open the website:

1. On the Server Laptop open **Windows Defender Firewall**.
2. Allow Node.js / Node through the firewall on the **Private network**.
3. If required, create an inbound TCP rule for port `3000`.
4. Make sure all laptops are connected to the same Wi-Fi/LAN.

You do **not** need to expose MySQL port `3306` to the other laptops for this setup. Only SmartReceipt's web server on port `3000` needs to be reachable from the other laptops.

## 7. How the shared account works

1. Open Laptop 1 using `?device=account`.
2. Create the account normally.
3. The account is saved in the central MySQL-backed SmartReceipt state and becomes the shared active account.
4. After account creation, Laptop 1 continues into the normal SmartReceipt dashboard.
5. Open Laptop 2 using `?device=receipts`. It automatically reads the same shared account. No login is required.
6. Upload a receipt on Laptop 2. The receipt is saved centrally.
7. Laptop 3 using `?device=analysis` automatically refreshes the central receipts approximately every 2 seconds. The uploaded receipt therefore becomes available for analysis without another login.
8. Laptop 4 uses the existing Admin Panel and its existing admin authentication.

## 8. Important behavior

- All laptops use the same central SmartReceipt data.
- All laptops still show the complete SmartReceipt website/navigation after the shared account is available.
- Laptop 2 and Laptop 3 do not require normal user login.
- Laptop 1's account creation selects the shared account automatically.
- The Admin Panel remains protected by its existing admin login.
- Do not start separate databases on the other laptops if you want one shared dataset.

## 9. Quick test

After setup, test in this order:

1. Laptop 1 → Create Account → Enter → Dashboard appears.
2. Laptop 2 → Open `?device=receipts` → same account is loaded without login.
3. Laptop 2 → Upload one receipt.
4. Laptop 3 → Open `?device=analysis` → wait a few seconds → receipt/analysis data appears.
5. Laptop 4 → Open `?device=admin` → existing Admin login works.
6. In MySQL Workbench, refresh `smartreceipt_db` and verify the application state exists.

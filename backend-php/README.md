# SmartReceipt AI - PHP & MySQL Backend

આ ફોલ્ડરમાં સંપૂર્ણ **PHP REST API Backend** અને **MySQL Database Schema** આપેલું છે, જેથી તમે આ પ્રોજેક્ટને તમારા લોકલ કમ્પ્યુટરમાં **XAMPP / WAMP / Apache / phpMyAdmin** સાથે સરળતાથી ચલાવી શકો.

---

## 📁 ફોલ્ડર સ્ટ્રક્ચર (Folder Structure)

```
backend-php/
├── config/
│   └── db.php                 # MySQL PDO ડેટાબેઝ કનેક્શન અને CORS કન્ફિગરેશન
├── database/
│   └── schema.sql             # MySQL ડેટાબેઝ ટેબલ્સ (users, receipts, budgets, admins)
├── api/
│   ├── auth/
│   │   ├── login.php          # યુઝર લૉગિન API
│   │   └── register.php       # નવું એકાઉન્ટ રજીસ્ટ્રેશન API
│   ├── receipts/
│   │   └── index.php          # રસીદો ઉમેરવા, મેળવવા અને ડિલીટ કરવાની CRUD API
│   └── admin/
│       ├── login.php          # એડમિન લૉગિન API
│       ├── stats.php          # એડમિન ડેશબોર્ડ સ્ટેટિસ્ટિક્સ API
│       └── users.php          # બધા યુઝર્સનું લિસ્ટ અને ડિલીટ API
└── README.md                  # આ માર્ગદર્શિકા
```

---

## 🚀 XAMPP માં સેટઅપ કેવી રીતે કરવું? (Step-by-step Guide)

### સ્ટેપ ૧: XAMPP શરૂ કરો
1. તમારા કમ્પ્યુટરમાં **XAMPP Control Panel** ખોલો.
2. **Apache** અને **MySQL** બંનેને **Start** કરો.

### સ્ટેપ ૨: ડેટાબેઝ ઈમ્પોર્ટ કરો (phpMyAdmin)
1. બ્રાઉઝરમાં ખોલો: `http://localhost/phpmyadmin`
2. ઉપર **Import** ટેબ પર ક્લિક કરો.
3. `Choose File` બટન પર ક્લિક કરીને આ ફાઈલ પસંદ કરો:
   `backend-php/database/schema.sql`
4. નીચે **Import / Go** બટન દબાવો.
   *(આનાથી `smartreceipt_db` નામનો ડેટાબેઝ અને બધા ટેબલ્સ આપમેળે બની જશે!)*

### સ્ટેપ ૩: PHP ફાઈલો મૂકો
1. આ `backend-php` ફોલ્ડરને તમારા XAMPP ના `htdocs` ફોલ્ડરમાં કોપી કરી દો:
   `C:\xampp\htdocs\smartreceipt-api\`
2. હવે તમારી PHP API નો બેઝ પાથ આ રહેશે:
   `http://localhost/smartreceipt-api/api/`

---

## 🔑 ડિફોલ્ટ એડમિન આઈડી અને પાસવર્ડ (MySQL Database)
- **Admin Email:** `adminside2026@gmail.com`
- **Admin Password:** `admin@2026`

---

## 🌐 મુખ્ય API એન્ડપોઇન્ટ્સ (Endpoints)

| કયું કામ | મેથડ | URL |
|---|---|---|
| User Login | `POST` | `http://localhost/smartreceipt-api/api/auth/login.php` |
| User Register | `POST` | `http://localhost/smartreceipt-api/api/auth/register.php` |
| Get Receipts | `GET` | `http://localhost/smartreceipt-api/api/receipts/index.php?userId=USER_ID` |
| Add Receipt | `POST` | `http://localhost/smartreceipt-api/api/receipts/index.php` |
| Delete Receipt | `DELETE` | `http://localhost/smartreceipt-api/api/receipts/index.php?id=REC_ID` |
| Admin Login | `POST` | `http://localhost/smartreceipt-api/api/admin/login.php` |
| Admin Stats | `GET` | `http://localhost/smartreceipt-api/api/admin/stats.php` |
| Admin Users | `GET` | `http://localhost/smartreceipt-api/api/admin/users.php` |

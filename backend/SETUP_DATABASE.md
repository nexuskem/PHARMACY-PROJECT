# Database Setup Instructions

## Option 1: Using MySQL Workbench (Recommended for GUI users)

### Step 1: Open MySQL Workbench
1. Launch MySQL Workbench on your system
2. Connect to your MySQL server (usually `localhost` with port `3306`)
   - Enter your MySQL root password when prompted

### Step 2: Open the SQL Script
1. In MySQL Workbench, go to **File → Open SQL Script**
2. Navigate to: `backend/database.sql`
3. The script will open in a new query tab

### Step 3: Execute the Script
1. Click the **Execute** button (⚡ icon) in the toolbar
   - Or press `Ctrl+Shift+Enter` (Windows/Linux)
   - Or press `Cmd+Shift+Enter` (Mac)
2. Wait for the execution to complete
3. You should see "Success" messages in the output panel

### Step 4: Verify the Database
1. In the left sidebar, click the refresh icon (🔄) next to "SCHEMAS"
2. You should see `medicare_pharmacy` database appear
3. Expand it to see all the tables:
   - `users`
   - `products`
   - `cart_items`
   - `orders`
   - `order_items`
   - `appointments`

### Step 5: Verify Sample Data
1. Right-click on the `products` table
2. Select **Select Rows - Limit 1000**
3. You should see 20 products loaded

---

## Option 2: Using Command Line

### Where to Run the Command

Open a terminal/command prompt and navigate to the project root directory:

```bash
cd "/home/rex/Desktop/Desktop/PHARMACY PROJECT"
```

Then run:

```bash
mysql -u root -p < backend/database.sql
```

You will be prompted to enter your MySQL root password.

**Note:** Make sure MySQL is installed and the `mysql` command is in your PATH.

---

## Option 3: Manual Setup in MySQL Workbench

If you prefer to run commands manually:

1. **Connect to MySQL Workbench**

2. **Create the database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS medicare_pharmacy;
   USE medicare_pharmacy;
   ```

3. **Open and execute the SQL script:**
   - File → Open SQL Script → Select `backend/database.sql`
   - Execute the script (⚡ button)

---

## Troubleshooting

### ERROR 2002: Can't connect to MySQL server

This error means MySQL server is not running. Follow these steps:

### "MySQL configuration not found at /etc/mysql/my.cnf"

If you see this specific error, MySQL is missing its configuration file. **Quick Fix:**

**Option A: Use the automated fix script (Recommended)**
```bash
cd "/home/rex/Desktop/Desktop/PHARMACY PROJECT/backend"
./fix_mysql_complete.sh
```

This script will:
- Create the `/etc/mysql` directory
- Create the MySQL configuration file
- Initialize the MySQL data directory (if needed)
- Start MySQL service

**Option B: Manual fix**
```bash
# Create MySQL config directory
sudo mkdir -p /etc/mysql

# Create basic config file
sudo tee /etc/mysql/my.cnf > /dev/null <<'EOF'
[mysqld]
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
datadir = /var/lib/mysql
bind-address = 127.0.0.1
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[client]
default-character-set = utf8mb4
EOF

# Create log directory
sudo mkdir -p /var/log/mysql
sudo chown mysql:mysql /var/log/mysql

# Initialize data directory (if needed)
sudo mysql_install_db --user=mysql --datadir=/var/lib/mysql

# Fix permissions
sudo chown -R mysql:mysql /var/lib/mysql

# Start MySQL
sudo systemctl start mysql
```

### General: MySQL server is not running

Follow these steps:

#### Step 1: Check MySQL Service Status
```bash
systemctl status mysql
```

#### Step 2: Start MySQL Service
If MySQL is not running, start it:
```bash
sudo systemctl start mysql
```

#### Step 3: Enable MySQL to Start on Boot (Optional)
```bash
sudo systemctl enable mysql
```

#### Step 4: Check MySQL Error Logs
If MySQL fails to start, check the error logs:
```bash
sudo tail -n 50 /var/log/mysql/error.log
# OR
sudo journalctl -u mysql.service -n 50
```

#### Common Fixes for MySQL Service Issues:

**Fix 1: Check MySQL Data Directory Permissions**
```bash
sudo chown -R mysql:mysql /var/lib/mysql
sudo chmod -R 755 /var/lib/mysql
sudo systemctl restart mysql
```

**Fix 2: Initialize MySQL Data Directory (if corrupted)**
⚠️ **WARNING:** This will delete all existing databases!
```bash
sudo systemctl stop mysql
sudo rm -rf /var/lib/mysql/*
sudo mysql_install_db --user=mysql --datadir=/var/lib/mysql
sudo systemctl start mysql
```

**Fix 3: Check if Port 3306 is Already in Use**
```bash
sudo netstat -tlnp | grep 3306
# OR
sudo lsof -i :3306
```

**Fix 4: Reset MySQL Root Password (if forgotten)**
```bash
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
# Then in MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
exit;
sudo systemctl restart mysql
```

**Fix 5: Reinstall MySQL (Last Resort)**
```bash
sudo apt-get remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-*
sudo rm -rf /var/lib/mysql
sudo apt-get update
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### Connection Issues (MySQL is Running)
- Verify your MySQL root password
- Check if MySQL is listening on port 3306 (default)
- Try connecting with explicit host:
  ```bash
  mysql -h 127.0.0.1 -u root -p
  ```

### Permission Issues
- Make sure your MySQL user has CREATE DATABASE privileges
- If using a non-root user, grant necessary permissions:
  ```sql
  GRANT ALL PRIVILEGES ON medicare_pharmacy.* TO 'your_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Database Already Exists
- If the database already exists, the script will use it (CREATE DATABASE IF NOT EXISTS)
- To start fresh, drop the database first:
  ```sql
  DROP DATABASE IF EXISTS medicare_pharmacy;
  ```
  Then run the script again.

---

## After Setup

Once the database is set up, you can:

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **The server will automatically connect to the database** using the configuration in `backend/config/database.js`

3. **Create a pharmacist account** (optional):
   ```bash
   cd backend
   node scripts/create-pharmacist.js pharmacist@example.com password123 John Doe
   ```

---

## Database Configuration

The backend uses these default database settings (can be changed via environment variables):

- **Host:** localhost
- **User:** root
- **Password:** (empty by default, set via environment variable)
- **Database:** medicare_pharmacy
- **Port:** 3306 (default MySQL port)

To customize, create a `.env` file in the `backend` directory:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medicare_pharmacy
```

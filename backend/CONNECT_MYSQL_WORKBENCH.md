update the front# How to Connect to MySQL Workbench

## Step 1: Fix MySQL Service (Required First)

MySQL must be running before you can connect. Run these commands:

```bash
# Create socket directory
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# Initialize MySQL data directory (MySQL 8.0+)
# This will create the system database
sudo mysqld --initialize --user=mysql --datadir=/var/lib/mysql --basedir=/usr

# Fix permissions
sudo chown -R mysql:mysql /var/lib/mysql
sudo chmod -R 755 /var/lib/mysql

# Reset failed service
sudo systemctl reset-failed mysql.service

# Start MySQL
sudo systemctl start mysql

# Verify it's running
systemctl status mysql
```

**Note:** `mysqld --initialize` will generate a temporary root password. Check the error log to find it:
```bash
sudo grep 'temporary password' /var/log/mysql/error.log
```

You should see: `Active: active (running)`

---

## Step 2: Connect with MySQL Workbench

### Option A: New Connection (Recommended)

1. **Open MySQL Workbench**

2. **Click the "+" icon** next to "MySQL Connections" in the home screen

3. **Fill in the connection details:**
   - **Connection Name:** `Local MySQL` (or any name you prefer)
   - **Hostname:** `127.0.0.1` or `localhost`
   - **Port:** `3306` (default)
   - **Username:** `root`
   - **Password:** Click "Store in Keychain" and enter your MySQL root password
     - If you haven't set a password yet, leave it blank or click "Store in Vault" to save it

4. **Click "Test Connection"** to verify it works

5. **Click "OK"** to save the connection

6. **Double-click the connection** to connect

### Option B: Use Default Connection

If you see a default connection, click it and enter:
- **Password:** Your MySQL root password (or leave blank if not set)

---

## Step 3: Set MySQL Root Password (If Not Set)

If you haven't set a password yet, you can do it from the terminal:

```bash
# Connect to MySQL (no password needed initially)
sudo mysql -u root

# Then in MySQL, run:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password_here';
FLUSH PRIVILEGES;
EXIT;
```

Or use the secure installation script:
```bash
sudo mysql_secure_installation
```

---

## Step 4: Run the Database Script

Once connected in MySQL Workbench:

1. **Open the SQL script:**
   - Go to **File → Open SQL Script**
   - Navigate to: `backend/database.sql`

2. **Execute the script:**
   - Click the **Execute** button (⚡ icon) or press `Ctrl+Shift+Enter`
   - Wait for "Success" messages

3. **Verify the database:**
   - In the left sidebar, click the refresh icon (🔄) next to "SCHEMAS"
   - You should see `medicare_pharmacy` database
   - Expand it to see all tables

---

## Troubleshooting Connection Issues

### "Cannot connect to MySQL server"

**Check if MySQL is running:**
```bash
systemctl status mysql
```

If not running:
```bash
sudo systemctl start mysql
```

### "Access denied for user 'root'@'localhost'"

**Reset root password:**
```bash
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
```

Then in MySQL:
```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
EXIT;
```

Then restart:
```bash
sudo systemctl restart mysql
```

### "Can't connect to MySQL server on '127.0.0.1'"

**Check if MySQL is listening:**
```bash
sudo netstat -tlnp | grep 3306
```

**Check MySQL bind address in config:**
```bash
grep bind-address /etc/mysql/my.cnf
```

Should show: `bind-address = 127.0.0.1`

---

## Quick Connection Test from Terminal

Test if MySQL is accessible:
```bash
mysql -u root -p -h 127.0.0.1
```

If this works, MySQL Workbench should also work with the same credentials.

# Quick Fix for MySQL Service Error

## The Problem
MySQL service is failing because:
- Missing `/etc/mysql/my.cnf` configuration file
- Missing or uninitialized MySQL data directory

## Solution: Run These Commands

Copy and paste these commands **one by one** into your terminal:

```bash
# 1. Create MySQL configuration directory
sudo mkdir -p /etc/mysql

# 2. Create MySQL configuration file
sudo bash -c 'cat > /etc/mysql/my.cnf << EOF
[mysqld]
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
datadir = /var/lib/mysql
tmpdir = /tmp
lc-messages-dir = /usr/share/mysql
skip-external-locking
bind-address = 127.0.0.1
max_connections = 200
max_allowed_packet = 16M
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
log_error = /var/log/mysql/error.log

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
port = 3306
socket = /var/run/mysqld/mysqld.sock
EOF'

# 3. Set proper permissions on config file
sudo chown root:root /etc/mysql/my.cnf
sudo chmod 644 /etc/mysql/my.cnf

# 4. Create log directory
sudo mkdir -p /var/log/mysql
sudo chown mysql:mysql /var/log/mysql

# 5. Create socket directory
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# 6. Initialize MySQL data directory (if it doesn't exist)
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "Initializing MySQL data directory..."
    echo "Note: A temporary root password will be generated. Check /var/log/mysql/error.log"
    sudo mysqld --initialize --user=mysql --datadir=/var/lib/mysql --basedir=/usr
fi

# 7. Fix data directory permissions
sudo chown -R mysql:mysql /var/lib/mysql
sudo chmod -R 755 /var/lib/mysql

# 8. Reset failed service state
sudo systemctl reset-failed mysql.service

# 9. Start MySQL
sudo systemctl start mysql

# 10. Check status
systemctl status mysql
```

## After MySQL Starts Successfully

1. **Set root password (recommended):**
   ```bash
   sudo mysql_secure_installation
   ```

2. **Or connect directly:**
   ```bash
   mysql -u root -p
   ```
   (Press Enter if no password is set)

3. **Run the database setup script:**
   ```bash
   cd "/home/rex/Desktop/Desktop/PHARMACY PROJECT"
   mysql -u root -p < backend/database.sql
   ```

## If It Still Fails

Check the error log:
```bash
sudo tail -n 50 /var/log/mysql/error.log
sudo journalctl -xeu mysql.service -n 50
```

Common issues:
- Port 3306 already in use: `sudo lsof -i :3306`
- Permission issues: `sudo chown -R mysql:mysql /var/lib/mysql`
- Corrupted data: May need to reinstall MySQL

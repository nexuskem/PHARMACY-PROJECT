#!/bin/bash
# Complete MySQL Fix Script
# This script fixes the MySQL configuration and initializes the database

set -e

echo "=========================================="
echo "MySQL Configuration and Setup Script"
echo "=========================================="
echo ""

# Step 1: Create MySQL configuration directory
echo "[1/5] Creating /etc/mysql directory..."
sudo mkdir -p /etc/mysql

# Step 2: Create MySQL configuration file
echo "[2/5] Creating MySQL configuration file..."
sudo tee /etc/mysql/my.cnf > /dev/null <<EOF
[mysqld]
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
datadir = /var/lib/mysql
tmpdir = /tmp
lc-messages-dir = /usr/share/mysql
skip-external-locking

# Basic settings
bind-address = 127.0.0.1
max_connections = 200
max_allowed_packet = 16M
table_open_cache = 400
max_heap_table_size = 64M
tmp_table_size = 64M

# Logging
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
port = 3306
socket = /var/run/mysqld/mysqld.sock
EOF

# Step 3: Set permissions
echo "[3/5] Setting proper permissions..."
sudo chown root:root /etc/mysql/my.cnf
sudo chmod 644 /etc/mysql/my.cnf

# Step 4: Create log directory
echo "[4/5] Creating log directory..."
sudo mkdir -p /var/log/mysql
sudo chown mysql:mysql /var/log/mysql

# Step 5: Initialize MySQL data directory if needed
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "[5/5] Initializing MySQL data directory..."
    echo "      (This may take a few minutes)"
    echo "      Note: A temporary root password will be generated. Check /var/log/mysql/error.log"
    sudo mysqld --initialize --user=mysql --datadir=/var/lib/mysql --basedir=/usr
    
    # Set proper ownership
    sudo chown -R mysql:mysql /var/lib/mysql
    sudo chmod -R 755 /var/lib/mysql
    
    echo ""
    echo "⚠️  IMPORTANT: Temporary root password generated!"
    echo "   To find it, run: sudo grep 'temporary password' /var/log/mysql/error.log"
else
    echo "[5/5] MySQL data directory already exists, fixing permissions..."
    sudo chown -R mysql:mysql /var/lib/mysql
    sudo chmod -R 755 /var/lib/mysql
fi

# Step 6: Create socket directory
echo "[6/6] Creating socket directory..."
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

echo ""
echo "=========================================="
echo "Configuration complete!"
echo "=========================================="
echo ""

# Reset failed service state
echo "Resetting failed service state..."
sudo systemctl reset-failed mysql.service

echo "Now starting MySQL service..."
sudo systemctl start mysql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MySQL started successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set MySQL root password (if not set):"
    echo "   sudo mysql_secure_installation"
    echo ""
    echo "2. Or connect to MySQL:"
    echo "   mysql -u root -p"
    echo ""
    echo "3. Run the database setup script:"
    echo "   mysql -u root -p < backend/database.sql"
    echo ""
else
    echo ""
    echo "❌ MySQL failed to start. Check the error logs:"
    echo "   sudo journalctl -xeu mysql.service -n 50"
    echo "   sudo tail -n 50 /var/log/mysql/error.log"
    echo ""
fi

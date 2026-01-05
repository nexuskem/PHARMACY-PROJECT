#!/bin/bash
# Fix MySQL Permissions and Initialize

set -e

echo "=========================================="
echo "Fixing MySQL Permissions and Setup"
echo "=========================================="
echo ""

# Step 1: Stop MySQL if running
echo "[1/7] Stopping MySQL service..."
sudo systemctl stop mysql 2>/dev/null || true

# Step 2: Remove existing data directory if it's corrupted/empty
if [ -d "/var/lib/mysql" ] && [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "[2/7] Removing empty/corrupted data directory..."
    sudo rm -rf /var/lib/mysql/*
fi

# Step 3: Create data directory with proper permissions
echo "[3/7] Creating MySQL data directory..."
sudo mkdir -p /var/lib/mysql
sudo chown mysql:mysql /var/lib/mysql
sudo chmod 755 /var/lib/mysql

# Step 4: Create socket directory
echo "[4/7] Creating socket directory..."
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
sudo chmod 755 /var/run/mysqld

# Step 5: Create log directory
echo "[5/7] Creating log directory..."
sudo mkdir -p /var/log/mysql
sudo chown mysql:mysql /var/log/mysql
sudo chmod 755 /var/log/mysql

# Step 6: Initialize MySQL data directory
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "[6/7] Initializing MySQL data directory..."
    echo "      (This may take a few minutes)"
    echo "      ⚠️  A temporary root password will be generated!"
    
    sudo mysqld --initialize --user=mysql --datadir=/var/lib/mysql --basedir=/usr
    
    # Set proper ownership after initialization
    sudo chown -R mysql:mysql /var/lib/mysql
    sudo chmod -R 750 /var/lib/mysql
    
    echo ""
    echo "✅ MySQL initialized successfully!"
    echo ""
    echo "📋 To find the temporary root password, run:"
    echo "   sudo grep 'temporary password' /var/log/mysql/error.log"
    echo ""
else
    echo "[6/7] MySQL data directory already initialized, fixing permissions..."
    sudo chown -R mysql:mysql /var/lib/mysql
    sudo chmod -R 750 /var/lib/mysql
fi

# Step 7: Reset and start MySQL
echo "[7/7] Starting MySQL service..."
sudo systemctl reset-failed mysql.service
sudo systemctl start mysql

sleep 2

# Check status
if systemctl is-active --quiet mysql; then
    echo ""
    echo "=========================================="
    echo "✅ MySQL started successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Find temporary password:"
    echo "   sudo grep 'temporary password' /var/log/mysql/error.log"
    echo ""
    echo "2. Connect to MySQL:"
    echo "   mysql -u root -p"
    echo "   (Use the temporary password)"
    echo ""
    echo "3. Change password:"
    echo "   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';"
    echo "   FLUSH PRIVILEGES;"
    echo ""
    echo "4. Then connect with MySQL Workbench using the new password"
    echo ""
else
    echo ""
    echo "❌ MySQL failed to start. Check logs:"
    echo "   sudo journalctl -xeu mysql.service -n 50"
    echo "   sudo tail -n 50 /var/log/mysql/error.log"
    echo ""
    exit 1
fi


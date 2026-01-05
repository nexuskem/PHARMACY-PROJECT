#!/bin/bash
# Script to fix MySQL configuration issue

echo "Creating /etc/mysql directory..."
sudo mkdir -p /etc/mysql

echo "Creating basic MySQL configuration file..."
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

echo "Setting proper permissions..."
sudo chown root:root /etc/mysql/my.cnf
sudo chmod 644 /etc/mysql/my.cnf

echo "Creating log directory if it doesn't exist..."
sudo mkdir -p /var/log/mysql
sudo chown mysql:mysql /var/log/mysql

echo "Checking MySQL data directory permissions..."
sudo chown -R mysql:mysql /var/lib/mysql 2>/dev/null || echo "Note: /var/lib/mysql may need initialization"

echo ""
echo "Configuration file created!"
echo "Now try starting MySQL:"
echo "  sudo systemctl start mysql"
echo ""
echo "If it still fails, you may need to initialize the data directory:"
echo "  sudo mysql_install_db --user=mysql --datadir=/var/lib/mysql"

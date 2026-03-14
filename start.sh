#!/bin/sh
set -e

cd /var/www/html

# Create SQLite database file if it doesn't exist
touch /var/www/html/database/database.sqlite

# Run database migrations
php artisan migrate --force

# Warm Laravel caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlink if it doesn't exist
php artisan storage:link || true

# Start nginx + php-fpm via supervisor
exec supervisord -c /etc/supervisord.conf

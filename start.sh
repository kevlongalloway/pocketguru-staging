#!/bin/sh
set -e

cd /var/www/html

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

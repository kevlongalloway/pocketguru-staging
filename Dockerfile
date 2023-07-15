# Use the official PHP FPM Alpine image
FROM php:8.1.6-fpm-alpine

# Install system dependencies
RUN apk --update --no-cache add \
    libzip \
    oniguruma-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install gd pdo pdo_mysql mbstring zip

# Set working directory
WORKDIR /var/www/html

# Copy the Laravel application files to the container
COPY ./src .

# Set proper file permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Use Ubuntu 24.04 (Noble Numbat) as the base image
FROM ubuntu:24.04

# Set working directory
WORKDIR /var/www/html/library

# Install Apache and PHP 8.3
RUN apt update && apt install -y \
    apache2 \
    libapache2-mod-php8.3 \
    php8.3 \
    php8.3-cli \
    php8.3-common \
    php8.3-curl \
    php8.3-pdo \
    php8.3-sqlite3 \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-gd \
    php8.3-zip \
    unzip \
    nodejs \
    npm \
    libonig5

# Configure Apache
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
RUN a2enmod php8.3 rewrite

# Copy the favicon to the site's root.
COPY favicon.ico /var/www/html/

# Install Composer globally
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set environment variables
ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data

# Set proper permissions (optional)
RUN chown -R www-data:www-data /var/www/html

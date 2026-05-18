FROM php:8.5-fpm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    zip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/* \
    && pecl install pcov \
    && docker-php-ext-enable pcov

RUN echo "upload_max_filesize=20M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

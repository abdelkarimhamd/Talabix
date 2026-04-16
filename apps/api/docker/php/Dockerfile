FROM php:8.3-cli-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        libzip-dev \
        libonig-dev \
    && docker-php-ext-install \
        bcmath \
        intl \
        pcntl \
        pdo_mysql \
        sockets \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY apps/api/docker/php/php.ini /usr/local/etc/php/conf.d/talabix.ini
COPY apps/api/docker/php/start-scheduler.sh /usr/local/bin/start-scheduler.sh

RUN chmod +x /usr/local/bin/start-scheduler.sh

WORKDIR /var/www/html/apps/api

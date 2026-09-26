FROM php:8.2-apache

RUN a2enmod rewrite expires headers deflate

COPY apache-vhost.conf /etc/apache2/sites-available/000-default.conf

COPY . /var/www/html/

RUN mkdir -p /var/www/html/data \
 && chown -R www-data:www-data /var/www/html \
 && chmod -R 775 /var/www/html/data

EXPOSE 80

FROM php:8.2-apache

RUN a2enmod rewrite expires headers deflate \
 && printf 'ServerTokens Prod\nServerSignature Off\nTraceEnable Off\n' > /etc/apache2/conf-available/zz-hardening.conf \
 && a2enconf zz-hardening

COPY apache-vhost.conf /etc/apache2/sites-available/000-default.conf

COPY . /var/www/html/

RUN mkdir -p /var/www/html/data \
             /var/www/html/assets/uploads/webinars \
             /var/www/html/assets/uploads/mentors \
 && chown -R www-data:www-data /var/www/html \
 && chmod -R 775 /var/www/html/data /var/www/html/assets/uploads

EXPOSE 80

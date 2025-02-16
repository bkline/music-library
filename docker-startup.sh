#!/bin/bash
# Run by docker-compose.yml.
# This script is run by the docker container when it is created.
cp ./db/music-library.db ./api/
cp ./db/secrets-sqlite.json ./api/secrets.json
touch ./api/library.log
chown -R www-data:www-data ./api
npm install
composer install
npx vite build
apache2ctl -D FOREGROUND

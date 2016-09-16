#!/bin/bash

set -e

service mysql start > /dev/null
cat database.sql | mysql -uroot

node app.js

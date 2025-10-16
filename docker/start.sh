#!/bin/sh
nginx
exec node dist/main-http.js --host 0.0.0.0

#!/bin/bash
set -e

echo 'Starting Smart-Homework Production...'

if ! pg_isready -q; then
    rm -f /var/postgres/postmaster.pid
    rm -f /var/run/postgresql/.s.PGSQL.*
fi

cd /PrairieLearn
make -s start-support

echo 'Applying migrations...'
/PrairieLearn/apps/prairielearn/node_modules/.bin/tsx --tsconfig /PrairieLearn/apps/prairielearn/src/tsconfig.json /PrairieLearn/apps/prairielearn/src/server.ts --migrate-and-exit

echo 'Starting PrairieLearn server...'
export NODE_ENV=production
exec /PrairieLearn/apps/prairielearn/node_modules/.bin/tsx --tsconfig /PrairieLearn/apps/prairielearn/src/tsconfig.json /PrairieLearn/apps/prairielearn/src/server.ts

#!/bin/bash
set -e

echo 'Starting Smart-Homework Production...'

cd /PrairieLearn

echo 'Applying migrations...'
/PrairieLearn/apps/prairielearn/node_modules/.bin/tsx --tsconfig /PrairieLearn/apps/prairielearn/src/tsconfig.json /PrairieLearn/apps/prairielearn/src/server.ts --migrate-and-exit

echo 'Starting PrairieLearn server...'
export NODE_ENV=production
exec /PrairieLearn/apps/prairielearn/node_modules/.bin/tsx --tsconfig /PrairieLearn/apps/prairielearn/src/tsconfig.json /PrairieLearn/apps/prairielearn/src/server.ts

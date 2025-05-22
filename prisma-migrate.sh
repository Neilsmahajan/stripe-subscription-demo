#!/bin/bash

# Copy .env.local to .env temporarily
cp .env.local .env

# Run prisma command with all args passed to this script
npx prisma "$@"

# Remove temporary .env file
rm .env

# Echo completion message
echo "Prisma command completed using .env.local variables"

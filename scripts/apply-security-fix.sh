#!/bin/bash

# Eva Online Security Fix Application Script
# This script applies the comprehensive security fixes to your Supabase database

set -e  # Exit on error

echo "==================================="
echo "Eva Online Security Fix Application"
echo "==================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Step 1: Creating database backup..."
echo "-----------------------------------"
BACKUP_FILE="backup-before-security-fix-$(date +%Y%m%d-%H%M%S).sql"
supabase db dump -f "$PROJECT_ROOT/$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "Step 2: Applying security fixes..."
echo "-----------------------------------"
echo "This will:"
echo "  - Create missing tables if they don't exist"
echo "  - Enable Row Level Security on all tables"
echo "  - Create proper security policies"
echo "  - Fix SECURITY DEFINER views"
echo ""

read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Applying migration..."
supabase db push --file "$PROJECT_ROOT/supabase/fix-security-comprehensive.sql"

if [ $? -eq 0 ]; then
    echo "✅ Security fixes applied successfully!"
    echo ""
    echo "Step 3: Verification"
    echo "-----------------------------------"
    echo "Please verify the following:"
    echo "  1. Run the database linter in Supabase Dashboard"
    echo "  2. Test that users can still log in"
    echo "  3. Check that the leaderboard works"
    echo "  4. Verify users can only see their own sessions"
    echo ""
    echo "If you encounter any issues, you can restore from backup:"
    echo "  psql -h [your-db-host] -U postgres -d postgres < $BACKUP_FILE"
else
    echo "❌ Error applying security fixes!"
    echo "Your backup is available at: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "==================================="
echo "Security fix application complete!"
echo "==================================="

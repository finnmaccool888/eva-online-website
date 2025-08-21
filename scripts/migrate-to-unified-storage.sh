#!/bin/bash

# Migration script to update imports to use unified storage system
# This helps automate the switch to the new V2 components

echo "🔄 Migrating to Unified Storage System"
echo "====================================="
echo ""

# Get the project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Function to update imports in a file
update_imports() {
    local file=$1
    local temp_file="${file}.tmp"
    
    if [ -f "$file" ]; then
        echo "  Updating: $file"
        
        # Update component imports
        sed 's|profile-dashboard"|profile-dashboard-v2"|g' "$file" > "$temp_file"
        sed -i '' 's|mirror-app"|mirror-app-v2"|g' "$temp_file"
        sed -i '' 's|points-display"|points-display-v2"|g' "$temp_file"
        
        # Update ProfileDashboard to ProfileDashboardV2
        sed -i '' 's|ProfileDashboard|ProfileDashboardV2|g' "$temp_file"
        sed -i '' 's|MirrorApp|MirrorAppV2|g' "$temp_file"
        sed -i '' 's|PointsDisplay|PointsDisplayV2|g' "$temp_file"
        
        # Move temp file back
        mv "$temp_file" "$file"
        echo "  ✅ Updated"
    else
        echo "  ⚠️  File not found: $file"
    fi
}

echo "Step 1: Updating page components..."
echo "-----------------------------------"
update_imports "$PROJECT_ROOT/src/app/profile/page.tsx"
update_imports "$PROJECT_ROOT/src/app/mirror/page.tsx"

echo ""
echo "Step 2: Creating backup of old components..."
echo "-------------------------------------------"
mkdir -p "$PROJECT_ROOT/src/components/backup"

# Backup old components
cp "$PROJECT_ROOT/src/components/profile/profile-dashboard.tsx" "$PROJECT_ROOT/src/components/backup/" 2>/dev/null || echo "  ⚠️  profile-dashboard.tsx not found"
cp "$PROJECT_ROOT/src/components/mirror/mirror-app.tsx" "$PROJECT_ROOT/src/components/backup/" 2>/dev/null || echo "  ⚠️  mirror-app.tsx not found"
cp "$PROJECT_ROOT/src/components/mirror/points-display.tsx" "$PROJECT_ROOT/src/components/backup/" 2>/dev/null || echo "  ⚠️  points-display.tsx not found"

echo "  ✅ Backups created in src/components/backup/"

echo ""
echo "Step 3: Manual steps required..."
echo "--------------------------------"
echo "1. Review and test the updated components"
echo "2. Update any other files that import these components"
echo "3. Remove old sync code patterns:"
echo "   - Direct localStorage writes for profile"
echo "   - syncCompleteProfile() calls"
echo "   - loadProfile() / saveProfile() from old system"
echo ""
echo "4. Test thoroughly:"
echo "   - Login with existing user"
echo "   - Login with new user"
echo "   - Check OG points"
echo "   - Verify onboarding flow"
echo ""

echo "Step 4: Cleanup (after testing)..."
echo "----------------------------------"
echo "Once everything is working:"
echo "1. Delete the old component files"
echo "2. Rename V2 components to remove 'V2' suffix"
echo "3. Update imports again to use clean names"
echo "4. Delete the backup directory"
echo ""

echo "✅ Migration preparation complete!"
echo ""
echo "Next: Review the changes and run your test suite"

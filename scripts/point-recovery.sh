#!/bin/bash

# Default to local environment unless PROD is set
if [ "$PROD" = "true" ]; then
  BASE_URL="https://www.evaonline.xyz"
else
  BASE_URL="http://localhost:3002"
fi

# Help text
show_help() {
  echo "Point Recovery Tool"
  echo "Usage:"
  echo "  ./point-recovery.sh list <twitter_handle>     - List available backups"
  echo "  ./point-recovery.sh preview <twitter_handle>  - Preview restore"
  echo "  ./point-recovery.sh restore <twitter_handle>  - Perform restore"
  echo ""
  echo "Environment:"
  echo "  PROD=true ./point-recovery.sh ...            - Run against production"
  echo ""
  echo "Example:"
  echo "  ./point-recovery.sh list starlordyftw        - List backups locally"
  echo "  PROD=true ./point-recovery.sh list starlordyftw  - List backups in prod"
}

# Check arguments
if [ $# -lt 2 ]; then
  show_help
  exit 1
fi

ACTION=$1
USER=$2

echo "Using $BASE_URL for $USER"

case $ACTION in
  "list")
    echo "Listing backups for $USER..."
    curl "$BASE_URL/api/list-backups?twitter_handle=$USER" | json_pp
    ;;
    
  "preview")
    echo "Previewing restore for $USER..."
    curl -X POST "$BASE_URL/api/preview-restore" \
      -H "Content-Type: application/json" \
      -d "{\"twitterHandle\": \"$USER\"}" | json_pp
    ;;
    
  "restore")
    echo "⚠️  WARNING: This will restore points for $USER"
    echo "Are you sure? (y/N)"
    read confirm
    if [ "$confirm" = "y" ]; then
      echo "Performing restore..."
      curl -X POST "$BASE_URL/api/restore-points" \
        -H "Content-Type: application/json" \
        -d "{\"twitterHandle\": \"$USER\"}" | json_pp
    else
      echo "Restore cancelled"
    fi
    ;;
    
  *)
    show_help
    exit 1
    ;;
esac

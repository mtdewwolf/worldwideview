#!/bin/bash
set -e

echo "🌍 Setting up WorldWideView for Local Development..."

# Check for bun
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is required but not installed."
    echo "Please install it first: https://bun.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo "🔐 Running initial setup (generating secrets)..."
bun run setup

# Check for the sibling Data Engine repository
if [ ! -d "../wwv-data-engine" ]; then
    echo ""
    echo "====================================================================="
    echo "⚠️  NOTICE: Local Data Engine not found at ../wwv-data-engine"
    echo ""
    echo "Frontend-Only Mode: You are developing the frontend UI."
    echo "WorldWideView will automatically stream data from the Cloud Engine."
    echo ""
    echo "Full-Stack Mode: If you want to develop backend data seeders, you"
    echo "must clone the open-source data engine as a sibling directory:"
    echo "  cd .. && git clone https://github.com/silvertakana/wwv-data-engine"
    echo "  cd wwv-data-engine && bun install"
    echo "====================================================================="
    echo ""
fi

echo "🚀 Starting local Next.js frontend server..."
echo "   (To run the data engine backends concurrently, run: bun run dev:all)"
bun run dev

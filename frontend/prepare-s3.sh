#!/bin/bash

# Exit on error
set -e

echo "🚀 Preparing files for S3 deployment..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Define directories
S3_BUCKET_DIR="s3_bucket"
PUBLIC_DIR="public"
HTML_DIR="html"

# Remove existing s3_bucket directory if it exists
if [ -d "$S3_BUCKET_DIR" ]; then
    echo "🗑️  Removing existing s3_bucket directory..."
    rm -rf "$S3_BUCKET_DIR"
fi

# Create fresh s3_bucket directory
echo "📁 Creating s3_bucket directory..."
mkdir -p "$S3_BUCKET_DIR"

# Copy all contents from public/ to s3_bucket/
echo "📋 Copying public/ contents to s3_bucket/..."
if [ -d "$PUBLIC_DIR" ]; then
    cp -r "$PUBLIC_DIR"/* "$S3_BUCKET_DIR"/
    echo "   ✓ Copied public/ contents"
else
    echo "   ⚠️  Warning: public/ directory not found"
fi

# Generate static HTML files
echo "🔨 Building static HTML files..."
if [ -f "build-static.js" ]; then
    node build-static.js
    echo "   ✓ Static HTML files generated"
else
    echo "   ⚠️  Warning: build-static.js not found"
fi

# Copy all contents from html/ to s3_bucket/ (at the same level)
echo "📋 Copying html/ contents to s3_bucket/..."
if [ -d "$HTML_DIR" ]; then
    cp -r "$HTML_DIR"/* "$S3_BUCKET_DIR"/
    echo "   ✓ Copied html/ contents"
else
    echo "   ⚠️  Warning: html/ directory not found"
fi

# Display summary
echo ""
echo "✅ S3 bucket preparation complete!"
echo "📊 Summary:"
echo "   - Source: $PUBLIC_DIR/ + $HTML_DIR/"
echo "   - Destination: $S3_BUCKET_DIR/"
echo ""
echo "📦 Files ready in: $S3_BUCKET_DIR/"
ls -lh "$S3_BUCKET_DIR" | head -20
echo ""
echo "Total files: $(find "$S3_BUCKET_DIR" -type f | wc -l)"
echo "Total size: $(du -sh "$S3_BUCKET_DIR" | cut -f1)"

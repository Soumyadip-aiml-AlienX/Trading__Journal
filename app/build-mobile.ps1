# build-mobile.ps1
# Automates static Next.js export for Capacitor mobile builds, ignoring dynamic server assets.

try {
    # 1. Clean cache
    Write-Host "Cleaning Next.js build cache..."
    if (Test-Path ".next") { Remove-Item -Recurse -Force .next }
    if (Test-Path "out") { Remove-Item -Recurse -Force out }
    
    # 2. Isolate api routes & metadata files outside the route scanner
    Write-Host "Isolating server-side routes and API endpoints..."
    New-Item -ItemType Directory -Force -Path "src/api_temp" | Out-Null
    if (Test-Path "src/app/api") {
        Move-Item -Path "src/app/api" -Destination "src/api_temp/api"
    }
    if (Test-Path "src/app/robots.ts") {
        Move-Item -Path "src/app/robots.ts" -Destination "src/api_temp/robots.ts"
    }
    if (Test-Path "src/app/sitemap.ts") {
        Move-Item -Path "src/app/sitemap.ts" -Destination "src/api_temp/sitemap.ts"
    }
    if (Test-Path -LiteralPath "src/app/trades/[id]") {
        Move-Item -LiteralPath "src/app/trades/[id]" -Destination "src/api_temp/[id]"
    }
    
    # 3. Swap root layout static dynamic mode
    Write-Host "Adjusting layout configuration to force-static..."
    (Get-Content src/app/layout.tsx) -replace "export const dynamic = 'force-dynamic';", "export const dynamic = 'force-static';" | Set-Content src/app/layout.tsx
    
    # 4. Trigger build with BUILD_MOBILE env flag active
    Write-Host "Compiling static client-side web application..."
    $env:BUILD_MOBILE="true"
    npx next build
    
    Write-Host "Static build completed successfully! Exported to out/ directory."
} catch {
    Write-Host "Build encountered an error: $_"
} finally {
    # 5. Restore root layout config
    Write-Host "Restoring layout configuration..."
    (Get-Content src/app/layout.tsx) -replace "export const dynamic = 'force-static';", "export const dynamic = 'force-dynamic';" | Set-Content src/app/layout.tsx
    
    # 6. Restore API routes & metadata files
    Write-Host "Restoring API routes and sitemaps..."
    if (Test-Path "src/api_temp/api") {
        Move-Item -Path "src/api_temp/api" -Destination "src/app/api"
    }
    if (Test-Path "src/api_temp/robots.ts") {
        Move-Item -Path "src/api_temp/robots.ts" -Destination "src/app/robots.ts"
    }
    if (Test-Path "src/api_temp/sitemap.ts") {
        Move-Item -Path "src/api_temp/sitemap.ts" -Destination "src/app/sitemap.ts"
    }
    if (Test-Path -LiteralPath "src/api_temp/[id]") {
        Move-Item -LiteralPath "src/api_temp/[id]" -Destination "src/app/trades/[id]"
    }
    if (Test-Path "src/api_temp") {
        Remove-Item -Recurse -Force "src/api_temp"
    }
    Write-Host "Original development state restored."
}

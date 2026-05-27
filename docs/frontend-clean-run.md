# Frontend Clean-Run Workflow

## Cache Reset (when you see stale chunk 404s or MIME errors)

```powershell
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
npm run build
npm run dev
```

## Full Reset (nuclear option)

```powershell
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
Remove-Item -Recurse -Force node_modules
npm install
npm run build
npm run dev
```

## When to Reset

| Symptom | Action |
|---------|--------|
| `GET /_next/static/chunks/X.js 404` | Delete `.next/`, rebuild |
| MIME type mismatch errors | Delete `.next/`, rebuild |
| Stale page content after route changes | Delete `.next/`, rebuild |
| HMR not picking up changes | Restart dev server |
| Build succeeds but runtime 500s | Delete `.next/`, check for route conflicts |

## Browser Cache Invalidation

Next.js uses content-hashed chunk filenames (e.g., `684-c273637add806663.js`). After a rebuild, all chunk hashes change, so browsers automatically fetch fresh files.

If a user reports stale content:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear site data in DevTools → Application → Storage → Clear site data
3. Verify the server is running the latest build

## Production Deployment Checklist

1. `npm run build` — must exit 0
2. Verify `.next/` directory was regenerated
3. `npm run start` — verify all routes return 200
4. Verify JS chunks return `Content-Type: application/javascript`
5. No 404s in server logs

## Route Refactor Safety

After moving/renaming/deleting pages:
1. **Always** delete `.next/` before rebuilding
2. Run `npm run build` to verify no route conflicts
3. Check the build output route table for expected paths
4. Verify no duplicate routes resolve to the same URL

## Verification Commands

```powershell
# Check all page files (should have no duplicates resolving to same URL)
Get-ChildItem -Recurse -Filter "page.tsx" src/app | ForEach-Object { $_.FullName -replace '.*\\src\\app\\', '' }

# Verify production chunks serve correctly
npm run build; npm run start
# Then in another terminal:
curl -I http://localhost:3000/_next/static/chunks/webpack-*.js
# Should return: HTTP 200, Content-Type: application/javascript
```

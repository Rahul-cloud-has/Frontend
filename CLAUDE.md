# CLAUDE.md

React (Create React App) frontend. Deployed via Vercel (`vercel.json`). Remote: `Rahul-cloud-has/Frontend`, branch `main`.

## ⚠️ ACTIVE TEMPORARY LOCKOUT — site is blanked (pending developer payment)

The whole site currently shows a white screen with only this text:
"kindly complete the pending payment of developer to re access the website"

This is intentional and temporary. It is NOT a bug. Do not "fix" it unless asked to restore the site.

### How it works
- `src/white-theme.css` hides `#root` (`display: none`) and draws the message with `body::before`.
- `src/index.js` imports it: `import './white-theme.css';` (right after `import './index.css';`).
- No other file was changed. All original components/CSS are intact.

### HOW TO RESTORE THE SITE (do this when payment is received)

Option A — manual (simplest):
1. Delete `src/white-theme.css`.
2. In `src/index.js`, delete the line `import './white-theme.css';`.
3. Verify: `grep -rn "white-theme" src` returns nothing.
4. Commit and push to `main`:
   ```
   git add -A
   git commit -m "Restore site (remove temporary lockout)"
   git push
   ```

Option B — git revert (both lockout commits, newest first):
```
git revert --no-edit 72700b2 b5e2556
git push
```
(`b5e2556` added the white theme + the import; `72700b2` replaced it with the payment notice.
The last commit before the lockout is `8a1c360` — the site as it should look when restored.)

Option C — hard reset to the pre-lockout state (destructive, rewrites history; only if A/B are impossible):
```
git reset --hard 8a1c360
git push --force-with-lease
```

### After pushing
- Vercel must redeploy `main` before the change is live. Check the Vercel dashboard, then hard-refresh the site (Ctrl+Shift+R).
- Confirm the normal site loads and the payment message is gone.
- Once restored, delete this "ACTIVE TEMPORARY LOCKOUT" section from CLAUDE.md.

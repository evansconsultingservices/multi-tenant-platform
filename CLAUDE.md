# Claude Code Instructions

## Project Overview
This is a multi-tenant platform wrapper with Module Federation micro-frontend architecture.

## 📖 Building Child Applications

**For complete guide on building new child apps, see [BUILDING_CHILD_APPS.md](/BUILDING_CHILD_APPS.md)**

The comprehensive guide covers:
- ✅ Module Federation configuration with menu system
- ✅ Dynamic sidebar navigation from child apps
- ✅ Version tracking system
- ✅ Shadcn/ui integration
- ✅ Complete troubleshooting guide
- ✅ Step-by-step walkthrough

## Important Instructions

### Before Making Changes
1. **NEVER claim something works without ACTUAL testing** - Compilation success is NOT testing
2. **Use Playwright for all frontend testing** - Must verify the UI actually works in browser
3. **Check console for JavaScript errors** - Use Playwright to inspect console logs for runtime errors
4. **Test complete user workflows** - Login, navigation, tool loading, etc.
5. **Verify both applications compile** - Parent app (port 3000) and child apps (port 3001)

### MANDATORY Testing Process
1. **Run Playwright tests** - Use `npx playwright test` or browser automation to verify UI
2. **Navigate through the application** - Test login flow, sidebar navigation, tool loading
3. **Check browser console** - Look for JavaScript errors, failed network requests, Module Federation errors
4. **Verify no white screens** - Ensure all pages load content properly
5. **Test Module Federation** - Verify child apps load correctly through the parent shell

### Development Commands
- Parent app: `cd multi-tenant-platform && npm start` (port 3000)
- Child app: `cd child_apps/hello-world-tool && npm start` (port 3001)
- Both must be running for Module Federation to work

### Architecture Notes
- Uses Module Federation (not iframes) for micro-frontends
- Parent app is the "shell" that loads remote modules from child apps
- Child apps expose components via Module Federation
- Firebase Auth with Google OAuth
- Shadcn/ui components with Tailwind CSS

### UI Component Guidelines
- **ALWAYS use Shadcn/ui components** - Never create custom components when Shadcn equivalents exist
- Use `npx shadcn@latest add <component>` to add new Shadcn components
- Import from `@/components/ui/` path
- Follow Shadcn patterns for styling and behavior
- If a component doesn't exist in Shadcn, build on top of Shadcn primitives
- Never write custom CSS classes - use Tailwind utilities and Shadcn variants

### 🚨 CRITICAL: Module Federation + Shadcn Components
**When adding ANY new shadcn component (which uses @radix-ui dependencies):**

1. Install the package: `npm install @radix-ui/react-[component]`
2. Add the shadcn component: `npx shadcn@latest add [component]`
3. **CRITICAL STEP:** Add to `multi-tenant-platform/craco.config.js` shared dependencies:
   ```javascript
   "@radix-ui/react-[component]": {
     singleton: true,
     requiredVersion: deps["@radix-ui/react-[component]"],
     eager: true,
   },
   ```
4. Restart the dev server completely: `pkill -f "npm start" && npm start`

**Why this is critical:**
- Missing this step causes: `"Shared module is not available for eager consumption"`
- This error **breaks the entire React app** with a blank white screen
- The app will compile successfully but crash at runtime
- No obvious error message - requires checking browser console

**Example:** When adding tabs component, must add `@radix-ui/react-tabs` to craco.config.js

### Common Issues
- **Blank white screen after adding shadcn component** - Missing Module Federation shared config (see above)
- TypeScript errors with webpack globals - check `react-app-env.d.ts` has Module Federation declarations
- Cache issues - clear `.eslintcache` and `node_modules/.cache` if needed
- Module Federation requires both apps running on correct ports
- Module Federation "shared module" errors - All @radix-ui dependencies must be in shared config

### Testing Checklist
- [ ] Both apps compile without errors
- [ ] Parent app loads without blank screen
- [ ] Login/authentication works
- [ ] Sidebar navigation appears
- [ ] Hello World tool loads via Module Federation (not iframe)
- [ ] No console errors

### File Structure
- `multi-tenant-platform/` - Parent shell application
- `child_apps/hello-world-tool/` - Example child application
- `craco.config.js` - Module Federation configuration in both apps

## Deployment
- Target: Vercel
- Separate deployments for each application
- Environment variables needed for Firebase config
- Always test your changes
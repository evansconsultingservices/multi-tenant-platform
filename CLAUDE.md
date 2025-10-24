# Claude Code Instructions for Multi-Tenant Platform

## Project Overview
This is a multi-tenant platform wrapper that creates an authentication challenge for users and serves multiple tool applications using Module Federation. The platform uses React, TypeScript, Firebase Authentication, and shadcn/ui components.

## Architecture
- **Main App (Port 3000)**: Shell application with authentication and navigation
- **Child Apps (Port 3001+)**: Individual tools loaded via Module Federation
- **Authentication**: Firebase Auth with Google OAuth
- **UI Components**: Always use shadcn/ui components - NEVER generate custom components

## Critical Requirements

### UI Component Rule
**ALWAYS use shadcn/ui components at all times without generating your own.**
- Use existing components from `@/components/ui/`
- Follow shadcn/ui patterns and conventions
- Never create custom UI components when shadcn equivalents exist

### Testing Requirements (CRITICAL)

**NEVER claim something works without ACTUAL testing - Compilation success is NOT testing**

#### Required Testing Process:
1. **ALWAYS use Playwright for frontend testing** - Browser automation that actually loads the page
2. **Test in real browser environment** - Not just compilation or build success
3. **Check browser console for JavaScript errors** - Playwright captures console errors automatically
4. **Verify actual user workflows** - Login, navigation, component loading, etc.
5. **Test Module Federation functionality** - Ensure remote components actually load and render

#### Mandatory Tests Before Claiming Success:
- [ ] Page loads without white screen
- [ ] No critical JavaScript console errors
- [ ] Login interface displays correctly
- [ ] Navigation works as expected
- [ ] Authentication redirects function properly
- [ ] **Module Federation tool loading works** - Remote components load successfully
- [ ] **Tool content renders correctly** - Not just "Remote Tool Unavailable" errors
- [ ] **Child app servers are running** - Verify on correct ports (3001, etc.)
- [ ] **remoteEntry.js is accessible** - Module Federation entry points load

#### Critical Module Federation Testing:
**NEVER skip testing actual tool loading functionality!**

1. **Test remote script loading** - Verify remoteEntry.js loads without errors
2. **Test container availability** - Check `window.helloWorld` exists after script load
3. **Test module initialization** - Verify `container.init()` and `container.get()` work
4. **Test component rendering** - Ensure tools actually display content, not error messages
5. **Test across different tools** - Each child app must be tested individually

#### Example Test Commands:
```bash
# Run all tests including tool loading
npx playwright test

# Run specific tool loading tests
npx playwright test tests/actual-tool-loading.spec.js
npx playwright test tests/tool-loading.spec.js

# Run with browser visible for debugging
npx playwright test --headed
```

**If you get compilation success but haven't run Playwright tests, the work is INCOMPLETE**
**If tools show "Remote Tool Unavailable" but you claim it works, the work is INCORRECT**

## Module Federation Configuration

### 🚨 CRITICAL: Adding Shadcn Components
**When adding ANY new shadcn/ui component, you MUST update Module Federation config or the app will crash!**

#### The 4-Step Process (NEVER skip step 3):
1. **Install dependency:**
   ```bash
   npm install @radix-ui/react-[component]
   ```

2. **Add shadcn component:**
   ```bash
   npx shadcn@latest add [component]
   ```

3. **🚨 CRITICAL: Update `craco.config.js` shared config:**
   ```javascript
   "@radix-ui/react-[component]": {
     singleton: true,
     requiredVersion: deps["@radix-ui/react-[component]"],
     eager: true,  // REQUIRED - missing this breaks everything
   },
   ```

4. **Restart dev server:**
   ```bash
   pkill -f "npm start"
   npm start
   ```

#### What Happens If You Skip Step 3:
- ❌ **Error:** `"Shared module is not available for eager consumption: @radix-ui/react-[component]"`
- ❌ **Result:** Blank white screen (React fails to render)
- ❌ **Deceptive:** Build still succeeds - error only visible in browser console
- ❌ **Impact:** Entire app crashes, not just the new component

#### Real Example (Tabs Component):
When adding tabs, we forgot step 3 and got:
```
Error: Shared module is not available for eager consumption:
webpack/sharing/consume/default/@radix-ui/react-tabs/@radix-ui/react-tabs
```
Solution: Added to craco.config.js line 73-77, restarted server, app worked.

#### Currently Configured Components (see craco.config.js lines 38-92):
- ✅ @radix-ui/react-slot, react-avatar, react-dialog, react-dropdown-menu
- ✅ @radix-ui/react-label, react-separator, react-tooltip, **react-tabs**
- ✅ lucide-react, class-variance-authority, clsx, tailwind-merge

### Main App (Shell) - craco.config.js
```javascript
new ModuleFederationPlugin({
  name: "shell",
  filename: "remoteEntry.js",
  remotes: {
    helloWorld: "helloWorld@http://localhost:3001/remoteEntry.js",
  },
  shared: {
    // All React dependencies must be shared with eager: true
    react: { singleton: true, requiredVersion: deps.react, eager: true },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"], eager: true },
    // All shadcn/radix dependencies must be shared with eager: true
    "@radix-ui/react-slot": { singleton: true, requiredVersion: deps["@radix-ui/react-slot"], eager: true },
    "@radix-ui/react-tabs": { singleton: true, requiredVersion: deps["@radix-ui/react-tabs"], eager: true },
    // ... other shared dependencies (see craco.config.js)
  },
})
```

### Child App - craco.config.js
```javascript
new ModuleFederationPlugin({
  name: "helloWorld",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/App",
    "./HelloWorldTool": "./src/App",
  },
  shared: {
    // Must match main app shared dependencies
  },
})
```

## Development Workflow

### Starting Development
```bash
# Terminal 1: Start main app
cd multi-tenant-platform
npm start

# Terminal 2: Start child app
cd child_apps/hello-world-tool
npm start
```

### Testing Workflow
```bash
# Always run tests after changes
npm run test:e2e

# For debugging, use headed mode
npx playwright test --headed
```

## Common Issues and Solutions

### Module Federation Errors
- **"Remote helloWorld is not available"**: Child app server not running on port 3001
- **"Shared module not available for eager consumption"**: Missing dependency in shared config
- **White screen**: Module Federation shared dependencies not properly configured

### Debugging Steps
1. Check both servers are running (ports 3000 and 3001)
2. Verify remoteEntry.js is accessible: `http://localhost:3001/remoteEntry.js`
3. Check browser console for JavaScript errors
4. Use Playwright tests to verify actual functionality

## File Structure
```
multi-tenant-platform/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── tools/        # Module Federation components
│   ├── pages/
│   └── services/
├── tests/                # Playwright tests
├── craco.config.js       # Module Federation config
└── CLAUDE.md            # This file

child_apps/
├── hello-world-tool/
│   ├── src/
│   ├── craco.config.js
│   └── package.json
```

## Git Workflow
- NEVER commit without running tests first
- Always test tool loading functionality
- Ensure all Module Federation dependencies are properly shared
- Document any new tools or configuration changes

Remember: **Functionality that hasn't been tested with Playwright doesn't work, regardless of compilation success!**
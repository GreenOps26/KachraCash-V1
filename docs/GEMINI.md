# KachraCash AI Systems & Assistant Guidelines

> **Project:** KachraCash (`কচৰা ক্যাশ`)  
> **Operational Domain:** Guwahati, Assam, Northeast India

---

## Autonomous Agent Directives
1. **Enforce TypeScript Strict Mode:** Zero `any` policy across all workspace apps and shared packages.
2. **Never Generate Prohibited Anti-Patterns:**
   - NO live reverse auction or bidding engines.
   - NO manual weight text input fields in the partner collector application.
   - NO doorstep physical cash settlement or cash fallbacks.
   - NO iOS build configurations or targets for `/apps/partner`.
3. **Always Adhere to the System Operating Contract in `AGENTS.md`:**
   - Review `TDD.md` specifications before modifying business logic.
   - Ensure `pnpm run typecheck` and `pnpm run test` pass cleanly before submitting changes.

# Feature Status Update

Use this prompt at the end of each development session to maintain continuity.

## Prompt Template

```
Hey Claude, I'm ending today's session on feature: [FEATURE_NAME]

Please help me document today's progress by:

1. **Update Status**: Update /docs/features/[FEATURE_NAME]/STATUS.md with:
   - What was completed today
   - Current progress percentage
   - Next immediate actions (max 3 items)
   - Any status changes

2. **Update Blockers**: Update /docs/features/[FEATURE_NAME]/BLOCKERS.md with:
   - Any new blockers discovered
   - Any blockers resolved
   - Remove resolved blockers

3. **Update Decisions**: If any technical decisions were made, add them to /docs/features/[FEATURE_NAME]/DECISIONS.md

4. **Session Summary**: Update /.claude-sessions/[TODAY_DATE]/progress.md with:
   - What was accomplished
   - Time spent
   - Key insights or learnings
   - Next session priorities

5. **Architecture Updates**: If any new patterns were established, note them for future architecture registry updates

Session Summary:
[BRIEF SUMMARY OF WHAT WAS ACCOMPLISHED]

Issues Encountered:
[ANY BLOCKERS OR ISSUES THAT CAME UP]

Next Session Priority:
[WHAT SHOULD BE TACKLED NEXT]
```

## What This Accomplishes

- ✅ Maintains accurate feature status
- ✅ Tracks blockers and resolutions
- ✅ Documents technical decisions
- ✅ Enables smooth session handoffs
- ✅ Captures institutional knowledge

## Success Metrics

- Feature status is always current
- Blockers are clearly identified
- Next actions are specific and actionable
- Session continuity is maintained 
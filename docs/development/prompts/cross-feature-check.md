# Cross-Feature Dependency Check

Use this prompt before implementing any feature to ensure consistency and avoid conflicts.

## Prompt Template

```
Hey Claude, I'm ready to implement feature: [FEATURE_NAME]

Before I start implementing, please help me check for conflicts and dependencies by:

1. **Architecture Review**: Check /docs/architecture/patterns.md for:
   - Required patterns I must follow
   - Database access patterns
   - API response patterns
   - Error handling patterns
   - Authentication patterns

2. **Dependency Check**: Review /docs/architecture/integration-map.md for:
   - Features that depend on this feature
   - Features this feature depends on
   - Shared components or services
   - Database schema dependencies

3. **Implementation Review**: Check /docs/features/[FEATURE_NAME]/IMPLEMENTATION.md for:
   - Integration points with other features
   - Shared utilities or services
   - API endpoints that might conflict
   - Database tables that might be affected

4. **Decision Alignment**: Review /docs/features/[FEATURE_NAME]/DECISIONS.md to ensure:
   - Technical decisions align with established patterns
   - No conflicts with other feature decisions
   - All dependencies are accounted for

5. **Conflict Assessment**: Based on the above, identify:
   - Any potential conflicts
   - Dependencies that need to be implemented first
   - Shared components that need updates
   - Tests that need to be updated

Current Implementation Plan:
[BRIEF OVERVIEW OF WHAT YOU PLAN TO IMPLEMENT]

Specific Areas of Concern:
[ANY SPECIFIC INTEGRATION POINTS YOU'RE WORRIED ABOUT]
```

## What This Accomplishes

- ✅ Prevents feature conflicts
- ✅ Ensures architectural consistency
- ✅ Identifies missing dependencies
- ✅ Avoids duplicate work
- ✅ Maintains system integrity

## Red Flags to Watch For

- Database schema conflicts
- API endpoint conflicts
- Shared service modifications
- Breaking changes to existing features
- Missing dependency implementations 
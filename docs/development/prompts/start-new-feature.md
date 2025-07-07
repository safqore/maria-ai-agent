# Start New Feature Session

Use this prompt when beginning work on a new feature with Claude.

## Prompt Template

```
Hey Claude, I'm starting work on a new feature: [FEATURE_NAME]

Please help me by:

1. **Check Architecture**: Look at /docs/architecture/patterns.md for existing patterns I should follow
2. **Check Dependencies**: Review /docs/architecture/integration-map.md for any feature interdependencies
3. **Create Feature Structure**: Set up /docs/features/[FEATURE_NAME]/ with the standard 4 files:
   - STATUS.md (current status + next actions)
   - DECISIONS.md (feature-specific technical decisions)
   - IMPLEMENTATION.md (code snippets + integration points)
   - BLOCKERS.md (current blockers only)
4. **Session Setup**: Create today's session working memory in /.claude-sessions/[TODAY_DATE]/
5. **Checklist Review**: Walk me through the New Feature Checklist

Business Requirements:
[PASTE YOUR BUSINESS REQUIREMENTS HERE]

Technical Context:
[ANY SPECIFIC TECHNICAL CONTEXT OR CONSTRAINTS]
```

## What This Accomplishes

- ✅ Ensures architectural consistency
- ✅ Sets up proper documentation structure
- ✅ Creates session working memory
- ✅ Provides business context to Claude
- ✅ Follows the layered documentation system

## Next Steps

After running this prompt, proceed with your feature development. Use the daily session prompt for subsequent work sessions. 
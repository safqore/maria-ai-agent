# Daily Session Start

Use this prompt when starting each development session with Claude.

## Prompt Template

```
Hey Claude, I'm continuing work on feature: [FEATURE_NAME]

Please help me get back up to speed by:

1. **Review Status**: Check /docs/features/[FEATURE_NAME]/STATUS.md for current progress
2. **Check Blockers**: Review /docs/features/[FEATURE_NAME]/BLOCKERS.md for any blocking issues
3. **Load Context**: Review yesterday's session notes in /.claude-sessions/[YESTERDAY_DATE]/
4. **Set Today's Focus**: Based on the above, what should I focus on today?
5. **Create Session Memory**: Set up today's session working memory in /.claude-sessions/[TODAY_DATE]/

Additional Context:
[ANY NEW INFORMATION OR CHANGES SINCE LAST SESSION]

Time Available: [X hours]
Priority: [High/Medium/Low]
```

## What This Accomplishes

- ✅ Quickly rebuilds Claude's context
- ✅ Identifies current blockers
- ✅ Sets clear focus for the session
- ✅ Maintains session continuity
- ✅ Avoids duplicate work

## Tips for Success

- Be specific about time available and priorities
- Mention any new information since last session
- Review the status file before starting if possible
- Keep this prompt consistent across team members 
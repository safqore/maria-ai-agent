# Documentation Cleanup and Migration

Use this prompt to migrate existing documentation to the new layered documentation system.

## Prompt Template

```
Hey Claude, I need to clean up and migrate existing documentation to align with our new layered documentation system.

Please help me by:

1. **Review Current System**: First, review /docs/README.md to understand:
   - The 3-layer architecture (cross-feature registry, focused feature docs, session memory)
   - Line limits for each document type
   - Directory structure and organization principles
   - Quality standards and design principles

2. **Assess Existing Documentation**: I have documentation that needs cleanup located at:
   [USER TO SPECIFY: Path to existing documentation]

   Please analyze this documentation and:
   - Identify what type of content exists
   - Categorize content by the new system (architecture, features, decisions, etc.)
   - Assess content quality and relevance
   - Identify any conflicts with existing documentation
   - Extract cross-feature architectural information that belongs in /docs/architecture/ (decisions.md, integration-map.md, patterns.md)

3. **Create Migration Plan**: Based on your analysis, create a step-by-step plan that:
   - Shows what content will be migrated to each new location
   - Identifies content that exceeds line limits (STATUS: 50 lines, DECISIONS: 30 lines, IMPLEMENTATION: 100 lines, BLOCKERS: 20 lines) and shows how to restate/summarize without losing key messages
   - Suggests what should be deleted vs migrated to reduce noise
   - Identifies any missing documentation that should be created
   - Shows how to update architecture registry (/docs/architecture/decisions.md, integration-map.md, patterns.md) with cross-feature information
   - Identifies cases where features may be too complex for line limits and should be broken down
   - Estimates time and effort required
   - Identifies potential conflicts or issues and how to resolve them through code review

4. **Cleanup Strategy**: Include in your plan:
   - What content will be hard deleted after validation
   - How to reduce documentation noise
   - Focus on essential content only
   - Stage migration first, then delete after validation

5. **Validation Steps**: Include steps to ensure:
   - Migrated content follows established patterns
   - Line limits are respected
   - Architecture registry is updated BEFORE feature docs to avoid conflicts
   - No conflicts with existing feature documentation
   - Cross-references between architecture and feature docs are consistent
   - When conflicts arise, resolve by reviewing actual codebase implementation
   - Architecture registry serves as single source of truth for cross-feature decisions

**Present the plan for my review before any execution. Once I approve the plan, proceed with implementation including creating directory structures and migrating content without asking for additional permissions.**

Additional Context:
[ANY SPECIFIC REQUIREMENTS OR CONSTRAINTS]

Priority Level: [High/Medium/Low]
Timeline: [When this needs to be completed]
```

## What This Accomplishes

- ✅ Ensures systematic migration to new documentation system
- ✅ Preserves only essential content within line limits
- ✅ Reduces documentation noise for better Claude context
- ✅ Maintains architectural consistency
- ✅ Prevents documentation conflicts
- ✅ Creates clear migration roadmap

## Migration Success Criteria

- Only essential content is preserved within strict line limits
- New documentation follows line limits and structure
- Architecture registry is updated with new patterns
- No conflicts with existing feature documentation
- Documentation noise is significantly reduced
- Claude context is optimized for better AI assistance

## Common Migration Patterns

### For Scattered Requirements
- Extract business requirements → Feature documentation
- Extract technical decisions → DECISIONS.md (max 30 lines)
- Extract implementation notes → IMPLEMENTATION.md (max 100 lines)
- Delete redundant or outdated content

### For Bloated Documentation
- Identify core content for migration
- Restate and summarize to fit line limits without losing key messages
- Delete detailed examples and lengthy discussions
- Create focused, essential-only versions
- **If critical technical details would be lost due to line limits, recommend breaking the feature into smaller features**

### For Duplicate Content
- Consolidate into single source of truth
- Delete all duplicates
- Restate content to fit new categories if needed

### For Content That Doesn't Fit Categories
- Rewrite to fit STATUS, DECISIONS, IMPLEMENTATION, or BLOCKERS format
- Break complex content into appropriate sections
- Delete content that can't be meaningfully categorized

### For Cross-Feature Architectural Content
- Extract architectural decisions → /docs/architecture/decisions.md
- Extract integration points → /docs/architecture/integration-map.md  
- Extract code patterns → /docs/architecture/patterns.md
- Update architecture registry to reflect current system state
- **Architecture registry becomes single source of truth; feature docs reference it rather than duplicating information**

## Red Flags to Watch For

- Content that doesn't fit new structure
- Dependencies between scattered documents
- Information that spans multiple features (should go to architecture registry)
- Critical context that might be lost during summarization
- Outdated or conflicting information
- Architectural decisions buried in feature docs
- Integration points not captured in integration-map.md
- Code patterns not documented in patterns.md
- Conflicts between existing architecture docs and migrated content (**resolve by reviewing actual codebase**)
- Same information appearing in multiple places (consolidate into architecture registry as single source)
- Features that seem too complex for line limits (**recommend breaking into smaller features**)

## Post-Migration Checklist

- [ ] All team members can find relevant documentation
- [ ] Architecture registry (decisions.md, integration-map.md, patterns.md) is updated with cross-feature information
- [ ] Feature documentation is complete and current
- [ ] All line limits are respected (STATUS: 50, DECISIONS: 30, IMPLEMENTATION: 100, BLOCKERS: 20)
- [ ] Old documentation has been hard deleted
- [ ] Documentation noise has been significantly reduced
- [ ] Claude context is optimized for AI assistance

## Migration Order Requirements

1. **Architecture Registry First**: Update /docs/architecture/ documents before feature docs
2. **Feature Documentation Second**: Create feature docs that reference architecture registry
3. **Cross-Validation**: Ensure consistency between architecture and feature documentation
4. **Conflict Resolution**: Review actual codebase when documentation conflicts arise
5. **Hard Deletion Last**: Only delete original content after successful migration and validation

## Conflict Resolution Principles

- **Documentation Conflicts**: When existing docs contradict migrated content, review actual codebase implementation
- **Architecture Registry**: Serves as single source of truth for cross-feature decisions
- **Feature Complexity**: If feature can't fit line limits without losing critical details, recommend breaking into smaller features
- **Content Overlap**: Consolidate duplicate information into architecture registry, have feature docs reference it 
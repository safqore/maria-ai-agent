# Documentation System

This directory contains all project documentation organized in a layered system designed to support AI-assisted development and prevent feature conflicts.

## Directory Structure

```
docs/
├── README.md                 # ← This file
├── architecture/             # ← Cross-feature architecture registry
│   ├── decisions.md          # ← Technical Decision Records (TDRs)
│   ├── patterns.md           # ← Established code patterns
│   └── integration-map.md    # ← Feature interdependencies
├── development/              # ← Development workflow tools
│   ├── prompts/              # ← Guided prompts for Claude sessions
│   └── checklists/           # ← Workflow checklists
├── features/                 # ← Feature-specific documentation
│   └── [feature-name]/       # ← Individual feature docs
│       ├── STATUS.md         # ← Current status (max 50 lines)
│       ├── DECISIONS.md      # ← Feature decisions (max 30 lines)
│       ├── IMPLEMENTATION.md # ← Implementation details (max 100 lines)
│       └── BLOCKERS.md       # ← Current blockers (max 20 lines)
└── templates/                # ← Documentation templates
    ├── feature-docs/         # ← Templates for feature documentation
    └── session-memory/       # ← Templates for session working memory
```

## System Design Principles

### 1. Layered Architecture
- **Layer 1**: Cross-feature architecture registry (single source of truth)
- **Layer 2**: Focused feature documentation (line-limited)
- **Layer 3**: Session working memory (temporary, gets deleted)

### 2. Line Limits
- **STATUS.md**: 50 lines max
- **DECISIONS.md**: 30 lines max
- **IMPLEMENTATION.md**: 100 lines max
- **BLOCKERS.md**: 20 lines max

### 3. Coordination First
- All features must check architecture registry before implementation
- Integration map prevents conflicts
- Established patterns ensure consistency

## Getting Started

### For New Features
1. Use `/docs/development/prompts/start-new-feature.md`
2. Follow the new feature checklist
3. Create feature documentation from templates

### For Daily Sessions
1. Use `/docs/development/prompts/daily-session-start.md`
2. Follow the daily session checklist
3. Create session working memory

### For Implementation
1. Use `/docs/development/prompts/cross-feature-check.md`
2. Follow the implementation ready checklist
3. Check architecture registry for patterns

## Working with Claude

### Session Continuity
- Use guided prompts for consistent session startup
- Maintain session working memory in `/.claude-sessions/`
- Update feature documentation at end of each session

### Preventing Hallucinations
- Hard line limits prevent documentation bloat
- Focused documents provide clear context
- Architecture registry prevents pattern conflicts

## Benefits

### For Developers
- ✅ Clear guidance for every development phase
- ✅ Consistent patterns across all features
- ✅ Reduced conflicts and coordination overhead
- ✅ Effective AI assistance without hallucinations

### For the Project
- ✅ Architectural consistency across features
- ✅ Knowledge preservation across sessions
- ✅ Scalable documentation system
- ✅ Reduced technical debt

## Migration Notes

This system replaces the previous scattered documentation approach. Existing documentation in `/requirements/` will be gradually migrated to this new structure.

---
*This documentation system is designed to scale with your team and ensure AI-assisted development remains effective* 
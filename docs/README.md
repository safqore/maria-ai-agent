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
│   └── prompts/              # ← Deterministic prompts for AI-assisted development
├── features/                 # ← Feature-specific documentation
│   └── [feature-name]/       # ← Individual feature docs
│       ├── STATUS.md         # ← Current status (max 50 lines)
│       ├── DECISIONS.md      # ← Feature decisions (max 30 lines)
│       ├── IMPLEMENTATION.md # ← Implementation details (max 100 lines)
│       └── BLOCKERS.md       # ← Current blockers (max 20 lines)
└── templates/                # ← Documentation templates
    └── feature-docs/         # ← Templates for feature documentation
```

## System Design Principles

### 1. Layered Architecture
- **Layer 1**: Cross-feature architecture registry (single source of truth)
- **Layer 2**: Focused feature documentation (line-limited)
- **Layer 3**: Deterministic development prompts (AI-assisted workflow)

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
1. Use `/docs/development/prompts/feature-planning.md`
2. Follow the deterministic planning workflow
3. Create technical specifications and implementation plan

### For Development
1. Use `/docs/development/prompts/development.md`
2. Follow the AI-assisted development workflow
3. Implement code with automatic documentation updates

### For Validation
1. Use `/docs/development/prompts/progress-check.md`
2. Validate code against documentation and requirements
3. Ensure consistency and quality standards

## Working with AI Assistants

### Deterministic Development
- Use structured prompts for consistent AI behavior
- Follow hybrid interactive/autonomous workflows
- Automatic documentation updates ensure continuity

### Preventing Hallucinations
- Hard line limits prevent documentation bloat
- Focused documents provide clear context
- Architecture registry prevents pattern conflicts
- Explicit handoff gates prevent assumptions

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
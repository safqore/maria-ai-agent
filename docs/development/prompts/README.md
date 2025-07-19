# Development Prompts Registry

This directory contains deterministic prompts for AI-assisted development. Each prompt follows a hybrid interactive/autonomous workflow with explicit handoff gates.

## Available Prompts

### Core Development Prompts

#### 1. `feature-planning.md`
**When to use:** Starting any new feature or major feature enhancement
**Purpose:** Convert business requirements into detailed technical specifications
**Workflow:** 
- Interactive: Gather and clarify business requirements
- Handoff Gate: Confirm requirements are implementable
- Autonomous: Generate technical specifications and implementation plan
- **Architecture Integration:** Reviews existing architectural decisions and captures new ones

#### 2. `development.md`
**When to use:** Implementing code for any feature
**Purpose:** AI-assisted development with automatic documentation updates
**Workflow:**
- Interactive: Review current status and confirm next tasks
- Handoff Gate: Approve development approach
- Autonomous: Implement code, run tests, update documentation
- **Architecture Integration:** Ensures code follows established patterns and decisions

#### 3. `progress-check.md`
**When to use:** Validating feature implementation against requirements
**Purpose:** Ensure code matches documentation and requirements
**Workflow:**
- Autonomous: Analyze code vs documentation discrepancies
- Interactive: Present findings for approval
- Autonomous: Apply approved updates
- **Architecture Integration:** Validates compliance with architectural decisions

### Supporting Prompts

#### 4. `documentation-updater.md`
**When to use:** Called by other prompts to update documentation consistently
**Purpose:** Centralized documentation updates following established patterns
**Workflow:** Autonomous only - updates STATUS.md, DECISIONS.md, IMPLEMENTATION.md, BLOCKERS.md
- **Architecture Integration:** Maintains `/docs/architecture/decisions.md`, `/docs/architecture/integration-map.md`, `/docs/architecture/patterns.md`

## Usage Guidelines

### For New Features
1. Start with `feature-planning.md` (considers existing architectural decisions)
2. Use `development.md` for implementation (follows established patterns)
3. Use `progress-check.md` for validation (ensures architecture compliance)

### For Existing Features
1. Use `development.md` for continued work (maintains architecture alignment)
2. Use `progress-check.md` periodically for validation (checks decision compliance)

### Feature Name Validation
- `development.md` and `progress-check.md` require explicit feature name specification
- If no feature name is provided, prompts will ask user to specify one
- Feature directory must exist at `/docs/features/[FEATURE_NAME]/`
- Prompts will not proceed until valid feature name is confirmed

### For Team Coordination
- All prompts automatically update documentation
- Architecture decisions are preserved and referenced across all features
- Next developer uses same prompts to continue work
- Documentation provides continuity between sessions
- Architectural decisions ensure consistent implementation patterns

## Prompt Design Principles

### Deterministic Behavior
- Self-validation checklists
- Explicit error codes and recovery
- Clear success criteria
- No assumptions without user confirmation

### Hybrid Workflow
- Interactive phase for user input
- Handoff gate for explicit approval
- Autonomous phase for technical execution

### Documentation Integration
- All prompts update documentation automatically
- Consistent documentation patterns
- Line limits enforced (STATUS: 50, DECISIONS: 30, IMPLEMENTATION: 100, BLOCKERS: 20)
- **Architecture documentation preserved without line limits**

### Architecture Integration
- All prompts load and consider existing architectural decisions
- New architectural decisions are automatically captured
- Code implementation verified against established patterns
- Integration points tracked and maintained
- Ensures all features pull in the same architectural direction

## Error Handling

All prompts use standardized error codes:
- `FEATURE_NOT_FOUND`: Feature directory does not exist
- `REQUIREMENT_VALIDATION_FAILED`: Business requirements unclear
- `TECHNICAL_SPEC_FAILED`: Unable to generate technical specifications
- `IMPLEMENTATION_FAILED`: Code implementation failed
- `TESTING_FAILED`: Unable to write or execute tests successfully
- `DOCUMENTATION_FAILED`: Documentation update failed
- `VALIDATION_FAILED`: Progress check validation failed
- `CODE_FIX_FAILED`: Unable to apply code fixes
- `REPORT_FAILED`: Unable to generate validation report
- `QUALITY_FAILED`: Unable to meet quality/code standards
- `ARCHITECTURE_FAILED`: Architecture compliance issues detected

## Success Criteria

Each prompt has explicit success criteria that must be met before completion:
- All acceptance checklist items marked ✓
- Documentation updated and validated
- Architecture decisions captured and maintained
- No errors or conflicts detected
- Clear next steps identified
- Architecture compliance verified

## Architecture Documentation

### Key Files Maintained
- `/docs/architecture/decisions.md`: All architectural decisions with rationale
- `/docs/architecture/integration-map.md`: Feature integration points and dependencies
- `/docs/architecture/patterns.md`: Established code patterns and standards

### Decision Preservation
- Architectural decisions are preserved indefinitely (no line limits)
- All decisions include rationale and implementation details
- Decisions are referenced during all development phases
- Ensures consistent architectural direction across features

---
*Use these prompts consistently to ensure deterministic AI-assisted development with architectural consistency* 
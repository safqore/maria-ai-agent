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

#### 2. `development.md`
**When to use:** Implementing code for any feature
**Purpose:** AI-assisted development with automatic documentation updates
**Workflow:**
- Interactive: Review current status and confirm next tasks
- Handoff Gate: Approve development approach
- Autonomous: Implement code, run tests, update documentation

#### 3. `progress-check.md`
**When to use:** Validating feature implementation against requirements
**Purpose:** Ensure code matches documentation and requirements
**Workflow:**
- Autonomous: Analyze code vs documentation discrepancies
- Interactive: Present findings for approval
- Autonomous: Apply approved updates

### Supporting Prompts

#### 4. `documentation-updater.md`
**When to use:** Called by other prompts to update documentation consistently
**Purpose:** Centralized documentation updates following established patterns
**Workflow:** Autonomous only - updates STATUS.md, DECISIONS.md, IMPLEMENTATION.md, BLOCKERS.md

## Usage Guidelines

### For New Features
1. Start with `feature-planning.md`
2. Use `development.md` for implementation
3. Use `progress-check.md` for validation

### For Existing Features
1. Use `development.md` for continued work
2. Use `progress-check.md` periodically for validation

### For Team Coordination
- All prompts automatically update documentation
- Next developer uses same prompts to continue work
- Documentation provides continuity between sessions

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

## Error Handling

All prompts use standardized error codes:
- `REQUIREMENT_VALIDATION_FAILED`: Business requirements unclear
- `TECHNICAL_SPEC_FAILED`: Unable to generate technical specifications
- `IMPLEMENTATION_FAILED`: Code implementation failed
- `DOCUMENTATION_FAILED`: Documentation update failed
- `VALIDATION_FAILED`: Progress check validation failed

## Success Criteria

Each prompt has explicit success criteria that must be met before completion:
- All acceptance checklist items marked ✓
- Documentation updated and validated
- No errors or conflicts detected
- Clear next steps identified

---
*Use these prompts consistently to ensure deterministic AI-assisted development* 
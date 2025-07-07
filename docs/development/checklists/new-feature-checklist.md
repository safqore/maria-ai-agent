# New Feature Checklist

Use this checklist when starting any new feature to ensure consistency and avoid conflicts.

## Pre-Development Phase

### Requirements Analysis
- [ ] Business requirements are clearly defined
- [ ] Technical requirements have been broken down
- [ ] User stories are complete and testable
- [ ] Acceptance criteria are defined

### Architecture Review
- [ ] Check `/docs/architecture/patterns.md` for required patterns
- [ ] Review `/docs/architecture/integration-map.md` for dependencies
- [ ] Identify any existing features that might be affected
- [ ] Confirm database schema changes needed

### Documentation Setup
- [ ] Create `/docs/features/[FEATURE_NAME]/` directory
- [ ] Create `STATUS.md` with initial status
- [ ] Create `DECISIONS.md` with initial decisions
- [ ] Create `IMPLEMENTATION.md` with planned approach
- [ ] Create `BLOCKERS.md` (empty initially)

## Development Phase

### Initial Setup
- [ ] Feature branch created from main
- [ ] Development environment set up
- [ ] Dependencies identified and installed
- [ ] Initial file structure created

### Implementation Planning
- [ ] Break down work into manageable tasks
- [ ] Identify integration points with other features
- [ ] Plan database migrations (if needed)
- [ ] Plan API endpoints and contracts
- [ ] Plan frontend components and state management

### Cross-Feature Coordination
- [ ] Run cross-feature dependency check
- [ ] Coordinate with other developers if needed
- [ ] Identify shared components that need updates
- [ ] Plan for any breaking changes

## Quality Assurance

### Code Quality
- [ ] Follow established coding patterns
- [ ] Write tests for new functionality
- [ ] Ensure error handling is consistent
- [ ] Document any new patterns or utilities

### Integration Testing
- [ ] Test integration with existing features
- [ ] Validate API contracts
- [ ] Test database migrations
- [ ] Verify no breaking changes

## Completion

### Documentation Updates
- [ ] Update feature STATUS.md with completion
- [ ] Document any new architectural decisions
- [ ] Update integration map if needed
- [ ] Add any new patterns to architecture registry

### Code Review
- [ ] Create pull request
- [ ] Address code review feedback
- [ ] Merge to main branch
- [ ] Deploy to staging/production

---
*Use this checklist to ensure nothing is missed* 
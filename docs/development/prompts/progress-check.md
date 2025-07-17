---
mode: 'agent'
---

<!--
Prompt-Contract Header (v1.0.0)
Role: Progress Validation Orchestrator - Hybrid Autonomous-then-Interactive workflow
Mandatory Inputs: 
 - Feature name (from user)
Output: Validation report + documentation updates + discrepancy resolution
Acceptance Checklist (AI must self-tick at each gate):
 [ ] Feature context loaded
 [ ] Code analysis completed
 [ ] Documentation analysis completed
 [ ] Discrepancies identified
 [ ] HANDOFF GATE: User approved discrepancy resolution
 [ ] Documentation updated
 [ ] Validation report generated
 [ ] Quality standards verified
 Stop-if-missing rule: if any mandatory input is absent at the gate, HALT with specific error code and DO NOT advance to the next phase
-->

<!-- Hybrid Flow Overview
AUTONOMOUS PHASE:
Feature Analysis -> Code Review -> Documentation Review -> Discrepancy Identification

INTERACTIVE PHASE:
Discrepancy Report -> User Approval -> HANDOFF GATE

AUTONOMOUS PHASE:
Documentation Update -> Validation Report -> Quality Verification
-->

You are an expert validation agent operating in **HYBRID MODE**: Autonomous analysis followed by interactive approval, then autonomous resolution.

**CRITICAL WORKFLOW RULE:** This process has THREE DISTINCT PHASES:
- **Phase 1 (Autonomous):** Analyze code and documentation to identify discrepancies
- **Phase 2 (Interactive):** Present findings and get user approval for resolution
- **Phase 3 (Autonomous):** Apply approved updates and generate validation report

Between phases, there is a **HANDOFF GATE** requiring explicit user approval.

<!-- PHASE 1: AUTONOMOUS ANALYSIS -->

1. **Load Feature Context (Autonomous):**
    - **Action:** Load feature documentation from `/docs/features/[FEATURE_NAME]/`
    - **Files to Load:**
        - `STATUS.md` - Current progress and next actions
        - `DECISIONS.md` - Technical decisions made
        - `IMPLEMENTATION.md` - Technical specifications
        - `BLOCKERS.md` - Current blocking issues
    - **Architecture Context:** Load `/docs/architecture/patterns.md` for validation standards
    - **Codebase Analysis:** Analyze actual code implementation for the feature
    - **End Condition:** Full context loaded and understood

2. **Analyze Code Implementation (Autonomous):**
    - **Code Structure Analysis:** Review actual code structure and organization
    - **Functionality Analysis:** Verify implemented functionality against requirements
    - **Pattern Compliance:** Check code against established patterns
    - **Integration Analysis:** Verify integration points are properly implemented
    - **Error Handling:** Verify error handling is implemented correctly
    - **Testing Coverage:** Analyze test coverage and quality
    - **Performance Analysis:** Check performance considerations
    - **Security Analysis:** Verify security best practices
    - **Validation:** Ensure comprehensive code analysis completed

3. **Analyze Documentation (Autonomous):**
    - **Requirements Alignment:** Compare documentation against original requirements
    - **Implementation Accuracy:** Verify documentation matches actual implementation
    - **Completeness Check:** Ensure all aspects are documented
    - **Accuracy Validation:** Verify technical details are correct
    - **Consistency Check:** Ensure documentation is internally consistent
    - **Timeliness Check:** Verify documentation is up to date
    - **Validation:** Ensure comprehensive documentation analysis completed

4. **Identify Discrepancies (Autonomous):**
    - **Code vs Documentation:** Identify mismatches between code and documentation
    - **Requirements vs Implementation:** Identify gaps between requirements and implementation
    - **Pattern Violations:** Identify deviations from established patterns
    - **Missing Elements:** Identify missing documentation or implementation
    - **Inconsistencies:** Identify internal inconsistencies
    - **Quality Issues:** Identify quality or standards violations
    - **Validation:** Ensure all discrepancies identified and categorized

<!-- PHASE 2: INTERACTIVE APPROVAL -->

5. **Generate Discrepancy Report (Interactive):**
    - **Action:** Compile comprehensive discrepancy report:
        ```
        VALIDATION REPORT:
        - Feature: [FeatureName]
        - Analysis Date: [Date]
        - Overall Status: [Compliant/Needs Updates/Critical Issues]
        
        DISCREPANCIES FOUND:
        - Code vs Documentation: [List of mismatches]
        - Requirements vs Implementation: [List of gaps]
        - Pattern Violations: [List of violations]
        - Missing Elements: [List of missing items]
        - Quality Issues: [List of quality problems]
        
        PROPOSED RESOLUTIONS:
        - Documentation Updates: [List of updates needed]
        - Code Fixes: [List of fixes needed]
        - Pattern Corrections: [List of corrections needed]
        - Quality Improvements: [List of improvements needed]
        
        IMPACT ASSESSMENT:
        - Risk Level: [Low/Medium/High]
        - Effort Required: [Low/Medium/High]
        - Priority: [Low/Medium/High]
        ```
    - **End Condition:** Comprehensive report generated and presented to user

6. **Discrepancy Summary & Handoff Gate (Interactive):**
    - **HANDOFF GATE:** Ask explicit question:
        "**READY TO APPLY DISCREPANCY RESOLUTIONS?**
    
        I will now:
        - Update documentation to match actual implementation
        - Fix any code issues that can be resolved automatically
        - Generate final validation report
        - Update feature status automatically
        - Complete all validation tasks without further input

        This process will take approximately 2-3 minutes.

        **Proceed with discrepancy resolution? (yes/no)**"

    - **Gate Logic:**
        - If "yes" -> Proceed to Phase 3 (Autonomous)
        - If "no" -> Return to discrepancy review in Phase 2
        - If unclear response -> Ask again with explicit binary choice
        - If no response -> Wait indefinitely (do not assume approval)
        - **Never proceed without explicit "yes" confirmation**

    - **Checklist Update:** Mark handoff gate as ✓ when user approves

<!-- PHASE 3: AUTONOMOUS RESOLUTION -->

7. **Apply Documentation Updates (Autonomous):**
    - **Action:** Execute `documentation-updater.md` sub-prompt with:
        - Feature name: [FeatureName]
        - Update type: STATUS
        - Content: Updated validation status and next actions
    - **Additional Updates:**
        - Update IMPLEMENTATION.md to match actual code
        - Update DECISIONS.md with any new decisions made during validation
        - Update BLOCKERS.md with any new blockers or resolved blockers
    - **Validation:** Verify all documentation updated successfully
    - **Error Handling:** If documentation update fails, HALT with "DOCUMENTATION_FAILED"

8. **Apply Code Fixes (Autonomous):**
    - **Automatic Fixes:** Apply fixes that can be resolved automatically
    - **Code Quality:** Fix code quality issues within scope
    - **Pattern Compliance:** Correct pattern violations
    - **Documentation Alignment:** Ensure code matches documentation
    - **Validation:** Verify all fixes applied successfully
    - **Error Handling:** If code fixes fail, HALT with "CODE_FIX_FAILED"

9. **Generate Final Validation Report (Autonomous):**
    - **Report Structure:**
        - Executive Summary
        - Detailed Findings
        - Resolution Actions Taken
        - Remaining Issues (if any)
        - Recommendations
        - Next Steps
    - **Report Location:** Save to `/docs/features/[FEATURE_NAME]/validation-report.md`
    - **Validation:** Verify report generated successfully
    - **Error Handling:** If report generation fails, HALT with "REPORT_FAILED"

10. **Verify Quality Standards (Autonomous):**
    - **Final Code Review:** Verify all code meets quality standards
    - **Documentation Accuracy:** Verify documentation is accurate and complete
    - **Pattern Compliance:** Verify all patterns are followed
    - **Integration Verification:** Verify all integrations work correctly
    - **Validation:** Ensure all quality standards met
    - **Error Handling:** If quality issues remain, HALT with "QUALITY_FAILED"

<!-- AUTONOMOUS ERROR HANDLING -->
**Error Recovery Pattern:** For all autonomous phases (1-4, 7-10):
    - **Attempt:** Execute step
    - **Validate:** Check success conditions
    - **Context Preservation:** Save current state (analysis, findings, progress)
    - **Retry:** If failed, attempt automated fix and retry once
    - **Diagnostic Info:** Capture specific error details and context
    - **Halt:** If retry fails, HALT with specific error code and full diagnostic context
    - **State Recovery:** Preserve all analysis for manual continuation
    - **No User Interaction:** Never ask user for guidance during autonomous phases

<!-- ERROR CODE DEFINITIONS -->
**Error Codes:**
- ANALYSIS_FAILED: Unable to complete code or documentation analysis
- DOCUMENTATION_FAILED: Unable to update documentation
- CODE_FIX_FAILED: Unable to apply code fixes
- REPORT_FAILED: Unable to generate validation report
- QUALITY_FAILED: Unable to meet quality standards

<!-- COMPLETION VERIFICATION -->
11. **Final Verification (Autonomous):**
    - **Action:** Confirm all steps completed successfully:
        - [ ] Code analysis completed
        - [ ] Documentation analysis completed
        - [ ] Discrepancies identified
        - [ ] Documentation updated
        - [ ] Validation report generated
        - [ ] Quality standards verified
    - **Success Criteria:** All checklist items ticked, no errors
    - **Completion Message:** "Progress validation complete!
    
    Your feature has been validated and updated. You can now:
        - Review validation report in: `/docs/features/[FeatureName]/validation-report.md`
        - Check updated status in: `/docs/features/[FeatureName]/STATUS.md`
        - Continue development or start new feature planning"
    
**SUCCESS CRITERIA:** All acceptance checklist items marked ✓ without user intervention after handoff gate. 
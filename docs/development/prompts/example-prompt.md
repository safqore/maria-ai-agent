---
mode: 'agent'
---

<!--
Prompt-Contract Header (v2.0.0)
Role: New-Feature Orchestrator - Hybrid Interactive-then-Autonomous workflow
Mandatory Inputs: 
 - Feature purpose description (from user)
Output: Completed feature scaffold + save implementation plan
Acceptance Checklist (AI must self-tick at each gate):
 [ ] Feature purpose collected
 [ ] Parameter confirmation received from user
 [ ] HANDOFF GATE: User approved automation execution
 [ ] Parameter file created and validated
 [ ] Scaffolding command executed successfully
 [ ] Implementation plan generated & saved
 [ ] Quick-lint checklist completed
 Stop-if-missing rule: if any mandatory input is absent at the gate, HALT with specific error code and DO NOT advance to the next phase
-->

<!-- Hybrid Flow Overview
INTERACTIVE PHASE:
Feature Purpose -> Paramter Collection -> User Confirmation -> HANDOFF GATE

AUTONOMOUS PHASE:
Parameter JSON -> Scaffold Script -> Context Gathering -> Implementation Plan
-->

You are an expert developer agent operating in **HYBRID MODE**: Interactive parameter gathering followed by autonomous execution.

**CRITICAL WORKFLOW RULE:** This process has TWO DISTINCT PHASES:
- **Phase 1 (Interactive):** Collect parameters with user collaboration
- **Phase 2-4 (Autonomous):** Execute technical tasks without user intervention

Between phases, there is a **HANDOFF GATE** requiring explicit user approval.

<!-- PHASE 1: INTERACTIVE PARAMETER GATHERING -->

1. **Initiate Parameter Gathering (01-Interviewer-v2):**
    - **Action:** Execute `src/ai-scaffold/newFeature/v2/01-Interviewer-v2.prompt.md` as sub-procedure
    - **Output:** Collect all feature parameters through conversation
    - **Constraint:** DO NOT create any files yet - only gather information
    - **End Condition:** User confirms all parameters are correct

2. **Parameter Summary & Handoff Gate:**
    - **Action:** Display complete parameter summary to user:
        ```
        PARAMETER SUMMARY:
        - Feature Name: [FeatureName]
        - Template Name: [templateName]
        - Flag Name: [flagName]
        - Route Path: [routePath]
        - Navigation Text: [NavText]
        - Icon: [IconName]
        - Flag Description: [flagDescription]
        - Flag Category: [flagCategory] - DEFAULT 'ui'
        - Navigation Area: [NavigationArea] - DEFAULT 'ui'
        - Feature Purpose: [featurePurpose]
        ```
    - **HANDOFF GATE:** Ask explicit question:
        "**READY FOR AUTONOMOUS EXECUTION?**
    
        I will now:
        - Create parameter file automatically
        - Run scaffolding script automatically
        - Generate implementation plan automatically
        - Complete all technical tasks without futher input

        This process will take approximately 2-3 minutes.

        **Proceed with autonomous execution? (yes/no)**"

    - **Gate Logic:**
        - If "yes" -> Proceed to Phase 2 (Autonomous)
        - If "no" -> Return to parameter refinement in Phase 1
        - If unclear response -> Ask again with explicit binary choice
        - If no response -> Wait indefinitely (do not assume approval)
        - **Never proceed without explicit "yes" confirmation**

    - **Checklist Update:** Mark handoff gate as ✓ when user approves

2.5 **Parameter Structure Validation:**
    - **Action:** Validate all required parameters collected from step 1:
        - FeatureName (PascalCase format) ✓
        - templateName (lowercase version of FeatureName) ✓
        - flagName (camelCase format) ✓
        - routePath (kebab-case format with leading slash) ✓
        - NavText, IconName, flagDescription, flagCategory, NavigationArea ✓
        - featurePurpose (original user input preserved) ✓
    - **Validation Rules:**
        - FeatureName must not contain spaces or special characters
        - templateName must be all lowercase, no spaces
        - routePath must start with "/" and use kebab-case
        - flagName must be camelCase starting with lowercase
    - **Error Handling:** If any parameter format invalid, HALT with "PARAMETER_VALIDATION_FAILED"
    - **Success:** All parameters validated and ready for file creation

<!-- PHASE 2-4: AUTONOMOUS EXECUTION (NO USER INTERACTION) -->

3. **Create Parameter File (Autonomous):**
    - **Directory Creation:** First create the feature directory `src/app/features/[templateName]/`
    - **File Path Construction:** `src/app/features/[templateName]/[templateName]-params.json`
    - **Path Validation:**
        - Verify templateName contains only lowercase letters/numbers
        - Ensure no spaces, special characters, or uppercase in path
        - Confirm folder structure matches scaffolding expectations
    - **Example Paths:**
        - UserProfile -> `src/app/features/userprofile/userprofile-params.json`
        - DataVisualizer -> `src/app/features/datavisualizer/datavisualizer-params.json`    
    - **JSON Encoding Safety:** Before creating JSON, sanitize all string values:
        - Escape double quotes: '"' -> '\"'
        - Escape backslashes: '\' -> '\\'
        - Escape newlines: '\n' -> '\\n'
        - Escape carriage returns: '\r' -> '\\r'
        - Escape tabs: '\t' -> '\\t'
        - Remove or escape any control characters (ASCII 0-31)
        - Validate UTF-8 encoding for special characters
    - **Action:** Create JSON file with exact structure (after sanitization):
    ```json
    {
        "__FeatureName__": "[PascalCase name from step 1 - sanitized]",
        "__templateName__": "[lowercase version of FeatureName - sanitized]",
        "__flagName__": "[camelCase flag from step 1 - sanitized]",
        "__flagDescription__": "[description from step 1 - sanitized]",
        "__flagCategory__": "[ui or functionality from step 1 - sanitized]",
        "__routePath__": "[kebab-case path from step 1 - sanitized]",
        "__NavText__": "[display text from step 1 - sanitized]",
        "__IconName__": "[MUI icon name from step 1 - sanitized]",
        "__NavigationArea__": "[App or Developer from step 1 - sanitized]",
        "__featurePurpose__": "[original purpose from step 1 - sanitized]"
    }
    ```
    - **JSON Validation:** After creation, parse the JSON file to ensure it's valid
    - **Validation:** Verify all 10 required keys are present with correct values
    - **File Verification:** Confirm parameter fle exists and contains valid JSON
    - **Error Handling:** If directory creation or file creation fails, HALT with error code "FILE_CREATION_FAILED"
    - **Success:** Verify parameter file exists and is valid JSON

4. **Execute Scaffolding Script (Autonomous):**
    - **Command:** `npm run scaffold:feature -- --input [featureParamsPath]`
    - **Execution:** Run in PowerShell terminal automatically
    - **Retry Logic:** If first attempt fails, analyse error and retry once with corrections
    - **Halt Condition:** If both attempts fail, HALT with error code "SCAFFOLDING_FAILED" and diagnostic info
    - **Success:** Verify scaffold completion and folder structure

5. **Gather Feature Context (Autonomous):**
    - **Primary Action:** Automatically gather full context of `src/app/features/[featureName]/` folder
    - **Style Guide Integration:** Load `src/ai-scaffold/newFeature/v2/AGENTIC_STYLE_GUIDE.md` for coding standards and patterns
    - **Codebase Analysis:** Analyse existing feature components to understand current UI patterns:
        - Search for existing Material-UI usage patterns in other features
        - Identify correct import statements and component usage
        - Gather examples of proper routing, state management and service integration
    - **Context Compilation:** Combine scaffolded feature structure + style guide + existing patterns
    - **Validation:** Confirm context is complete before proceeding
    - **Error Handling:** If context gathering fails, HALT with error code "CONTEXT_FAILED"

6. **Generate Implementation Plan (Autonomous):**
    - **Action:** Executes `src/ai-scaffold/newFeature/v2/03-Planner-v2.prompt.md` with feature context
    - **Input:** Feature purpose + scaffolded context + planner instructions
    - **Output:** Complete implementation plan
    - **Quality Check:** Verify plan addresses all components and feature purpose
    - **Retry:** If plan inadequte, regenerate once with enhanced context
    - **Halt Condition:** If unable to generate satisfactory plan, HALT with error code "PLANNING_FAILED"

7. **Save Implementation Plan (Autonomous):**
    - **Action:** Save plan to `src/app/features/[featureName]/specification/[FeatureName]Plan.md`
    - **Validation:** Verify file creation and content accuracy
    - **Error Handling:** If save fails, HALT with error code "PLAN_SAVE_FAILED"

<!-- AUTONOMOUS ERROR HANDLING -->
**Error Recovery Pattern:** For all autonomous phases (3-7):
    - **Attempt:** Execute step
    - **Validate:** Check succcess conditions
    - **Context Preservation:** Save current state (parameters, file paths, progress)
    - **Retry:** If failed, attempt automated fix and retry once
    - **Diagnostic Info:** Capture specific error details, file path, command output
    - **Halt:** If retry fails, HALT with specific error code and full diagnostic context
    - **State Recovery:** Preserve all collected parameters and progress for manual continuation
    - **No User Interaction:** Never ask user for guidance during autonomous phase

<!-- ERROR CODE DEFINITIONS -->
**Error Codes:**
- FILE_CREATION_FAILED: Unable to create parameter JSON file
- PARAMETER_VALIDATION_FAILED: Invalid parameter format detected
- SCAFFOLDING_FAILED: npm scaffold command failed twice
- CONTEXT_FAILED: Unable to gather feature folder context
- PLANNING_FAILED: Unable to generate satisfactory implementation plan
- PLAN_SAVE_FAILED: Unable to save plan to specification folder

<!-- COMPLETION VERIFICATION -->
8. **Final Verification:**
    - **Action:** Confirm all steps completed successfully:
        - [ ] Parameter file created and validated
        - [ ] Scaffolding script executed successfully
        - [ ] Implementation plan generated and saved
        - [ ] Quick-lint checklist completed
    - **Success Criteria:** All checklist items ticked, no errors
    - **Completion Message:** "Feature implementation complete!
    
    Your new feature is ready. You can now:
        - Review the implementation plan: `src/app/features/[featureName]/specification/[FeatureName]Plan.md`
        - Explore the scaffolded feature folder: `src/app/features/[featureName]/`
        - Test the new feature in your application"
    
**SUCCESS CRITERIA:** All acceptance checklist items marked ✓ without user intervention after handoff gate.
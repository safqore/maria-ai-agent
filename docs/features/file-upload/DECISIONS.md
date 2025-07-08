# File Upload Feature Decisions

## Technical Decisions

### File Type Restriction
- **Decision**: PDF files only (no other formats)
- **Rationale**: Security, consistency, AI processing compatibility
- **Impact**: Simplifies validation, reduces attack surface

### File Size Limits
- **Decision**: 5MB maximum per file, 3 files maximum
- **Rationale**: Storage costs, upload performance, user experience
- **Impact**: Prevents abuse, ensures reasonable upload times

### Upload Workflow Integration
- **Decision**: Integrate into chat FSM with "Done & Continue" button
- **Rationale**: Seamless user experience, workflow consistency
- **Impact**: Users must complete upload before proceeding

### Progress Tracking
- **Decision**: Per-file progress bars with individual status
- **Rationale**: User feedback, retry capability, error handling
- **Impact**: Users can see upload status and retry failed uploads

### Error Handling Strategy
- **Decision**: Inline error messages with retry functionality
- **Rationale**: Clear user feedback, recovery options
- **Impact**: Users can understand and resolve upload issues

### Frontend-Backend Decoupling
- **Decision**: Configuration-based URL management
- **Rationale**: Independent deployment, microservices architecture
- **Impact**: No hardcoded dependencies between services 
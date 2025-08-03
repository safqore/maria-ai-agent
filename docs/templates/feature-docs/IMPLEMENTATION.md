# [FEATURE_NAME] Implementation

**Last Updated**: [YYYY-MM-DD]

## Core Components

### Backend
- **Model**: `[ModelName]` - [Brief description]
- **Repository**: `[RepositoryName]` - [Brief description]
- **Service**: `[ServiceName]` - [Brief description]
- **Routes**: `[RouteFile]` - [Brief description]

### Frontend
- **Components**: `[ComponentName]` - [Brief description]
- **Hooks**: `[HookName]` - [Brief description]
- **Context**: `[ContextName]` - [Brief description]
- **API**: `[ApiFile]` - [Brief description]

## Key Code Patterns

### Database Pattern
```python
# Example of repository pattern usage
repository = get_[feature]_repository()
with TransactionContext():
    result = repository.create(data)
```

### API Pattern
```python
# Example of API endpoint pattern
@[feature]_bp.route('/endpoint', methods=['POST'])
@require_session
def endpoint():
    # Implementation
    return jsonify({'status': 'success', 'nextTransition': 'NEXT_STATE'})
```

### Frontend Pattern
```typescript
// Example of hook pattern
export const use[Feature] = (sessionId: string) => {
  const { resetSession } = useSession();
  // Implementation
};
```

## Integration Points

### Database
- **Tables**: [table_name] - [relationship to other tables]
- **Migrations**: [migration_file] - [what it creates/modifies]

### API Endpoints
- **POST /api/v1/[endpoint]** - [Purpose and integration]
- **GET /api/v1/[endpoint]** - [Purpose and integration]

### Frontend Components
- **[Component]** integrates with **[OtherFeature]** via **[method]**
- **[Hook]** uses **[SharedService]** for **[purpose]**

## Configuration
```env
# Environment variables needed
[VAR_NAME]=[description]
[VAR_NAME]=[description]
```

## File Structure
```
backend/app/
├── models/[feature]_model.py
├── repositories/[feature]_repository.py
├── services/[feature]_service.py
└── routes/[feature]_routes.py

frontend/src/
├── components/[feature]/
├── hooks/use[Feature].ts
├── api/[feature]Api.ts
└── contexts/[Feature]Context.tsx
```

---
*Max 100 lines - Focus on integration points and key patterns* 
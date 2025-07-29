# Task Completion Checklist

When completing any coding task in this project, ensure:

## Before Committing
1. **Test Changes**: Run `npm run dev` to test functionality
2. **Type Check**: Run `npm run build` to ensure TypeScript compiles
3. **Manual Testing**: Test the specific feature/fix manually
4. **Cross-Platform**: Consider Windows/macOS/Linux compatibility

## Security Checks
- [ ] Validate all file paths to prevent traversal attacks
- [ ] No hardcoded secrets or API keys
- [ ] External URLs validated before use
- [ ] User inputs sanitized

## Performance Considerations
- [ ] Async operations don't block UI
- [ ] Large lists use virtualization if >100 items
- [ ] Database queries are optimized
- [ ] No synchronous file operations in Tauri commands

## Code Quality
- [ ] Follow existing code patterns
- [ ] No commented-out code
- [ ] Clear variable/function names
- [ ] Error handling for all async operations
- [ ] Loading states for UI operations

## Documentation
- [ ] Update CLAUDE.md if adding major features
- [ ] Update type definitions if changing data structures
- [ ] Note any new dependencies added

## Known Issues to Watch For
- Path traversal vulnerabilities in file operations
- SQL injection risks with string concatenation
- Performance issues with large game libraries
- Missing TypeScript types (avoid `any`)
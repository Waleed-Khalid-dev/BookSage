with open(r'd:\[Project]\BookSage\src\services\dbService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Target: the end of the highlights migration line + closing bracket
old_ending = '\'\n  ];\n\n  for (const query of migrations)'
new_ending = "',\n    // Phase 5 -- Notes Viewer columns\n    'ALTER TABLE chapters ADD COLUMN user_notes TEXT',\n    'ALTER TABLE chapters ADD COLUMN studied INTEGER DEFAULT 0',\n    'ALTER TABLE chapters ADD COLUMN steps_progress TEXT'\n  ];\n\n  for (const query of migrations)"

if old_ending in content:
    content = content.replace(old_ending, new_ending, 1)
    with open(r'd:\[Project]\BookSage\src\services\dbService.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS - migrations added')
    print('Verify:', 'steps_progress TEXT' in content)
else:
    # Show what's around the area
    idx = content.find("  for (const query of migrations)")
    print('Context:', repr(content[idx-60:idx+10]))

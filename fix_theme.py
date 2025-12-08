import os
import re

directories = [
    '/Users/sahilmehta/sportstrivia-2/components/showcase/ui',
    '/Users/sahilmehta/sportstrivia-2/app/showcase'
]

patterns = [
    (r'getTextColor\(theme,', 'getTextColor('),
    (r'getTextColor\(theme\)', 'getTextColor()'),
    (r'getChipStyles\(theme,', 'getChipStyles('),
    (r'getChipStyles\(theme\)', 'getChipStyles()'),
    (r'getSurfaceStyles\(theme,', 'getSurfaceStyles('),
    (r'getSurfaceStyles\(theme\)', 'getSurfaceStyles()'),
    (r'getInputStyles\(theme\)', 'getInputStyles()'),
    (r'getGlassCard\(theme\)', 'getGlassCard()'),
    (r'getCardGlow\(theme\)', 'getCardGlow()'),
    (r'getDividerStyles\(theme\)', 'getDividerStyles()'),
    (r'getBackgroundVariant\(theme\)', 'getBackgroundVariant()'),
    (r'getBlurCircles\(theme\)', 'getBlurCircles()'),
]

# Regex to remove unused hook: const { theme } = useShowcaseTheme();
# Also handles: const { theme } = useShowcaseTheme()
hook_pattern = re.compile(r'^\s*const\s+\{\s*theme\s*\}\s*=\s*useShowcaseTheme\(\);?\s*$', re.MULTILINE)

count = 0

for directory in directories:
    if not os.path.exists(directory):
        print(f"Skipping {directory}, does not exist")
        continue

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Apply function replacements
                    for pattern, replacement in patterns:
                        content = re.sub(pattern, replacement, content)
                    
                    # Apply hook removal if theme is not used elsewhere?
                    # Using a simple check: if 'theme' appears only in the hook definition, it's safe to remove.
                    # But simpler: just remove the exact line "const { theme } = useShowcaseTheme();"
                    # If "theme" is used elsewhere, this breaks code?
                    # No, the breakage is if I remove definition but use it.
                    # But if I replaced all usages (getTextColor(theme) -> getTextColor()), then 'theme' should be unused.
                    # Exception: if theme is used for something else (e.g. `theme === 'dark'`).
                    # So I should only remove the hook if I'm confident 'theme' is unused.
                    
                    # Check if 'theme' is used other than the hook line
                    content_without_hook = hook_pattern.sub('', content)
                    
                    # Very naive check: does "theme" appear in content_without_hook?
                    # Note: "theme" matches "ShowcaseTheme" or "themeMode". stricter check needed.
                    # \btheme\b
                    
                    if re.search(r'\btheme\b', content_without_hook):
                        # theme is used elsewhere, DO NOT remove the hook line
                        pass
                    else:
                        # theme is NOT used elsewhere, remove the hook line
                        content = content_without_hook

                    if content != original_content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Fixed {path}")
                        count += 1
                except Exception as e:
                    print(f"Error processing {path}: {e}")

print(f"Total files fixed: {count}")

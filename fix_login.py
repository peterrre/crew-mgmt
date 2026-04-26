with open('app/login/page.tsx', 'r') as f:
    lines = f.readlines()
# line 121 is index 120 (0-indexed)
lines[120] = '              Don&apos;t have an account?{\\' \\'}\\n'
with open('app/login/page.tsx', 'w') as f:
    f.writelines(lines)

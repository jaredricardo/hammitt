import os
import re

# Define the directory you want to start from
rootDir = r'C:\Users\ZIA\Documents\EcomExperts\Clients\Hammitt'  # Change this to your directory path

# Define the pattern to search for
pattern = re.compile(r'<script[^>]*type="noscript-s"[^>]*>', re.IGNORECASE)
css_pattern = re.compile(r'<link[^>]*data-href[^>]*>', re.IGNORECASE)
img_pattern = re.compile(r'<img[^>]*class="opt_lazy"[^>]*>', re.IGNORECASE)
restructure_pattern = re.compile(r'<script[^>]*class="restructure"[^>]*>', re.IGNORECASE)

img_matches = []
matches = []
css_matches = []
restructure_matches = []

for dirName, subdirList, fileList in os.walk(rootDir):
    for fname in fileList:
        if fname.endswith('.liquid'):
            full_path = os.path.join(dirName, fname)
            print(f"Processing file {full_path}")
            with open(full_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                for line_no, line in enumerate(lines, 1):
                    if pattern.search(line) is not None:
                        script_content = line
                        while '</script>' not in line:
                            line_no += 1
                            line = lines[line_no]
                            script_content += line
                        folder_name = os.path.basename(dirName)
                        script_lines = script_content.strip().split('\n')
                        if 'data-src' not in script_content and len(script_lines) > 5:
                            script_content = '\n'.join(script_lines[:5]) + '\n    ... ' + '\n    [Script content trimmed for brevity]' + '\n</script>'
                        matches.append((fname, line_no, folder_name, script_content))
                    elif restructure_pattern.search(line) is not None:
                        folder_name = os.path.basename(dirName)
                        script_content = line
                        while '</script>' not in line:
                            line_no += 1
                            line = lines[line_no]
                            script_content += line
                        restructure_matches.append((fname, line_no, folder_name, script_content))

for dirName, subdirList, fileList in os.walk(rootDir):
    for fname in fileList:
        if fname.endswith('.liquid'):
            full_path = os.path.join(dirName, fname)
            print(f"Processing file {full_path}")
            with open(full_path, 'r', encoding='utf-8') as file:
                for line_no, line in enumerate(file, 1):
                    if css_pattern.search(line) is not None:
                        folder_name = os.path.basename(dirName)
                        css_matches.append(f'* Lazy loaded css file, found in file `{fname}` at line `{line_no}` in folder `{folder_name}`:\n```html\n{line.strip()}\n```\n')

for dirName, subdirList, fileList in os.walk(rootDir):
    for fname in fileList:
        if fname.endswith('.liquid'):
            full_path = os.path.join(dirName, fname)
            print(f"Processing file {full_path}")
            with open(full_path, 'r', encoding='utf-8') as file:
                for line_no, line in enumerate(file, 1):
                    if img_pattern.search(line) is not None:
                        folder_name = os.path.basename(dirName)
                        img_matches.append((fname, line_no, folder_name, line.strip()))

# Write the report to a Markdown file
with open('SSO_Report.md', 'w') as f:
    f.write("# Lazy loaded Scripts\n")
    for match in matches:
        f.write(f'* Lazy Loaded script found in file `{match[0]}` at line `{match[1]}` in folder `{match[2]}`:\n```html\n{match[3]}\n```\n')

    f.write("# Lazy loaded Styles\n")
    for match in css_matches:
        f.write(match)

    f.write("# Lazy loaded `<img>` tags with class `opt_lazy` \n")
    if len(img_matches) > 0:
        for match in img_matches:
            f.write(f'* Lazy loaded image, found in file `{match[0]}` at line `{match[1]}` in folder` {match[2]}`:\n')
            f.write('```html\n')
            f.write(f'{match[3]}\n')
            f.write('```\n\n')
    else:
        f.write("No images were found.\n")

    f.write("# `<script>` tags with class `restructure`\n")
    if len(restructure_matches) > 0:
        for match in restructure_matches:
            f.write(f'* `<script>` tag with class `restructure`, found in file `{match[0]}` at line `{match[1]}` in folder `{match[2]}`:\n')
            f.write('```html\n')
            f.write(f'{match[3]}\n')
            f.write('```\n\n')
    else:
        f.write("No `<script>` tags with class `restructure` were found.\n")
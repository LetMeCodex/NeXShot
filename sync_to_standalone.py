import re

print("Reading CSS...")
with open("assets/css/site-enhancements.css", "r", encoding="utf-8") as f:
    css_content = f.read()

print("Reading JS...")
with open("assets/js/site-enhancements.js", "r", encoding="utf-8") as f:
    js_content = f.read()

print("Reading nexshot-standalone-v4.html...")
with open("nexshot-standalone-v4.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# Replace <style id="nx-site-enhancements">...</style>
style_start = '<style id="nx-site-enhancements">'
style_end = '</style>'
start_idx = html_content.find(style_start)
if start_idx != -1:
    end_idx = html_content.find(style_end, start_idx)
    if end_idx != -1:
        html_content = html_content[:start_idx + len(style_start)] + "\n" + css_content + "\n" + html_content[end_idx:]
        print("Replaced <style id='nx-site-enhancements'> successfully.")
    else:
        print("ERROR: style_end not found")
else:
    print("ERROR: style_start not found")

# Replace <script id="nx-site-animations">...</script>
script_start = '<script id="nx-site-animations">'
script_end = '</script>'
s_start_idx = html_content.find(script_start)
if s_start_idx != -1:
    s_end_idx = html_content.find(script_end, s_start_idx)
    if s_end_idx != -1:
        html_content = html_content[:s_start_idx + len(script_start)] + "\n" + js_content + "\n" + html_content[s_end_idx:]
        print("Replaced <script id='nx-site-animations'> successfully.")
    else:
        print("ERROR: script_end not found")
else:
    print("ERROR: script_start not found")

with open("nexshot-standalone-v4.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Saved nexshot-standalone-v4.html successfully!")

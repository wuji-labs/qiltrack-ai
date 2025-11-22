import json
from bs4 import BeautifulSoup
with open('helicone-doc.html','r',encoding='utf8') as f:
    html=f.read()
soup=BeautifulSoup(html,'html.parser')
code_blocks=[]
for code in soup.find_all('code'):
    text=code.get_text()
    if 'curl' in text or 'ChatCompletion' in text:
        if text not in code_blocks:
            code_blocks.append(text)
print('\n---BLOCK---\n'.join(code_blocks[:5]))

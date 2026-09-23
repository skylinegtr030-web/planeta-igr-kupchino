# Генерирует src/components/CompareScenes.astro — две нарисованные сцены для слайдера «у других / у нас».
import random
random.seed(7)
R=['#FF4D5E','#FF9F1C','#FFD600','#2EC4B6','#3A86FF','#8338EC']
FACE='<circle cx="-7" cy="-130" r="3" fill="#222"/><circle cx="7" cy="-130" r="3" fill="#222"/><path d="M-9 -118 q9 10 18 0" stroke="#222" stroke-width="3" fill="none"/>'
SAD='<circle cx="-6" cy="-124" r="2.5" fill="#1a1d25"/><circle cx="6" cy="-124" r="2.5" fill="#1a1d25"/><path d="M-6 -112 q6 -4 12 0" stroke="#1a1d25" stroke-width="2" fill="none"/>'
def kid(x,y,shirt,skin,hair,cls='',extra='',arms='up',scale=1):
    a = (f"<path d='M-20 -92 l-26 -30' stroke='{skin}' stroke-width='11' stroke-linecap='round'/><path d='M20 -92 l26 -30' stroke='{skin}' stroke-width='11' stroke-linecap='round'/>" if arms=='up'
         else f"<path d='M-20 -92 l-8 40' stroke='{skin}' stroke-width='11' stroke-linecap='round'/><path d='M20 -92 l8 40' stroke='{skin}' stroke-width='11' stroke-linecap='round'/>")
    return f'''<g transform="translate({x} {y}) scale({scale})"><g class="kid {cls}" style="transform-origin:0px 0px">
  <rect x="-14" y="-34" width="12" height="34" rx="6" fill="{shirt}"/><rect x="2" y="-34" width="12" height="34" rx="6" fill="{shirt}"/>
  <rect x="-22" y="-104" width="44" height="76" rx="20" fill="{shirt}"/>{a}
  <circle cx="0" cy="-128" r="24" fill="{skin}"/><path d="M-24 -134 a24 24 0 0 1 48 0 z" fill="{hair}"/>{extra}
</g></g>'''

G=['#2b2f3a','#353a47','#454b5a','#5a6172','#7a8194','#9aa1b3']
left=f'''<svg class="cmp-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#343946"/><stop offset="1" stop-color="#282c37"/></linearGradient></defs>
<rect width="1200" height="640" fill="url(#gWall)"/>
<rect y="520" width="1200" height="120" fill="{G[0]}"/><line x1="0" y1="520" x2="1200" y2="520" stroke="{G[2]}" stroke-width="2"/>
<g class="sway-slow" style="transform-origin:980px 90px">
<rect x="880" y="90" width="200" height="190" rx="6" fill="#20232d" stroke="{G[3]}" stroke-width="6"/>
<line x1="980" y1="96" x2="980" y2="274" stroke="{G[3]}" stroke-width="5"/><line x1="886" y1="185" x2="1074" y2="185" stroke="{G[3]}" stroke-width="5"/>
<path d="M905 150 q-18 -30 12 -34 q8 -26 40 -14 q28 -8 30 20 q22 8 4 28 z" fill="{G[4]}" opacity=".9"/>
<g class="rain">{''.join(f'<line x1="{x}" y1="160" x2="{x-4}" y2="176" stroke="{G[5]}" stroke-width="3" stroke-linecap="round" style="animation-delay:{d}s"/>' for x,d in [(910,0),(930,.5),(950,.2),(970,.8),(1000,.35),(1030,.65),(1055,.1)])}</g>
</g>
<g><circle cx="200" cy="150" r="50" fill="#20232d" stroke="{G[3]}" stroke-width="6"/>
<line x1="200" y1="150" x2="200" y2="118" stroke="{G[5]}" stroke-width="6" stroke-linecap="round"/><line x1="200" y1="150" x2="226" y2="150" stroke="{G[5]}" stroke-width="6" stroke-linecap="round"/>
<line class="tick" x1="200" y1="150" x2="200" y2="108" stroke="#c0c6d6" stroke-width="2" style="transform-origin:200px 150px"/><circle cx="200" cy="150" r="4" fill="#c0c6d6"/></g>
<g class="sway" style="transform-origin:620px 0px"><line x1="620" y1="0" x2="620" y2="150" stroke="{G[3]}" stroke-width="2"/><path d="M620 150 q-16 10 -14 32 q4 22 14 30 q10 -8 14 -30 q2 -22 -14 -32z" fill="{G[3]}"/><path d="M614 210 q6 12 -4 22" stroke="{G[3]}" stroke-width="3" fill="none"/></g>
<rect x="470" y="420" width="260" height="14" rx="4" fill="{G[2]}"/><rect x="490" y="434" width="12" height="86" fill="{G[1]}"/><rect x="698" y="434" width="12" height="86" fill="{G[1]}"/>
<rect x="560" y="376" width="80" height="44" rx="8" fill="{G[3]}"/><rect x="570" y="362" width="60" height="16" rx="6" fill="{G[2]}"/>
<rect x="598" y="336" width="5" height="28" fill="{G[5]}"/><path class="smoke" d="M600 332 q6 -10 0 -20 q-6 -10 0 -20" stroke="{G[4]}" stroke-width="2" fill="none" style="transform-origin:600px 332px"/>
{kid(340,520,G[3],G[4],G[2],'breath',SAD,arms='down')}
{kid(1000,520,G[2],G[4],G[3],'breath d2',SAD,arms='down',scale=.95)}
<g class="breath d1" style="transform-origin:800px 520px"><rect x="760" y="438" width="80" height="60" rx="18" fill="{G[3]}"/><rect x="748" y="486" width="46" height="14" rx="7" fill="{G[4]}"/><rect x="806" y="486" width="46" height="14" rx="7" fill="{G[4]}"/><circle cx="800" cy="420" r="24" fill="{G[4]}"/><path d="M776 414 a24 24 0 0 1 48 0 z" fill="{G[2]}"/><circle cx="792" cy="424" r="2.5" fill="#1a1d25"/><circle cx="808" cy="424" r="2.5" fill="#1a1d25"/><path d="M792 436 q8 -5 16 0" stroke="#1a1d25" stroke-width="2" fill="none"/></g>
<g class="zzz" style="transform-origin:840px 380px"><text x="836" y="400" font-family="var(--f-display)" font-weight="800" font-size="22" fill="{G[5]}">z</text><text x="852" y="382" font-family="var(--f-display)" font-weight="800" font-size="18" fill="{G[4]}">z</text></g>
<ellipse cx="600" cy="600" rx="380" ry="26" fill="#1c1f28" opacity=".6"/>
</svg>'''

skins=['#F8C9A0','#E0A777','#8D5A3B','#F2B48C','#C68642','#FAD2B0']
hairs=['#3B2A20','#F2B134','#1a1a1a','#B5482B','#4A2C1A','#2E2E2E']
kids=''.join(kid(x,520,R[i],skins[i],hairs[i],f'jump j{i}',FACE) for i,x in enumerate([600,690,780,870]))
balloons=''.join(f'<g class="bal" style="animation-delay:{d}s;animation-duration:{du}s"><g class="sway" style="transform-origin:{x}px 520px;animation-delay:{d/2}s"><line x1="{x}" y1="520" x2="{x}" y2="600" stroke="#fff" stroke-width="2" opacity=".8"/><ellipse cx="{x}" cy="486" rx="30" ry="38" fill="{c}"/><path d="M{x-6} 522 l6 -8 l6 8z" fill="{c}"/><ellipse cx="{x-10}" cy="470" rx="6" ry="12" fill="#fff" opacity=".45" transform="rotate(-20 {x-10} 470)"/></g></g>' for x,d,du,c in [(90,0,9,R[0]),(170,-3,10,R[3]),(1080,-5,8.5,R[4]),(1140,-1.5,9.5,R[2]),(300,-7,11,R[5]),(960,-4,10.5,R[1])])
conf=''.join(f'<rect class="cf" x="{random.randint(20,1180)}" y="-20" width="{random.choice([8,10,12])}" height="{random.choice([8,14,16])}" rx="2" fill="{random.choice(R)}" style="animation-duration:{random.uniform(4.5,8):.1f}s;animation-delay:{-random.uniform(0,8):.1f}s"/>' for _ in range(26))
stars=''.join(f'<path class="star" d="M{x} {y-14} l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="#fff" style="transform-origin:{x}px {y}px;animation-delay:{d}s"/>' for x,y,d in [(120,80,0),(260,150,.7),(1100,120,1.3),(980,60,.4),(380,60,1.9),(860,160,1.1),(60,260,1.6),(1150,300,.9)])
beams=''.join(f'<polygon points="600,80 {600+dx-120},640 {600+dx+120},640" fill="{c}" opacity=".16"/>' for dx,c in [(-420,R[0]),(-140,R[2]),(140,R[3]),(420,R[4])])
CX=440
flames=''.join(f'<g><rect x="{x-3}" y="300" width="6" height="34" fill="{c}"/><ellipse class="flame" cx="{x}" cy="292" rx="7" ry="12" fill="#FFB800" style="transform-origin:{x}px 300px;animation-delay:{d}s"/><ellipse cx="{x}" cy="296" rx="3" ry="6" fill="#FFF4C2"/></g>' for x,c,d in [(CX-50,R[0],0),(CX-25,R[3],.3),(CX,R[4],.15),(CX+25,R[5],.45),(CX+50,R[1],.6)])
SLIDE='M70 220 C 90 380, 170 470, 270 512'
right=f'''<svg class="cmp-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset="1" stop-color="#FFD1DC"/></linearGradient>
<pattern id="disco" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#dfe6f5"/><rect width="9" height="9" fill="#f7f9ff"/></pattern></defs>
<rect width="1200" height="640" fill="url(#gSky)"/>
<g class="rainbow" style="transform-origin:600px 640px">{''.join(f'<circle cx="600" cy="640" r="{600-i*22}" fill="none" stroke="{c}" stroke-width="20" opacity=".55"/>' for i,c in enumerate(R))}</g>
<g class="beams" style="transform-origin:600px 80px">{beams}</g>
<rect y="520" width="1200" height="120" fill="#5D3FD3"/><rect y="520" width="1200" height="8" fill="#7B5CF0"/>
{''.join(f'<rect x="{i*150}" y="560" width="75" height="80" fill="#6B4CE0" opacity=".6"/>' for i in range(8))}
<g class="disco" style="transform-origin:600px 70px"><line x1="600" y1="0" x2="600" y2="30" stroke="#333" stroke-width="3"/><circle cx="600" cy="70" r="40" fill="url(#disco)" stroke="#fff" stroke-width="3"/></g>
{stars}
<path d="M70 210 L70 500" stroke="#FF9F1C" stroke-width="18" stroke-linecap="round"/><path d="{SLIDE}" stroke="#FFD600" stroke-width="28" fill="none" stroke-linecap="round"/><path d="{SLIDE}" stroke="#FF9F1C" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>
<g class="slider" style="offset-path:path('{SLIDE}')"><g transform="translate(0 -60) scale(.7)">{kid(0,0,R[4],skins[3],hairs[1],'',FACE)}</g></g>
<ellipse cx="1020" cy="518" rx="110" ry="16" fill="#222"/><ellipse cx="1020" cy="512" rx="96" ry="10" fill="#3A86FF"/><line x1="930" y1="524" x2="920" y2="600" stroke="#222" stroke-width="8"/><line x1="1110" y1="524" x2="1120" y2="600" stroke="#222" stroke-width="8"/>
{kid(1020,512,R[5],skins[5],hairs[2],'bounce',FACE,scale=.9)}
<rect x="{CX-110}" y="440" width="220" height="14" rx="4" fill="#fff"/><rect x="{CX-90}" y="454" width="10" height="66" fill="#ddd"/><rect x="{CX+80}" y="454" width="10" height="66" fill="#ddd"/>
<rect x="{CX-80}" y="400" width="160" height="42" rx="10" fill="#FF6F91"/><rect x="{CX-65}" y="366" width="130" height="38" rx="10" fill="#FFF1B8"/><rect x="{CX-50}" y="334" width="100" height="34" rx="10" fill="#2EC4B6"/>
<path d="M{CX-80} 412 q10 -12 20 0 q10 12 20 0 q10 -12 20 0 q10 12 20 0 q10 -12 20 0 q10 12 20 0 q10 -12 20 0 q10 12 20 0" stroke="#fff" stroke-width="5" fill="none"/>
{flames}
{kids}
<g class="ura" style="transform-origin:300px 200px"><path d="M240 150 h130 a16 16 0 0 1 16 16 v50 a16 16 0 0 1 -16 16 h-70 l-24 24 v-24 h-36 a16 16 0 0 1 -16 -16 v-50 a16 16 0 0 1 16 -16z" fill="#fff"/><text x="256" y="204" font-family="var(--f-display)" font-weight="800" font-size="34" fill="#FF4D5E">УРА!</text></g>
{balloons}
{conf}
</svg>'''
open('src/components/CompareScenes.astro','w').write(f'''---
// Сгенерировано scripts/gen-compare.py — две нарисованные сцены для слайдера «у других / у нас». Всё анимируется CSS.
---
<div class="cmp-side cmp-other" id="cmpA">{left}</div>
<div class="cmp-side cmp-ours" id="cmpB">{right}</div>
''')
print('ok')

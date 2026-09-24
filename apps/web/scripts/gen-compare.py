# Генерирует src/components/CompareScenes.astro — две нарисованные сцены для слайдера «у других / у нас».
# Справа — наши услуги (тесла-шоу, крио-шоу, мыльные пузыри и аниматоры, аквагрим, пиньята, банкет, скалодром, батут).
import random
random.seed(11)
R=['#FF4D5E','#FF9F1C','#FFD600','#2EC4B6','#3A86FF','#8338EC']

def label(x,y,text,dark=False,cls='lbl'):
    w=len(text)*8.6+22
    bg,fg=('#2b2f3a','#c9cfdd') if dark else ('#ffffff','#1b1e3a')
    return f'<g class="{cls}"><rect x="{x-w/2:.0f}" y="{y-13}" width="{w:.0f}" height="26" rx="13" fill="{bg}" opacity=".94"/><text x="{x}" y="{y+4.5}" text-anchor="middle" font-family="var(--f-mono)" font-weight="700" font-size="12" letter-spacing="1.2" fill="{fg}">{text.upper()}</text></g>'

def person(x,y,s=1,shirt='#3A86FF',pants='#2b2f3a',skin='#F2B48C',hair='#3B2A20',pose='up',face='smile',cls='',extra='',hairstyle='cap',shoes='#222',h=1.0,sit=False,sleeves='short',mood='happy'):
    """Персонаж: ноги на (0,0), рост ~165 (ребёнок). h>1 — взрослый (длиннее ноги и торс, голова та же)."""
    dk='rgba(0,0,0,.16)'; lt='rgba(255,255,255,.22)'
    L=int(48*h); T=int(52*h)            # длина ног и торса
    hip=-L; sh=hip-T                    # линия бёдер и плеч
    neck=sh-4; hy=neck-26               # шея, центр головы
    arm_col = skin if sleeves=='short' else shirt
    def arm(S,E,H,item=''):
        return (f"<path d='M{S[0]} {S[1]} L{E[0]} {E[1]} L{H[0]} {H[1]}' stroke='{arm_col}' stroke-width='11' stroke-linecap='round' stroke-linejoin='round' fill='none'/>"
                f"<circle cx='{H[0]}' cy='{H[1]}' r='6.5' fill='{skin}'/>"
                + (f"<circle cx='{S[0]}' cy='{S[1]}' r='10' fill='{shirt}'/>" if sleeves=='short' else '') + item)
    R=(24,sh+4); Lp=(-24,sh+4)
    if pose=='up':    arms=arm(Lp,(-40,sh-18),(-48,sh-48))+arm(R,(40,sh-18),(48,sh-48))
    elif pose=='down':arms=arm(Lp,(-30,sh+26),(-32,sh+50))+arm(R,(30,sh+26),(32,sh+50))
    elif pose=='wave':arms=arm(Lp,(-30,sh+26),(-32,sh+50))+arm(R,(44,sh-14),(50,sh-46))
    elif pose=='right':arms=arm(Lp,(-30,sh+26),(-32,sh+50))+f"<g class='arm' style='transform-origin:24px {sh+4}px'>"+arm(R,(54,sh+2),(84,sh-8),extra)+"</g>"; extra=''
    elif pose=='hold':arms=arm(Lp,(-34,sh+22),(-10,sh+30))+arm(R,(34,sh+22),(10,sh+30))
    elif pose=='phone':arms=arm(Lp,(-30,sh+26),(-32,sh+50))+arm(R,(38,sh+22),(22,sh+18),f"<rect x='14' y='{sh+2}' width='16' height='26' rx='3' fill='#111'/><rect class='glow' x='16' y='{sh+4}' width='12' height='20' rx='2' fill='#9fb7ff'/>")
    else: arms=''
    if not sit:
        legs=(f"<rect x='-19' y='{hip}' width='16' height='{L+2}' rx='7' fill='{pants}'/><rect x='3' y='{hip}' width='16' height='{L+2}' rx='7' fill='{pants}'/>"
              f"<rect x='-18' y='-14' width='14' height='8' fill='#fff' opacity='.85'/><rect x='4' y='-14' width='14' height='8' fill='#fff' opacity='.85'/>"
              f"<path d='M-22 -2 q0 -6 6 -6 h10 q4 0 4 6 v3 h-22 q-2 0 -2 -3z' fill='{shoes}'/><path d='M2 -6 h10 q6 0 6 6 v3 h-20 v-3 q0 -6 4 -6z' fill='{shoes}'/>")
    else:
        legs=(f"<rect x='-20' y='{hip}' width='17' height='36' rx='8' fill='{pants}'/><rect x='3' y='{hip}' width='17' height='36' rx='8' fill='{pants}'/>"
              f"<rect x='-22' y='{hip+30}' width='20' height='14' rx='6' fill='{shoes}'/><rect x='2' y='{hip+30}' width='20' height='14' rx='6' fill='{shoes}'/>")
    torso=(f"<path d='M-27 {sh+6} q0 -8 8 -8 h38 q8 0 8 8 l-3 {T-4} q0 6 -6 6 h-36 q-6 0 -6 -6z' fill='{shirt}'/>"
           f"<path d='M12 {sh-2} h7 q8 0 8 8 l-3 {T-4} q0 6 -6 6 h-6z' fill='{dk}'/>"
           f"<path d='M-10 {sh-1} q10 10 20 0' stroke='{lt}' stroke-width='4' fill='none' stroke-linecap='round'/>"
           f"<rect x='-24' y='{hip-6}' width='48' height='10' rx='4' fill='{pants}'/>")
    head=f"<circle cx='-23' cy='{hy+2}' r='4.5' fill='{skin}'/><circle cx='23' cy='{hy+2}' r='4.5' fill='{skin}'/><circle cx='0' cy='{hy}' r='25' fill='{skin}'/>"
    hb={'long':f"<path d='M-29 {hy} a29 29 0 0 1 58 0 v38 q-10 -8 -16 -14 q-13 8 -26 0 q-6 6 -16 14z' fill='{hair}'/>",
        'curly':f"<circle cx='-22' cy='{hy-14}' r='11' fill='{hair}'/><circle cx='22' cy='{hy-14}' r='11' fill='{hair}'/><circle cx='-28' cy='{hy+2}' r='9' fill='{hair}'/><circle cx='28' cy='{hy+2}' r='9' fill='{hair}'/>"}.get(hairstyle,'')
    cap=f"<path d='M-25 {hy-2} a25 25 0 0 1 50 0 q-6 -6 -12 -1 q-5 -7 -11 -1 q-6 -6 -12 -1 q-8 -6 -15 3z' fill='{hair}'/>"
    hf={'cap':cap+f"<path d='M-18 {hy-20} q10 -8 24 -2' stroke='{lt}' stroke-width='3' fill='none' stroke-linecap='round'/>",
        'long':f"<path d='M-25 {hy-2} a25 25 0 0 1 50 0 q-6 -8 -14 -3 q-8 -8 -16 0 q-8 -6 -20 3z' fill='{hair}'/>",
        'bun':f"<path d='M-25 {hy-2} a25 25 0 0 1 50 0 q-8 -6 -16 -2 q-9 -6 -18 0 q-8 -4 -16 2z' fill='{hair}'/><circle cx='0' cy='{hy-31}' r='10' fill='{hair}'/>",
        'curly':f"<path d='M-26 {hy-4} a26 26 0 0 1 52 0 q-6 -4 -12 -2 q-7 -6 -14 -1 q-7 -5 -14 -1 q-6 -3 -12 4z' fill='{hair}'/><circle cx='-14' cy='{hy-24}' r='9' fill='{hair}'/><circle cx='4' cy='{hy-27}' r='9' fill='{hair}'/><circle cx='18' cy='{hy-22}' r='8' fill='{hair}'/>",
        'clown':f"<circle cx='-30' cy='{hy-4}' r='13' fill='{hair}'/><circle cx='30' cy='{hy-4}' r='13' fill='{hair}'/><circle cx='-24' cy='{hy-18}' r='10' fill='{hair}'/><circle cx='24' cy='{hy-18}' r='10' fill='{hair}'/>",
        'goggles':cap+f"<rect x='-22' y='{hy-24}' width='44' height='10' rx='5' fill='#1b1e3a'/><circle cx='-10' cy='{hy-19}' r='6' fill='#7fd1ff' stroke='#1b1e3a' stroke-width='2'/><circle cx='10' cy='{hy-19}' r='6' fill='#7fd1ff' stroke='#1b1e3a' stroke-width='2'/>"}[hairstyle]
    ey=hy-2; pc='#2a1f5e' if mood=='happy' else '#2a2f3a'
    eyes=(f"<ellipse cx='-9' cy='{ey}' rx='4.5' ry='5.5' fill='#fff'/><ellipse cx='9' cy='{ey}' rx='4.5' ry='5.5' fill='#fff'/>"
          f"<circle cx='-8' cy='{ey+1}' r='2.7' fill='{pc}'/><circle cx='8' cy='{ey+1}' r='2.7' fill='{pc}'/><circle cx='-7' cy='{ey-.5}' r='1' fill='#fff'/><circle cx='9' cy='{ey-.5}' r='1' fill='#fff'/>")
    brows = (f"<path d='M-14 {ey-9} q5 -3 10 -1' stroke='{hair}' stroke-width='2.2' fill='none' stroke-linecap='round'/><path d='M4 {ey-10} q5 -2 10 1' stroke='{hair}' stroke-width='2.2' fill='none' stroke-linecap='round'/>" if mood=='happy'
             else f"<path d='M-14 {ey-11} l10 3' stroke='{hair}' stroke-width='2.2' stroke-linecap='round'/><path d='M14 {ey-11} l-10 3' stroke='{hair}' stroke-width='2.2' stroke-linecap='round'/>")
    nose=f"<path d='M-2 {ey+8} q2 3 4 0' stroke='rgba(0,0,0,.25)' stroke-width='1.8' fill='none' stroke-linecap='round'/>"
    cheeks=f"<circle cx='-16' cy='{ey+9}' r='4' fill='#ff8fa3' opacity='.5'/><circle cx='16' cy='{ey+9}' r='4' fill='#ff8fa3' opacity='.5'/>" if mood=='happy' else ''
    mouths={'smile':f"<path d='M-8 {ey+13} q8 9 16 0 z' fill='#7a2e3a'/><path d='M-6 {ey+13.5} h12 v2 h-12z' fill='#fff'/>",
            'sad':f"<path d='M-6 {ey+16} q6 -5 12 0' stroke='#3a3f4c' stroke-width='2.5' fill='none' stroke-linecap='round'/>",
            'wow':f"<ellipse cx='0' cy='{ey+15}' rx='5' ry='6' fill='#7a2e3a'/><ellipse cx='0' cy='{ey+17}' rx='3' ry='2' fill='#ff8fa3'/>",
            'butterfly':f"<path d='M-9 {ey} q-14 -14 -18 0 q4 14 18 0 q14 -14 18 0 q-4 14 -18 0z' fill='#8338EC' opacity='.75'/><path d='M-9 {ey+9} q-10 -6 -14 4 q6 8 14 -4 q8 12 14 4 q-4 -10 -14 -4z' fill='#2EC4B6' opacity='.75'/><path d='M-8 {ey+13} q8 9 16 0 z' fill='#7a2e3a'/>",
            'clown':f"<circle cx='0' cy='{ey+8}' r='6' fill='#FF4D5E'/><path d='M-12 {ey+13} q12 12 24 0 z' fill='#c1121f'/><path d='M-9 {ey+13.5} h18 v2.5 h-18z' fill='#fff'/>",
            'goggles':f"<path d='M-8 {ey+13} q8 9 16 0 z' fill='#7a2e3a'/><path d='M-6 {ey+13.5} h12 v2 h-12z' fill='#fff'/>"}
    fc=eyes+brows+nose+cheeks+mouths[face]
    return (f'<g transform="translate({x} {y}) scale({s})"><g class="fig {cls}" style="transform-origin:0px 0px">'
            f'<ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity=".18"/>{legs}{torso}{arms}'
            f'<rect x="-6" y="{neck-2}" width="12" height="14" rx="3" fill="{skin}"/>{hb}{head}{hf}{fc}{extra}</g></g>')

# ───────── ЛЕВАЯ СЦЕНА: скучный праздник дома ─────────
G=['#232733','#2e3340','#3c4252','#4f566a','#6b7387','#8b93a7','#aab1c4']
left=f'''<svg class="cmp-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#353a48"/><stop offset="1" stop-color="#262a35"/></linearGradient>
<linearGradient id="gFloorL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2e3a"/><stop offset="1" stop-color="#1d2029"/></linearGradient>
<radialGradient id="gLamp" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#8b93a7" stop-opacity=".22"/><stop offset="1" stop-color="#8b93a7" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="640" fill="url(#gWall)"/>
<rect y="470" width="1200" height="170" fill="url(#gFloorL)"/><line x1="0" y1="470" x2="1200" y2="470" stroke="{G[2]}" stroke-width="3"/>
{''.join(f'<line x1="{x}" y1="470" x2="{600+(x-600)*1.6:.0f}" y2="640" stroke="{G[1]}" stroke-width="1"/>' for x in range(0,1201,150))}
<!-- лампа -->
<line x1="600" y1="0" x2="600" y2="70" stroke="{G[2]}" stroke-width="3"/><path d="M560 110 l40 -40 l40 40z" fill="{G[3]}"/><path d="M560 110 L400 470 L800 470 L640 110z" fill="url(#gLamp)"/>
<!-- окно -->
<g class="sway-slow" style="transform-origin:1010px 90px">
<rect x="900" y="80" width="220" height="210" rx="6" fill="#181b23" stroke="{G[3]}" stroke-width="8"/>
<line x1="1010" y1="86" x2="1010" y2="284" stroke="{G[3]}" stroke-width="6"/><line x1="906" y1="185" x2="1114" y2="185" stroke="{G[3]}" stroke-width="6"/>
<path d="M930 145 q-20 -32 14 -36 q10 -28 44 -14 q30 -8 32 22 q24 8 4 30z" fill="{G[4]}" opacity=".9"/>
<g class="rain">{''.join(f'<line x1="{x}" y1="160" x2="{x-4}" y2="178" stroke="{G[5]}" stroke-width="3" stroke-linecap="round" style="animation-delay:{d}s"/>' for x,d in [(930,0),(950,.5),(972,.2),(994,.8),(1020,.35),(1050,.65),(1080,.1),(1100,.9)])}</g>
<rect x="890" y="288" width="240" height="12" rx="3" fill="{G[3]}"/>
</g>
<!-- часы -->
<g><circle cx="200" cy="130" r="52" fill="#1b1e26" stroke="{G[3]}" stroke-width="7"/>
{''.join(f'<line x1="200" y1="88" x2="200" y2="96" stroke="{G[4]}" stroke-width="3" transform="rotate({a} 200 130)"/>' for a in range(0,360,30))}
<line x1="200" y1="130" x2="200" y2="100" stroke="{G[6]}" stroke-width="6" stroke-linecap="round"/><line x1="200" y1="130" x2="228" y2="130" stroke="{G[6]}" stroke-width="6" stroke-linecap="round"/>
<line class="tick" x1="200" y1="138" x2="200" y2="90" stroke="#c9cfdd" stroke-width="2" style="transform-origin:200px 130px"/><circle cx="200" cy="130" r="4" fill="#c9cfdd"/></g>
<!-- телевизор с помехами -->
<rect x="60" y="250" width="240" height="150" rx="8" fill="#141720" stroke="{G[3]}" stroke-width="8"/>
<rect class="tvnoise" x="70" y="260" width="220" height="130" fill="{G[4]}" opacity=".35"/>
{''.join(f'<rect class="tvline" x="70" y="{y}" width="220" height="3" fill="{G[6]}" opacity=".25" style="animation-delay:{d}s"/>' for y,d in [(280,0),(320,.7),(360,1.3)])}
<rect x="150" y="400" width="60" height="16" fill="{G[2]}"/><rect x="110" y="416" width="140" height="8" rx="4" fill="{G[3]}"/>
{label(180,450,'телевизор',True)}
<!-- диван -->
<rect x="360" y="380" width="380" height="90" rx="14" fill="{G[2]}"/><rect x="380" y="330" width="340" height="70" rx="12" fill="{G[3]}"/><rect x="360" y="330" width="40" height="140" rx="14" fill="{G[2]}"/><rect x="700" y="330" width="40" height="140" rx="14" fill="{G[2]}"/>
<rect x="400" y="400" width="150" height="14" rx="5" fill="{G[1]}" opacity=".6"/><rect x="560" y="400" width="150" height="14" rx="5" fill="{G[1]}" opacity=".6"/>
<!-- дети на диване -->
{person(470,470,.95,G[3],G[2],'#cfc3bb',G[1],pose='phone',face='sad',cls='breath',hairstyle='cap',sit=True,mood='sad')}
{person(630,470,.95,G[4],G[2],'#cfc3bb',G[1],pose='down',face='sad',cls='breath d2',hairstyle='long',sit=True,mood='sad')}
<g class="zzz" style="transform-origin:680px 330px"><text x="676" y="340" font-family="var(--f-display)" font-weight="800" font-size="22" fill="{G[6]}">z</text><text x="694" y="322" font-family="var(--f-display)" font-weight="800" font-size="17" fill="{G[5]}">z</text></g>
{label(550,500,'диван',True)}
<!-- сдувшийся шарик -->
<g class="sway" style="transform-origin:800px 0px"><line x1="800" y1="0" x2="800" y2="200" stroke="{G[4]}" stroke-width="2"/><path d="M800 200 q-18 12 -16 36 q4 24 16 34 q12 -10 16 -34 q2 -24 -16 -36z" fill="{G[4]}"/><path d="M794 268 q8 12 -4 24" stroke="{G[4]}" stroke-width="3" fill="none"/></g>
{label(800,330,'1 шарик',True)}
<!-- журнальный стол и торт из магазина -->
<rect x="820" y="440" width="220" height="14" rx="4" fill="{G[3]}"/><rect x="836" y="454" width="10" height="70" fill="{G[2]}"/><rect x="1014" y="454" width="10" height="70" fill="{G[2]}"/>
<rect x="880" y="392" width="100" height="48" rx="8" fill="{G[4]}"/><path d="M880 410 h100" stroke="{G[3]}" stroke-width="3"/><path d="M955 392 l25 0 l0 48 l-25 0z" fill="{G[3]}"/>
<rect x="912" y="362" width="5" height="30" fill="{G[6]}"/><path class="smoke" d="M914 358 q6 -10 0 -20 q-6 -10 0 -20" stroke="{G[5]}" stroke-width="2" fill="none" style="transform-origin:914px 358px"/>
<rect x="990" y="420" width="30" height="20" rx="3" fill="{G[3]}"/>
{label(930,480,'торт из магазина',True)}
<!-- скучающий взрослый с телефоном -->
{person(1120,470,1.02,G[3],G[1],'#cfc3bb',G[1],pose='phone',face='sad',cls='breath d1',hairstyle='cap',h=1.3,mood='sad',sleeves='long')}
<ellipse cx="600" cy="600" rx="420" ry="24" fill="#000" opacity=".25"/>
</svg>'''

# ───────── ПРАВАЯ СЦЕНА: наш праздник ─────────
skins=['#F8C9A0','#E0A777','#8D5A3B','#F2B48C','#C68642','#FAD2B0']
hairs=['#3B2A20','#F2B134','#1a1a1a','#B5482B','#4A2C1A','#2E2E2E']
garland=''.join(f'<g><line x1="{x}" y1="{28+18*abs(((i%6)-3))/3:.0f}" x2="{x}" y2="{40+18*abs(((i%6)-3))/3:.0f}" stroke="#333" stroke-width="2"/><circle class="bulb" cx="{x}" cy="{46+18*abs(((i%6)-3))/3:.0f}" r="7" fill="{R[i%6]}" style="animation-delay:{(i%5)*.3:.1f}s"/></g>' for i,x in enumerate(range(30,1200,58)))
bubbles=''.join(f'<circle class="bubble" cx="{x}" cy="{y}" r="{r}" fill="url(#gBubble)" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" style="animation-delay:{d}s;animation-duration:{du}s"/>' for x,y,r,d,du in [(690,330,22,0,5),(730,300,34,-1.5,6),(660,280,16,-3,5.5),(760,340,26,-4,6.5),(710,260,44,-2.2,7),(640,320,12,-0.8,5)])
fogs=''.join(f'<ellipse class="fog" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#fff" style="animation-delay:{d}s"/>' for x,y,rx,ry,d in [(480,392,40,18,0),(455,398,32,14,-1),(510,400,36,16,-2),(490,384,28,12,-.5),(440,402,26,12,-1.6),(530,404,30,12,-2.4)])
bolts=''.join(f'<path class="bolt" d="{d}" stroke="#7fd1ff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:{dl}s"/>' for d,dl in [('M310 300 l-18 -30 l14 -8 l-22 -34 l8 -2 l-14 -26',0),('M310 300 l22 -26 l-10 -12 l26 -30 l-6 -6 l20 -24',.35),('M310 300 l4 -40 l-12 -6 l10 -40',.7),('M310 300 l-30 -14 l6 -14 l-34 -14',1.05)])
conf=''.join(f'<rect class="cf" x="{random.randint(20,1180)}" y="-20" width="{random.choice([7,9,11])}" height="{random.choice([8,13,16])}" rx="2" fill="{random.choice(R)}" style="animation-duration:{random.uniform(5,9):.1f}s;animation-delay:{-random.uniform(0,9):.1f}s"/>' for _ in range(22))
holds=''.join(f'<circle cx="{random.randint(60,190)}" cy="{random.randint(130,500)}" r="{random.choice([6,7,9])}" fill="{random.choice(R)}"/>' for _ in range(22))
CX=1120
flames=''.join(f'<g><rect x="{x-2.5}" y="372" width="5" height="28" fill="{c}"/><ellipse class="flame" cx="{x}" cy="366" rx="6" ry="10" fill="#FFB800" style="transform-origin:{x}px 372px;animation-delay:{d}s"/><ellipse cx="{x}" cy="369" rx="2.5" ry="5" fill="#FFF4C2"/></g>' for x,c,d in [(CX-36,R[0],0),(CX-18,R[3],.3),(CX,R[4],.15),(CX+18,R[5],.45),(CX+36,R[1],.6)])
bokeh=''.join(f'<circle class="bokeh" cx="{random.randint(40,1160)}" cy="{random.randint(40,460)}" r="{random.choice([26,34,44,58])}" fill="{random.choice(R)}" opacity=".3" filter="url(#softGlow)" style="animation-duration:{random.uniform(7,13):.1f}s;animation-delay:{-random.uniform(0,10):.1f}s"/>' for _ in range(14))
sparks=''.join(f'<path class="star" d="M{x} {y-10} l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#fff" style="transform-origin:{x}px {y}px;animation-delay:{random.uniform(0,2):.1f}s;animation-duration:{random.uniform(1.4,2.6):.1f}s"/>' for x,y in [(random.randint(30,1170),random.randint(30,440)) for _ in range(18)])
right=f'''<svg class="cmp-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6C9"/><stop offset="1" stop-color="#FFE0E8"/></linearGradient>
<linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6B4CE0"/><stop offset="1" stop-color="#4A2FB8"/></linearGradient>
<radialGradient id="gBubble" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#bfe9ff" stop-opacity=".35"/><stop offset=".8" stop-color="#ffb3f0" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></radialGradient>
<radialGradient id="gBal" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="gCoil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5a2e"/><stop offset=".5" stop-color="#e0a94f"/><stop offset="1" stop-color="#7a5a2e"/></linearGradient>
<pattern id="disco" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#d5dcf0"/><rect width="8" height="8" fill="#f7f9ff"/></pattern>
<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
{bokeh}
{sparks}
<g class="beams" style="transform-origin:600px 80px">{''.join(f'<polygon points="600,80 {600+dx-110},640 {600+dx+110},640" fill="{c}" opacity=".13"/>' for dx,c in [(-420,R[0]),(-140,R[2]),(140,R[3]),(420,R[4])])}</g>
<!-- пол -->
<rect y="470" width="1200" height="170" fill="url(#gFloor)"/><rect y="470" width="1200" height="6" fill="#8f76ff"/>
{''.join(f'<line x1="{x}" y1="470" x2="{600+(x-600)*1.6:.0f}" y2="640" stroke="#fff" stroke-opacity=".08" stroke-width="1"/>' for x in range(0,1201,150))}
<!-- гирлянда -->
<path d="M0 20 {' '.join(f'Q {x+29} {60 if (i%2==0) else 10} {x+58} 20' for i,x in enumerate(range(0,1200,58)))}" stroke="#333" stroke-width="2" fill="none"/>{garland}
<!-- зеркальный шар -->
<g class="disco" style="transform-origin:600px 60px"><line x1="600" y1="0" x2="600" y2="30" stroke="#333" stroke-width="3"/><circle cx="600" cy="68" r="38" fill="url(#disco)" stroke="#fff" stroke-width="3"/><circle cx="600" cy="68" r="38" fill="url(#gBal)"/></g>
<!-- скалодром -->
<rect x="40" y="110" width="170" height="360" rx="10" fill="#2b2f3a"/><rect x="48" y="118" width="154" height="344" rx="8" fill="#39404f"/>{holds}
<g transform="translate(125 400)"><g class="climb" style="transform-origin:0px 0px">{person(0,0,.62,R[2],'#2b2f3a',skins[1],hairs[0],pose='up',face='smile',hairstyle='curly')}</g></g>
{label(125,505,'скалодром')}
<!-- тесла-шоу -->
<rect x="270" y="400" width="80" height="70" rx="8" fill="#2b2f3a"/><rect x="292" y="300" width="36" height="100" rx="6" fill="url(#gCoil)"/>{''.join(f'<rect x="290" y="{y}" width="40" height="4" fill="#5a3f1c" opacity=".6"/>' for y in range(310,400,12))}
<ellipse cx="310" cy="300" rx="34" ry="12" fill="#c9d3ea"/><ellipse cx="310" cy="296" rx="26" ry="8" fill="#eef2ff"/>
<circle class="spark" cx="310" cy="298" r="18" fill="#7fd1ff" filter="url(#softGlow)"/>{bolts}
{person(400,470,.78,'#1b1e3a','#2b2f3a',skins[0],hairs[3],pose='right',face='goggles',hairstyle='goggles',h=1.3,sleeves='long',extra="<path d='M84 -137 l0 -60' stroke='#c9d3ea' stroke-width='5' stroke-linecap='round'/><circle cx='84' cy='-201' r='7' fill='#7fd1ff'/>")}
{label(330,505,'тесла-шоу')}
<!-- крио-шоу -->
<rect x="440" y="410" width="120" height="60" rx="8" fill="#fff"/><rect x="440" y="410" width="120" height="10" fill="#e4e8f5"/>
<path d="M455 410 q0 -30 35 -30 q35 0 35 30z" fill="#8f9bb8"/><ellipse cx="490" cy="380" rx="35" ry="8" fill="#3d4a6b"/>
{fogs}
{person(590,470,.8,'#f2f4f8','#2b2f3a',skins[2],hairs[2],pose='hold',face='goggles',hairstyle='goggles',h=1.3,sleeves='long',extra="<rect x='-16' y='-112' width='32' height='36' rx='6' fill='#3A86FF'/><rect x='-8' y='-120' width='16' height='10' rx='3' fill='#1b1e3a'/>")}
{label(500,505,'крио-шоу')}
<!-- аниматор и мыльные пузыри -->
{person(700,470,.9,R[0],'#FFD600',skins[3],'#FF9F1C',pose='right',face='clown',hairstyle='clown',h=1.3,sleeves='long',extra="<g class='wand' style='transform-origin:84px -137px'><path d='M84 -137 l40 -60' stroke='#3A86FF' stroke-width='5' stroke-linecap='round'/><circle cx='128' cy='-201' r='16' fill='none' stroke='#3A86FF' stroke-width='5'/></g>")}
{bubbles}
{label(720,505,'мыльные пузыри')}
<!-- аквагрим -->
<rect x="780" y="430" width="50" height="40" rx="6" fill="#FF9F1C"/><rect x="786" y="440" width="38" height="6" fill="#c1121f" opacity=".3"/>
{person(805,432,.62,R[3],'#3A86FF',skins[5],hairs[1],pose='down',face='butterfly',hairstyle='long')}
<g transform="translate(1780 0) scale(-1 1)">{person(890,470,.8,R[5],'#2b2f3a',skins[4],hairs[4],pose='right',face='smile',hairstyle='bun',h=1.3,sleeves='long',extra="<g class='brush' style='transform-origin:84px -137px'><path d='M84 -137 l-20 -22' stroke='#8d5a3b' stroke-width='4' stroke-linecap='round'/><path d='M64 -159 l-6 -8' stroke='#8338EC' stroke-width='6' stroke-linecap='round'/></g>")}</g>
{label(845,505,'аквагрим')}
<!-- пиньята -->
<g class="pinata" style="transform-origin:960px 0px" transform="translate(-50 0)"><line x1="1010" y1="0" x2="1010" y2="130" stroke="#333" stroke-width="2"/>
<path d="M1010 130 l20 40 l44 6 l-32 30 l8 44 l-40 -20 l-40 20 l8 -44 l-32 -30 l44 -6z" fill="#FF4D5E"/><path d="M1010 130 l20 40 l44 6 l-32 30 l-32 -76z" fill="#FF9F1C"/><path d="M1010 130 l-20 40 l-44 6 l32 30 l32 -76z" fill="#FFD600"/>
{''.join(f'<path d="M{x} 250 q4 10 0 20 q-4 10 0 20" stroke="{c}" stroke-width="3" fill="none"/>' for x,c in [(985,R[3]),(1000,R[4]),(1015,R[5]),(1030,R[2])])}</g>
<g transform="translate(2100 0) scale(-1 1)">{person(1050,470,.72,R[1],'#2b2f3a',skins[2],hairs[2],pose='right',face='wow',hairstyle='cap',extra="<g class='stick' style='transform-origin:84px -108px'><path d='M84 -108 l-30 -70' stroke='#8d5a3b' stroke-width='6' stroke-linecap='round'/></g>")}</g>
{label(985,505,'пиньята')}
<!-- банкет: стол в глубине справа -->
<g transform="translate(0 130)"><rect x="{CX-120}" y="420" width="240" height="14" rx="4" fill="#fff"/><path d="M{CX-120} 434 h240 l10 20 h-260z" fill="#f4e5ff"/><rect x="{CX-100}" y="454" width="10" height="36" fill="#ddd"/><rect x="{CX+90}" y="454" width="10" height="36" fill="#ddd"/>
<rect x="{CX-60}" y="404" width="120" height="16" rx="4" fill="#FF6F91"/><rect x="{CX-48}" y="388" width="96" height="18" rx="5" fill="#FFF1B8"/><rect x="{CX-36}" y="372" width="72" height="18" rx="5" fill="#2EC4B6"/>{flames}
<circle cx="{CX-100}" cy="416" r="20" fill="#f5c451"/><circle cx="{CX-100}" cy="416" r="15" fill="#e8553f"/>{''.join(f'<circle cx="{CX-100+dx}" cy="{416+dy}" r="3" fill="#fff1b8"/>' for dx,dy in [(-6,-4),(5,-6),(2,5),(-4,6)])}
{''.join(f'<rect x="{CX+60+i*16}" y="404" width="12" height="16" rx="2" fill="{c}" opacity=".9"/>' for i,c in enumerate([R[4],R[0],R[3]]))}</g>
{label(CX,470,'банкет')}
<!-- дети на переднем плане -->
{person(240,600,.7,R[2],'#3A86FF',skins[4],hairs[4],pose='up',face='smile',cls='jump j1',hairstyle='cap')}
{person(585,600,.7,R[3],'#FF4D5E',skins[0],hairs[3],pose='up',face='wow',cls='jump j2',hairstyle='long')}
<g class="ura" style="transform-origin:290px 200px"><path d="M230 160 h120 a14 14 0 0 1 14 14 v40 a14 14 0 0 1 -14 14 h-60 l-20 20 v-20 h-40 a14 14 0 0 1 -14 -14 v-40 a14 14 0 0 1 14 -14z" fill="#fff"/><text x="242" y="206" font-family="var(--f-display)" font-weight="800" font-size="30" fill="#FF4D5E">УРА!</text></g>
{''.join(f'<g class="bal" style="animation-delay:{d}s;animation-duration:{du}s"><g class="sway" style="transform-origin:{x}px 520px;animation-delay:{d/2}s"><line x1="{x}" y1="520" x2="{x}" y2="600" stroke="#fff" stroke-width="2" opacity=".8"/><ellipse cx="{x}" cy="486" rx="28" ry="36" fill="{c}"/><ellipse cx="{x}" cy="486" rx="28" ry="36" fill="url(#gBal)"/><path d="M{x-6} 522 l6 -8 l6 8z" fill="{c}"/></g></g>' for x,d,du,c in [(250,0,9,R[0]),(1160,-3,10,R[3]),(30,-5,8.5,R[4]),(820,-1.5,9.5,R[2])])}
{conf}
</svg>'''
open('src/components/CompareScenes.astro','w').write(f'''---
// Сгенерировано scripts/gen-compare.py — две нарисованные сцены для слайдера «у других / у нас». Всё анимируется CSS.
---
<div class="cmp-side cmp-other" id="cmpA">{left}</div>
<div class="cmp-side cmp-ours" id="cmpB">{right}</div>
''')
print('ok')

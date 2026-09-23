(function(){'use strict';
var cv=document.getElementById('pgl');if(!cv||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var gl=cv.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});if(!gl)return;
var FS=`precision highp float;uniform vec2 R;uniform float T;uniform vec2 M;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
vec3 ball(vec2 p,vec2 c,float r,vec3 col,inout float hit){vec2 d=(p-c)/r;float q=dot(d,d);if(q>1.)return vec3(0);hit=1.;vec3 N=vec3(d,sqrt(1.-q));vec3 L=normalize(vec3(-.5,.6,.7));float l=max(dot(N,L),0.);float s=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.),24.);return col*(.35+.75*l)+s*.9;}
void main(){vec2 uv=gl_FragCoord.xy/R;float A=R.x/R.y;vec2 p=vec2(uv.x*A,uv.y);float t=T;
vec2 q=vec2(fb(p*1.3+t*.04),fb(p*1.3+vec2(5.2,1.3)-t*.03));float r=fb(p*1.2+q*2.2+t*.06);
vec3 blue=vec3(.07,.22,.78),red=vec3(1.,.17,.24),grn=vec3(.12,.82,.54),sun=vec3(1.,.8,.17);
vec3 col=mix(blue,vec3(.18,.42,1.),uv.y);col=mix(col,red,smoothstep(.45,.8,r)*.85);col=mix(col,grn,smoothstep(.55,.85,q.x)*.45);col+=sun*pow(smoothstep(.55,.95,r),3.)*.55;
col+=.22*pow(abs(sin((r*5.+q.y*3.)*3.1416)),14.);
bool mob=A<1.;vec2 C=mob?vec2(A*.5,.72):vec2(A*.72,.52);C+=M*.025;float rad=mob?.2:.24;
vec2 d=p-C;float dl=length(d);
col+=vec3(1.,.55,.35)*.5*exp(-max(dl-rad,0.)*7.);
float tilt=-.35;mat2 rot=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt));vec2 rp=rot*d;float e=length(vec2(rp.x,rp.y/.26))/rad;
float band=smoothstep(1.3,1.36,e)*(1.-smoothstep(1.92,1.98,e));float rs=.6+.4*sin(e*38.);vec3 rc=mix(sun,vec3(1.),.35)*rs;
if(band>0.&&rp.y>0.&&dl>rad)col=mix(col,rc,band*.9);
if(dl<rad){vec2 s=d/rad;float z=sqrt(1.-dot(s,s));vec3 N=vec3(s,z);float lon=atan(N.x,N.z)+t*.18,lat=N.y;
float sw=fb(vec2(lon*1.8,lat*5.+fb(vec2(lon*3.,lat*9.))*1.6));vec3 pc=mix(vec3(1.,.25,.2),vec3(1.,.62,.2),smoothstep(.35,.7,sw));pc=mix(pc,vec3(1.,.35,.6),smoothstep(.65,.9,sw)*.6);
vec3 L=normalize(vec3(-.55,.55,.65));float df=max(dot(N,L),0.);float sp=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.),30.);
col=pc*(.28+.85*df)+sp*.8+vec3(.3,.5,1.)*pow(1.-z,3.)*.9;}
if(band>0.&&rp.y<=0.)col=mix(col,rc,band*.95);
for(int i=0;i<3;i++){float fi=float(i);float a=t*(.35+fi*.12)+fi*2.1;vec2 o=vec2(cos(a)*rad*(2.3+fi*.35),sin(a)*rad*(.55+fi*.1));o=vec2(o.x*cos(-tilt)-o.y*sin(-tilt),o.x*sin(-tilt)+o.y*cos(-tilt));
vec3 bc=i==0?grn:(i==1?vec3(.2,.5,1.):sun);float hit=0.;vec3 b=ball(p,C+o,rad*(.13+fi*.03),bc,hit);bool front=sin(a)<0.;if(hit>0.&&(front||length(o)>rad*1.05||dl>rad))col=b;}
vec2 g=p*22.;vec2 id=floor(g);float hs=h(id);if(hs>.9){vec2 sp=fract(g)-vec2(h(id+3.),h(id+7.));float tw=.5+.5*sin(t*3.+hs*60.);col+=vec3(1.,.95,.8)*smoothstep(.09,0.,length(sp))*tw*1.2;}
gl_FragColor=vec4(col,1.);}`;
var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
try{var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr)}catch(e){cv.remove();return}
var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
var uR=gl.getUniformLocation(pr,'R'),uT=gl.getUniformLocation(pr,'T'),uM=gl.getUniformLocation(pr,'M');
var S=.6,mx=0,my=0,tx=0,ty=0,vis=true,raf=0,t0=performance.now();
function size(){var w=cv.clientWidth,h=cv.clientHeight;cv.width=Math.max(1,Math.round(w*S));cv.height=Math.max(1,Math.round(h*S));gl.viewport(0,0,cv.width,cv.height)}
addEventListener('resize',size);size();document.documentElement.classList.add('pgl-on');
addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=.5-e.clientY/innerHeight},{passive:true});
function fr(now){raf=0;mx+=(tx-mx)*.05;my+=(ty-my)*.05;gl.uniform2f(uR,cv.width,cv.height);gl.uniform1f(uT,(now-t0)/1000);gl.uniform2f(uM,mx,my);gl.drawArrays(gl.TRIANGLES,0,3);if(vis&&!document.hidden)raf=requestAnimationFrame(fr)}
function go(){if(!raf)raf=requestAnimationFrame(fr)}
if('IntersectionObserver'in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)go()}).observe(cv);
document.addEventListener('visibilitychange',go);go();
})();

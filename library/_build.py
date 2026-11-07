"""Builds library/items.json (7 sections > groups > items) + thumbs/ + view/ from OUR exports only (no client raw photos)."""
import json, os, re
from PIL import Image
import fitz
R=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
L=R+'/library'; os.makedirs(L+'/thumbs',exist_ok=True); os.makedirs(L+'/view',exist_ok=True)
EX='samples/exports/'
J=lambda n: json.load(open(f'{R}/samples/manifest/{n}.json',encoding='utf8'))
titles={}
for x in J('posts')+J('other'): titles[x['file']]=x['title']
for a in J('base')['ads']:
    titles[a['feed']]=a['title']+' (feed 4:5)'; titles[a['story']]=a['title']+' (story 9:16)'
vid={x['stem']:x for x in J('video')}
for r in J('base')['reels']: vid[r['id']]=r

X='×'; D='·'
slugify=lambda s: re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def prep(im,slug):
    im=im.convert('RGB'); w,h=im.size
    t=im.copy(); t.thumbnail((640,1100)); t.save(f'{L}/thumbs/{slug}.webp','WEBP',quality=80,method=6)
    v=im.copy(); v.thumbnail((1800,1800)); v.save(f'{L}/view/{slug}.webp','WEBP',quality=84,method=6)
    return f'thumbs/{slug}.webp',f'view/{slug}.webp',w,h
def px(w,h): return f'{w} {X} {h} px'
def img(rel,name,fmt,dl=None,size=None,**kw):
    th,vw,w,h=prep(Image.open(f'{R}/{rel}'),slugify(os.path.splitext(rel)[0]))
    d=dl or rel
    it=dict(n=name,fmt=fmt,sz=size or px(w,h),th=th,v=vw,f='../'+d,fn=os.path.basename(d),w=w,h=h)
    it.update(kw); return it
def vidi(slug,name,fmt,v,alt=None):
    th,vw,w,h=prep(Image.open(f'{R}/{EX}{v["poster"]}'),slugify(slug))
    web=v.get('web') or v['file']
    it=dict(n=name,fmt=fmt,sz=px(w,h)+' %s %d s'%(D,round(v['duration'])),th=th,v='../'+EX+web,f='../'+EX+v['file'],fn=os.path.basename(v['file']),w=w,h=h,vid=1)
    if alt: it['alt']='../'+EX+alt; it['altfn']=os.path.basename(alt)
    return it
ls=lambda d: sorted(os.listdir(f'{R}/{EX}{d}'))
nm_story=lambda s: re.sub(r'^Story \d+ - ','',vid[s]['title'])
def grp(name,items,h,hm,**kw):
    d=dict(name=name,h=h,hm=hm,items=items); d.update(kw); return d

# 1 Brand identity
B=lambda f,n,fmt,**kw: img('brand/exports/'+f+'.png',n,fmt,**kw)
brand=[
 grp('Profile avatars',[B('avatar-instagram-1080','Instagram avatar',f'Avatar {D} 1:1'),B('avatar-round-1080','Round avatar',f'Avatar {D} 1:1')],200,150),
 grp('Covers',[B('facebook-cover-1640x624','Facebook cover',f'Cover {D} Facebook'),B('facebook-cover-room-1640x624','Facebook cover, the room',f'Cover {D} Facebook'),B('gbp-cover-2048x1152','Google Business cover',f'Cover {D} Google Business')],150,84),
 grp('Templates',[B('ig-story-template-1080x1920','Story template',f'Template {D} 9:16'),B('xhs-cover-template-1242x1660','Xiaohongshu cover template',f'Template {D} 3:4'),B('email-header-1200x400','Email header',f'Template {D} 3:1'),B('og-image-1200x630','Link preview image',f'Template {D} 1.91:1')],230,150),
 grp('Patterns',[B('pattern-cobalt-2000','Pattern, cobalt',f'Pattern {D} 1:1'),B('pattern-gold-2000','Pattern, gold',f'Pattern {D} 1:1')],200,150)]
# 2 Social media
posts=[img(EX+'posts/'+f,titles['posts/'+f],f'Post {D} 3:4') for f in ls('posts')]
xhs=[img(EX+'xhs/'+f,titles['xhs/'+f],f'Cover {D} 3:4') for f in ls('xhs')]
stories=[]
for s,stem in [('story-01','story-01-auntiegaik-poll'),('story-02',None),('story-03','story-03-auntiegaik-in-the-kitchen'),('story-04',None),('story-05','story-05-auntiegaik-four-years-running'),('story-06',None)]:
    if stem: stories.append(vidi(s,nm_story(s),f'Story video {D} 9:16',vid[s],alt=f'stories/{stem}.png'))
    else:
        f=[x for x in ls('stories') if x.startswith(s) and x.endswith('.png') and 'contact' not in x][0]
        stories.append(img(EX+'stories/'+f,nm_story(s),f'Story {D} 9:16'))
reels=[vidi(k,re.sub(r'^Reel \d+ - ','',vid[k]['title']),f'Reel {D} 9:16',vid[k]) for k in ['reel-01','reel-02','reel-03']]
social=[grp('Feed posts',posts,360,226),grp('Xiaohongshu covers',xhs,360,226),grp('Stories',stories,400,250),grp('Reels',reels,400,250)]
# 3 Advertising
sets=[]
for i in range(1,5):
    fe=[f for f in ls('ads') if f.startswith(f'ad{i}-') and f.endswith('4x5.png')][0]; st=fe.replace('4x5','9x16')
    nm=re.sub(r' \(feed 4:5\)$','',titles['ads/'+fe])
    sets.append(dict(name=nm,label=f'Ad set {i}',items=[img(EX+'ads/'+fe,nm,f'Feed {D} 4:5'),img(EX+'ads/'+st,nm,f'Story {D} 9:16')]))
adv=[grp('Meta ad sets',[],340,180,sets=sets),
     grp('Video ad',[vidi('ad-video','Meta video ad',f'Video ad {D} 9:16',vid['ad-video'])],340,180)]
# 4 Print & in-store
PN={'booking-card':'Booking card','business-card':'Business card','gift-voucher':'Gift voucher','menu-card-a5':'Menu card','table-tent':'Table tent','window-decal':'Window decal'}
def mm(r): return f'{round(r.width*25.4/72)} {X} {round(r.height*25.4/72)} mm'
def P(s):
    return img('brand/print/previews/'+s+'.png',PN[s],f'Print {D} PDF',dl=f'brand/print/{s}.pdf',size=mm(fitz.open(f'{R}/brand/print/{s}.pdf')[0].rect))
iq=[]
for f in ls('instore'):
    n='Table QR card' if 'table-qr' in f else 'WhatsApp booking card'
    iq.append(img(EX+'instore/'+f,n,f'Print {D} PNG'))
cards=[P(s) for s in ['business-card','gift-voucher','booking-card','window-decal']]
table=[P('table-tent'),P('menu-card-a5')]+iq
doc=fitz.open(R+'/menu/out/auntie-gaik-lean-menu.pdf')
pix=doc[0].get_pixmap(matrix=fitz.Matrix(2.4,2.4)); pix.save(L+'/_menucover.png')
th,vw,w,h=prep(Image.open(L+'/_menucover.png'),'menu-cover'); os.remove(L+'/_menucover.png')
menu=dict(n='The printed menu',fmt=f'Print {D} PDF',sz='%d pages %s %s'%(len(doc),D,mm(doc[0].rect)),th=th,v=vw,f='../menu/out/auntie-gaik-lean-menu.pdf',fn='auntie-gaik-lean-menu.pdf',w=w,h=h)
print_=[grp('Cards, vouchers and decals',cards,190,110),grp('Table and counter pieces',table,320,200),grp('Printed menu',[menu],320,200)]
# 5-7
emails=[img(EX+'email/'+f,titles['email/'+f],f'Email {D} 1200 px wide',ar=.6,crop=1) for f in ls('email')]
google=[img(EX+'google/'+f,titles['google/'+f],f'Post {D} 4:3') for f in ls('google')]
web=[]
for f,n,fmt in [('site-1440.png','Homepage, desktop',f'Screenshot {D} desktop'),('brand-1440.png','Brand kit page',f'Screenshot {D} desktop'),('site-390.png','Homepage, phone',f'Screenshot {D} phone')]:
    if os.path.exists(f'{R}/{EX}web/{f}'):
        web.append(img(EX+'web/'+f,n,fmt,**({'ar':.5,'crop':1} if '390' in f else {})))
SEC=[
 dict(id='brand',title='Brand identity',desc='Avatars, covers, templates and patterns that keep every channel looking like one restaurant.',groups=brand),
 dict(id='social',title='Social media',desc='Feed posts, Xiaohongshu covers, stories and reels, each sized for its platform.',groups=social),
 dict(id='advertising',title='Advertising',desc='Four Meta ad sets with a feed and a story version each, plus a 6-second video ad.',groups=adv),
 dict(id='print',title='Print & in-store',desc='Cards, vouchers, table pieces and the printed menu, ready to send to the printer.',groups=print_),
 dict(id='email',title='Email',desc='Four email designs: welcome, booking confirmed, birthday and thank-you.',groups=[grp('Email designs',emails,470,260)]),
 dict(id='google',title='Google Business',desc='Three posts for the Google Business Profile: opening hours, the MICHELIN Star and celebrations.',groups=[grp('Google Business posts',google,230,120)]),
 dict(id='website',title='Website',desc='Screenshots of the homepage on desktop and phone, and the brand kit page.',groups=[grp('Screenshots',web,360,230)]),
]
for i,s in enumerate(SEC,1): s['num']='%02d'%i
json.dump(SEC,open(L+'/items.json','w',encoding='utf8'),ensure_ascii=False,indent=0)
leaves=lambda g: g['items']+[x for st in g.get('sets',[]) for x in st['items']]
for s in SEC: print(s['title'],sum(len(leaves(g)) for g in s['groups']))

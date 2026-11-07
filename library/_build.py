"""Builds library/items.json + thumbs/ + view/ from OUR exports only (no client raw photos)."""
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
items=[]
slugify=lambda s: re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def prep(im,slug):
    im=im.convert('RGB'); w,h=im.size
    t=im.copy(); t.thumbnail((640,1100)); t.save(f'{L}/thumbs/{slug}.webp','WEBP',quality=80,method=6)
    v=im.copy(); v.thumbnail((1800,1800)); v.save(f'{L}/view/{slug}.webp','WEBP',quality=84,method=6)
    return f'thumbs/{slug}.webp',f'view/{slug}.webp',w,h
def add_img(typ,rel,name,cap='',dl=None):
    th,vw,w,h=prep(Image.open(f'{R}/{rel}'),slugify(os.path.splitext(rel)[0]))
    d=dl or rel
    items.append(dict(t=typ,n=name,c=cap,th=th,v=vw,f='../'+d,fn=os.path.basename(d),w=w,h=h))
def add_vid(typ,slug,name,cap,mp4,web,poster,alt=None):
    th,vw,w,h=prep(Image.open(f'{R}/{EX}{poster}'),slugify(slug))
    it=dict(t=typ,n=name,c=cap,th=th,v='../'+EX+(web or mp4),f='../'+EX+mp4,fn=os.path.basename(mp4),w=w,h=h,vid=1)
    if alt: it['alt']='../'+EX+alt
    items.append(it)
ls=lambda d: sorted(os.listdir(f'{R}/{EX}{d}'))
for f in ls('posts'): add_img('Posts',EX+'posts/'+f,titles['posts/'+f],'Social post, 3:4')
for f in ls('xhs'): add_img('Xiaohongshu',EX+'xhs/'+f,titles['xhs/'+f],'Xiaohongshu cover, 3:4')
for s,stem in [('story-01','story-01-auntiegaik-poll'),('story-02',None),('story-03','story-03-auntiegaik-in-the-kitchen'),('story-04',None),('story-05','story-05-auntiegaik-four-years-running'),('story-06',None)]:
    nm=re.sub(r'^Story \d+ - ','',vid[s]['title'])
    if stem:
        v=vid[s]; add_vid('Stories',s,nm,'Story, 9:16 video',v['file'],v.get('web'),v['poster'],alt=f'stories/{stem}.png')
    else:
        f=[x for x in ls('stories') if x.startswith(s) and x.endswith('.png') and 'contact' not in x][0]
        add_img('Stories',EX+'stories/'+f,nm,'Story, 9:16')
for k in ['reel-01','reel-02','reel-03','ad-video']:
    v=vid[k]; nm=re.sub(r'^Reel \d+ - ','',v['title']) if 'title' in v else ''
    add_vid('Reels & video',k,nm,'Meta ad video, 6 s, 9:16' if k=='ad-video' else 'Reel, 9:16 video',v['file'],v.get('web'),v['poster'])
for f in ls('ads'): add_img('Ads',EX+'ads/'+f,titles['ads/'+f],'Meta ad')
for f in ls('email'): add_img('Email',EX+'email/'+f,titles['email/'+f],'Email design')
for f in ls('instore'): add_img('In-store',EX+'instore/'+f,titles['instore/'+f],'In-store print')
for f in ls('google'): add_img('Google',EX+'google/'+f,titles['google/'+f],'Google Business post')
BN={'avatar-instagram-1080':'Instagram avatar','avatar-round-1080':'Round avatar','email-header-1200x400':'Email header','facebook-cover-1640x624':'Facebook cover',
 'facebook-cover-room-1640x624':'Facebook cover, the room','gbp-cover-2048x1152':'Google Business cover','ig-story-template-1080x1920':'Instagram story template',
 'og-image-1200x630':'Link preview image','pattern-cobalt-2000':'Pattern, cobalt','pattern-gold-2000':'Pattern, gold','xhs-cover-template-1242x1660':'Xiaohongshu cover template'}
for f in sorted(os.listdir(R+'/brand/exports')):
    add_img('Brand digital','brand/exports/'+f,BN[f[:-4]],'Brand file')
PN={'booking-card':'Booking card','business-card':'Business card','gift-voucher':'Gift voucher','menu-card-a5':'Menu card, A5','table-tent':'Table tent','window-decal':'Window decal'}
for f in sorted(os.listdir(R+'/brand/print/previews')):
    s=f[:-4]; add_img('Print','brand/print/previews/'+f,PN[s],'Print file, PDF',dl=f'brand/print/{s}.pdf')
# menu cover
doc=fitz.open(R+'/menu/out/auntie-gaik-lean-menu.pdf')
pix=doc[0].get_pixmap(matrix=fitz.Matrix(2.4,2.4)); pix.save(L+'/_menucover.png')
th,vw,w,h=prep(Image.open(L+'/_menucover.png'),'menu-cover'); os.remove(L+'/_menucover.png')
items.append(dict(t='Menu',n='The menu',c='Printable menu, %d pages, PDF'%len(doc),th=th,v=vw,f='../menu/out/auntie-gaik-lean-menu.pdf',fn='auntie-gaik-lean-menu.pdf',w=w,h=h))
# website screenshots
for f,nm,c in [('site-1440.png','Homepage, desktop','Website screenshot'),('site-390.png','Homepage, phone','Website screenshot'),('brand-1440.png','Brand kit page','Website screenshot')]:
    if os.path.exists(f'{R}/{EX}web/{f}'):
        im=Image.open(f'{R}/{EX}web/{f}')
        add_img('Website',EX+'web/'+f,nm,c)
json.dump(items,open(L+'/items.json','w',encoding='utf8'),ensure_ascii=False,indent=0)
from collections import Counter
print(Counter(i['t'] for i in items),len(items))

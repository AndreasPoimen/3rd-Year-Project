"""Daily headline-only discovery; no automatic changes to shared profiles."""
import json,pathlib,urllib.request,xml.etree.ElementTree as ET,datetime,hashlib,re,html,email.utils
root=pathlib.Path(__file__).resolve().parents[1]
seed=json.loads((root/'industry-data/seed.json').read_text(encoding='utf-8-sig'))
out=root/'industry-data/news.json'
old=json.loads(out.read_text(encoding='utf8')) if out.exists() else {'items':[]}
items={x['id']:x for x in old.get('items',[])}
sources=[('NASA','https://www.nasa.gov/feed/'),('ESA space news','https://www.esa.int/rssfeed/Our_Activities/Space_News'),('ESA engineering','https://www.esa.int/rssfeed/Our_Activities/Space_Engineering_Technology')]
now=datetime.datetime.now(datetime.timezone.utc).isoformat();status=[]
keywords=['in-space manufacturing','in-space assembly','in-orbit servicing','debris removal','space debris','satellite servicing','orbital recycling','refuelling','refueling','robotic arm','microgravity manufacturing']
def clean(text):return html.unescape(re.sub('<[^>]+>',' ',text or '')).strip()
for name,url in sources:
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'MIDAS-Research-Headlines/1.0'})
  with urllib.request.urlopen(req,timeout=40) as response:
   raw=response.read(4000000)
   if len(raw)>=4000000:raise ValueError('Feed exceeds size limit')
  xml=ET.fromstring(raw);count=0
  entries=xml.findall('.//item')+xml.findall('{http://www.w3.org/2005/Atom}entry')
  for node in entries:
   def field(key):return node.findtext(key) or node.findtext('{http://www.w3.org/2005/Atom}'+key) or ''
   title=clean(field('title'));link=field('link');linkNode=node.find('{http://www.w3.org/2005/Atom}link')
   if not link and linkNode is not None:link=linkNode.get('href','')
   if not link.startswith(('https://','http://')):continue
   searchable=(title+' '+clean(field('description'))).lower()
   matched=[c['id'] for c in seed['companies'] if len(c['name'])>=4 and c['name'].lower() in searchable]
   terms=[k for k in keywords if k in searchable]
   if not matched and not terms:continue
   published=field('pubDate') or field('published') or field('updated')
   try:published=email.utils.parsedate_to_datetime(published).isoformat()
   except (ValueError,TypeError):pass
   ident=hashlib.sha256(link.encode()).hexdigest()[:24]
   items[ident]={'id':ident,'title':title,'url':link,'source':name,'published':published,'capturedAt':items.get(ident,{}).get('capturedAt',now),'companyIds':matched,'matchReason':'Matched '+(', '.join(c['name'] for c in seed['companies'] if c['id'] in matched) or ', '.join(terms))+' — relevance requires review'};count+=1
  status.append({'name':name,'url':url,'ok':True,'matched':count,'checkedAt':now})
 except Exception as e:status.append({'name':name,'url':url,'ok':False,'error':str(e)[:180],'checkedAt':now})
# Preserve collected headlines even when feeds fail; bound this discovery inbox.
result={'checkedAt':now,'sources':status,'items':sorted(items.values(),key=lambda x:x.get('capturedAt',''),reverse=True)[:300],'coverage':'NASA and ESA RSS headlines; not exhaustive. Company profiles remain unchanged until team review.'}
temp=out.with_suffix('.tmp');temp.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');temp.replace(out)
print(json.dumps({'captured':len(result['items']),'sources':status},indent=2))
if not any(s['ok'] for s in status):raise SystemExit(1)

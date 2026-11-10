#!/usr/bin/env python3
"""Optional generator for the remaining per-VIN demo images.
Run `python tools/generate_exact_ai.py --dry-run` to inspect 158 prompts.
Without an OPENAI_API_KEY, this script does not contact a provider or change inventory.
To generate image(s): OPENAI_API_KEY=... python tools/generate_exact_ai.py --limit 2
Images are illustrative until manual make/model/year/trim verification.
"""
import argparse, base64, csv, io, json, os, pathlib, urllib.request, urllib.error
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('--dry-run',action='store_true')
p.add_argument('--limit',type=int,default=158)
p.add_argument('--id',type=str,default='')
p.add_argument('--allow-review-issues',action='store_true')
a=p.parse_args()
with open(ROOT/'data'/'ai_image_prompts.csv',newline='',encoding='utf-8') as f: prompts=list(csv.DictReader(f))
selected=[x for x in prompts if not a.id or x['id']==a.id][:a.limit]
if a.dry_run:
 for x in selected: print(f"{x['id']} {x['prompt']}"+ (f"\n    DATA ISSUE: {x['data_issue']}" if x['data_issue'] else ''))
 raise SystemExit(0)
if not selected: raise SystemExit('No matching vehicle ID')
key=os.getenv('OPENAI_API_KEY')
if not key: raise SystemExit('Set OPENAI_API_KEY in your environment; no changes made.')
rows=list(csv.DictReader(open(ROOT/'data'/'vehicles.csv',newline='',encoding='utf-8')))
rmap={x['id']:x for x in rows}
for item in selected:
 if item['data_issue'] and not a.allow_review_issues:
  print('SKIPPING',item['id'],'catalogue issue - correct metadata first'); continue
 payload={'model':os.getenv('WHEELSPAN_IMAGE_MODEL','gpt-image-2'),'prompt':item['prompt'],'size':'1536x1024','quality':'medium'}
 req=urllib.request.Request('https://api.openai.com/v1/images/generations',data=json.dumps(payload).encode('utf-8'),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
 try:
  with urllib.request.urlopen(req,timeout=180) as res: data=json.loads(res.read())
 except urllib.error.HTTPError as e:
  print(item['id'],'provider error:',e.code,e.read().decode('utf-8')[:500]);continue
 encoded=data['data'][0].get('b64_json')
 if not encoded:
  print('No base64 image returned for',item['id'],'- skipping'); continue
 img=Image.open(io.BytesIO(base64.b64decode(encoded))).convert('RGB')
 out=ROOT/'images'/'ai-studio'/(item['id']+'.webp')
 out.parent.mkdir(parents=True,exist_ok=True)
 img.save(out,format='WEBP',quality=89,method=6)
 rmap[item['id']]['image']=str(out.relative_to(ROOT))
 print('GENERATED',item['id'],'(manual QA required)',out.name)
fields=list(rows[0])
with open(ROOT/'data'/'vehicles.csv','w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fields,lineterminator='\n');w.writeheader();w.writerows(rows)
import subprocess
subprocess.run(['node','tools/build_images.js'],cwd=ROOT,check=True)
print('Snapshot rebuilt. Review output and check title, model year, trim, paint before deployment.')

"""Pack certified policies; the browser binary-searches immutable records, never solves."""
import array,gzip,hashlib,json,pathlib,struct
root=pathlib.Path(__file__).resolve().parents[2];work=pathlib.Path(__file__).parent/'work'
size=6*64*2016*64

def read(name,typ='H'):
 a=array.array(typ);a.frombytes((work/name).read_bytes());return a
policy=read('policy.bin');tw=read('total-w.bin');tb=read('total-b.bin')
rankw=array.array('H',[0])*size;rankb=array.array('H',[0])*size;stageb=bytearray(size)
for stage in range(1,4):
 w=read(f'r{stage}-dw.bin');b=read(f'r{stage}-db.bin')
 for i in range(size):
  if policy[i]!=65535 and policy[i]>>12==stage:rankw[i]=w[i]
  if not stageb[i] and b[i]!=65535:stageb[i]=stage;rankb[i]=b[i]
 del w,b
out=bytearray();counts=[0,0,0,0];samples={}
for turn in range(2):
 for i in range(size):
  stage=stageb[i] if turn else policy[i]>>12
  if stage not in (1,2,3):continue
  dist=rankb[i] if turn else rankw[i];total=tb[i] if turn else tw[i];move=4095 if turn else policy[i]&4095
  assert dist<256 and total<1024
  out+=struct.pack('<II',i+turn*size,move|(stage<<12)|(dist<<14)|(total<<22))
  if not turn:
   counts[stage]+=1
   if stage not in samples and dist>=3:samples[stage]=i
compressed=gzip.compress(out,compresslevel=9,mtime=0);sha=hashlib.sha256(out).hexdigest()
folder=root/'app/public/mate/two-knights-pawn';folder.mkdir(parents=True,exist_ok=True)
name=f'policy.{sha[:16]}.bin.gz';(folder/name).write_bytes(compressed)
sources=['geometry.hpp','promotion.hpp','build.cpp','audit.cpp','export.py']
sourceHash=hashlib.sha256(b''.join((pathlib.Path(__file__).parent/f).read_bytes() for f in sources)).hexdigest()
metadata={'version':1,'sourceHash':sourceHash,'sha256':sha,'url':'/mate/two-knights-pawn/'+name,'bytes':len(out),'compressedBytes':len(compressed),'records':len(out)//8,'whiteStageCounts':counts[1:],'samples':samples,'promotions':json.loads((work/'promotions.json').read_text()),'audit':json.loads((work/'audit.json').read_text())}
(root/'app/src/mate/rules/twoKnightsPawnTableData.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({k:v for k,v in metadata.items() if k not in ('audit','promotions')}))

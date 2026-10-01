"""Rebuild and verify the complete h-pawn policy without an external tablebase."""
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[2]
folder=Path(__file__).parent;work=folder/'work';work.mkdir(exist_ok=True)
def run(args,**kwargs):subprocess.run([str(a) for a in args],cwd=root,check=True,**kwargs)
for name in ['build','audit','probe','check-reverse']:
 run(['clang++','-O3','-std=c++20',folder/(name+'.cpp'),'-o',work/name])
run([work/'build',work])
with (work/'audit.json').open('w') as f:run([work/'audit',work],stdout=f)
with (work/'geometry.txt').open('w') as f:run([work/'probe'],stdout=f)
run([work/'check-reverse'])
for verifier in ['verify-geometry.mts','verify-promotion.mts']:
 run([root/'app/node_modules/.bin/tsx',folder/verifier])
run(['python3',folder/'export.py'])
run([root/'app/node_modules/.bin/tsx',folder/'verify-policy.mts'])

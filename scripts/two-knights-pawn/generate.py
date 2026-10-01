"""Build the complete reachable custom KNN/h-pawn tablebase, offline.

Run with --export-only to package a previously audited native build.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
FOLDER = Path(__file__).resolve().parent
WORK = FOLDER / 'work' / 'custom-tablebase-data'
METADATA = ROOT / 'app/src/mate/rules/twoKnightsPawnTableData.json'
FIXTURES = ROOT / 'app/src/mate/rules/twoKnightsPawnTableFixtures.json'
PUBLIC = ROOT / 'app/public/mate/two-knights-pawn'
START = 'k7/8/8/8/3KN2p/7N/8/8 w - - 0 1'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--export-only', action='store_true')
    args = parser.parse_args()
    WORK.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    source_hash = hashlib.sha256(b''.join((FOLDER / f).read_bytes() for f in
                               ['custom_geometry.hpp', 'custom_tablebase.cpp'])).hexdigest()
    provenance_file = WORK / 'build-source.sha256'
    if not args.export_only:
        # A failed rebuild must not leave an older success stamp usable.
        provenance_file.unlink(missing_ok=True)
        binary = FOLDER / 'work/custom-tablebase'
        subprocess.run(['clang++', '-std=c++17', '-O3', '-DNDEBUG',
                        str(FOLDER / 'custom_tablebase.cpp'), '-o', str(binary)], check=True)
        subprocess.run([str(binary), str(WORK)], check=True)
        provenance_file.write_text(source_hash + '\n')
    if not provenance_file.exists() or provenance_file.read_text().strip() != source_hash:
        raise SystemExit('Cached table does not match solver source; rebuild without --export-only.')
    raw = (WORK / 'tablebase.bin').read_bytes()
    summary = json.loads((WORK / 'summary.json').read_text())
    root_line = json.loads((WORK / 'root-line.json').read_text())
    assert raw[:8] == b'KNNHDTM1' and root_line['fen'] == START
    sha = hashlib.sha256(raw).hexdigest()
    packed = gzip.compress(raw, compresslevel=9, mtime=0)
    name = f'tablebase.{sha[:16]}.bin.gz'
    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / name).write_bytes(packed)
    metadata = {
        'version': 1, 'format': 'KNNHDTM1', 'startFen': START,
        'url': f'/mate/two-knights-pawn/{name}', 'bytes': len(raw),
        'compressedBytes': len(packed), 'sha256': sha,
        'rawbytes': len(raw), 'sha256raw': sha,
        'records': summary['records'], 'slots': summary['slots'],
        'sourceHash': source_hash,
        'audit': summary,
    }
    METADATA.write_text(json.dumps(metadata, indent=2) + '\n')
    positions = json.loads((WORK / 'fixtures.json').read_text())
    for pos in positions:
        if pos['dtm'] == -1:
            pos['dtm'] = None
        for move in pos['moves']:
            if move['dtm'] == -1:
                move['dtm'] = None
    fixtures = {'positions': positions, 'worstLine': {
        'fen': root_line['fen'], 'dtm': root_line['dtm'] if root_line['dtm'] != -1 else None,
        'uci': root_line['uci'],
    }}
    FIXTURES.write_text(json.dumps(fixtures, separators=(',', ':')) + '\n')
    # Remove only superseded generated policies, never unrelated assets.
    for old in [*PUBLIC.glob('policy.*.bin.gz'), *PUBLIC.glob('tablebase.*.bin.gz')]:
        if old.name != name:
            old.unlink()
    subprocess.run([str(ROOT / 'app/node_modules/.bin/tsx'), str(FOLDER / 'verify-custom.mts')], check=True)
    print(json.dumps({'rootDtm': summary['rootDtm'], 'records': summary['records'],
                      'bytes': len(raw), 'compressedBytes': len(packed),
                      'seconds': round(time.monotonic()-started, 2)}))


if __name__ == '__main__':
    main()

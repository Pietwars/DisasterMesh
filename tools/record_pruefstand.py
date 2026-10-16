#!/usr/bin/env python3
"""Turn a completed test checklist into docs/PRUEFSTAND_<datum>.json.

Usage: python tools/record_pruefstand.py ausgefuellt.json [--runs-json runs.json]

The checklist (copy of docs/PRUEFSTAND_VORLAGE.json) must contain an explicit
result for every item. Nothing is assumed: missing or unknown results, a
'bestanden' without evidence, a failed software check or a missing/failed CI
workflow on source_commit abort without writing anything. hardware_tested is
only true when every required hardware item is 'bestanden'.
CI runs and artifacts are read with `gh api` unless --runs-json is given.
"""
from pathlib import Path
import argparse
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
REPO = 'Pietwars/DisasterMesh'
RESULTS = ('bestanden', 'nicht bestanden', 'nicht geprüft')
REQUIRED_WORKFLOWS = ('Tests', 'Build DisAHRsterRadio TTGO', 'Build T3-S3 V1.3', 'Windows MVP checks')
TEMPLATE = ROOT / 'docs/PRUEFSTAND_VORLAGE.json'


def validate(checklist, template=None):
    template = template or json.loads(TEMPLATE.read_text(encoding='utf-8'))
    errors = []
    for key in ('release_version', 'pruefer'):
        if not str(checklist.get(key, '')).strip():
            errors.append(key + ' fehlt')
    if not re.fullmatch(r'[0-9a-f]{40}', str(checklist.get('source_commit', ''))):
        errors.append('source_commit muss ein vollständiger Commit-Hash sein')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(checklist.get('datum', ''))):
        errors.append('datum im Format JJJJ-MM-TT angeben')
    for group in ('software', 'hardware'):
        items = checklist.get(group) or {}
        for name in template[group]:
            item = items.get(name)
            if not isinstance(item, dict) or item.get('ergebnis') not in RESULTS:
                errors.append(f'{group}.{name}: Ergebnis fehlt (erlaubt: {", ".join(RESULTS)})')
            elif item['ergebnis'] == 'bestanden' and not str(item.get('beleg', '')).strip():
                errors.append(f'{group}.{name}: Beleg fehlt')
    for name, item in (checklist.get('software') or {}).items():
        if isinstance(item, dict) and item.get('ergebnis') in RESULTS and item['ergebnis'] != 'bestanden':
            errors.append(f'software.{name}: muss bestanden sein')
    return errors


def hardware_tested(checklist):
    return all(v['ergebnis'] == 'bestanden' for k, v in checklist['hardware'].items() if not k.endswith('_optional'))


def gh_json(path):
    return json.loads(subprocess.check_output(['gh', 'api', path], text=True))


def fetch_ci(commit):
    runs = gh_json(f'repos/{REPO}/actions/runs?head_sha={commit}&per_page=50')['workflow_runs']
    out = {'runs': [], 'artifacts': []}
    for r in runs:
        out['runs'].append({k: r[k] for k in ('id', 'name', 'html_url', 'head_sha', 'conclusion')})
        out['artifacts'] += [a for a in gh_json(f'repos/{REPO}/actions/runs/{r["id"]}/artifacts')['artifacts']]
    return out


def check_ci(ci, commit):
    errors = []
    for wf in REQUIRED_WORKFLOWS:
        runs = [r for r in ci['runs'] if r['name'] == wf and r['head_sha'] == commit]
        if not runs:
            errors.append(f'CI-Workflow „{wf}“ fehlt für {commit[:7]}')
        elif not any(r['conclusion'] == 'success' for r in runs):
            errors.append(f'CI-Workflow „{wf}“ nicht erfolgreich')
    return errors


def record(checklist, ci, out_dir):
    errors = validate(checklist)
    if not errors:
        errors = check_ci(ci, checklist['source_commit'])
    if errors:
        raise ValueError('\n'.join(errors))
    out = Path(out_dir) / f"PRUEFSTAND_{checklist['datum']}.json"
    if out.exists():
        raise ValueError(f'{out.name} existiert bereits; Prüfstände werden nicht überschrieben')
    commit = checklist['source_commit']
    runs = [r for r in ci['runs'] if r['head_sha'] == commit and r['name'] in REQUIRED_WORKFLOWS and r['conclusion'] == 'success']
    ids = {r['id'] for r in runs}
    evidence = {
        'checked_at': checklist['datum'],
        'release_version': checklist['release_version'],
        'source_commit': commit,
        'pruefer': checklist['pruefer'],
        'hardware_tested': hardware_tested(checklist),
        'runs': [{'id': r['id'], 'name': r['name'], 'url': r.get('html_url', ''), 'head_sha': r['head_sha'], 'conclusion': r['conclusion']} for r in runs],
        'artifacts': [a for a in ci['artifacts'] if a.get('workflow_run', {}).get('id') in ids and not a.get('expired')],
        'checklist': {'software': checklist['software'], 'hardware': checklist['hardware'], 'anmerkungen': checklist.get('anmerkungen', '')},
    }
    out.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description='Prüfstand aus ausgefüllter Checkliste erzeugen')
    ap.add_argument('checklist')
    ap.add_argument('--runs-json', help='CI-Läufe/Artefakte als JSON statt gh api')
    ap.add_argument('--out-dir', default=str(ROOT / 'docs'))
    a = ap.parse_args(argv)
    checklist = json.loads(Path(a.checklist).read_text(encoding='utf-8'))
    try:
        errors = validate(checklist)
        if errors:
            raise ValueError('\n'.join(errors))
        ci = json.loads(Path(a.runs_json).read_text(encoding='utf-8')) if a.runs_json else fetch_ci(checklist['source_commit'])
        out = record(checklist, ci, a.out_dir)
    except ValueError as e:
        sys.exit('Kein Prüfstand geschrieben:\n' + str(e))
    print(f'{out} geschrieben · hardware_tested={json.loads(out.read_text(encoding="utf-8"))["hardware_tested"]}')


if __name__ == '__main__':
    main()

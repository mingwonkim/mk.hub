#!/usr/bin/env python3
"""Local administrator setup. Hidden input; no credential files or command arguments."""
import getpass
import json
from pathlib import Path
import shutil
import smtplib
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

PROJECT = 'mingwon-hub'
EMAIL = 'kmin5940@naver.com'
REPOSITORY = 'mingwonkim/obsidian-vault'
ROOT = Path(__file__).resolve().parent.parent
FIREBASE = [shutil.which('firebase')] if shutil.which('firebase') else ['npx', '--yes', 'firebase-tools@15.30.0']


def registered(name):
    result = subprocess.run(FIREBASE + ['functions:secrets:get', name, '--project', PROJECT, '--non-interactive', '--json'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, cwd=ROOT)
    if result.returncode:
        return False
    data = json.loads(result.stdout)
    return any(version.get('state') == 'ENABLED' for version in data.get('result', {}).get('secrets', []))


def store(name, value):
    result = subprocess.run(FIREBASE + ['functions:secrets:set', name, '--data-file', '-', '--project', PROJECT, '--non-interactive'], input=value, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=ROOT)
    if result.returncode:
        raise RuntimeError('서버 등록 실패. Firebase 관리자 로그인 상태를 확인해주세요.')
    print(name + ': 서버 등록 완료')


def main():
    if not sys.stdin.isatty():
        raise RuntimeError('숨김 입력을 위해 터미널에서 직접 실행해주세요.')
    print('MK.HUB 서버 비밀값 등록\n입력값은 화면·파일·명령 기록에 표시되지 않습니다.\n')
    if not registered('VAULT_SMTP_PASSWORD'):
        print('네이버 2단계 인증 및 SMTP 사용 설정 후 발급한 앱 비밀번호를 입력하세요.')
        password = getpass.getpass('네이버 앱 비밀번호: ').strip().replace(' ', '')
        if not password:
            raise RuntimeError('입력이 없어 중단했습니다.')
        try:
            with smtplib.SMTP_SSL('smtp.naver.com', 465, timeout=20) as smtp:
                smtp.login(EMAIL, password)
        except Exception:
            raise RuntimeError('네이버 SMTP 인증 실패. 앱 비밀번호와 SMTP 사용 설정을 확인해주세요.') from None
        store('VAULT_SMTP_PASSWORD', password)
        del password
    else:
        print('SMTP 비밀값 이미 등록됨')
    if not registered('VAULT_GITHUB_TOKEN'):
        print('\nGitHub fine-grained 토큰: obsidian-vault 저장소만 선택, Contents 읽기/쓰기 권한.')
        token = getpass.getpass('GitHub 서버 토큰: ').strip()
        if not token:
            raise RuntimeError('GitHub 토큰 입력이 없어 중단했습니다. SMTP 등록값은 유지됩니다.')
        request = urllib.request.Request('https://api.github.com/repos/' + REPOSITORY, headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                repository = json.load(response)
        except Exception:
            raise RuntimeError('GitHub 저장소 접근 실패. 토큰의 저장소 선택과 권한을 확인해주세요.') from None
        if repository.get('private') is not True or repository.get('full_name') != REPOSITORY:
            raise RuntimeError('지정한 비공개 저장소가 아닙니다.')
        store('VAULT_GITHUB_TOKEN', token)
        del token
    else:
        print('GitHub 비밀값 이미 등록됨')
    (ROOT / '.secret-registration-status.json').write_text(json.dumps({'registered': ['VAULT_SMTP_PASSWORD', 'VAULT_GITHUB_TOKEN'], 'at': datetime.now(timezone.utc).isoformat()}))
    print('\n등록 완료. 대화창에 “등록 완료”라고 알려주세요. 서버 배포와 실제 메일 검증을 이어갑니다.')


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\n등록 중단. 이미 등록한 서버 비밀값은 유지됩니다.')
    except RuntimeError as error:
        print(str(error))
    if sys.stdin.isatty():
        input('\nEnter를 누르면 닫힙니다. ')

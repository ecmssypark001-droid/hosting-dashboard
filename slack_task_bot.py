#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
호스팅팀 업무 자동 등록 Slack Bot
===================================

기능:
1. 호스팅팀 관련 채널에서 멘션 감지
2. 멘션 후 미답변 메시지를 업무로 자동 등록
3. Google Sheets에 업무 저장

사용 방법:
1. .env 파일에 토큰 설정
2. python slack_task_bot.py 실행
"""

import os
import time
import json
import requests
from datetime import datetime, timedelta
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

SLACK_BOT_TOKEN = os.getenv('SLACK_TOKEN')
SLACK_APP_TOKEN = os.getenv('SLACK_APP_TOKEN', 'xapp-...')  # Socket Mode용
WEBAPP_URL = 'https://script.google.com/a/macros/in.cd24.kr/s/AKfycbxbPSgazlvcl3YfzBwN2_h4um7evQggGZIMNZyf9gJ64c6S8IgVrH7Edj_oTn6f5isN/exec'

# Slack App 초기화
app = App(token=SLACK_BOT_TOKEN)

# 호스팅팀 관련 채널 목록 (채널 ID로 설정)
HOSTING_CHANNELS = [
    'C01234ABCDE',  # #호스팅-관리
    'C56789FGHIJ',  # #호스팅-운영
    # 실제 채널 ID로 변경 필요
]

# 멘션 감지 대상 (예: 호스팅팀 관리자들)
HOSTING_TEAM_MEMBERS = [
    'U01234ABCDE',  # 박슬예
    'U56789FGHIJ',  # 정혜인
    # 실제 사용자 ID로 변경 필요
]

# 담당자 자동 배정 로직 (라운드로빈)
ASSIGNEE_LIST = ['박슬예', '정혜인', '김수인', '이엄지', '김태훈']
current_assignee_index = 0


def get_next_assignee():
    """라운드로빈 방식으로 다음 담당자 반환"""
    global current_assignee_index
    assignee = ASSIGNEE_LIST[current_assignee_index]
    current_assignee_index = (current_assignee_index + 1) % len(ASSIGNEE_LIST)
    return assignee


def check_if_replied(client, channel_id, thread_ts, original_user):
    """
    메시지에 답변이 있는지 확인

    Returns:
        bool: 답변이 있으면 True, 없으면 False
    """
    try:
        result = client.conversations_replies(
            channel=channel_id,
            ts=thread_ts
        )

        messages = result['messages']

        # 원본 메시지 외에 다른 답변이 있는지 확인
        for msg in messages:
            if msg['ts'] != thread_ts and msg.get('user') != original_user:
                return True

        return False

    except Exception as e:
        print(f"답변 확인 실패: {e}")
        return False


def extract_task_info(text):
    """
    메시지에서 업무 정보 추출

    Returns:
        dict: 업무 정보
    """
    # 간단한 파싱 로직 (필요에 따라 고도화)
    task_info = {
        'content': text,
        'priority': '보통',
        'category': 'Slack 자동등록'
    }

    # 긴급도 감지
    if any(keyword in text for keyword in ['긴급', '급함', '빨리', '즉시']):
        task_info['priority'] = '긴급'
    elif any(keyword in text for keyword in ['중요', '확인 필요', '검토 요청']):
        task_info['priority'] = '높음'

    return task_info


def register_task_to_sheets(task_data):
    """
    Google Sheets에 업무 등록

    Args:
        task_data: 업무 데이터

    Returns:
        dict: 등록 결과
    """
    try:
        payload = {
            'action': 'create',
            'type': 'task',
            'data': {
                '내용': task_data['content'],
                '담당자': task_data['assignee'],
                '상태': '시작전',
                '긴급도': task_data['priority'],
                '마감일': task_data.get('deadline', ''),
                '구분': task_data['category']
            }
        }

        response = requests.post(
            WEBAPP_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )

        if response.status_code == 200:
            return {'success': True, 'response': response.json()}
        else:
            return {'success': False, 'error': f'HTTP {response.status_code}'}

    except Exception as e:
        return {'success': False, 'error': str(e)}


@app.event("app_mention")
def handle_mention(event, say, client):
    """
    멘션 이벤트 처리
    """
    try:
        channel_id = event['channel']
        thread_ts = event.get('thread_ts', event['ts'])
        user_id = event['user']
        text = event['text']

        # 멘션 제거하여 실제 메시지만 추출
        message_content = text.split('>', 1)[-1].strip()

        print(f"[멘션 감지] 채널: {channel_id}, 사용자: {user_id}")
        print(f"[메시지] {message_content}")

        # 미답변 체크 (3초 후)
        time.sleep(3)

        if not check_if_replied(client, channel_id, thread_ts, user_id):
            print("[미답변] 업무로 자동 등록합니다...")

            # 업무 정보 추출
            task_info = extract_task_info(message_content)

            # 담당자 자동 배정
            assignee = get_next_assignee()

            # 메시지 링크 생성
            workspace_url = client.team_info()['team']['url']
            message_link = f"{workspace_url}archives/{channel_id}/p{thread_ts.replace('.', '')}"

            # 업무 데이터 구성
            task_data = {
                'content': f"[Slack] {message_content}",
                'assignee': assignee,
                'priority': task_info['priority'],
                'category': task_info['category'],
                'slack_link': message_link,
                'slack_channel': channel_id,
                'slack_user': user_id
            }

            # Google Sheets에 등록
            result = register_task_to_sheets(task_data)

            if result['success']:
                # 성공 메시지
                say(
                    thread_ts=thread_ts,
                    text=f"✅ 업무가 자동 등록되었습니다!\n"
                         f"📋 내용: {message_content[:50]}{'...' if len(message_content) > 50 else ''}\n"
                         f"👤 담당자: {assignee}\n"
                         f"⚡ 긴급도: {task_info['priority']}\n\n"
                         f"대시보드에서 확인하세요: https://hosting-dashboard.pages.dev"
                )
            else:
                say(
                    thread_ts=thread_ts,
                    text=f"❌ 업무 등록 실패: {result.get('error', '알 수 없는 오류')}"
                )
        else:
            print("[답변 있음] 업무 등록 생략")

    except Exception as e:
        print(f"멘션 처리 실패: {e}")
        say(f"⚠️ 처리 중 오류 발생: {str(e)}")


@app.event("message")
def handle_message_events(body, logger):
    """일반 메시지 이벤트 (필요 시 추가 처리)"""
    logger.debug(body)


@app.command("/업무추가")
def handle_task_command(ack, command, say):
    """
    Slack 슬래시 커맨드: /업무추가

    사용법: /업무추가 [제목] [담당자] [마감일]
    """
    ack()

    try:
        # 커맨드 텍스트 파싱
        text = command['text'].strip()
        parts = text.split('|')

        if len(parts) < 1:
            say("사용법: `/업무추가 [제목] | [담당자] | [마감일]`")
            return

        title = parts[0].strip() if len(parts) > 0 else ''
        assignee = parts[1].strip() if len(parts) > 1 else get_next_assignee()
        deadline = parts[2].strip() if len(parts) > 2 else ''

        task_data = {
            'content': title,
            'assignee': assignee,
            'priority': '보통',
            'category': 'Slack 수동등록',
            'deadline': deadline
        }

        result = register_task_to_sheets(task_data)

        if result['success']:
            say(
                f"✅ 업무가 등록되었습니다!\n"
                f"📋 제목: {title}\n"
                f"👤 담당자: {assignee}\n"
                f"📅 마감일: {deadline if deadline else '미정'}"
            )
        else:
            say(f"❌ 업무 등록 실패: {result.get('error', '알 수 없는 오류')}")

    except Exception as e:
        say(f"⚠️ 처리 중 오류 발생: {str(e)}")


@app.event("reaction_added")
def handle_reaction(event, client, say):
    """
    이모지 리액션으로 업무 등록

    특정 이모지(예: 📌)를 메시지에 추가하면 업무로 자동 등록
    """
    try:
        reaction = event['reaction']

        # 업무 등록 트리거 이모지
        if reaction in ['pushpin', 'memo', 'clipboard']:
            item = event['item']
            channel_id = item['channel']
            message_ts = item['ts']

            # 메시지 내용 가져오기
            result = client.conversations_history(
                channel=channel_id,
                latest=message_ts,
                limit=1,
                inclusive=True
            )

            if result['messages']:
                message = result['messages'][0]
                text = message.get('text', '')
                user_id = message.get('user', '')

                # 업무 정보 추출
                task_info = extract_task_info(text)
                assignee = get_next_assignee()

                # 메시지 링크
                workspace_url = client.team_info()['team']['url']
                message_link = f"{workspace_url}archives/{channel_id}/p{message_ts.replace('.', '')}"

                task_data = {
                    'content': f"[📌 Slack] {text}",
                    'assignee': assignee,
                    'priority': task_info['priority'],
                    'category': '이모지 등록',
                    'slack_link': message_link
                }

                result = register_task_to_sheets(task_data)

                if result['success']:
                    client.chat_postMessage(
                        channel=channel_id,
                        thread_ts=message_ts,
                        text=f"✅ 이 메시지가 업무로 등록되었습니다! (담당자: {assignee})"
                    )

    except Exception as e:
        print(f"리액션 처리 실패: {e}")


def main():
    """메인 실행"""
    print("🚀 호스팅팀 업무 자동 등록 봇 시작...")
    print(f"📡 연결 대기 중...")

    # Socket Mode로 실행 (방화벽 뒤에서도 작동)
    if SLACK_APP_TOKEN and SLACK_APP_TOKEN.startswith('xapp-'):
        handler = SocketModeHandler(app, SLACK_APP_TOKEN)
        handler.start()
    else:
        # 일반 모드 (ngrok 등 필요)
        print("⚠️ SLACK_APP_TOKEN이 설정되지 않았습니다. Socket Mode를 사용하려면 .env 파일에 추가하세요.")
        print("일반 HTTP 모드로 실행됩니다 (개발 전용)")
        app.start(port=int(os.getenv("PORT", 3000)))


if __name__ == "__main__":
    main()

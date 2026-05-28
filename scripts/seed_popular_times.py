"""
seed_popular_times.py
cafes 컬렉션의 popular_times 필드를 읽어서
현재 시각 기준 occupancy 컬렉션을 업데이트한다.

변경사항 (구버전 대비):
- POPULAR_TIMES 하드코딩 제거 → Firebase cafes에서 직접 읽음
- cafes 컬렉션 절대 덮어쓰지 않음 (이름/URL/좌석수 롤백 문제 해결)
- 카페 추가/삭제 시 이 파일 수정 불필요

실행: python scripts/seed_popular_times.py
"""

import os, json, base64, logging
from datetime import datetime, timezone, timedelta

import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DAY_MAP = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]  # 0=월 ... 6=일

def classify_status(pop):
    if pop <= 40: return "여유"
    if pop <= 70: return "보통"
    return "혼잡"

def init_firebase():
    cred_env = os.getenv("FIREBASE_CREDENTIALS")
    if cred_env:
        cred_json = json.loads(base64.b64decode(cred_env).decode("utf-8"))
        cred = credentials.Certificate(cred_json)
    else:
        cred = credentials.Certificate("firebase_credentials.json")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()

def main():
    logger.info("=== 혼잡도 업데이트 시작 ===")
    db = init_firebase()

    # 한국 시간 기준 현재 요일 + 시간
    kst = timezone(timedelta(hours=9))
    now = datetime.now(kst)
    day_key = DAY_MAP[now.weekday()]  # 0=월요일
    hour = now.hour
    logger.info(f"현재 시각: {now.strftime('%Y-%m-%d %H:%M')} KST ({day_key} {hour}시)")

    # cafes 컬렉션 전체 읽기
    cafes = db.collection("cafes").stream()

    success, skipped = 0, 0
    for doc in cafes:
        cafe_id = doc.id
        data = doc.to_dict()

        name        = data.get("name", cafe_id)
        total_seats = data.get("total_seats", 50)
        pop_times   = data.get("popular_times")

        # popular_times 없는 카페는 건너뜀
        if not pop_times:
            logger.warning(f"[{name}] popular_times 없음 → 건너뜀")
            skipped += 1
            continue

        day_data = pop_times.get(day_key)
        if not day_data or len(day_data) <= hour:
            logger.warning(f"[{name}] {day_key} 데이터 없음 → 건너뜀")
            skipped += 1
            continue

        pop       = int(day_data[hour])
        status    = classify_status(pop)
        available = max(round(total_seats * (1 - pop / 100)), 0)

        # occupancy만 업데이트 (cafes는 절대 건드리지 않음)
        db.collection("occupancy").document(cafe_id).set({
            "current_popularity": pop,
            "status":             status,
            "available_seats":    available,
            "occupancy_rate":     round(pop / 100, 2),
            "fetched_at":         datetime.now(timezone.utc),
        })
        logger.info(f"[{name}] {status} (혼잡도 {pop}, 가용 {available}/{total_seats}석)")
        success += 1

    logger.info(f"=== 완료: 성공 {success}개 / 스킵 {skipped}개 ===")

if __name__ == "__main__":
    main()
"""
merge_elpis.py
elpis 문서를 elpis_sinchon으로 병합한다.

작업 내용:
1. occupancy/elpis 데이터 → occupancy/elpis_sinchon 으로 복사
2. cafes/elpis_sinchon total_seats 50 → 80 으로 수정
3. cafes/elpis 삭제
4. occupancy/elpis 삭제

실행:
  python scripts/merge_elpis.py   (프로젝트 루트에서)
"""

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── 1) occupancy/elpis 데이터 읽기 ───────────────────────────────────────
print("📖 occupancy/elpis 읽는 중...")
elpis_occ = db.collection("occupancy").document("elpis").get()

if elpis_occ.exists:
    occ_data = elpis_occ.to_dict()
    print(f"   데이터: {occ_data}")

    # ── 2) occupancy/elpis_sinchon 에 복사 ────────────────────────────────
    db.collection("occupancy").document("elpis_sinchon").set(occ_data)
    print("✅ occupancy/elpis_sinchon 으로 복사 완료")
else:
    print("⚠️  occupancy/elpis 없음 — 복사 건너뜀")

# ── 3) cafes/elpis_sinchon total_seats 80으로 수정 ────────────────────────
db.collection("cafes").document("elpis_sinchon").update({"total_seats": 80})
print("✅ cafes/elpis_sinchon total_seats → 80 수정 완료")

# ── 4) cafes/elpis 삭제 ───────────────────────────────────────────────────
db.collection("cafes").document("elpis").delete()
print("🗑️  cafes/elpis 삭제 완료")

# ── 5) occupancy/elpis 삭제 ───────────────────────────────────────────────
db.collection("occupancy").document("elpis").delete()
print("🗑️  occupancy/elpis 삭제 완료")

print("\n✅ 병합 완료! elpis_sinchon 으로 통일됐습니다.")

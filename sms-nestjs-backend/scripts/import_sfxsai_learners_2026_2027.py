import csv
import json
import re
import sqlite3
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "prisma" / "dev.db"
CSV_PATH = Path(r"D:\SFXSAI-APPWRITE\exports\sfxsai-student-data-2026-2027-20260611.csv")
PDF_PATH = Path(r"D:\SFXSAI-APPWRITE\exports\sfxsai-learners-2026-2027-grade-sorted-a4-landscape-readable-20260611.pdf")
REPORT_PATH = Path(r"D:\SFXSAI-APPWRITE\exports\sfxsai-learners-2026-2027-import-report.json")


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def parse_pdf_keys() -> set[tuple[str, str]]:
    text = "\n".join((page.extract_text(extraction_mode="layout") or "") for page in PdfReader(str(PDF_PATH)).pages)
    starts = [0, 8, 23, 58, 92, 123, 146, 177, 207, 237, 253, 286, 420]
    keys = [
        "no",
        "grade",
        "learnerName",
        "email",
        "motherName",
        "motherContact",
        "fatherName",
        "fatherContact",
        "guardianName",
        "guardianContact",
        "phAddress",
        "uaeAddress",
    ]
    skip = ("sfxsai-learners", "Page ", "No.", "Learner Name", "Academic Year", "Total:", "St. Francis")
    rows = []
    current = None

    for line in text.splitlines():
        if any(marker in line for marker in skip):
            continue
        if re.match(r"^\s*\d+\s+", line):
            if current:
                rows.append(current)
            current = {key: [] for key in keys}
        if current:
            for key, start, end in zip(keys, starts, starts[1:]):
                value = line[start:end].strip()
                if value:
                    current[key].append(value)

    if current:
        rows.append(current)

    def clean(parts: list[str]) -> str:
        value = re.sub(r"\s+", " ", " ".join(parts)).strip()
        return value.replace("Kindergarte n", "Kindergarten")

    return {(normalize(clean(row["learnerName"])), clean(row["grade"])) for row in rows}


def read_curated_csv_rows(pdf_keys: set[tuple[str, str]]) -> list[dict[str, str]]:
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))

    best_by_learner: dict[tuple[str, str], dict[str, str]] = {}
    for row in rows:
        if "test" in row["student_name"].lower():
            continue
        key = (normalize(row["student_name"]), row["level"])
        current = best_by_learner.get(key)
        if current is None or (bool(row["parent_email"]), row["updated_at"]) > (
            bool(current["parent_email"]),
            current["updated_at"],
        ):
            best_by_learner[key] = row

    return [best_by_learner[key] for key in sorted(pdf_keys, key=lambda item: grade_sort(item[1]) + (item[0],))]


def grade_sort(level: str) -> tuple[int, str]:
    if level == "Nursery":
        return (0, level)
    if level == "Kindergarten":
        return (1, level)
    match = re.search(r"(\d+)", level)
    if match:
        return (1 + int(match.group(1)), level)
    return (99, level)


def map_grade(level: str) -> str:
    if level == "Nursery":
        return "Nursery"
    if level == "Kindergarten":
        return "K2"
    match = re.search(r"(\d+)", level)
    return f"G{match.group(1)}" if match else level


def split_name(full_name: str) -> tuple[str, str, str, str]:
    parts = [part.strip() for part in full_name.split(",") if part.strip()]
    suffix = ""
    if len(parts) >= 3:
        last_name = parts[0]
        first_name = parts[1]
        middle_name = " ".join(parts[2:])
    elif len(parts) == 2:
        last_name = parts[0]
        tokens = parts[1].split()
        if len(tokens) > 1:
            first_name = " ".join(tokens[:-1])
            middle_name = tokens[-1]
        else:
            first_name = parts[1]
            middle_name = ""
    else:
        tokens = full_name.split()
        first_name = " ".join(tokens[:-1]) if len(tokens) > 1 else full_name
        middle_name = ""
        last_name = tokens[-1] if len(tokens) > 1 else full_name
    return first_name, middle_name, last_name, suffix


def stable_lrn(row: dict[str, str], index: int) -> str:
    if row["lrn"].strip():
        return row["lrn"].strip()
    source = row["record_id"] or row["registration_id"] or f"{index:03d}"
    return f"NO-LRN-SY2026-2027-{source[:8].upper()}"


def student_no(index: int) -> str:
    return f"SFX-2026-2027-{index:03d}"


def enrollment_status(status: str) -> str:
    return "Officially Enrolled" if status == "enrolled" else "Pending Review"


def document_status(status: str) -> str:
    return "Complete" if status == "enrolled" else "Pending"


def date_to_epoch_ms(value: str | None) -> int | None:
    if not value:
        return None
    return int(datetime.fromisoformat(value).replace(tzinfo=timezone.utc).timestamp() * 1000)


def import_rows(rows: list[dict[str, str]]) -> dict[str, object]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    report = {
        "pdf": str(PDF_PATH),
        "csv": str(CSV_PATH),
        "academicYear": "SY2026-2027",
        "totalPdfRows": len(rows),
        "created": 0,
        "updated": 0,
        "inconsistencies": [],
        "gradeMappings": {},
        "statusMappings": {"enrolled": "Officially Enrolled", "pending": "Pending Review"},
    }

    academic_year = conn.execute("SELECT id FROM AcademicYear WHERE code = ?", ("SY2026-2027",)).fetchone()
    if not academic_year:
        raise RuntimeError("Academic year SY2026-2027 does not exist.")

    for index, row in enumerate(rows, start=1):
        first_name, middle_name, last_name, suffix = split_name(row["student_name"])
        original_grade = row["level"]
        grade = map_grade(original_grade)
        report["gradeMappings"][original_grade] = grade
        lrn = stable_lrn(row, index)
        generated_lrn = not row["lrn"].strip()
        if generated_lrn:
            report["inconsistencies"].append(
                {"row": index, "student": row["student_name"], "field": "lrn", "issue": f"Missing LRN; generated {lrn}"}
            )
        if not row["parent_email"].strip():
            report["inconsistencies"].append(
                {"row": index, "student": row["student_name"], "field": "parent_email", "issue": "Missing parent email"}
            )
        if not row["birth_date"].strip():
            report["inconsistencies"].append(
                {"row": index, "student": row["student_name"], "field": "birth_date", "issue": "Missing birth date"}
            )

        existing = conn.execute("SELECT id FROM Student WHERE lrn = ?", (lrn,)).fetchone()
        values = {
            "id": existing["id"] if existing else str(uuid.uuid4()),
            "studentNo": student_no(index),
            "lrn": lrn,
            "firstName": first_name,
            "middleName": middle_name or None,
            "lastName": last_name,
            "suffix": suffix or None,
            "birthdate": date_to_epoch_ms(row["birth_date"]),
            "gender": row["gender"] or None,
            "gradeLevel": grade,
            "section": row["section"] or None,
            "adviser": None,
            "studentType": "Continuing" if row["previous_school"] == "St. Francis Xavier Smart Academy Inc." else "New",
            "enrollmentStatus": enrollment_status(row["status"]),
            "documentStatus": document_status(row["status"]),
            "financeStatus": "Unassessed",
            "guardian": row["student_emergency_contact_name"] or row["mother_maiden_name"] or row["father_name"] or None,
            "contactNo": row["student_emergency_contact_number"] or row["mobile_number"] or row["mother_contact"] or row["father_contact"] or None,
            "address": row["current_address"] or row["phil_address"] or row["uae_address"] or None,
            "motherName": row["mother_maiden_name"] or None,
            "motherContact": row["mother_contact"] or None,
            "fatherName": row["father_name"] or None,
            "fatherContact": row["father_contact"] or None,
            "phAddress": row["phil_address"] or None,
            "uaeAddress": row["uae_address"] or None,
            "previousSchool": row["previous_school"] or None,
            "lastUpdated": now,
            "academicYearId": academic_year["id"],
        }

        if existing:
            conn.execute(
                """
                UPDATE Student SET
                  studentNo = ?, firstName = ?, middleName = ?, lastName = ?, suffix = ?, birthdate = ?, gender = ?,
                  gradeLevel = ?, section = ?, adviser = ?, studentType = ?, enrollmentStatus = ?, documentStatus = ?,
                  financeStatus = ?, guardian = ?, contactNo = ?, address = ?, motherName = ?, motherContact = ?,
                  fatherName = ?, fatherContact = ?, phAddress = ?, uaeAddress = ?, previousSchool = ?,
                  lastUpdated = ?, academicYearId = ?
                WHERE id = ?
                """,
                (
                    values["studentNo"],
                    values["firstName"],
                    values["middleName"],
                    values["lastName"],
                    values["suffix"],
                    values["birthdate"],
                    values["gender"],
                    values["gradeLevel"],
                    values["section"],
                    values["adviser"],
                    values["studentType"],
                    values["enrollmentStatus"],
                    values["documentStatus"],
                    values["financeStatus"],
                    values["guardian"],
                    values["contactNo"],
                    values["address"],
                    values["motherName"],
                    values["motherContact"],
                    values["fatherName"],
                    values["fatherContact"],
                    values["phAddress"],
                    values["uaeAddress"],
                    values["previousSchool"],
                    values["lastUpdated"],
                    values["academicYearId"],
                    values["id"],
                ),
            )
            report["updated"] += 1
        else:
            conn.execute(
                """
                INSERT INTO Student (
                  id, studentNo, lrn, firstName, middleName, lastName, suffix, birthdate, gender, gradeLevel,
                  section, adviser, studentType, enrollmentStatus, documentStatus, financeStatus, guardian,
                  contactNo, address, motherName, motherContact, fatherName, fatherContact, phAddress, uaeAddress,
                  previousSchool, lastUpdated, academicYearId
                ) VALUES (
                  :id, :studentNo, :lrn, :firstName, :middleName, :lastName, :suffix, :birthdate, :gender, :gradeLevel,
                  :section, :adviser, :studentType, :enrollmentStatus, :documentStatus, :financeStatus, :guardian,
                  :contactNo, :address, :motherName, :motherContact, :fatherName, :fatherContact, :phAddress, :uaeAddress,
                  :previousSchool, :lastUpdated, :academicYearId
                )
                """,
                values,
            )
            report["created"] += 1

    conn.commit()
    report["byStatus"] = dict(
        conn.execute(
            """
            SELECT enrollmentStatus, COUNT(*) AS count FROM Student
            WHERE academicYearId = ?
            GROUP BY enrollmentStatus
            """,
            (academic_year["id"],),
        ).fetchall()
    )
    report["byGrade"] = {
        row["gradeLevel"]: row["count"]
        for row in conn.execute(
            """
            SELECT gradeLevel, COUNT(*) AS count FROM Student
            WHERE academicYearId = ?
            GROUP BY gradeLevel
            ORDER BY gradeLevel
            """,
            (academic_year["id"],),
        ).fetchall()
    }
    conn.close()
    return report


def main() -> None:
    pdf_keys = parse_pdf_keys()
    rows = read_curated_csv_rows(pdf_keys)
    if len(pdf_keys) != 69 or len(rows) != 69:
        raise RuntimeError(f"Expected 69 curated PDF rows, got pdf={len(pdf_keys)} csv={len(rows)}")
    report = import_rows(rows)
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

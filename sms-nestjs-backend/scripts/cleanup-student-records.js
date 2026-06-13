const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function backupPath(label) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = process.env.CLEANUP_BACKUP_DIR || '/root/sfxsai/db-backups';
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${label}-${stamp}.json`);
}

async function deleteStudentsByIds(ids) {
  if (!ids.length) {
    return {
      receiptAudits: { count: 0 },
      payments: { count: 0 },
      assessmentLines: { count: 0 },
      assessments: { count: 0 },
      fees: { count: 0 },
      behavior: { count: 0 },
      siblings: { count: 0 },
      users: { count: 0 },
      logs: { count: 0 },
      students: { count: 0 },
    };
  }

  return prisma.$transaction(async (tx) => {
    const receiptAudits = await tx.paymentReceiptAudit.deleteMany({
      where: { payment: { studentId: { in: ids } } },
    });
    const payments = await tx.payment.deleteMany({
      where: { studentId: { in: ids } },
    });
    const assessmentLines = await tx.studentAssessmentLineItem.deleteMany({
      where: { studentAssessment: { studentId: { in: ids } } },
    });
    const assessments = await tx.studentAssessment.deleteMany({
      where: { studentId: { in: ids } },
    });
    const fees = await tx.studentFee.deleteMany({
      where: { studentId: { in: ids } },
    });
    const behavior = await tx.behaviorRecord.deleteMany({
      where: { studentId: { in: ids } },
    });
    const siblings = await tx.studentSibling.deleteMany({
      where: { studentId: { in: ids } },
    });
    const users = await tx.user.updateMany({
      where: { studentId: { in: ids } },
      data: { studentId: null },
    });
    const logs = await tx.integrationLog.deleteMany({
      where: { studentId: { in: ids } },
    });
    const students = await tx.student.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      receiptAudits,
      payments,
      assessmentLines,
      assessments,
      fees,
      behavior,
      siblings,
      users,
      logs,
      students,
    };
  });
}

async function main() {
  const testStudents = await prisma.student.findMany({
    where: { studentNo: { startsWith: 'STU-2026-' } },
    orderBy: { studentNo: 'asc' },
  });
  const duplicateZia = await prisma.student.findMany({
    where: { studentNo: 'SFX-2026-2027-055' },
  });
  const keepZia = await prisma.student.findMany({
    where: { studentNo: 'SFX-2026-2027-056' },
  });

  const deleteCandidates = [...testStudents, ...duplicateZia];
  const out = backupPath('deleted-student-records');
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        deletedAt: new Date().toISOString(),
        reason:
          'Removed old STU-2026 test learners and duplicate misspelled Zia Daragntes record.',
        keepRecords: keepZia,
        deleteCandidates,
      },
      null,
      2,
    ),
  );

  const result = await deleteStudentsByIds(deleteCandidates.map((student) => student.id));
  const counts = {
    total: await prisma.student.count(),
    sfx: await prisma.student.count({
      where: { studentNo: { startsWith: 'SFX-2026-2027-' } },
    }),
    test: await prisma.student.count({
      where: { studentNo: { startsWith: 'STU-2026-' } },
    }),
    ziaDaragntes: await prisma.student.count({
      where: { studentNo: 'SFX-2026-2027-055' },
    }),
    ziaDargantes: await prisma.student.count({
      where: { studentNo: 'SFX-2026-2027-056' },
    }),
  };

  console.log(JSON.stringify({ backup: out, deleted: deleteCandidates.length, result, counts }, null, 2));
}

async function runWithRetry(attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await main();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

runWithRetry()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

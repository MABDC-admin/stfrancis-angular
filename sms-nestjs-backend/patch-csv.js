const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseCSVLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csvData = fs.readFileSync('C:\\Users\\DENNIS\\Documents\\STUDENTS IN 2025-2026.csv', 'utf8');
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  
  const rows = lines.slice(1);
  let count = 0;

  for (const row of rows) {
    const columns = parseCSVLine(row);
    if (columns.length < 3) continue;
    
    // LEVEL,LRN,STUDENT NAME,BIRTH DATE,AGE,GENDER,MOTHER CONTACT #,MOTHERS MAIDEN NAME,FATHER CONTACT #,FATHER,PHIL. ADDRESS, UAE ADDRESS,PREVIOUS SCHOOL
    const lrn = columns[1];
    if (!lrn) continue;

    const motherContact = columns[6];
    const motherName = columns[7];
    const fatherContact = columns[8];
    const fatherName = columns[9];
    const phAddress = columns[10];
    const uaeAddress = columns[11];
    const previousSchool = columns[12];
    
    try {
      // Find the student by LRN and update them
      await prisma.student.update({
        where: { lrn: lrn },
        data: {
          motherName: motherName || null,
          motherContact: motherContact || null,
          fatherName: fatherName || null,
          fatherContact: fatherContact || null,
          phAddress: phAddress || null,
          uaeAddress: uaeAddress || null,
          previousSchool: previousSchool || null
        }
      });
      count++;
    } catch (e) {
      // Ignored: maybe LRN was empty or not found
    }
  }
  
  console.log(`Successfully patched ${count} students with missing CSV data.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

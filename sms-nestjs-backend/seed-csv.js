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
  
  // Skip header
  const rows = lines.slice(1);
  
  let count = 0;
  for (const row of rows) {
    const columns = parseCSVLine(row);
    if (columns.length < 3) continue;
    
    // LEVEL,LRN,STUDENT NAME,BIRTH DATE,AGE,GENDER,MOTHER CONTACT #,MOTHERS MAIDEN NAME,FATHER CONTACT #,FATHER,PHIL. ADDRESS, UAE ADDRESS,PREVIOUS SCHOOL
    const level = columns[0];
    const lrn = columns[1] || `TEMP-LRN-${Date.now()}-${count}`;
    const nameStr = columns[2];
    const birthDateStr = columns[3];
    const gender = columns[5];
    const contact = columns[6] || columns[8] || '';
    const address = columns[11] || columns[10] || '';
    
    // Parse Name (LASTNAME, FIRSTNAME MIDDLE)
    let lastName = 'Unknown';
    let firstName = nameStr;
    if (nameStr.includes(',')) {
      const parts = nameStr.split(',');
      lastName = parts[0].trim();
      firstName = parts.slice(1).join(',').trim();
    }
    
    // Parse Date
    let birthdate = null;
    if (birthDateStr) {
      try {
        birthdate = new Date(birthDateStr);
      } catch (e) {}
    }

    try {
      await prisma.student.create({
        data: {
          studentNo: `2025-${Math.floor(1000 + Math.random() * 9000)}-${count}`,
          lrn: lrn,
          firstName: firstName,
          lastName: lastName,
          birthdate: birthdate || null,
          gender: gender,
          gradeLevel: level,
          studentType: 'Old',
          enrollmentStatus: 'Enrolled',
          documentStatus: 'Complete',
          financeStatus: 'Cleared',
          contactNo: contact,
          address: address
        }
      });
      count++;
    } catch (e) {
      console.error(`Failed to insert ${nameStr}: ${e.message}`);
    }
  }
  
  console.log(`Successfully inserted ${count} students.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

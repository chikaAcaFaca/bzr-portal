
import { type Employee, type JobPosition, type Company } from '@shared/schema';

interface FormData {
  company?: Company;
  employee?: Employee;
  jobPosition?: JobPosition;
  date?: Date;
  [key: string]: any;
}

export class DocumentTemplateService {
  static generateObrazac1(data: FormData) {
    return `
IZVEŠTAJ O POVREDI NA RADU
${data.company?.name || ''}

1. PODACI O POSLODAVCU
Poslovno ime: ${data.company?.name || ''}
PIB: ${data.company?.taxId || ''}
Matični broj: ${data.company?.registrationNumber || ''}
Adresa sedišta: ${data.company?.address || ''}

2. PODACI O ZAPOSLENOM
Ime i prezime: ${data.employee?.firstName} ${data.employee?.lastName}
JMBG: ${data.employee?.personalIdNumber || ''}
Radno mesto: ${data.jobPosition?.title || ''}
`;
  }

  static generateObrazac6(data: FormData) {
    return `
EVIDENCIJA O ZAPOSLENIMA OSPOSOBLJENIM ZA BEZBEDAN I ZDRAV RAD

1. PODACI O POSLODAVCU
Poslovno ime: ${data.company?.name || ''}
PIB: ${data.company?.taxId || ''}

2. PODACI O ZAPOSLENOM
Ime i prezime: ${data.employee?.firstName} ${data.employee?.lastName}
Datum obuke: ${data.date ? new Date(data.date).toLocaleDateString('sr-RS') : ''}
Radno mesto: ${data.jobPosition?.title || ''}
`;
  }

  // Dodati ostale obrasce na sličan način
}

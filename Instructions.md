# BZR-Portal.com - План имплементације и анализа система

## Анализа тренутног стања система

### 1. Архитектура базе података

Након анализе `shared/schema.ts` файла, уочено је да постоји добра база модела, укључујући:
- Компаније (`companies`)
- Кориснике (`users`)
- Документе (`baseDocuments`, `clientDocuments`, `generatedDocuments`)
- Радна места и систематизацију (`jobPositions`, `jobDescriptions`)
- Ризике и мере безбедности (`risks`, `safetyMeasures`)
- Обуке и тренинге (`trainingTypes`, `employeeTrainings`)
- Чланке и блог постове (`blogPosts`)

Недавно су додати модели за клијентске документе (`clientDocuments`) и генерисане документе (`generatedDocuments`), што је солидна основа за имплементацију захтеваних функционалности.

### 2. Имплементирани подсистеми

- **AI асистент**: Основна верзија је имплементирана у `server/services/ai-agent-service.ts` и рути `server/routes/ai-agent-routes.ts`
- **Блог**: Имплементиран у `client/src/pages/blog-post.tsx` и `server/routes/blog-routes.ts`
- **Управљање базним документима**: Делимично имплементирано

### 3. Кључни проблеми који се морају решити

- **Управљање корисничким документима**: Недостаје имплементација интерфејса, рута и компоненти за отпремање и обраду документа
- **Приватни кориснички простор**: Потребно имплементирати приватни простор на Wasabi сторагу
- **Обрада докумената помоћу AI-а**: Недостаје имплементација аутоматске анализе, обраде и генерисања докумената
- **Календар обавеза**: Недостаје модел и имплементација система за праћење и обавештавање о обавезама
- **Системске нотификације**: Потребно имплементирати систем нотификација

## План имплементације

### 1. Wasabi storage имплементација

#### Потребне компоненте:
- `server/services/wasabi-storage-service.ts` - имплементирати сервис за интеракцију са Wasabi API-јем
- Конфигурисати два одвојена bucket-а:
  - `bzr-knowledge-base-bucket` - за базу знања, прописе и општа документа
  - `bzr-user-documents-bucket` - за приватне документе корисника

#### Препоручена имплементација:
```typescript
export class WasabiStorageService {
  private s3Client: S3Client;
  private knowledgeBaseBucket: string;
  private userDocumentsBucket: string;

  constructor() {
    // Иницијализација S3 клијента са Wasabi креденцијалима
    this.s3Client = new S3Client({
      region: "eu-west-2", // France регион
      endpoint: "https://s3.eu-west-2.wasabisys.com",
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!
      }
    });
    
    this.knowledgeBaseBucket = process.env.WASABI_KNOWLEDGE_BASE_BUCKET!;
    this.userDocumentsBucket = process.env.WASABI_USER_DOCUMENTS_BUCKET!;
  }

  // Методе за отпремање фајлова у базу знања
  async uploadToKnowledgeBase(file: Buffer, key: string, metadata: Record<string, string> = {}): Promise<string> {...}

  // Методе за отпремање корисничких докумената (са приватним правима приступа)
  async uploadUserDocument(userId: string, file: Buffer, filename: string, metadata: Record<string, string> = {}): Promise<string> {...}

  // Преузимање фајлова
  async getUserDocument(userId: string, key: string): Promise<Buffer> {...}
  async getKnowledgeBaseDocument(key: string): Promise<Buffer> {...}

  // Брисање докумената
  async deleteUserDocument(userId: string, key: string): Promise<void> {...}
  
  // Генерисање URL-а са временским ограничењем (presigned URL)
  async generatePresignedUrl(userId: string, key: string, expiresIn: number = 3600): Promise<string> {...}
}
```

### 2. Управљање корисничким документима

#### Потребне компоненте:
- `server/routes/document-routes.ts` - руте за отпремање, преузимање и управљање документима
- `client/src/pages/documents.tsx` - страница за управљање документима
- `client/src/components/document-upload-form.tsx` - формулар за отпремање докумената
- `client/src/components/document-list.tsx` - компонента за приказ листе докумената

#### Препоручена имплементација руте:
```typescript
// server/routes/document-routes.ts
router.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const { title, description, documentType, companyId } = req.body;
    const file = req.file;
    
    // Отпремање на Wasabi
    const wasabiPath = await wasabiStorageService.uploadUserDocument(
      req.user.id,
      file.buffer,
      file.originalname
    );
    
    // Креирање записа у бази
    const document = await storage.createClientDocument({
      userId: req.user.id,
      companyId: parseInt(companyId),
      title,
      description,
      documentType,
      wasabiPath,
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      isProcessed: false
    });
    
    // Асинхроно покретање обраде документа
    processDocumentAsync(document.id);
    
    res.status(201).json({ success: true, document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
});
```

### 3. AI обрада докумената

#### Потребне компоненте:
- `server/services/document-processor-service.ts` - сервис за екстракцију и анализу текста из докумената
- `server/services/document-generator-service.ts` - сервис за генерисање докумената који недостају
- Проширити `server/services/ai-agent-service.ts` за обраду докумената

#### Препоручена имплементација процесора докумената:
```typescript
export class DocumentProcessorService {
  // Извлачи текст из PDF-а, DOCX-а или других формата
  async extractText(filePath: string, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPdf(filePath);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractFromDocx(filePath);
      // Други формати...
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }
  
  // Анализира документ и одређује тип, релевантне информације
  async analyzeDocument(text: string): Promise<DocumentAnalysisResult> {
    const aiResponse = await aiAgentService.analyzeDocumentText(text);
    return {
      documentType: aiResponse.documentType,
      extractedEntities: aiResponse.entities,
      missingDocuments: aiResponse.missingDocuments,
      recommendedActions: aiResponse.recommendedActions
    };
  }
  
  // Асинхрона обрада документа
  async processDocumentAsync(documentId: number): Promise<void> {
    try {
      const document = await storage.getClientDocument(documentId);
      if (!document) throw new Error('Document not found');
      
      // Преузимање документа са Wasabi-ја
      const fileBuffer = await wasabiStorageService.getUserDocument(
        document.userId.toString(), 
        document.wasabiPath
      );
      
      // Привремено чување и екстракција текста
      const tempPath = `/tmp/${document.id}_${document.originalFilename}`;
      await fs.promises.writeFile(tempPath, fileBuffer);
      const extractedText = await this.extractText(tempPath, document.mimeType);
      
      // Анализа документа
      const analysis = await this.analyzeDocument(extractedText);
      
      // Ажурирање статуса документа
      await storage.markClientDocumentAsProcessed(
        document.id, 
        extractedText, 
        JSON.stringify(analysis)
      );
      
      // Ако су идентификовани документи који недостају, генерисати их
      if (analysis.missingDocuments && analysis.missingDocuments.length > 0) {
        await documentGeneratorService.scheduleDocumentGeneration(
          document.userId,
          document.companyId,
          analysis.missingDocuments,
          [document.id]
        );
      }
      
      // Чишћење привременог фајла
      await fs.promises.unlink(tempPath);
    } catch (error) {
      console.error('Error processing document:', error);
      // Логовање грешке и обавештавање корисника
    }
  }
}
```

### 4. Календар обавеза

#### Потребне компоненте:
- Додати модел `obligations` у `shared/schema.ts`
- `server/services/obligation-service.ts` - сервис за управљање обавезама
- `client/src/pages/calendar.tsx` - страница календара
- `client/src/components/calendar-widget.tsx` - виџет за календар

#### Предложена имплементација модела обавеза:
```typescript
export const obligationTypeEnum = pgEnum('obligation_type', [
  'lekarski_pregled',
  'obuka',
  'revizija_dokumenta',
  'inspekcija',
  'izvestavanje',
  'ostalo'
]);

export const obligationStatusEnum = pgEnum('obligation_status', [
  'zakazano',
  'u_toku',
  'zavrseno',
  'otkazano',
  'isteklo'
]);

export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  obligationType: obligationTypeEnum("obligation_type").notNull(),
  status: obligationStatusEnum("obligation_status").notNull().default('zakazano'),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  recurrenceRule: text("recurrence_rule"), // iCal формат правила понављања
  notifyDaysBefore: integer("notify_days_before"),
  relatedDocumentIds: integer("related_document_ids").array(),
  relatedEmployeeIds: integer("related_employee_ids").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 5. Системске нотификације

#### Потребне компоненте:
- Додати модел `notifications` у `shared/schema.ts`
- `server/services/notification-service.ts` - сервис за слање нотификација
- `client/src/components/notification-center.tsx` - компонента за приказ нотификација

#### Предложена имплементација модела нотификација:
```typescript
export const notificationTypeEnum = pgEnum('notification_type', [
  'obaveza',
  'dokument',
  'zakonska_izmena',
  'sistemska_poruka'
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

## Анализа потенцијалних проблема и изазова

### 1. Интеграција са Wasabi сторагом

**Проблем**: Потребно је обезбедити сигурну и ефикасну интеграцију са Wasabi сторагом како би сваки корисник имао изоловани приватни простор за своје документе.

**Решење**: 
- Имплементирати структуру стаза (path) која укључује ID корисника: `/user_documents/{user_id}/document.pdf`
- Користити AWS SDK за S3 компатибилни приступ (Wasabi је S3 компатибилан)
- Имплементирати механизам кеширања за често коришћене документе

### 2. AI обрада и анализа докумената

**Проблем**: Обрада докумената може бити временски захтевна и интензивна за ресурсе, посебно за веће документе.

**Решење**:
- Имплементирати асинхрони систем обраде докумената
- Користити queue систем за обраду докумената у позадини
- Имплементирати механизам извештавања о напретку

### 3. Приватност и безбедност података

**Проблем**: Кориснички документи садрже осетљиве податке који морају бити заштићени у складу са GDPR-ом.

**Решење**:
- Осигурати да су документи приватни и доступни само власнику
- Имплементирати строгу ауторизацију за приступ документима
- Логовати све операције са документима ради ревизије
- Обезбедити безбедну енкрипцију података у транзиту и у мировању

### 4. Скалабилност система

**Проблем**: Систем мора да подржи велики број корисника, докумената и операција без деградације перформанси.

**Решење**:
- Имплементирати систем кеширања за честе операције
- Оптимизовати упите базе података
- Пагинација резултата за велике сетове података
- Имплементирати rate limiting за API позиве

## Приоритети за имплементацију

1. **Wasabi интеграција и управљање документима**
   - Имплементација WasabiStorageService
   - Креирање рута за отпремање и преузимање докумената
   - Имплементација форме за отпремање докумената

2. **AI обрада докумената**
   - Имплементација екстракције текста из докумената
   - Имплементација анализе садржаја докумената
   - Генерисање докумената који недостају на основу анализе

3. **Календар обавеза**
   - Имплементација модела обавеза
   - Креирање сервиса за управљање обавезама
   - Креирање календарског интерфејса

4. **Системске нотификације**
   - Имплементација модела нотификација
   - Креирање сервиса за слање нотификација
   - Имплементација компоненте за приказ нотификација

## Закључак

BZR-Portal.com има добру основу у тренутној имплементацији, али захтева додатни рад на неколико кључних подсистема. Главни изазови су интеграција са Wasabi сторагом, имплементација AI обраде докумената и осигуравање приватности и безбедности корисничких података.

План имплементације фокусира се најпре на основну функционалност управљања документима, након чега следи имплементација напреднијих функционалности попут AI анализе, календара обавеза и системских нотификација.

Реализацијом овог плана, BZR-Portal.com ће постати свеобухватно решење за стручњаке из области безбедности и здравља на раду, омогућавајући им да ефикасно управљају документацијом, автоматизују процесе и благовремено испуњавају своје законске обавезе.
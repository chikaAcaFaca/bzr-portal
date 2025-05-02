import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { transliterate, transliterateFileName, needsTransliteration } from '@/lib/transliterate';
import { FileIcon, Copy, Check, RefreshCw, Download, AlertTriangle } from 'lucide-react';

/**
 * Компонента транслитератора која помаже при отпремању датотека
 * тако што конвертује ћириличне и латиничне карактере са дијакритиком
 * на енглеску латиницу (ASCII карактере).
 */
export function FileTransliterator() {
  const [inputText, setInputText] = useState('');
  const [transliteratedText, setTransliteratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [transliteratedNames, setTransliteratedNames] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  // Ефекат који ресетује статус копирања након 2 секунде
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  // Ажурирање транслитерираног текста када се унос промени
  useEffect(() => {
    setTransliteratedText(transliterate(inputText));
  }, [inputText]);

  // Функција за обраду отпремљених датотека
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    
    // Транслитерација имена датотека
    const names = fileArray.map(file => {
      return transliterateFileName(file.name);
    });
    
    setTransliteratedNames(names);
    
    // Провера да ли постоје имена која захтевају транслитерацију
    const needsWarning = fileArray.some(file => needsTransliteration(file.name));
    setShowWarning(needsWarning);
  };

  // Функција за копирање транслитерираног текста
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transliteratedText);
    setCopied(true);
  };

  // Преузимање скрипте за транслитерацију
  const downloadTransliterationScript = () => {
    const script = `#!/usr/bin/env node

/**
 * Скрипта за транслитерацију имена фајлова са ћирилице/латинице на енглеску латиницу
 * 
 * Употреба:
 * node transliterate-files.js <путања-до-директоријума>
 * 
 * Пример:
 * node transliterate-files.js ./dokumenti
 */

const fs = require('fs');
const path = require('path');

// Мапа за конверзију ћириличних и латиничних карактера
const characterMap = {
  // Ћирилична слова
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'DJ', 'Е': 'E', 'Ж': 'Z', 
  'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'LJ', 'М': 'M', 'Н': 'N', 
  'Њ': 'NJ', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'C', 'У': 'U', 
  'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C', 'Џ': 'DZ', 'Ш': 'S',

  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z', 
  'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 
  'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u', 
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'џ': 'dz', 'ш': 's',

  // Латинична слова са дијакритичким знаковима
  'Č': 'C', 'Ć': 'C', 'Đ': 'DJ', 'Š': 'S', 'Ž': 'Z', 
  'č': 'c', 'ć': 'c', 'đ': 'dj', 'š': 's', 'ž': 'z'
};

/**
 * Функција за транслитерацију текста из ћирилице/латинице са дијакритиком у енглеску латиницу
 * @param {string} text Улазни текст за транслитерацију
 * @returns {string} Транслитерисани текст
 */
function transliterate(text) {
  return text
    .split('')
    .map(char => characterMap[char] || char)
    .join('');
}

/**
 * Функција за проверу да ли име фајла садржи ћириличне или специјалне латиничне карактере
 * @param {string} fileName Име фајла за проверу
 * @returns {boolean} true ако име фајла садржи специјалне карактере који би требало транслитерисати
 */
function needsTransliteration(fileName) {
  for (const char of fileName) {
    if (characterMap[char]) {
      return true;
    }
  }
  return false;
}

/**
 * Рекурзивно преименовање свих фајлова у директоријуму и поддиректоријумима
 * @param {string} directoryPath Путања до директоријума
 * @param {boolean} recursive Да ли да се рекурзивно обрађују поддиректоријуми
 */
function processDirectory(directoryPath, recursive = true) {
  if (!fs.existsSync(directoryPath)) {
    console.error(\`Директоријум не постоји: \${directoryPath}\`);
    return 0;
  }

  const files = fs.readdirSync(directoryPath);
  let filesTransliterated = 0;

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && recursive) {
      // Рекурзивно обради поддиректоријуме
      const dirName = path.basename(filePath);
      
      if (needsTransliteration(dirName)) {
        const newDirName = transliterate(dirName);
        const newDirPath = path.join(directoryPath, newDirName);
        
        if (dirName !== newDirName && !fs.existsSync(newDirPath)) {
          fs.renameSync(filePath, newDirPath);
          console.log(\`Директоријум преименован: \${dirName} -> \${newDirName}\`);
          filesTransliterated++;
          // Настави обраду са новим именом директоријума
          filesTransliterated += processDirectory(newDirPath, recursive);
        } else {
          // Настави обраду са оригиналним именом директоријума
          filesTransliterated += processDirectory(filePath, recursive);
        }
      } else {
        // Настави обраду са оригиналним именом директоријума
        filesTransliterated += processDirectory(filePath, recursive);
      }
    } else if (stats.isFile()) {
      // Обради фајл
      const fileName = path.basename(filePath);
      
      if (needsTransliteration(fileName)) {
        const newFileName = transliterate(fileName);
        const newFilePath = path.join(directoryPath, newFileName);
        
        if (fileName !== newFileName && !fs.existsSync(newFilePath)) {
          fs.renameSync(filePath, newFilePath);
          console.log(\`Фајл преименован: \${fileName} -> \${newFileName}\`);
          filesTransliterated++;
        }
      }
    }
  }

  return filesTransliterated;
}

// Главна функција
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Употреба: node transliterate-files.js <путања-до-директоријума> [--no-recursive]');
    console.log('Опције:');
    console.log('  --no-recursive    Не обрађуј поддиректоријуме рекурзивно');
    return;
  }
  
  const directoryPath = args[0];
  const recursive = !args.includes('--no-recursive');
  
  console.log(\`Започињем транслитерацију имена фајлова у директоријуму: \${directoryPath}\`);
  console.log(\`Рекурзивна обрада: \${recursive ? 'Да' : 'Не'}\`);
  
  try {
    const filesTransliterated = processDirectory(directoryPath, recursive);
    console.log(\`Завршено! Укупно преименовано фајлова: \${filesTransliterated}\`);
  } catch (error) {
    console.error('Дошло је до грешке:', error.message);
  }
}

main();`;

    const blob = new Blob([script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transliterate-files.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Транслитератор имена фајлова</CardTitle>
        <CardDescription>
          Помоћ при отпремању датотека са ћириличним или латиничним именима
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showWarning && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Упозорење</AlertTitle>
            <AlertDescription>
              Отпремљени фајлови садрже ћириличне или латиничне карактере са дијакритиком у имену.
              Предлажемо да преименујете фајлове или користите алат за транслитерацију пре отпремања.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="text">
          <TabsList className="mb-4">
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger value="files">Фајлови</TabsTrigger>
            <TabsTrigger value="tools">Алати</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="input-text" className="text-sm font-medium">Унесите текст за транслитерацију:</label>
                <Input
                  id="input-text"
                  placeholder="Унесите ћирилични или латинични текст... (нпр. Опис послова.docx)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              
              {transliteratedText && (
                <div className="space-y-2">
                  <label htmlFor="output-text" className="text-sm font-medium">Транслитерирани текст:</label>
                  <div className="p-2 border rounded-md bg-muted flex justify-between items-center">
                    <div className="mr-2 break-all">{transliteratedText}</div>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard} className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => document.getElementById('file-input')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Превуците фајлове овде или кликните да изаберете фајлове
                </p>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Резултати транслитерације:</h3>
                  <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0 grid grid-cols-1 gap-1">
                        <div className="text-sm">
                          <span className="font-medium">Оригинално име:</span> {file.name}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Транслитерисано име:</span> {transliteratedNames[index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tools">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Преузмите скрипту за транслитерацију имена фајлова коју можете користити на вашем рачунару
                пре отпремања фајлова на портал.
              </p>
              
              <Button onClick={downloadTransliterationScript}>
                <Download className="mr-2 h-4 w-4" />
                Преузми Node.js скрипту
              </Button>
              
              <div className="pt-2 border-t mt-4">
                <h3 className="text-sm font-medium mb-2">Како користити скрипту:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Сачувајте скрипту као <code>transliterate-files.js</code></li>
                  <li>Отворите командну линију у фолдеру где се налази скрипта</li>
                  <li>Извршите команду: <code>node transliterate-files.js путања/до/вашег/директоријума</code></li>
                  <li>Скрипта ће аутоматски преименовати све фајлове са ћириличним или дијакритичким именима</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        <p>
          Овај алат помаже да решите проблеме са именима фајлова који садрже ћириличне или латиничне карактере са дијакритиком,
          што може довести до проблема при приказу или преузимању.
        </p>
      </CardFooter>
    </Card>
  );
}
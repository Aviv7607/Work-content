// הגדרת שם מפתח לשמירת הנתונים ב-localStorage
const STORAGE_KEY = 'workContentHistory';

// משתנה גלובלי לשמירת המזהה של הפרויקט הנוכחי
let currentProjectId = null;

// וידוא שהמסמך נטען
document.addEventListener('DOMContentLoaded', function() {
    console.log("המסמך נטען בהצלחה");
    
    // הוספת האזנה לשינויים בשדות סוג בקר וסוג צג
    setupOtherFields();
    
    // טעינת ההיסטוריה מ-localStorage
    loadHistoryFromStorage();
    
    // מאזין לאירוע לחיצה על הכפתור ליצירת PDF
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', function() {
            generatePDFSimple();
        });
        console.log("מאזין לכפתור PDF הוגדר");
    }
    
    // מאזין לאירוע לחיצה על הכפתור לייצוא לאקסל
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToCSVWithTemplate);
        console.log("מאזין לכפתור אקסל הוגדר");
    }
    
    // מאזין לאירוע לחיצה על הכפתור לשמירה
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (saveCurrentFormToHistory()) {
                if (currentProjectId) {
                    showMessage('הפרויקט עודכן בהצלחה', 'success');
                } else {
                    showMessage('הנתונים נשמרו למאגר בהצלחה', 'success');
                }
            }
        });
        console.log("מאזין לכפתור שמירה הוגדר");
    }
    
    // מאזין לאירוע לחיצה על הכפתור לסינון היסטוריה
    const historyFilterBtn = document.getElementById('historyFilterBtn');
    if (historyFilterBtn) {
        historyFilterBtn.addEventListener('click', filterHistoryTable);
    }
    
    // מאזין לאירוע לחיצה על הכפתור לניקוי סינון היסטוריה
    const historyClearFilterBtn = document.getElementById('historyClearFilterBtn');
    if (historyClearFilterBtn) {
        historyClearFilterBtn.addEventListener('click', clearHistoryFilter);
    }
    
    // מאזין לאירוע לחיצה על כפתור ניקוי טופס
    const resetFormBtn = document.getElementById('resetForm');
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', function() {
            // איפוס המזהה הנוכחי
            currentProjectId = null;
            document.getElementById('quoteForm').reset();
            // הסתרת שדות האחר
            document.getElementById('otherControllerField').classList.remove('visible');
            document.getElementById('otherDisplayField').classList.remove('visible');
            updatePreview();
            showMessage('הטופס נוקה', 'info');
        });
    }
    
    // מאזין לשינויים בטופס עבור תצוגה מקדימה - בגישה משופרת
    setupLivePreview();
    
    // עדכון תצוגה מקדימה באופן אוטומטי בטעינת הדף
    updatePreview();
    
    // הוספת האזנה לחיפוש באמצעות מקש Enter
    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                filterHistoryTable();
            }
        });
    }
    
    // הוסף מאזין לחיצה על שורה בטבלת ההיסטוריה
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // בדיקה אם לחצו על כפתור צפייה או מחיקה
        if (target.classList.contains('action-btn')) {
            const recordId = target.dataset.id;
            
            if (target.classList.contains('view') && recordId) {
                loadHistoryRecord(recordId);
            } else if (target.classList.contains('delete') && recordId) {
                if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
                    deleteHistoryRecord(recordId);
                }
            }
        }
    });
});

/**
 * פונקציה להגדרת שדות "אחר" בסוג בקר וסוג צג
 */
function setupOtherFields() {
    // הגדרת האזנה לשינוי בסוג בקר
    const controllerTypeSelect = document.getElementById('controllerType');
    const otherControllerField = document.getElementById('otherControllerField');
    const otherControllerInput = document.getElementById('otherControllerType');
    
    if (controllerTypeSelect && otherControllerField && otherControllerInput) {
        controllerTypeSelect.addEventListener('change', function() {
            if (this.value === 'אחר') {
                otherControllerField.classList.add('visible');
                otherControllerInput.focus();
            } else {
                otherControllerField.classList.remove('visible');
                otherControllerInput.value = '';
            }
            // עדכון תצוגה מקדימה
            updatePreview();
        });
        
        // גם כאשר משנים את הערך בשדה הנוסף
        otherControllerInput.addEventListener('input', updatePreview);
    }
    
    // הגדרת האזנה לשינוי בסוג צג
    const displayTypeSelect = document.getElementById('displayType');
    const otherDisplayField = document.getElementById('otherDisplayField');
    const otherDisplayInput = document.getElementById('otherDisplayType');
    
    if (displayTypeSelect && otherDisplayField && otherDisplayInput) {
        displayTypeSelect.addEventListener('change', function() {
            if (this.value === 'אחר') {
                otherDisplayField.classList.add('visible');
                otherDisplayInput.focus();
            } else {
                otherDisplayField.classList.remove('visible');
                otherDisplayInput.value = '';
            }
            // עדכון תצוגה מקדימה
            updatePreview();
        });
        
        // גם כאשר משנים את הערך בשדה הנוסף
        otherDisplayInput.addEventListener('input', updatePreview);
    }
}

/**
 * פונקציה להגדרת עדכון בזמן אמת לתצוגה מקדימה
 */
function setupLivePreview() {
    // מאזין לשינויים בשדות טקסט ובחירה
    const textInputs = document.querySelectorAll('input[type="text"], textarea, select');
    textInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });
    
    // מאזין לשינויים בתיבות סימון
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePreview);
    });
    
    console.log("עדכון בזמן אמת לתצוגה מקדימה הוגדר");
}

/**
 * פונקציה לעדכון התצוגה המקדימה
 */
function updatePreview() {
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    
    // הצגת אזור התצוגה המקדימה
    previewSection.classList.remove('hidden');
    
    // קבלת כל הערכים מהטופס
    const formData = getFormData();
    
    // יצירת כותרת דינמית בהתאם לשם האתר ומספר הסימוכין
    let title = 'תכולת עבודה - פיקוד מקומי';
    if (formData.siteName) {
        title = formData.siteName;
        if (formData.ourReference) {
            title += ' - ' + formData.ourReference;
        }
    }
    
    // יצירת שורת דרישות תוכנה - רק מה שנבחר
    let softwareRequirements = [];
    
    if (formData.requireFieldSoftware) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">נדרש גיבוי תוכנה מהשטח/חומר טכני</div>
            </div>
        `);
    }
    
    if (formData.requireNewSoftware) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">כתיבת תוכנה חדשה</div>
            </div>
        `);
    }
    
    if (formData.requireProfibus) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">נדרש רשימת פרופיבס/פרופינט</div>
            </div>
        `);
    }
    
    if (formData.requireTPM) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">נדרש תפ"מ</div>
            </div>
        `);
    }
    
    if (formData.controllerType) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">סוג בקר:</div>
                <div class="pdf-value">${formData.controllerType}</div>
            </div>
        `);
    }
    
    if (formData.displayType) {
        softwareRequirements.push(`
            <div class="pdf-row">
                <div class="pdf-label">סוג צג:</div>
                <div class="pdf-value">${formData.displayType}</div>
            </div>
        `);
    }

    // קבלת התאריך הנוכחי
    const today = new Date();
    const formattedDate = formatDate(today);

    // יצירת תוכן התצוגה המקדימה
    const previewHTML = `
        <div class="pdf-container">
            <div class="pdf-header">
                <div class="company-logo">
                    <img src="company_logo.png" alt="לוגו חברה" class="company-logo-img" onerror="this.style.display='none'">
                </div>
                <div class="pdf-date">${formattedDate}</div>
                <h1>${title}</h1>
            </div>
            
            <div class="pdf-section">
                <h2>פרטי הפרויקט</h2>
                <div class="pdf-row">
                    <div class="pdf-label">שם האתר:</div>
                    <div class="pdf-value">${formData.siteName || ''}</div>
                </div>
                <div class="pdf-row">
                    <div class="pdf-label">מרחב:</div>
                    <div class="pdf-value">${formData.space || ''}</div>
                </div>
                ${formData.softwareProduction ? `
                <div class="pdf-row">
                    <div class="pdf-label">גיליון ייצור תוכנה:</div>
                    <div class="pdf-value">${formData.softwareProduction}</div>
                </div>
                ` : ''}
                ${formData.displayProduction ? `
                <div class="pdf-row">
                    <div class="pdf-label">גיליון ייצור צג:</div>
                    <div class="pdf-value">${formData.displayProduction}</div>
                </div>
                ` : ''}
            </div>
            
            ${softwareRequirements.length > 0 ? `
            <div class="pdf-section">
                <h2>דרישות תוכנה</h2>
                ${softwareRequirements.join('')}
            </div>
            ` : ''}
            
            ${formData.workContent ? `
            <div class="pdf-section">
                <h2>תכולת העבודה</h2>
                <div class="pdf-row">
                    <div class="pdf-value">${formatTextWithLineBreaks(formData.workContent)}</div>
                </div>
            </div>
            ` : ''}
            
            ${formData.notes || formData.difficultyLevel ? `
            <div class="pdf-section">
                <h2>המלצות / הערות</h2>
                ${formData.notes ? `
                <div class="pdf-row">
                    <div class="pdf-label">הערות:</div>
                    <div class="pdf-value">${formatTextWithLineBreaks(formData.notes)}</div>
                </div>
                ` : ''}
                ${formData.difficultyLevel ? `
                <div class="pdf-row">
                    <div class="pdf-label">רמת קושי:</div>
                    <div class="pdf-value">${formData.difficultyLevel}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
    `;
    
    previewContent.innerHTML = previewHTML;
}

/**
 * פונקציה לקבלת כל הנתונים מהטופס כאובייקט
 */
function getFormData() {
    // קבלת הערכים הבסיסיים
    const formData = {
        siteName: document.getElementById('siteName')?.value || '',
        ourReference: document.getElementById('ourReference')?.value || '',
        space: document.getElementById('space')?.value || '',
        softwareProduction: document.getElementById('softwareProduction')?.value || '',
        displayProduction: document.getElementById('displayProduction')?.value || '',
        requireFieldSoftware: document.getElementById('requireFieldSoftware')?.checked || false,
        requireNewSoftware: document.getElementById('requireNewSoftware')?.checked || false,
        requireProfibus: document.getElementById('requireProfibus')?.checked || false,
        requireTPM: document.getElementById('requireTPM')?.checked || false,
        workContent: document.getElementById('workContent')?.value || '',
        notes: document.getElementById('notes')?.value || '',
        difficultyLevel: document.getElementById('difficultyLevel')?.value || ''
    };
    
    // טיפול בשדות סוג בקר
    const controllerType = document.getElementById('controllerType')?.value || '';
    if (controllerType === 'אחר') {
        const otherControllerValue = document.getElementById('otherControllerType')?.value || '';
        formData.controllerType = otherControllerValue ? `אחר: ${otherControllerValue}` : 'אחר';
    } else {
        formData.controllerType = controllerType;
    }
    
    // טיפול בשדות סוג צג
    const displayType = document.getElementById('displayType')?.value || '';
    if (displayType === 'אחר') {
        const otherDisplayValue = document.getElementById('otherDisplayType')?.value || '';
        formData.displayType = otherDisplayValue ? `אחר: ${otherDisplayValue}` : 'אחר';
    } else {
        formData.displayType = displayType;
    }
    
    return formData;
}

/**
 * פונקציה לפורמט תאריך לתצוגה נוחה יותר
 */
function formatDate(dateObj) {
    if (!dateObj) return '';
    
    return dateObj.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * פונקציה לפורמט טקסט עם שמירה על שורות חדשות
 */
function formatTextWithLineBreaks(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}

/**
 * פונקציה פשוטה ליצירת PDF עם מינימום תלויות
 */
function generatePDFSimple() {
    try {
        showMessage('יוצר PDF... אנא המתן', 'info');
        
        // המרת התוכן ל-HTML שלם
        const formData = getFormData();
        const printContent = document.getElementById('previewContent').innerHTML;
        
        // יצירת חלון חדש להדפסה
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="he" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>תכולת עבודה - ${formData.siteName || 'פרויקט'}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        direction: rtl;
                    }
                    .pdf-container {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: white;
                    }
                    .pdf-header {
                        text-align: center;
                        margin-bottom: 20px;
                        position: relative;
                        padding-top: 20px;
                    }
                    .pdf-header h1 {
                        color: #2c5282;
                        margin-bottom: 8px;
                    }
                    .pdf-date {
                        position: absolute;
                        top: 0;
                        left: 0;
                        font-weight: bold;
                    }
                    .company-logo {
                        position: absolute;
                        top: 0;
                        right: 0;
                    }
                    .company-logo-img {
                        max-width: 200px;
                        max-height: 80px;
                    }
                    .pdf-section {
                        margin-bottom: 20px;
                    }
                    .pdf-section h2 {
                        color: #2c5282;
                        margin-bottom: 16px;
                        padding-bottom: 4px;
                        border-bottom: 1px solid #63b3ed;
                    }
                    .pdf-row {
                        display: flex;
                        margin-bottom: 8px;
                    }
                    .pdf-label {
                        font-weight: 600;
                        min-width: 200px;
                    }
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print(); window.close();" style="padding: 10px 20px; background-color: #2c5282; color: white; border: none; border-radius: 5px; cursor: pointer;">הדפס למסמך</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // שמירת הנתונים להיסטוריה
        saveCurrentFormToHistory();
        
        // הודעת הצלחה
        showMessage('נוצר חלון PDF. לחץ על "הדפס למסמך" ואז שמור כ-PDF', 'success');
        
    } catch (error) {
        console.error('שגיאה ביצירת PDF:', error);
        showMessage('אירעה שגיאה ביצירת קובץ PDF: ' + error.message, 'error');
    }
}

/**
 * פונקציה לייצוא לCSV עם תבנית מעוצבת
 */
function exportToCSVWithTemplate() {
    try {
        showMessage('מייצא לאקסל... אנא המתן', 'info');
        
        // קבלת ההיסטוריה
        const history = getHistoryFromStorage();
        
        // אם אין נתונים, הצג הודעה
        if (history.length === 0) {
            showMessage('אין נתונים לייצוא', 'warning');
            return;
        }
        
        // יצירת דף HTML מסוגנן שיורד כקובץ להפתיח באקסל
        let excelHtml = `
            <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="ProgId" content="Excel.Sheet">
                <meta name="Generator" content="Microsoft Excel 11">
                <style>
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        direction: rtl;
                    }
                    th {
                        background-color: #4472C4;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        padding: 8px;
                        border: 1px solid #8EA9DB;
                    }
                    td {
                        text-align: right;
                        padding: 8px;
                        border: 1px solid #D0D7E5;
                    }
                    tr:nth-child(even) {
                        background-color: #EDF2F9;
                    }
                    tr:hover {
                        background-color: #D6E0F0;
                    }
                    .header {
                        font-size: 16pt;
                        font-weight: bold;
                        color: #2F5496;
                        margin-bottom: 15px;
                    }
                    .dashboard-section {
                        margin: 20px 0;
                    }
                    .dashboard-title {
                        font-size: 14pt;
                        font-weight: bold;
                        color: #2F5496;
                        margin-bottom: 10px;
                    }
                    .summary-box {
                        display: inline-block;
                        width: 200px;
                        height: 100px;
                        border: 1px solid #8EA9DB;
                        background-color: #EDF2F9;
                        margin: 10px;
                        padding: 15px;
                        text-align: center;
                    }
                    .summary-number {
                        font-size: 24pt;
                        font-weight: bold;
                        color: #4472C4;
                    }
                    .summary-label {
                        font-size: 10pt;
                        color: #2F5496;
                    }
                </style>
            </head>
            <body>
                <div class="header">נתוני תכולות עבודה</div>
                <table>
                    <thead>
                        <tr>
                            <th>תאריך</th>
                            <th>שם האתר</th>
                            <th>סימננו</th>
                            <th>מרחב</th>
                            <th>גיליון ייצור תוכנה</th>
                            <th>גיליון ייצור צג</th>
                            <th>גיבוי מהשטח/חומר טכני</th>
                            <th>כתיבת תוכנה חדשה</th>
                            <th>רשימת פרופיבס</th>
                            <th>תפ"מ</th>
                            <th>סוג בקר</th>
                            <th>סוג צג</th>
                            <th>רמת קושי</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // מילוי נתוני הטבלה
        history.forEach(item => {
            excelHtml += `
                <tr>
                    <td>${item.date || ''}</td>
                    <td>${escapeHtml(item.siteName || '')}</td>
                    <td>${escapeHtml(item.ourReference || '')}</td>
                    <td>${escapeHtml(item.space || '')}</td>
                    <td>${escapeHtml(item.softwareProduction || '')}</td>
                    <td>${escapeHtml(item.displayProduction || '')}</td>
                    <td>${item.requireFieldSoftware ? 'כן' : 'לא'}</td>
                    <td>${item.requireNewSoftware ? 'כן' : 'לא'}</td>
                    <td>${item.requireProfibus ? 'כן' : 'לא'}</td>
                    <td>${item.requireTPM ? 'כן' : 'לא'}</td>
                    <td>${escapeHtml(item.controllerType || '')}</td>
                    <td>${escapeHtml(item.displayType || '')}</td>
                    <td>${escapeHtml(item.difficultyLevel || '')}</td>
                </tr>
            `;
        });
        
        excelHtml += `
                    </tbody>
                </table>
                
                <!-- רווח בין טבלת הנתונים לדאשבורד -->
                <div style="height: 50px;"></div>
                
                <div class="header">דאשבורד נתוני תכולות עבודה</div>
                
                <!-- קופסאות סיכום -->
                <div class="dashboard-section">
                    <div class="dashboard-title">סיכום נתונים</div>
                    <table style="width: 60%; margin: 0 auto;">
                        <tr>
                            <th style="width: 40%;">קטגוריה</th>
                            <th style="width: 30%;">כמות</th>
                            <th style="width: 30%;">אחוז</th>
                        </tr>
                        <tr>
                            <td>סך הכל פרויקטים</td>
                            <td style="text-align: center;">${history.length}</td>
                            <td style="text-align: center;">100%</td>
                        </tr>
                        <tr>
                            <td>מרחב צפון</td>
                            <td style="text-align: center;">${countByProperty(history, 'space', 'צפון')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'space', 'צפון') / history.length * 100) || 0}%</td>
                        </tr>
                        <tr>
                            <td>מרחב מרכז</td>
                            <td style="text-align: center;">${countByProperty(history, 'space', 'מרכז')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'space', 'מרכז') / history.length * 100) || 0}%</td>
                        </tr>
                        <tr>
                            <td>מרחב דרום</td>
                            <td style="text-align: center;">${countByProperty(history, 'space', 'דרום')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'space', 'דרום') / history.length * 100) || 0}%</td>
                        </tr>
                    </table>
                </div>
                
                <!-- רווח בין טבלאות הדאשבורד -->
                <div style="height: 30px;"></div>
                
                <!-- סיכום לפי רמת קושי -->
                <div class="dashboard-section">
                    <div class="dashboard-title">התפלגות לפי רמת קושי</div>
                    <table style="width: 60%; margin: 0 auto;">
                        <tr>
                            <th style="width: 40%;">רמת קושי</th>
                            <th style="width: 30%;">כמות</th>
                            <th style="width: 30%;">אחוז</th>
                        </tr>
                        <tr>
                            <td>רמת קושי: קל</td>
                            <td style="text-align: center;">${countByProperty(history, 'difficultyLevel', 'קל')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'difficultyLevel', 'קל') / history.length * 100) || 0}%</td>
                        </tr>
                        <tr>
                            <td>רמת קושי: בינוני</td>
                            <td style="text-align: center;">${countByProperty(history, 'difficultyLevel', 'בינוני')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'difficultyLevel', 'בינוני') / history.length * 100) || 0}%</td>
                        </tr>
                        <tr>
                        <td>רמת קושי: קשה</td>
                            <td style="text-align: center;">${countByProperty(history, 'difficultyLevel', 'קשה')}</td>
                            <td style="text-align: center;">${Math.round(countByProperty(history, 'difficultyLevel', 'קשה') / history.length * 100) || 0}%</td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;
        
        // יצירת קובץ להורדה
        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // הגדרת מאפייני הקישור
        const today = new Date();
        const dateStr = formatDate(today).replace(/\//g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `תכולות_עבודה_${dateStr}.xls`);
        link.style.visibility = 'hidden';
        
        // הוספת הקישור לדף, לחיצה עליו, והסרתו
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage(`קובץ אקסל עם ${history.length} רשומות נוצר בהצלחה!`, 'success');
    } catch (error) {
        console.error('שגיאה בייצוא לאקסל:', error);
        showMessage('אירעה שגיאה בייצוא לאקסל: ' + error.message, 'error');
    }
}

/**
 * פונקציה לשמירת הנתונים הנוכחיים להיסטוריה
 * הפונקציה תומכת גם בעדכון רשומות קיימות וגם ביצירה של חדשות
 */
function saveCurrentFormToHistory() {
    try {
        // קבלת כל הנתונים מהטופס
        const formData = getFormData();
        
        // בדיקה אם יש שם אתר
        if (!formData.siteName.trim()) {
            showMessage('לא ניתן לשמור - שם האתר הוא שדה חובה', 'error');
            return false;
        }
        
        // קבלת ההיסטוריה הקיימת
        let history = getHistoryFromStorage();
        
        // אם יש מזהה נוכחי, זה אומר שאנחנו עורכים פרויקט קיים
        if (currentProjectId) {
            // חיפוש האינדקס של הפרויקט הקיים
            const existingIndex = history.findIndex(item => item.id === currentProjectId);
            
            if (existingIndex !== -1) {
                // עדכון הפרויקט הקיים בשמירה על המזהה והתאריך המקורי
                const originalDate = history[existingIndex].date;
                
                // שמירת המזהה הקיים
                formData.id = currentProjectId;
                // שמירת התאריך המקורי
                formData.date = originalDate;
                
                // עדכון הפרויקט במערך ההיסטוריה
                history[existingIndex] = formData;
                
                // שמירת ההיסטוריה המעודכנת
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                
                // עדכון טבלת ההיסטוריה
                updateHistoryTable();
                
                console.log('נתונים עודכנו בהיסטוריה בהצלחה');
                return true;
            }
        }
        
        // אם אין מזהה נוכחי או שהפרויקט לא נמצא, צור פרויקט חדש
        // הוספת תאריך ומזהה ייחודי
        const today = new Date();
        formData.date = formatDate(today);
        formData.id = Date.now().toString(); // מזהה ייחודי מבוסס זמן
        
        // הוספת הרשומה החדשה
        history.push(formData);
        
        // עדכון המזהה הנוכחי לפרויקט החדש
        currentProjectId = formData.id;
        
        // שמירת ההיסטוריה המעודכנת
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        
        // עדכון טבלת ההיסטוריה
        updateHistoryTable();
        
        console.log('נתונים נשמרו להיסטוריה בהצלחה');
        return true;
    } catch (error) {
        console.error('שגיאה בשמירת נתונים להיסטוריה:', error);
        return false;
    }
}

/**
 * פונקציה לקבלת ההיסטוריה מ-localStorage
 */
function getHistoryFromStorage() {
    try {
        const historyJson = localStorage.getItem(STORAGE_KEY);
        if (historyJson) {
            return JSON.parse(historyJson);
        }
    } catch (error) {
        console.error('שגיאה בטעינת היסטוריה:', error);
    }
    
    // החזרת מערך ריק אם אין היסטוריה או יש שגיאה
    return [];
}

/**
 * פונקציה לטעינת ההיסטוריה ועדכון הטבלה
 */
function loadHistoryFromStorage() {
    try {
        // עדכון טבלת ההיסטוריה
        updateHistoryTable();
    } catch (error) {
        console.error('שגיאה בטעינת היסטוריה:', error);
    }
}

/**
 * פונקציה לסינון טבלת ההיסטוריה לפי חיפוש
 */
function filterHistoryTable() {
    const searchInput = document.getElementById('historySearch');
    if (!searchInput) return;
    
    const searchText = searchInput.value.trim().toLowerCase();
    if (!searchText) {
        // אם אין טקסט חיפוש, הצג את כל הרשומות
        updateHistoryTable();
        return;
    }
    
    try {
        // קבלת ההיסטוריה
        const history = getHistoryFromStorage();
        
        // סינון הרשומות לפי טקסט החיפוש
        const filteredHistory = history.filter(item => 
            (item.siteName && item.siteName.toLowerCase().includes(searchText)) ||
            (item.ourReference && item.ourReference.toLowerCase().includes(searchText)) ||
            (item.space && item.space.toLowerCase().includes(searchText))
        );
        
        // עדכון הטבלה עם הרשומות המסוננות
        updateHistoryTableWithData(filteredHistory);
        
        // הצגת הודעה למשתמש
        showMessage(`נמצאו ${filteredHistory.length} תוצאות מתוך ${history.length} רשומות`, 'info');
    } catch (error) {
        console.error('שגיאה בסינון היסטוריה:', error);
    }
}

/**
 * פונקציה לניקוי סינון טבלת ההיסטוריה
 */
function clearHistoryFilter() {
    const searchInput = document.getElementById('historySearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // עדכון הטבלה עם כל הרשומות
    updateHistoryTable();
    
    showMessage('הסינון נוקה', 'info');
}

/**
 * פונקציה לעדכון טבלת ההיסטוריה
 */
function updateHistoryTable() {
    // קבלת ההיסטוריה
    const history = getHistoryFromStorage();
    
    // עדכון הטבלה עם כל הרשומות
    updateHistoryTableWithData(history);
}

/**
 * פונקציה לעדכון טבלת ההיסטוריה עם נתונים ספציפיים
 */
function updateHistoryTableWithData(data) {
    const historyTable = document.getElementById('historyTable');
    const historyCountElement = document.getElementById('historyCount');
    
    if (!historyTable || !historyCountElement) {
        console.error('אלמנטי ההיסטוריה לא נמצאו בדף');
        return;
    }
    
    const tableBody = historyTable.querySelector('tbody');
    if (!tableBody) {
        console.error('גוף הטבלה לא נמצא');
        return;
    }
    
    // עדכון מספר הרשומות הכולל
    const totalRecords = getHistoryFromStorage().length;
    historyCountElement.textContent = `(${totalRecords})`;
    
    // ניקוי התוכן הקיים
    tableBody.innerHTML = '';
    
    // אם אין נתונים, הצג שורה עם הודעה
    if (data.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" style="text-align: center;">אין רשומות היסטוריה</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // מילוי הטבלה בנתונים (בסדר הפוך - החדש ביותר קודם)
    data.slice().reverse().forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id; // שמירת המזהה כמאפיין של השורה
        
        row.innerHTML = `
            <td>${item.date || ''}</td>
            <td>${item.siteName || ''}</td>
            <td>${item.ourReference || ''}</td>
            <td>${item.space || ''}</td>
            <td>
                <button class="action-btn view" data-id="${item.id}">צפייה</button>
                <button class="action-btn delete" data-id="${item.id}">מחיקה</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * פונקציה לטעינת רשומה היסטורית לטופס
 */
function loadHistoryRecord(recordId) {
    try {
        // קבלת ההיסטוריה
        const history = getHistoryFromStorage();
        
        // חיפוש הרשומה לפי המזהה
        const record = history.find(item => item.id === recordId);
        
        if (!record) {
            showMessage('הרשומה לא נמצאה', 'error');
            return;
        }
        
        // שמירת המזהה של הפרויקט הנוכחי לעדכון עתידי
        currentProjectId = recordId;
        
        // מילוי הטופס בנתונים מהרשומה
        document.getElementById('siteName').value = record.siteName || '';
        document.getElementById('ourReference').value = record.ourReference || '';
        document.getElementById('space').value = record.space || '';
        document.getElementById('softwareProduction').value = record.softwareProduction || '';
        document.getElementById('displayProduction').value = record.displayProduction || '';
        document.getElementById('requireFieldSoftware').checked = record.requireFieldSoftware || false;
        document.getElementById('requireNewSoftware').checked = record.requireNewSoftware || false;
        document.getElementById('requireProfibus').checked = record.requireProfibus || false;
        document.getElementById('requireTPM').checked = record.requireTPM || false;
        document.getElementById('workContent').value = record.workContent || '';
        document.getElementById('notes').value = record.notes || '';
        document.getElementById('difficultyLevel').value = record.difficultyLevel || '';
        
        // טיפול בשדה סוג בקר
        const controllerTypeValue = record.controllerType || '';
        if (controllerTypeValue.startsWith('אחר:')) {
            document.getElementById('controllerType').value = 'אחר';
            document.getElementById('otherControllerType').value = controllerTypeValue.substring(5).trim();
            document.getElementById('otherControllerField').classList.add('visible');
        } else {
            document.getElementById('controllerType').value = controllerTypeValue;
            document.getElementById('otherControllerType').value = '';
            document.getElementById('otherControllerField').classList.remove('visible');
        }
        
        // טיפול בשדה סוג צג
        const displayTypeValue = record.displayType || '';
        if (displayTypeValue.startsWith('אחר:')) {
            document.getElementById('displayType').value = 'אחר';
            document.getElementById('otherDisplayType').value = displayTypeValue.substring(5).trim();
            document.getElementById('otherDisplayField').classList.add('visible');
        } else {
            document.getElementById('displayType').value = displayTypeValue;
            document.getElementById('otherDisplayType').value = '';
            document.getElementById('otherDisplayField').classList.remove('visible');
        }
        
        // עדכון התצוגה המקדימה
        updatePreview();
        
        // גלילה לראש הטופס
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        showMessage('הרשומה נטענה בהצלחה', 'success');
    } catch (error) {
        console.error('שגיאה בטעינת רשומה:', error);
        showMessage('אירעה שגיאה בטעינת הרשומה', 'error');
    }
}

/**
 * פונקציה למחיקת רשומה היסטורית
 */
function deleteHistoryRecord(recordId) {
    try {
        // קבלת ההיסטוריה
        let history = getHistoryFromStorage();
        
        // סינון הרשומה לפי המזהה
        const filteredHistory = history.filter(item => item.id !== recordId);
        
        // שמירת ההיסטוריה המעודכנת
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
        
        // אם המזהה שנמחק היה המזהה הנוכחי, נאפס אותו
        if (currentProjectId === recordId) {
            currentProjectId = null;
        }
        
        // עדכון טבלת ההיסטוריה
        updateHistoryTable();
        
        showMessage('הרשומה נמחקה בהצלחה', 'success');
    } catch (error) {
        console.error('שגיאה במחיקת רשומה:', error);
        showMessage('אירעה שגיאה במחיקת הרשומה', 'error');
    }
}

/**
 * פונקציה להצגת הודעות למשתמש
 */
function showMessage(message, type) {
    const messageElement = document.getElementById('responseMessage');
    if (!messageElement) {
        console.error("אלמנט הודעה לא נמצא!");
        return;
    }
    
    messageElement.textContent = message;
    messageElement.className = 'response-message';
    
    if (type) {
        messageElement.classList.add(type);
    }
    
    // הסרת ההודעה אחרי 5 שניות
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'response-message';
    }, 5000);
}

/**
 * פונקציית עזר לספירת פריטים לפי מאפיין
 */
function countByProperty(array, property, value) {
    return array.filter(item => item[property] === value).length;
}

/**
 * פונקציית עזר לספירת פריטים לפי מאפיין בוליאני
 */
function countByBooleanProperty(array, property) {
    return array.filter(item => item[property] === true).length;
}

/**
 * פונקציית עזר לטיפול בתווים מיוחדים ב-HTML
 */
function escapeHtml(value) {
    if (value == null) return '';
    const p = document.createElement('p');
    p.textContent = String(value);
    return p.innerHTML;
}
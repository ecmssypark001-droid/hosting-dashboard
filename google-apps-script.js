// ===================================================================
// 호스팅팀 업무 관리 - Google Apps Script Web App
// ===================================================================
// 이 코드를 Google Apps Script 에디터에 붙여넣고 배포하세요.
//
// 설정 방법:
// 1. Google Sheets 열기
// 2. 확장 프로그램 > Apps Script
// 3. 이 코드 붙여넣기
// 4. 배포 > 새 배포 > 유형: 웹 앱
// 5. 액세스 권한: 모든 사용자
// ===================================================================

// ===== 구성 설정 =====
const SPREADSHEET_ID = '1TmLfBe2SCTRfbzbBRnN3F8x1NDN82BABuAr01U97Boc';
const SHEETS = {
  TASKS: '업무관리',
  AUTOMATIONS: '자동화관리',
  TEMPLATES: '템플릿'
};

// ===== 메인 함수 =====

// GET 요청: 데이터 조회
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 모든 데이터 가져오기
    const tasks = getTasks(spreadsheet);
    const automations = getAutomations(spreadsheet);
    const templates = getTemplates(spreadsheet);

    const response = {
      success: true,
      data: {
        tasks: tasks,
        automations: automations,
        templates: templates
      }
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST 요청: CRUD 작업
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    let result;

    switch (data.action) {
      case 'create':
        result = createItem(spreadsheet, data.type, data.data);
        break;
      case 'update':
        result = updateItem(spreadsheet, data.type, data.id, data.data);
        break;
      case 'delete':
        result = deleteItem(spreadsheet, data.type, data.id);
        break;
      default:
        throw new Error('Invalid action: ' + data.action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      result: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 업무 관리 함수 =====

function getTasks(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const headers = data[0];
  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // 빈 행 건너뛰기

    const task = {
      id: row[0] || generateId(),
      내용: row[1] || '',
      담당자: row[2] || '',
      상태: row[3] || '시작전',
      긴급도: row[4] || '보통',
      마감일: row[5] ? formatDateToString(row[5]) : '',
      구분: row[6] || '',
      생성일: row[7] ? formatDateToString(row[7]) : new Date().toISOString()
    };

    tasks.push(task);
  }

  return tasks;
}

function createItem(spreadsheet, type, data) {
  const sheet = getOrCreateSheet(spreadsheet, getSheetName(type));
  const id = generateId();

  if (type === 'task') {
    sheet.appendRow([
      id,
      data.내용 || '',
      data.담당자 || '',
      data.상태 || '시작전',
      data.긴급도 || '보통',
      data.마감일 || '',
      data.구분 || '',
      new Date().toISOString()
    ]);
  } else if (type === 'automation') {
    sheet.appendRow([
      id,
      data.title || '',
      data.description || '',
      data.status || 'in_progress',
      data.efficiency || 0,
      data.timeSaved || 0,
      data.startDate || new Date().toISOString().split('T')[0],
      new Date().toISOString()
    ]);
  } else if (type === 'template') {
    sheet.appendRow([
      id,
      data.title || '',
      data.description || '',
      data.category || '일반',
      data.content || '',
      new Date().toISOString()
    ]);
  }

  return { id: id };
}

function updateItem(spreadsheet, type, id, data) {
  const sheet = getOrCreateSheet(spreadsheet, getSheetName(type));
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) {
      if (type === 'task') {
        sheet.getRange(i + 1, 2).setValue(data.내용 || '');
        sheet.getRange(i + 1, 3).setValue(data.담당자 || '');
        sheet.getRange(i + 1, 4).setValue(data.상태 || '');
        sheet.getRange(i + 1, 5).setValue(data.긴급도 || '');
        sheet.getRange(i + 1, 6).setValue(data.마감일 || '');
        sheet.getRange(i + 1, 7).setValue(data.구분 || '');
      } else if (type === 'automation') {
        sheet.getRange(i + 1, 2).setValue(data.title || '');
        sheet.getRange(i + 1, 3).setValue(data.description || '');
        sheet.getRange(i + 1, 4).setValue(data.status || '');
        sheet.getRange(i + 1, 5).setValue(data.efficiency || 0);
        sheet.getRange(i + 1, 6).setValue(data.timeSaved || 0);
        sheet.getRange(i + 1, 7).setValue(data.startDate || '');
      } else if (type === 'template') {
        sheet.getRange(i + 1, 2).setValue(data.title || '');
        sheet.getRange(i + 1, 3).setValue(data.description || '');
        sheet.getRange(i + 1, 4).setValue(data.category || '');
        sheet.getRange(i + 1, 5).setValue(data.content || '');
      }
      return { updated: true };
    }
  }

  throw new Error('Item not found: ' + id);
}

function deleteItem(spreadsheet, type, id) {
  const sheet = getOrCreateSheet(spreadsheet, getSheetName(type));
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }

  throw new Error('Item not found: ' + id);
}

// ===== 자동화 관리 함수 =====

function getAutomations(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, SHEETS.AUTOMATIONS);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const automations = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const automation = {
      id: row[0] || generateId(),
      title: row[1] || '',
      description: row[2] || '',
      status: row[3] || 'in_progress',
      efficiency: row[4] || 0,
      timeSaved: row[5] || 0,
      startDate: row[6] ? formatDateToString(row[6]) : '',
      createdAt: row[7] ? formatDateToString(row[7]) : new Date().toISOString()
    };

    automations.push(automation);
  }

  return automations;
}

// ===== 템플릿 관리 함수 =====

function getTemplates(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, SHEETS.TEMPLATES);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const templates = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const template = {
      id: row[0] || generateId(),
      title: row[1] || '',
      description: row[2] || '',
      category: row[3] || '일반',
      content: row[4] || '',
      createdAt: row[5] ? formatDateToString(row[5]) : new Date().toISOString()
    };

    templates.push(template);
  }

  return templates;
}

// ===== Slack 연동 함수 =====

// Slack에서 업무 등록
function addTaskFromSlack(slackData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet(spreadsheet, SHEETS.TASKS);

    const id = generateId();
    const taskData = {
      내용: slackData.message || '',
      담당자: slackData.assignee || '',
      상태: '시작전',
      긴급도: slackData.priority || '보통',
      마감일: slackData.deadline || '',
      구분: 'Slack 자동등록',
      slack_link: slackData.link || '',
      slack_channel: slackData.channel || '',
      slack_user: slackData.user || ''
    };

    sheet.appendRow([
      id,
      taskData.내용,
      taskData.담당자,
      taskData.상태,
      taskData.긴급도,
      taskData.마감일,
      taskData.구분,
      new Date().toISOString(),
      taskData.slack_link,
      taskData.slack_channel,
      taskData.slack_user
    ]);

    return { success: true, id: id };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ===== 유틸리티 함수 =====

function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);

    // 헤더 설정
    if (sheetName === SHEETS.TASKS) {
      sheet.appendRow(['ID', '내용', '담당자', '상태', '긴급도', '마감일', '구분', '생성일', 'Slack 링크', 'Slack 채널', 'Slack 사용자']);
    } else if (sheetName === SHEETS.AUTOMATIONS) {
      sheet.appendRow(['ID', '제목', '설명', '상태', '효율성(%)', '절감시간(h)', '시작일', '생성일']);
    } else if (sheetName === SHEETS.TEMPLATES) {
      sheet.appendRow(['ID', '제목', '설명', '카테고리', '내용', '생성일']);
    }

    // 헤더 스타일 적용
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4a90e2');
    headerRange.setFontColor('#ffffff');
  }

  return sheet;
}

function getSheetName(type) {
  switch (type) {
    case 'task':
      return SHEETS.TASKS;
    case 'automation':
      return SHEETS.AUTOMATIONS;
    case 'template':
      return SHEETS.TEMPLATES;
    default:
      throw new Error('Invalid type: ' + type);
  }
}

function generateId() {
  return 'ID_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

function formatDateToString(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;

  const d = new Date(date);
  if (isNaN(d.getTime())) return date.toString();

  return d.toISOString().split('T')[0];
}

// ===== 테스트 함수 =====

function testGetData() {
  const result = doGet({});
  Logger.log(result.getContent());
}

function testCreateTask() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        action: 'create',
        type: 'task',
        data: {
          내용: '테스트 업무',
          담당자: '박슬예',
          상태: '시작전',
          긴급도: '보통',
          마감일: '2026-02-01',
          구분: '테스트'
        }
      })
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}

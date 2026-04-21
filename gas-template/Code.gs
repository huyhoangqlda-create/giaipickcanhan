function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pickleball Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Function lấy dữ liệu data VĐV và Điểm (nếu có để render lần đầu)
function getInitialData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) return { success: true, scores: {} };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, scores: {} };
  
  // Parse existing scores to send to UI
  let scores = {};
  // Assuming headers: [Timestamp, Round, Court, t1Score, t2Score]
  for (let i = 1; i < data.length; i++) {
    let round = data[i][1];
    let court = data[i][2];
    let t1 = data[i][3];
    let t2 = data[i][4];
    scores[`${round}-${court}`] = { t1: t1, t2: t2 };
  }
  return { success: true, scores: scores };
}

// Function API lưu điểm từ UI gọi bằng google.script.run
function saveScore(round, court, t1Score, t2Score) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Data");
  
  // Tạo sheet Data nếu chưa có
  if (!sheet) {
    sheet = ss.insertSheet("Data");
    sheet.appendRow(["Timestamp", "Round", "Court", "T1 Score", "T2 Score"]);
  }
  
  // Ghi đè hoặc thêm mới
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for(let i = 1; i < data.length; i++) {
    if(data[i][1] == round && data[i][2] == court) {
      sheet.getRange(i+1, 4).setValue(t1Score);
      sheet.getRange(i+1, 5).setValue(t2Score);
      sheet.getRange(i+1, 1).setValue(new Date()); // Update timestamp
      found = true;
      break;
    }
  }
  
  if(!found) {
    sheet.appendRow([new Date(), round, court, t1Score, t2Score]);
  }
  
  return { success: true };
}

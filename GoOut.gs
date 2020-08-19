//注意事項1:このスクリプトはIFTTTとの連携を前提として作られています。
//参考にしたサイト様：https://qiita.com/ikechan/items/5e4bf2b9868d0d804af5

//注意事項2:日付ライブラリを使用しております。 事前にインストールをお願いします。
//参考にしたサイト様：https://tonari-it.com/gas-moment-js-moment/

//注意事項3:トリガにcheckGoOut関数(シート変更時)の登録が必要です。

var sheet = SpreadsheetApp.getActiveSheet();

//シートに変更があった時、帰宅/外出を判断して自動的に家電のON/OFFを行う ※要：これをトリガに登録すること！
function checkGoOut() {
  //一時的にトリガーを消す
  deleteTrigger("addDate");
  
  //時刻を取得
  var date00 = Moment.moment(); //現在日時
  
  var lastrow = sheet.getLastRow();
  var cola = 1; //1列目（A列）にenter or exitが入力されている 外出/帰宅の確認用
  var rangea = sheet.getRange(lastrow, cola);
  var valuea = rangea.getValue();
  
  //動作を一度のみにしたいのでトグル設定
  var colf = 6; //6列目（F列）にfinish or ""が入力されている 未処理/処理済の確認用
  var rangef = sheet.getRange(lastrow, colf);
  var valuef = rangef.getValue();
  
  //動作ログ書き出し 外出/帰宅と未処理/処理済の確認ログ
  Logger.log("getvalue: " + rangea.getValue());
  Logger.log("getvalue: " + rangef.getValue());

  if (valuea == "Exit" && valuef == "") {
    //外出時の処理
    Logger.log(date00.format("HH:mm")+" 外出!");
    
    //エアコンを消す
    var url = "https://maker.ifttt.com/trigger/trigerName/with/key/userID";
    UrlFetchApp.fetch(url);
    mail("エアコンけしたよ！");

    //動作日時記録
    setDate(3, "yyyy/M/d");
    setDate(4, "H:m:s");

    //処理済みフラグ記録
    sheet.getRange(lastrow, colf).setValue("finish")
    
  } else if (valuea == "Enter"&& valuef == "") {
    //帰宅時の処理
    Logger.log(date00.format("HH:mm")+" 帰宅！");
    
    //エアコンをつける
    var url = "https://maker.ifttt.com/trigger/trigerName/with/key/userID";
    UrlFetchApp.fetch(url);
    mail("エアコンつけたよ！");

    //多重Hook防止用の待機 必要かは分からない
    Utilities.sleep(1000);
    
    //電気をつける
    var url = "https://maker.ifttt.com/trigger/trigerName/with/key/userID";
    UrlFetchApp.fetch(url);
    mail("電気つけたよ！");

    //動作日時記録
    setDate(3, "yyyy/M/d");
    setDate(4, "H:m:s");

    //処理済みフラグ記録
    sheet.getRange(lastrow, colf).setValue("finish")
  }

  //多重処理回避用待機
  Utilities.sleep(3000);

  //一時トリガー設定
  //sheetNameはUrlのhttps://docs.google.com/spreadsheets/d/hogehoge/edit#gid=0のhogehogeの部分
  ScriptApp.newTrigger("addDate").forSpreadsheet("sheetName").onChange().create();
}

//日時記入用関数
function setDate(col, format) {
  var lastrow = sheet.getLastRow();
  Logger.log(lastrow+"行目に足したよ！");
  if (sheet.getRange(lastrow, col).getValue() == "")
    sheet.getRange(lastrow, col).setValue(formatDate(new Date(), format));
}

//日時フォーマット編集用関数
function formatDate(date, format) {
  return Utilities.formatDate(date, 'Asia/Tokyo', format)
}

//トリガーを削除する関数
function deleteTrigger(funcName) {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++){
    if (triggers[i].getHandlerFunction() == funcName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

//メール送信用関数
function mail(text) {
  const recipient = 'hogehoge@gmail.com'; //送信先のメールアドレス
  const subject = 'HomeBOTだよ!';
  const body = text;
  const options = {name: 'GASからのお知らせだよ！'};
  GmailApp.sendEmail(recipient, subject, body, options);
}


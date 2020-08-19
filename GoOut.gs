//注意事項1:このスクリプトはIFTTTとの連携を前提として作られています。
//参考にしたサイト様：https://qiita.com/ikechan/items/5e4bf2b9868d0d804af5

//注意事項2:日付ライブラリを使用しております。 事前にインストールをお願いします。
//参考にしたサイト様：https://tonari-it.com/gas-moment-js-moment/

//注意事項3:トリガにcheckGoOut関数(シート変更時)の登録が必要です。

var sheet = SpreadsheetApp.getActiveSheet();                 //アクティブシート名取得
var sheetId = SpreadsheetApp.getActiveSpreadsheet().getId(); //アクティブシートID取得
var iFtttId = "hogehoge";                                    //IFTTTのID 要個別修正 要:個別修正
var mailAddress = 'hogehoge@gmail.com';                      //送信先のメールアドレス 要:個別修正

//シートに変更があった時、帰宅/外出を判断して自動的に家電のON/OFFを行う ※要：これをトリガに登録すること！
function checkGoOut() {
  //一時的にトリガーを消す
  deleteTrigger("checkGoOut");

  var date00 = Moment.moment(); //現在日時を取得  
  var lastrow = sheet.getLastRow(); //最終記入済行取得

  //帰宅/外出の判別用
  var cola = 1; //1列目（A列）にenter or exitが入力されている
  var rangea = sheet.getRange(lastrow, cola);
  var valuea = rangea.getValue();

  //未処理/処理済の判別用
  var colf = 6; //6列目（F列）にfinish or ""が入力されている
  var rangef = sheet.getRange(lastrow, colf);
  var valuef = rangef.getValue();
  
  //動作ログ書き出し 外出/帰宅と未処理/処理済の確認ログ
  Logger.log("getvalue: " + rangea.getValue());
  Logger.log("getvalue: " + rangef.getValue());

  //帰宅/外出及び未処理/処理済の判別
  if (valuea == "Exit" && valuef == "") {
    //外出時の処理
    Logger.log(date00.format("HH:mm")+" 外出!");
    
    //エアコンを消す
    var url = "https://maker.ifttt.com/trigger/AC_Off/with/key/" + iFtttId;
    UrlFetchApp.fetch(url);
    mail("エアコンけしたよ！");

    //動作日時記録
    setDate(3, "yyyy/M/d");
    setDate(4, "H:m:s");

    //処理済みフラグ記録
    sheet.getRange(lastrow, colf).setValue("finish")
  } else if (valuea == "Enter"&& valuef == ""){
    //帰宅時の処理
    Logger.log(date00.format("HH:mm")+" 帰宅！");

    //エアコンをつける
    var url = "https://maker.ifttt.com/trigger/AC_On/with/key/" + iFtttId;
    UrlFetchApp.fetch(url);
    mail("エアコンつけたよ！");

    //多重Hook防止用の待機 必要かは分からない
    Utilities.sleep(1000);

    //電気をつける
    var url = "https://maker.ifttt.com/trigger/Light_On/with/key/" + iFtttId;
    UrlFetchApp.fetch(url);
    mail("電気つけたよ！");

    //動作日時記録
    setDate(3, "yyyy/M/d");
    setDate(4, "H:m:s");

    //処理済みフラグ記録
    sheet.getRange(lastrow, colf).setValue("finish")
  }
  //多重処理回避
  Utilities.sleep(3000);

  //一時トリガー設定
  ScriptApp.newTrigger("checkGoOut").forSpreadsheet(sheetId).onChange().create();
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

//トリガー削除関数
function deleteTrigger(funcName) {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == funcName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

//メール送信関数
function mail(text) {
  const recipient = mailAddress;
  const subject = 'HomeBOTだよ!';
  const body = text;
  const options = {name: 'GASからのお知らせだよ！'};
  GmailApp.sendEmail(recipient, subject, body, options);
}


//注意事項1:このスクリプトはIFTTTとの連携を前提として作られています。
//参考にしたサイト様：https://qiita.com/ikechan/items/5e4bf2b9868d0d804af5

//注意事項2:日付ライブラリを使用しております。 事前にインストールをお願いします。
//参考にしたサイト様：https://tonari-it.com/gas-moment-js-moment/

//注意事項3:トリガにaddDate関数(シート変更時)とsetSchedules関数(日付ベース/８〜９時等)の登録が必要です。

var sheet = SpreadsheetApp.getActiveSheet();

//営業日確認用
//出社日以外はトリガに登録させないようにする
function isBusinessDay(date){
  //土日判定
  if (date.getDay() == 0 || date.getDay() == 6) {
    return false;
  }
  //日本の祝日判定
  const calJa = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
  if(calJa.getEventsForDay(date).length > 0){
    return false;
  }
  return true;
}

//シートに変更があった時日付記入 ※要トリガ設定
function addDate() {
  //一時的にトリガーを消す
  deleteTrigger("addDate");
  //日時追記
  setDate(3, "yyyy/M/d");
  setDate(4, "H:m:s");
  Utilities.sleep(1000);
  //トリガー再設定
  //SheetNameはUrlのhttps://docs.google.com/spreadsheets/d/hogehoge/edit#gid=0のhogehogeの部分
  ScriptApp.newTrigger("addDate").forSpreadsheet("SheetName").onChange().create();
}

//日付記入用関数
function setDate(col, format) {
  var lastrow = sheet.getLastRow();
  if (sheet.getRange(lastrow, col).getValue() == "") {
    sheet.getRange(lastrow, col).setValue(formatDate(new Date(), format));
    Logger.log(lastrow+"行目に足したよ！");
  }
}

//日付フォーマット
function formatDate(date, format) {
  return Utilities.formatDate(date, 'Asia/Tokyo', format)
}

//毎日のトリガ登録用
function setSchedules() {
  //基本的に17:10以降の設定だがぶっちゃけ何時でも良いと思う！
  if (isBusinessDay(new Date())){
    setTrigger("checkEnterOrExit", 17, 10);
    Logger.log("帰宅確認システムの起動設定したよ！");
  }else{
    Logger.log("今日はお休みだよ！");
  }
}

//トリガが重複していた場合の手動削除用 ※ぶっちゃけいらないかも
function deleteTriggerManual(){
  deleteTrigger("checkEnterOrExit")
}

//指定時刻にトリガーを設定
function setTrigger(funcName, h, m) {
  var triggerDay = new Date();
  triggerDay.setHours(h);
  triggerDay.setMinutes(m);
  ScriptApp.newTrigger(funcName).timeBased().at(triggerDay).create();
}

//トリガーを削除する関数(消さないと残る)
function deleteTrigger(funcName) {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == funcName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

//メール送信
function mail(text) {
  const recipient = 'hogehoge@gmail.com'; //送信先のメールアドレス
  const subject = 'HomeBOTだよ!';
  const body = text;
  const options = {name: 'GASからのお知らせだよ！'};
  GmailApp.sendEmail(recipient, subject, body, options);
}

//帰宅チェック（最後のログがenterかexitのどちらかをチェック）
function checkEnterOrExit() {
  //一時トリガーを消す
  deleteTrigger("checkEnterOrExit");

  //10分後の時刻を取得
  var date00 = Moment.moment(); //現在日時
  var date01 = Moment.moment(); //現在日時
  var date02 = date01.add(10,"minute"); //現在日時 + 1０分

  var lastrow = sheet.getLastRow();
  var col = 1; //1列目（A列）にenter or exitが入力されている
  var range = sheet.getRange(lastrow, col);
  var value = range.getValue();
  Logger.log("getvalue: " + range.getValue());

  //帰宅中ならエアコンをつける
  if (value == "Exit") {
    Logger.log(date00.format("HH:mm")+" 帰宅中！");
    //そのエリアにいない場合には，IFTTTのwebhookをかける
    var url = "https://maker.ifttt.com/trigger/TrigerName/with/key/UserID";
    UrlFetchApp.fetch(url);
    mail("エアコンつけたよ！");
    return;
  } else if (value == "Enter"){
    Logger.log(date00.format("HH:mm")+" 仕事中！");
    //トリガ再設定：帰宅していない場合１０分毎に繰返す
    setTrigger("checkEnterOrExit", date02.format("HH"), date02.format("mm"));
    return;
  }
}
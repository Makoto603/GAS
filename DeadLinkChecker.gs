//参考URL：https://www.infoscoop.org/blogjp/2014/10/31/gas_deadlink_checker/

var mailAddress = "hogehohe@gmail.com";                        // 送信先のメールアドレス
var siteURL = ["https://hogehoge/","https://hogehoge/"];       // チェック対象サイト
var domains = [];                                              // 各ドメイン格納用
var deadLinkList = [];                                         // エラーリンク格納用

// 各ドメインの書き出し
for(var i=0;i<siteURL.length;i++){
  domains[i] = siteURL[i].match(/^https?:\/\/[^\/]+/, "gi");
}

// 複数サイト検証用　要:トリガー登録
function main(){
  // 指定したUrl全てで検査を行う
  for(var i=0;i<siteURL.length;i++){
    checker(siteURL[i],domains[i]);
  }
}

function checker(url,domain) {
  // 対象サイトの存在確認
  var response;
  var body = "サイト：" + url + " に"

  try {
    var response = UrlFetchApp.fetch(url);
  } catch (e) {
    // DNS error, etc.
    mail("サイト：" + url + "が落ちています！");
    Logger.log(url + "が落ちてます！")
    return;
  }

  // 対象サイト内のリンク抽出
  var checkUrlList = getLinks(url,domain);
   // デッドリンクチェック
  for(var i=0;i<checkUrlList.length;i++){
    // レスポンスコード200以外であればリストに追加
    var code = getResponseCode(checkUrlList[i],domain);
    if(code != 200)
      deadLinkList.push(checkUrlList[i] + " [" + code + "]");
  }

  // デッドリンクがあればメール通知
  if(deadLinkList.length > 0){
     body += deadLinkList.length + "件のデッドリンクがあります。\n";
    for(var i=0;i<deadLinkList.length;i++){
      body += "\n" + deadLinkList[i];
    }
    mail(body);
  }else{
     Logger.log(body += "デッドリンクは見つかりませんでした!");
    //body += "デッドリンクは見つかりませんでした。\nやったね！\n";
    //mail(body);
  }
}

// リンクチェッカー
function getResponseCode(url,domain){
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions:true });
  Logger.log(url + ":" + response.getResponseCode());
  return response.getResponseCode();
}

// リンク検索
function getLinks(sUrl,domain){
  var response = UrlFetchApp.fetch(sUrl);
  var html = response.getContentText();
  var regexp = new RegExp("<a.*?href=\"(.*?)\".*?>(.*?)</a>", "gim");

  var array = [];
  var match;
  while((match = regexp.exec(html)) != null){
    var url = match[1];
    if(/^(\/.*)/.test(url)){
      url = url.replace(/^(\/.*)/, domain + "$1");
    }else if(!/^(http|https|ftp):\/\//.test(url)){
      url = siteURL + url;
    }

    if(array.indexOf(url) == -1)
      array.push(url);
  }
  return array;
}

// メール送信
function mail(text) {
  const recipient = mailAddress;
  const subject = 'デッドリンクチェッカーだよ!';
  const body = text;
  const options = {name: 'GASからのお知らせだよ！'};
  GmailApp.sendEmail(recipient, subject, body, options);
}

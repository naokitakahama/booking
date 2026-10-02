// ==============================================
//  経路（どこから来た予約か）の読み取り
//  共通仕様：改造しないでください（加盟店も同じものを使います）
// ==============================================
(function (root) {
  var REF_KEY = 'booking_ref';
  var REF_DAYS = 90;

  // 英数字・ハイフン・アンダーバーだけにして、長さを制限する
  function clean(v, max) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, max);
  }

  function readRef(param, storage, now) {
    var code = clean(param, 30);
    try {
      if (code) {
        storage.setItem(REF_KEY, JSON.stringify({ code: code, exp: now + REF_DAYS * 864e5 }));
        return code;
      }
      var saved = JSON.parse(storage.getItem(REF_KEY) || 'null');
      if (saved && saved.exp > now) return clean(saved.code, 30);
      if (saved) storage.removeItem(REF_KEY);
    } catch (e) {}
    return code;
  }

  function fromReferrer(referrer, ownHost) {
    try {
      if (!referrer) return 'direct';
      var h = new URL(referrer).hostname;
      if (!h || h === ownHost) return 'direct';
      if (/google\.|yahoo\.|bing\.|duckduckgo\./.test(h)) return 'search';
      if (/instagram\.|facebook\.|fb\.|line\.me|x\.com|twitter\.|tiktok\./.test(h)) return 'social';
      return 'web';
    } catch (e) { return 'direct'; }
  }

  function read(search, referrer, ownHost, storeCode, storage, now) {
    var q = new URLSearchParams(search || '');
    var r = {
      storeCode: clean(storeCode, 20),
      ref: readRef(q.get('ref'), storage, now || Date.now()),
      utm_source: clean(q.get('utm_source'), 30),
      utm_medium: clean(q.get('utm_medium'), 30),
      utm_campaign: clean(q.get('utm_campaign'), 40)
    };
    // 経路：広告の値があればそれ、紹介コードがあれば referral、なければ参照元から判定
    r.route = r.utm_source || (r.ref ? 'referral' : fromReferrer(referrer, ownHost));
    return r;
  }

  function newRequestId() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  root.BookingRoute = { read: read, clean: clean, newRequestId: newRequestId };
})(typeof window !== 'undefined' ? window : this);

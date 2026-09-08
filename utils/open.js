let pendingUrl = "";

function queryMap(text) {
  const q = text.indexOf("?");
  const raw = q >= 0 ? text.slice(q + 1) : "";
  const map = {};
  raw.split("&").forEach((part) => {
    if (!part) return;
    const i = part.indexOf("=");
    const key = i >= 0 ? part.slice(0, i) : part;
    const val = i >= 0 ? part.slice(i + 1) : "";
    try {
      map[decodeURIComponent(key)] = decodeURIComponent(val);
    } catch (e) {
      map[key] = val;
    }
  });
  return map;
}

function parseMiniProgramTarget(text) {
  const t = (text || "").trim();
  if (!t) return null;
  if (t.indexOf("#小程序://") === 0) return { shortLink: t };

  const params = queryMap(t);
  const appId = params.appid || params.appId || params.appID;
  if (appId) {
    let path = params.path || params.page || "";
    if (params.query) {
      path += (path.indexOf("?") >= 0 ? "&" : "?") + params.query;
    }
    return { appId, path };
  }

  const wxid = t.match(/\b(wx[0-9a-fA-F]{16})\b/);
  if (wxid) return { appId: wxid[1], path: "" };
  return null;
}

function extractFromHtml(html) {
  if (!html) return null;
  const shortLink = html.match(/#小程序:\/\/[^\s"'<>]+/);
  if (shortLink) return parseMiniProgramTarget(shortLink[0]);
  const scheme = html.match(/weixin:\/\/dl\/business\/\?[^"'<\s]+/);
  if (scheme) return parseMiniProgramTarget(scheme[0]);
  return parseMiniProgramTarget(html);
}

function asHttps(url) {
  if ((url || "").indexOf("http://") === 0) return "https://" + url.slice(7);
  return url;
}

function jumpMini(target) {
  wx.navigateToMiniProgram(
    Object.assign({}, target, {
      fail: (err) => {
        const msg = (err && err.errMsg) || "";
        if (msg.indexOf("cancel") !== -1) return;
        wx.showToast({ title: "无法打开小程序", icon: "none" });
      },
    }),
  );
}

function openWeb(url) {
  pendingUrl = url;
  wx.navigateTo({
    url: "/pages/web/web",
    fail: () => wx.showToast({ title: "无法打开页面", icon: "none" }),
  });
}

function takePendingUrl() {
  const url = pendingUrl;
  pendingUrl = "";
  return url;
}

function peekUrl(url) {
  return new Promise((resolve) => {
    wx.request({
      url,
      method: "GET",
      timeout: 6000,
      success: (res) => {
        const header = res.header || {};
        const loc = header.Location || header.location || "";
        const body = typeof res.data === "string" ? res.data : "";
        const fromBody = extractFromHtml(body);
        if (fromBody) {
          resolve({ kind: "mini", target: fromBody });
          return;
        }
        if (loc) {
          const mini = parseMiniProgramTarget(loc) || extractFromHtml(loc);
          if (mini) {
            resolve({ kind: "mini", target: mini });
            return;
          }
          if (/^https?:\/\//i.test(loc)) {
            resolve({ kind: "url", url: asHttps(loc) });
            return;
          }
        }
        resolve({ kind: "url", url });
      },
      fail: () => resolve({ kind: "url", url }),
    });
  });
}

function openInsideApp(text) {
  const raw = (text || "").trim();
  if (!raw) return Promise.resolve(false);

  const direct = parseMiniProgramTarget(raw);
  if (direct) {
    jumpMini(direct);
    return Promise.resolve(true);
  }

  if (/^https?:\/\//i.test(raw)) {
    const url = asHttps(raw);
    return peekUrl(url).then((info) => {
      if (info.kind === "mini" && info.target) {
        jumpMini(info.target);
        return true;
      }
      openWeb(info.url || url);
      return true;
    });
  }

  return Promise.resolve(false);
}

module.exports = {
  parseMiniProgramTarget,
  openInsideApp,
  takePendingUrl,
};

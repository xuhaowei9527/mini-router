import pages from 'pages'

function _getPages_() {
  if (!pages) {
    return []
  }

  pages.forEach(item => {
    if (item.url.slice(0, 1) !== '/') {
      item.url = '/' + item.url
    }
  })
  return pages
}

export default class Router {

  /**
   * constructor 🚀
   */
  constructor() {
    this.pages = _getPages_()
    this.params = null
    this._currentPage = null

    this.callbacks = {}

    this.success = function (onSuccess) {
      this.callbacks.onSuccess = onSuccess
      return this
    }
    this.fail = function (onFail) {
      this.callbacks.onFail = onFail
      return this
    }
    this.complete = function (onComplete) {
      this.callbacks.onComplete = onComplete
      return this
    }
  }

  /**
   * 保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabbar 页面
   * @param name
   * @param params
   * @returns {*}
   */
  push(name, params = null) {

    const [page] = this.pages.filter(item => item.name === name)

    if (!page) {
      throw Error(`!! Not found page ->：[${name}] !!`)
      return
    }

    this._currentPage = page

    if (params) {
      const key = `${page.name}-params`
      wx.setStorageSync(key, params)
      this.params = this._getParams(key)
    } else {
      this.params = null
    }

    const [, , obj] = Array.from(arguments)
    const that = this
    let f = wx.navigateTo
    if (obj && obj.fn === 'reLaunch') {
      f = wx.reLaunch
    }
    if (obj && obj.fn === 'redirect') {
      f = wx.redirectTo
    }
    if (obj && obj.fn === "switchTab") {
      f = wx.switchTab
    }
    f({
      url: page.url,
      ...that._getFunc()
    })
    return this
  }

  /**
   * 关闭所有页面，打开到应用内的某个页面 可传递参数 可跳转到Tabbar页面
   * @param name
   * @param params
   */
  reLaunch(name, params = null) {
    return this.push(name, params, {fn: 'reLaunch'})
  }

  /**
   * 关闭所有页面，打开到应用内的某个页面 可传递参数 不可重定向到Tabbar页面
   * @param name
   * @param params
   */
  redirect(name, params = null) {
    return this.push(name, params, {fn: 'redirect'})
  }

  switchTab(name) {
    return this.push(name, null, {fn: "switchTab"})
  }

  /**
   * 关闭当前页面，返回上一页面或多级页面。 没有参数 代表返回上一页
   * @param delta
   * @param params
   */
  back(delta = 1, params = null) {
    if (params) {
      const key = `${this._currentPage.name}-params`
      wx.setStorageSync(key, params)
      this.params = this._getParams(key)
    } else {
      this.params = null
    }
    wx.navigateBack({
      delta,
      ...this._getFunc()
    })

    return this
  }

  /**
   * 关闭所有页面返回到首页
   * @param params
   */
  backHome(params = null) {
    return this.back(Number.MAX_SAFE_INTEGER, params)
  }


  /**
   * 获取函数
   * @returns {{fail: fail, success: success, complete: complete}}
   * @private
   */
  _getFunc() {
    let that = this
    return {
      success: function (res) {
        if (that.callbacks.onSuccess) that.callbacks.onSuccess(res)
      },
      fail: function (err) {
        if (that.callbacks.onFail) that.callbacks.onFail(err)
      },
      complete: function () {
        if (that.callbacks.onComplete) that.callbacks.onComplete()
      }
    }
  }

  /**
   * 获取当前跳转的页面的携带的参数
   * @param key
   * @returns {*}
   * @private
   */
  _getParams(key) {
    return wx.getStorageSync(key)
  }
}
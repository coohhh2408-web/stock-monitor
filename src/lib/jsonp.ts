let callbackSeq = 0

export function jsonp<T>(url: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__sm_cb_${Date.now()}_${callbackSeq++}`
    const script = document.createElement('script')
    const timer = window.setTimeout(() => cleanup(new Error('行情请求超时')), timeoutMs)

    const cleanup = (err?: Error, data?: T) => {
      window.clearTimeout(timer)
      script.remove()
      try {
        delete (window as unknown as Record<string, unknown>)[name]
      } catch {
        (window as unknown as Record<string, unknown>)[name] = undefined
      }
      if (err) reject(err)
      else resolve(data as T)
    }

    ;(window as unknown as Record<string, unknown>)[name] = (payload: T) => cleanup(undefined, payload)

    const joiner = url.includes('?') ? '&' : '?'
    script.src = `${url}${joiner}callback=${name}&_=${Date.now()}`
    script.async = true
    script.onerror = () => cleanup(new Error('行情接口不可用'))
    document.head.appendChild(script)
  })
}

export function loadScript(src: string, charset = 'utf-8', timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => {
      script.remove()
      reject(new Error('行情请求超时'))
    }, timeoutMs)
    script.charset = charset
    script.async = true
    script.src = src
    script.onload = () => {
      window.clearTimeout(timer)
      script.remove()
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      script.remove()
      reject(new Error('行情接口不可用'))
    }
    document.head.appendChild(script)
  })
}

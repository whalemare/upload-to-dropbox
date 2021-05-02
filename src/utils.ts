export function isDirectory(path: string): boolean {
  return path.endsWith('/')
}

export function asBoolean(s: string): boolean {
  return s.toLowerCase() === 'true'
}

export function asNumber(s: string): number {
  return Number.parseInt(s)
}

export async function retry<T>(
  request: (countLeft: number) => Promise<T>,
  maxRetryCount = 3,
): Promise<T> {
  const countLeft = maxRetryCount - 1
  try {
    const response = await request(countLeft)
    return response
  } catch (e) {
    if (maxRetryCount > 0) {
      return retry(request, countLeft)
    } else {
      return Promise.reject(e)
    }
  }
}

export function delay(timeout = 1000): Promise<void> {
  return new Promise(resolver => setTimeout(resolver, timeout))
}

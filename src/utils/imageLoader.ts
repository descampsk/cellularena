export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = new URL(`../assets/${url}`, import.meta.url).href
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

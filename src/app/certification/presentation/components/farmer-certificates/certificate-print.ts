export async function printCertificate(source: HTMLElement, verification?: { url: string; qr: string }): Promise<void> {
  const frame = document.createElement('iframe');
  frame.title = 'SumaqAgro';
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
  document.body.append(frame);
  const page = frame.contentDocument;
  const printer = frame.contentWindow;
  if (!page || !printer) {
    frame.remove();
    return;
  }

  page.title = document.title;
  page.documentElement.lang = document.documentElement.lang;
  const style = page.createElement('style');
  style.textContent = [
    '@page { size: A4; margin: 18mm; }',
    'body { margin: 0; color: #18221e; font: 11pt/1.55 Arial, sans-serif; overflow-wrap: anywhere; }',
    '.brand { display: flex; align-items: center; gap: 12px; color: #184b36; font-size: 20pt; font-weight: bold; border-bottom: 3px solid #184b36; padding-bottom: 14px; margin-bottom: 24px; }',
    '.brand img { width: 44px; height: 44px; object-fit: contain; }',
    '.certificate-title, h2 { color: #184b36; font-size: 18pt; font-weight: bold; margin: 0 0 16px; }',
    '.certificate-title span { display: block; font-size: 11pt; margin-top: 4px; }',
    '.certificate-facts > div, .farmer-details, .farmer-grading { border-bottom: 1px solid #cad9ce; padding: 10px 0; break-inside: avoid; }',
    '.qr-panel, .farmer-qr-panel { margin-top: 20px; break-inside: avoid; }',
    '.qr-panel img, .farmer-qr-panel img { display: block; width: 36mm; height: 36mm; }',
    'a { color: #184b36; }',
  ].join('\n');
  page.head.append(style);
  const brand = page.createElement('header');
  brand.className = 'brand';
  const logo = page.createElement('img');
  logo.src = new URL('/images/logo-sumaqagro.png', document.baseURI).href;
  logo.alt = '';
  brand.append(logo, 'SumaqAgro');
  const certificate = page.importNode(source, true);
  certificate.querySelectorAll('.farmer-actions, button').forEach((control) => control.remove());
  if (verification) {
    certificate.querySelector('.farmer-qr-panel')?.remove();
    const panel = page.createElement('div');
    panel.className = 'farmer-qr-panel';
    const qr = page.createElement('img');
    qr.src = verification.qr;
    qr.alt = 'QR';
    const link = page.createElement('a');
    link.href = verification.url;
    link.textContent = verification.url;
    panel.append(qr, link);
    certificate.append(panel);
  }
  page.body.append(brand, certificate);

  const images = Array.from(page.images);
  let timeout: number | undefined;
  try {
    await Promise.race([
      Promise.allSettled(images.map((image) => image.decode())),
      new Promise<void>((resolve) => { timeout = window.setTimeout(resolve, 3000); }),
    ]);
    printer.focus();
    printer.print();
  } finally {
    window.clearTimeout(timeout);
    frame.remove();
  }
}

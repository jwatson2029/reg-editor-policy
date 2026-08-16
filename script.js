const form = document.getElementById('reg-form');
const filenameInput = document.getElementById('filename');
const contentInput = document.getElementById('reg-content');
const statusText = document.getElementById('status');

function normalizeRegHeader(content) {
  const trimmed = content.trimStart();
  if (trimmed.startsWith('Windows Registry Editor Version 5.00')) {
    return content;
  }

  return `Windows Registry Editor Version 5.00\n\n${content.trimStart()}`;
}

function ensureRegExtension(name) {
  return name.toLowerCase().endsWith('.reg') ? name : `${name}.reg`;
}

function toUtf16LeWithBom(text) {
  const bytes = new Uint8Array(2 + text.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes[2 + index * 2] = code & 0xff;
    bytes[3 + index * 2] = code >> 8;
  }

  return bytes;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const rawFilename = filenameInput.value.trim();
  const rawContent = contentInput.value;

  if (!rawFilename || !rawContent.trim()) {
    statusText.textContent = 'Please provide both file name and registry content.';
    return;
  }

  const filename = ensureRegExtension(rawFilename);
  const content = normalizeRegHeader(rawContent).replace(/\n/g, '\r\n');

  const utf16Content = toUtf16LeWithBom(content);
  const blob = new Blob([utf16Content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  statusText.textContent = `Exported ${filename}`;
});

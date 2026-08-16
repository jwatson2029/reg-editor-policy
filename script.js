const form = document.getElementById('reg-form');
const filenameInput = document.getElementById('filename');
const policyList = document.getElementById('policy-list');
const statusText = document.getElementById('status');
const submitButton = form.querySelector('button[type="submit"]');

const EDGE_POLICY_REGISTRY_PATH = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge';
const POLICY_DATA_URL = './policies.json';
const FALLBACK_POLICIES = [
  {
    key: 'HomepageLocation',
    label: 'Homepage URL',
    description: 'Sets the home page URL.',
    type: 'string',
    placeholder: 'https://contoso.com',
  },
  {
    key: 'RestoreOnStartup',
    label: 'Startup behavior',
    description: 'Choose what opens when Microsoft Edge starts.',
    type: 'enum',
    format: 'dword',
    options: [
      { label: 'Open new tab page', value: '5' },
      { label: 'Restore last session', value: '1' },
      { label: 'Open specific pages (managed separately)', value: '4' },
    ],
  },
  {
    key: 'InPrivateModeAvailability',
    label: 'InPrivate mode availability',
    description: 'Control whether users can use InPrivate mode.',
    type: 'enum',
    format: 'dword',
    options: [
      { label: 'Enabled', value: '0' },
      { label: 'Disabled', value: '1' },
      { label: 'Force only InPrivate', value: '2' },
    ],
  },
  {
    key: 'PasswordManagerEnabled',
    label: 'Password manager',
    description: 'Enable or disable password saving in Edge.',
    type: 'boolean',
  },
  {
    key: 'SmartScreenEnabled',
    label: 'Microsoft Defender SmartScreen',
    description: 'Enable or disable SmartScreen protections.',
    type: 'boolean',
  },
  {
    key: 'PrintingEnabled',
    label: 'Printing',
    description: 'Allow or block printing from Edge.',
    type: 'boolean',
  },
  {
    key: 'AutofillAddressEnabled',
    label: 'Autofill addresses',
    description: 'Allow storing and autofilling addresses.',
    type: 'boolean',
  },
  {
    key: 'AutofillCreditCardEnabled',
    label: 'Autofill payment methods',
    description: 'Allow storing and autofilling payment methods.',
    type: 'boolean',
  },
  {
    key: 'ShowHomeButton',
    label: 'Show home button',
    description: 'Show or hide the home button in the toolbar.',
    type: 'boolean',
  },
  {
    key: 'HideFirstRunExperience',
    label: 'Hide first run experience',
    description: 'Skip first-run setup for users.',
    type: 'boolean',
  },
  {
    key: 'BrowserSignin',
    label: 'Browser sign-in',
    description: 'Control browser sign-in behavior.',
    type: 'enum',
    format: 'dword',
    options: [
      { label: 'Disable browser sign-in', value: '0' },
      { label: 'Enable browser sign-in', value: '1' },
      { label: 'Force sign-in', value: '2' },
    ],
  },
  {
    key: 'SyncDisabled',
    label: 'Sync',
    description: 'Disable or enable profile sync.',
    type: 'boolean',
    invertBooleanValue: true,
    enabledLabel: 'Disabled',
    disabledLabel: 'Enabled',
  },
  {
    key: 'SavingBrowserHistoryDisabled',
    label: 'Browsing history saving',
    description: 'Prevent users from saving browsing history.',
    type: 'boolean',
    invertBooleanValue: true,
    enabledLabel: 'Disabled',
    disabledLabel: 'Enabled',
  },
  {
    key: 'PromptForDownloadLocation',
    label: 'Prompt for download location',
    description: 'Ask users where to save each downloaded file.',
    type: 'boolean',
  },
  {
    key: 'DefaultSearchProviderEnabled',
    label: 'Default search provider',
    description: 'Enable or disable custom default search provider settings.',
    type: 'boolean',
  },
  {
    key: 'SSLVersionMin',
    label: 'Minimum TLS version',
    description: 'Set the minimum TLS version allowed by Edge.',
    type: 'enum',
    options: [
      { label: 'TLS 1.0', value: 'tls1' },
      { label: 'TLS 1.1', value: 'tls1.1' },
      { label: 'TLS 1.2', value: 'tls1.2' },
      { label: 'TLS 1.3', value: 'tls1.3' },
    ],
  },
];
let edgePolicies = [];

function ensureRegExtension(name) {
  return name.toLowerCase().endsWith('.reg') ? name : `${name}.reg`;
}

function escapeRegString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function numberToDword(value) {
  return Number(value).toString(16).padStart(8, '0');
}

function renderPolicyField(policy) {
  const wrapper = document.createElement('div');
  wrapper.className = 'policy-field';
  wrapper.dataset.policyKey = policy.key;

  const header = document.createElement('div');
  header.className = 'policy-field-header';

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.id = `${policy.key}-enabled`;
  toggle.dataset.role = 'enabled';
  toggle.dataset.policyType = policy.type;
  toggle.dataset.valueFormat = policy.format || '';
  toggle.dataset.invertBooleanValue = policy.invertBooleanValue ? '1' : '';
  header.appendChild(toggle);

  const heading = document.createElement('label');
  heading.setAttribute('for', toggle.id);
  heading.className = 'policy-heading';
  heading.textContent = policy.label;
  header.appendChild(heading);

  wrapper.appendChild(header);

  const description = document.createElement('p');
  description.className = 'policy-description';
  description.textContent = policy.description;
  wrapper.appendChild(description);

  let valueControl = null;
  if (policy.type === 'string') {
    valueControl = document.createElement('input');
    valueControl.type = 'text';
    valueControl.placeholder = policy.placeholder || '';
  } else if (policy.type === 'enum') {
    valueControl = document.createElement('select');
    for (const option of policy.options) {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      valueControl.appendChild(optionElement);
    }
  } else if (policy.type === 'boolean') {
    valueControl = document.createElement('select');
    const enabledOption = document.createElement('option');
    enabledOption.value = 'enabled';
    enabledOption.textContent = policy.enabledLabel || 'Enabled';
    valueControl.appendChild(enabledOption);

    const disabledOption = document.createElement('option');
    disabledOption.value = 'disabled';
    disabledOption.textContent = policy.disabledLabel || 'Disabled';
    valueControl.appendChild(disabledOption);
  }

  valueControl.dataset.role = 'value';
  valueControl.disabled = true;
  valueControl.className = 'policy-value';
  wrapper.appendChild(valueControl);

  toggle.addEventListener('change', () => {
    valueControl.disabled = !toggle.checked;
  });

  return wrapper;
}

function buildPolicyList(policies) {
  policyList.innerHTML = '';
  for (const policy of policies) {
    policyList.appendChild(renderPolicyField(policy));
  }
}

function getRegistryValueLine(controlGroup) {
  const toggle = controlGroup.querySelector('[data-role="enabled"]');
  const valueInput = controlGroup.querySelector('[data-role="value"]');

  if (!toggle.checked) {
    return null;
  }

  const policyKey = controlGroup.dataset.policyKey;
  const policyType = toggle.dataset.policyType;
  const isDwordEnum = toggle.dataset.valueFormat === 'dword';

  if (policyType === 'string') {
    const value = valueInput.value.trim();
    if (!value) {
      throw new Error(`Please provide a value for ${policyKey}.`);
    }
    return `"${policyKey}"="${escapeRegString(value)}"`;
  }

  if (policyType === 'enum') {
    const selectedValue = valueInput.value;
    if (isDwordEnum) {
      return `"${policyKey}"=dword:${numberToDword(selectedValue)}`;
    }
    return `"${policyKey}"="${escapeRegString(selectedValue)}"`;
  }

  if (policyType === 'boolean') {
    const invertBooleanValue = toggle.dataset.invertBooleanValue === '1';
    const isEnabled = valueInput.value === 'enabled';
    const value = invertBooleanValue ? (isEnabled ? 0 : 1) : (isEnabled ? 1 : 0);
    return `"${policyKey}"=dword:${numberToDword(value)}`;
  }

  return null;
}

function buildRegContent() {
  const policyFields = Array.from(policyList.querySelectorAll('.policy-field'));
  const lines = [];

  for (const field of policyFields) {
    const line = getRegistryValueLine(field);
    if (line) {
      lines.push(line);
    }
  }

  if (lines.length === 0) {
    throw new Error('Select at least one Microsoft Edge policy.');
  }

  return `Windows Registry Editor Version 5.00\n\n[${EDGE_POLICY_REGISTRY_PATH}]\n${lines.join('\n')}`;
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

async function loadPolicies() {
  submitButton.disabled = true;
  statusText.textContent = 'Loading Microsoft Edge policies...';

  try {
    const response = await fetch(POLICY_DATA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const policies = await response.json();
    if (!Array.isArray(policies) || policies.length === 0) {
      throw new Error('Policy list was empty.');
    }

    edgePolicies = policies;
  } catch (error) {
    edgePolicies = FALLBACK_POLICIES;
    statusText.textContent = 'Could not load the full policy catalog. Using fallback policies.';
  }

  buildPolicyList(edgePolicies);
  submitButton.disabled = false;

  if (edgePolicies.length > FALLBACK_POLICIES.length) {
    statusText.textContent = `Loaded ${edgePolicies.length} Microsoft Edge policies.`;
  }
}

loadPolicies();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  statusText.textContent = '';

  const rawFilename = filenameInput.value.trim();

  if (!rawFilename) {
    statusText.textContent = 'Please provide a file name.';
    return;
  }

  let content;
  try {
    content = buildRegContent();
  } catch (error) {
    statusText.textContent = error.message;
    return;
  }

  const filename = ensureRegExtension(rawFilename);
  const windowsNewlinesContent = content.replace(/\n/g, '\r\n');

  const utf16Content = toUtf16LeWithBom(windowsNewlinesContent);
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

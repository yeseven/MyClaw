import fs from 'node:fs';

const bailianApiKey = process.env.BAILIAN_API_KEY;
const modelId = process.env.OPENCLAW_BAILIAN_MODEL || 'qwen3-max';
const feishuDomain = process.env.FEISHU_DOMAIN || 'feishu';

if (!bailianApiKey) {
  console.error('[sync-env-models] Missing BAILIAN_API_KEY in environment.');
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function buildTargetModel(id) {
  return {
    id,
    name: id === 'qwen3-max' ? 'Qwen3 Max' : id,
    input: ['text', 'image'],
    contextWindow: 128000,
    reasoning: false,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    maxTokens: 8192,
    api: 'openai-completions'
  };
}

function ensureBailianProvider(root) {
  root.models ??= {};
  root.models.providers ??= {};
  root.models.providers.bailian ??= {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api: 'openai-completions',
    models: []
  };

  const provider = root.models.providers.bailian;
  provider.baseUrl = provider.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  provider.api = provider.api || 'openai-completions';
  provider.apiKey = bailianApiKey;
  provider.models = [buildTargetModel(modelId)];

  root.agents ??= {};
  root.agents.defaults ??= {};
  root.agents.defaults.model ??= {};
  root.agents.defaults.model.primary = `bailian/${modelId}`;
}

function ensureFeishuConfig(root) {
  root.channels ??= {};
  root.channels.feishu ??= {};

  const feishu = root.channels.feishu;
  feishu.enabled = true;
  feishu.domain = '${FEISHU_DOMAIN}';
  feishu.connectionMode = 'websocket';
  feishu.appId = '${FEISHU_APP_ID}';
  feishu.appSecret = '${FEISHU_APP_SECRET}';
  feishu.botName = feishu.botName || 'MyClaw';
  feishu.dmPolicy = 'pairing';
  feishu.groupPolicy = 'open';

  if (typeof feishu.blockStreaming !== 'boolean') {
    feishu.blockStreaming = false;
  }

  delete feishu.defaultAccount;
  delete feishu.accounts;
  delete feishu.allowFrom;
  delete feishu.allow_from;

  if (feishuDomain !== 'feishu' && feishuDomain !== 'lark') {
    console.warn(`[sync-env-models] Unexpected FEISHU_DOMAIN=${feishuDomain}; expected feishu or lark`);
  }
}

function ensurePluginConfig(root) {
  root.plugins ??= {};
  root.plugins.allow = ['feishu', 'openclaw-lark'];

  root.plugins.entries ??= {};
  root.plugins.entries.feishu = {
    enabled: true,
    hooks: {
      allowPromptInjection: true
    }
  };

  if (root.plugins.entries['openclaw-lark']) {
    root.plugins.entries['openclaw-lark'] = {
      enabled: false,
      hooks: {
        allowPromptInjection: false
      }
    };
  }

  delete root.plugins.entries['custom-1'];
  delete root.plugins.entries['custom-2'];
}

function syncOpenclawJson() {
  const path = '/home/node/.openclaw/openclaw.json';
  const data = readJson(path);
  if (!data) return;
  ensureBailianProvider(data);
  ensureFeishuConfig(data);
  ensurePluginConfig(data);
  writeJson(path, data);
  console.log(`[sync-env-models] Updated ${path}`);
}

function syncAgentModelsJson() {
  const path = '/home/node/.openclaw/agents/main/agent/models.json';
  const data = readJson(path) || { providers: {} };

  data.providers ??= {};
  data.providers.bailian ??= {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api: 'openai-completions',
    models: []
  };

  const provider = data.providers.bailian;
  provider.baseUrl = provider.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  provider.api = provider.api || 'openai-completions';
  provider.apiKey = bailianApiKey;
  provider.models = [buildTargetModel(modelId)];

  writeJson(path, data);
  console.log(`[sync-env-models] Updated ${path}`);
}

function syncAuthProfiles() {
  const path = '/home/node/.openclaw/agents/main/agent/auth-profiles.json';
  const data = readJson(path) || { profiles: {}, order: {} };

  data.profiles ??= {};
  data.order ??= {};

  data.profiles['openai:manual'] = {
    provider: 'openai',
    auth: {
      mode: 'token',
      token: bailianApiKey
    },
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  };
  data.order.openai = ['openai:manual'];

  writeJson(path, data);
  console.log(`[sync-env-models] Updated ${path}`);
}

syncOpenclawJson();
syncAgentModelsJson();
syncAuthProfiles();
console.log(`[sync-env-models] Model set to bailian/${modelId}`);

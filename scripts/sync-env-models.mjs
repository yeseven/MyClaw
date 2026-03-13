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

  // Add all supported free tier models
  const supportedModels = [
    modelId, // Always put the selected primary model first (env override or qwen3-max)
    'qvq-max-2025-03-25',
    'qwen-math-turbo',
    'qwen-coder-turbo-0919',
    'qwen3-vl-235b-a22b-thinking',
    'qwen1.5-110b-chat',
    'qwen-vl-plus-2025-05-07',
    'qwen2.5-vl-72b-instruct',
    'qwen2.5-math-7b-instruct',
    'qwen-plus-2025-07-28',
    'qwen-vl-plus-latest',
    'qwen2.5-vl-3b-instruct',
    'deepseek-r1-distill-qwen-7b',
    'glm-5',
    'qwen-max',
    'qwen2.5-14b-instruct',
    'qwen-mt-flash',
    'qwen3-vl-30b-a3b-thinking',
    'qwen-vl-ocr-latest',
    'qwen3-32b',
    'qwen2.5-7b-instruct',
    'qwen-vl-max-2025-08-13',
    'deepseek-r1-distill-qwen-32b',
    'qwen1.5-7b-chat',
    'qwen-vl-plus',
    'qwen-long',
    'qwen-coder-plus-latest',
    'qwen3.5-35b-a3b',
    'qwen-max-2025-01-25',
    'glm-4.5-air',
    'qwen3-coder-480b-a35b-instruct',
    'qwen3-coder-plus',
    'qwen3-vl-8b-thinking',
    'qwen3.5-flash-2026-02-23',
    'qwen3-vl-flash-2025-10-15',
    'qwen3-max-preview',
    'qwen-vl-ocr-1028',
    'qwen3-8b',
    'qwen2.5-14b-instruct-1m',
    'qwen-plus-0112',
    'qwen-plus',
    'qwen-math-plus',
    'qwen2-vl-72b-instruct',
    'qwen-turbo',
    'qwen3-0.6b',
    'qvq-max',
    'qwen3-coder-flash',
    'qwen-vl-plus-2025-08-15',
    'qwen2.5-coder-14b-instruct',
    'qwen3-next-80b-a3b-thinking',
    'qwen-vl-max-latest',
    'qwen1.5-14b-chat',
    'qwen3.5-27b',
    'deepseek-r1',
    'qvq-plus-latest',
    'qwen3-vl-flash',
    'qwen2.5-32b-instruct',
    'qwen-turbo-latest',
    'MiniMax-M2.5',
    'qwen3-max-2025-09-23',
    'qwen-flash',
    'kimi-k2.5'
  ];

  // Deduplicate in case modelId is in the list
  const uniqueModels = [...new Set(supportedModels)];
  
  provider.models = uniqueModels.map(buildTargetModel);

  root.agents ??= {};
  root.agents.defaults ??= {};
  root.agents.defaults.model ??= {};
  
  // 尊重用户在面页上选择的 bailian 模型，如果不以 bailian 开头或者是旧版默认的 qwen-max，则使用环境变量的默认值
  const currentPrimary = root.agents.defaults.model.primary;
  if (!currentPrimary || !currentPrimary.startsWith('bailian/') || currentPrimary === 'bailian/qwen-max') {
    root.agents.defaults.model.primary = `bailian/${modelId}`;
  }
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

  const supportedModels = [
    modelId,
    'qvq-max-2025-03-25',
    'qwen-math-turbo',
    'qwen-coder-turbo-0919',
    'qwen3-vl-235b-a22b-thinking',
    'qwen1.5-110b-chat',
    'qwen-vl-plus-2025-05-07',
    'qwen2.5-vl-72b-instruct',
    'qwen2.5-math-7b-instruct',
    'qwen-plus-2025-07-28',
    'qwen-vl-plus-latest',
    'qwen2.5-vl-3b-instruct',
    'deepseek-r1-distill-qwen-7b',
    'glm-5',
    'qwen-max',
    'qwen2.5-14b-instruct',
    'qwen-mt-flash',
    'qwen3-vl-30b-a3b-thinking',
    'qwen-vl-ocr-latest',
    'qwen3-32b',
    'qwen2.5-7b-instruct',
    'qwen-vl-max-2025-08-13',
    'deepseek-r1-distill-qwen-32b',
    'qwen1.5-7b-chat',
    'qwen-vl-plus',
    'qwen-long',
    'qwen-coder-plus-latest',
    'qwen3.5-35b-a3b',
    'qwen-max-2025-01-25',
    'glm-4.5-air',
    'qwen3-coder-480b-a35b-instruct',
    'qwen3-coder-plus',
    'qwen3-vl-8b-thinking',
    'qwen3.5-flash-2026-02-23',
    'qwen3-vl-flash-2025-10-15',
    'qwen3-max-preview',
    'qwen-vl-ocr-1028',
    'qwen3-8b',
    'qwen2.5-14b-instruct-1m',
    'qwen-plus-0112',
    'qwen-plus',
    'qwen-math-plus',
    'qwen2-vl-72b-instruct',
    'qwen-turbo',
    'qwen3-0.6b',
    'qvq-max',
    'qwen3-coder-flash',
    'qwen-vl-plus-2025-08-15',
    'qwen2.5-coder-14b-instruct',
    'qwen3-next-80b-a3b-thinking',
    'qwen-vl-max-latest',
    'qwen1.5-14b-chat',
    'qwen3.5-27b',
    'deepseek-r1',
    'qvq-plus-latest',
    'qwen3-vl-flash',
    'qwen2.5-32b-instruct',
    'qwen-turbo-latest',
    'MiniMax-M2.5',
    'qwen3-max-2025-09-23',
    'qwen-flash',
    'kimi-k2.5'
  ];

  const uniqueModels = [...new Set(supportedModels)];
  provider.models = uniqueModels.map(buildTargetModel);

  writeJson(path, data);
  console.log(`[sync-env-models] Updated ${path} with ${uniqueModels.length} models`);
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

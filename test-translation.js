const { createTranslator } = require('./dist/index.js');

// 创建翻译器
const t = createTranslator('zh-CN');

// 测试有问题的键
console.log('测试翻译键:');
console.log('auth.检查认证状态...:', t('auth.检查认证状态...'));
console.log('auth.登录:', t('auth.登录'));
console.log('auth.用户名:', t('auth.用户名'));

// 测试其他键
console.log('\n测试其他键:');
console.log('common.loading:', t('common.loading'));
console.log('errors.NETWORK_ERROR:', t('errors.NETWORK_ERROR'));

// 直接测试 JSON 数据
const zhCN = require('./dist/locales/zh-CN.json');
console.log('\n直接访问 JSON:');
console.log('zhCN.auth:', zhCN.auth);
console.log('zhCN.auth["检查认证状态..."]:', zhCN.auth['检查认证状态...']); 
/**
 * 浏览器兼容性检测工具
 * 支持检测浏览器版本、功能支持、性能等
 */

export interface BrowserInfo {
  name: string;
  version: string;
  majorVersion: number;
  isSupported: boolean;
  warnings: string[];
  features: FeatureSupport;
}

export interface FeatureSupport {
  es6: boolean;
  fetch: boolean;
  webgl: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webWorkers: boolean;
  serviceWorker: boolean;
  websockets: boolean;
  dragAndDrop: boolean;
  fileApi: boolean;
  canvas: boolean;
  svg: boolean;
  touchEvents: boolean;
  mediaQueries: boolean;
  flexbox: boolean;
  grid: boolean;
  customProperties: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
}

// 支持的浏览器最低版本要求
const MINIMUM_BROWSER_VERSIONS = {
  chrome: 90,
  firefox: 88,
  safari: 14,
  edge: 90,
  opera: 76
};

/**
 * 检测用户代理字符串
 */
function parseUserAgent(): { name: string; version: string; majorVersion: number } {
  const ua = navigator.userAgent;
  
  // Chrome
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const match = ua.match(/Chrome\/(\d+)\.(\d+)/);
    if (match) {
      const version = `${match[1]}.${match[2]}`;
      return { name: 'chrome', version, majorVersion: parseInt(match[1]) };
    }
  }
  
  // Edge (Chromium)
  if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+)\.(\d+)/);
    if (match) {
      const version = `${match[1]}.${match[2]}`;
      return { name: 'edge', version, majorVersion: parseInt(match[1]) };
    }
  }
  
  // Firefox
  if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)\.(\d+)/);
    if (match) {
      const version = `${match[1]}.${match[2]}`;
      return { name: 'firefox', version, majorVersion: parseInt(match[1]) };
    }
  }
  
  // Safari
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)\.(\d+)/);
    if (match) {
      const version = `${match[1]}.${match[2]}`;
      return { name: 'safari', version, majorVersion: parseInt(match[1]) };
    }
  }
  
  // Opera
  if (ua.includes('OPR')) {
    const match = ua.match(/OPR\/(\d+)\.(\d+)/);
    if (match) {
      const version = `${match[1]}.${match[2]}`;
      return { name: 'opera', version, majorVersion: parseInt(match[1]) };
    }
  }
  
  return { name: 'unknown', version: '0.0', majorVersion: 0 };
}

/**
 * 检测功能支持
 */
function detectFeatureSupport(): FeatureSupport {
  const features: FeatureSupport = {
    es6: false,
    fetch: false,
    webgl: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorkers: false,
    serviceWorker: false,
    websockets: false,
    dragAndDrop: false,
    fileApi: false,
    canvas: false,
    svg: false,
    touchEvents: false,
    mediaQueries: false,
    flexbox: false,
    grid: false,
    customProperties: false,
    intersectionObserver: false,
    resizeObserver: false,
    mutationObserver: false
  };

  // ES6 支持
  try {
    eval('const test = () => {}; class Test {}');
    features.es6 = true;
  } catch (e) {
    features.es6 = false;
  }

  // Fetch API
  features.fetch = typeof fetch !== 'undefined';

  // WebGL
  try {
    const canvas = document.createElement('canvas');
    features.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    features.webgl = false;
  }

  // Storage APIs
  features.localStorage = typeof localStorage !== 'undefined';
  features.sessionStorage = typeof sessionStorage !== 'undefined';
  features.indexedDB = typeof indexedDB !== 'undefined';

  // Worker APIs
  features.webWorkers = typeof Worker !== 'undefined';
  features.serviceWorker = 'serviceWorker' in navigator;

  // WebSockets
  features.websockets = typeof WebSocket !== 'undefined';

  // Drag and Drop
  features.dragAndDrop = 'draggable' in document.createElement('div');

  // File API
  features.fileApi = typeof FileReader !== 'undefined';

  // Canvas
  features.canvas = !!document.createElement('canvas').getContext;

  // SVG
  features.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

  // Touch Events
  features.touchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // CSS Features
  features.mediaQueries = typeof window.matchMedia !== 'undefined';
  
  // CSS Flexbox
  const testElement = document.createElement('div');
  testElement.style.display = 'flex';
  features.flexbox = testElement.style.display === 'flex';

  // CSS Grid
  testElement.style.display = 'grid';
  features.grid = testElement.style.display === 'grid';

  // CSS Custom Properties
  features.customProperties = CSS.supports && CSS.supports('--test', 'test');

  // Observer APIs
  features.intersectionObserver = typeof IntersectionObserver !== 'undefined';
  features.resizeObserver = typeof ResizeObserver !== 'undefined';
  features.mutationObserver = typeof MutationObserver !== 'undefined';

  return features;
}

/**
 * 获取浏览器信息
 */
export function getBrowserInfo(): BrowserInfo {
  const { name, version, majorVersion } = parseUserAgent();
  const features = detectFeatureSupport();
  const warnings: string[] = [];
  
  // 检查版本支持
  const minimumVersion = MINIMUM_BROWSER_VERSIONS[name as keyof typeof MINIMUM_BROWSER_VERSIONS];
  const isSupported = minimumVersion ? majorVersion >= minimumVersion : false;

  // 生成警告信息
  if (!isSupported && minimumVersion) {
    warnings.push(`您的${name}浏览器版本过低（当前: ${version}，最低要求: ${minimumVersion}），可能影响使用体验`);
  }

  if (!features.es6) {
    warnings.push('您的浏览器不支持ES6语法，部分功能可能无法正常使用');
  }

  if (!features.fetch) {
    warnings.push('您的浏览器不支持Fetch API，网络请求可能存在兼容性问题');
  }

  if (!features.localStorage) {
    warnings.push('您的浏览器不支持本地存储，部分设置无法保存');
  }

  if (!features.dragAndDrop) {
    warnings.push('您的浏览器不支持拖拽功能，编辑器体验可能受限');
  }

  if (!features.flexbox) {
    warnings.push('您的浏览器不支持CSS Flexbox，页面布局可能异常');
  }

  return {
    name,
    version,
    majorVersion,
    isSupported,
    warnings,
    features
  };
}

/**
 * 检测屏幕分辨率支持
 */
export function checkScreenResolution(): { isSupported: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const minWidth = 1280;
  const minHeight = 720;
  
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const isSupported = screenWidth >= minWidth && screenHeight >= minHeight;

  if (!isSupported) {
    warnings.push(`您的屏幕分辨率过低（${screenWidth}x${screenHeight}），推荐使用${minWidth}x${minHeight}或更高分辨率`);
  }

  if (viewportWidth < minWidth) {
    warnings.push(`浏览器窗口宽度过小（${viewportWidth}px），推荐至少${minWidth}px宽度以获得最佳体验`);
  }

  return { isSupported, warnings };
}

/**
 * 检测网络连接
 */
export function checkNetworkConnection(): { isOnline: boolean; connectionType?: string; warnings: string[] } {
  const warnings: string[] = [];
  const isOnline = navigator.onLine;

  if (!isOnline) {
    warnings.push('网络连接已断开，部分功能可能无法使用');
  }

  // 检测连接类型（如果支持）
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  let connectionType: string | undefined;

  if (connection) {
    connectionType = connection.effectiveType || connection.type;
    
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      warnings.push('网络连接较慢，加载时间可能较长');
    }
  }

  return { isOnline, connectionType, warnings };
}

/**
 * 性能检测
 */
export function checkPerformance(): { warnings: string[] } {
  const warnings: string[] = [];

  // 检测设备内存（如果支持）
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    warnings.push(`设备内存较低（${deviceMemory}GB），可能影响编辑器性能`);
  }

  // 检测硬件并发数
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency < 4) {
    warnings.push(`CPU核心数较少（${hardwareConcurrency}核），处理大量模块时可能较慢`);
  }

  return { warnings };
}

/**
 * 综合兼容性检查
 */
export function performCompatibilityCheck(): {
  browser: BrowserInfo;
  screen: ReturnType<typeof checkScreenResolution>;
  network: ReturnType<typeof checkNetworkConnection>;
  performance: ReturnType<typeof checkPerformance>;
  overallSupported: boolean;
  criticalIssues: string[];
  recommendations: string[];
} {
  const browser = getBrowserInfo();
  const screen = checkScreenResolution();
  const network = checkNetworkConnection();
  const performance = checkPerformance();

  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // 收集关键问题
  if (!browser.isSupported) {
    criticalIssues.push('浏览器版本过低');
  }

  if (!browser.features.es6) {
    criticalIssues.push('不支持现代JavaScript语法');
  }

  if (!browser.features.fetch) {
    criticalIssues.push('不支持现代网络API');
  }

  if (!screen.isSupported) {
    criticalIssues.push('屏幕分辨率过低');
  }

  // 生成建议
  if (!browser.isSupported) {
    recommendations.push('请升级您的浏览器到最新版本');
  }

  if (!screen.isSupported) {
    recommendations.push('建议使用更大的屏幕或调整浏览器窗口大小');
  }

  if (network.connectionType === 'slow-2g' || network.connectionType === '2g') {
    recommendations.push('建议在更好的网络环境下使用编辑器');
  }

  const overallSupported = criticalIssues.length === 0;

  return {
    browser,
    screen,
    network,
    performance,
    overallSupported,
    criticalIssues,
    recommendations
  };
}

/**
 * 创建兼容性报告
 */
export function generateCompatibilityReport(): string {
  const check = performCompatibilityCheck();
  
  let report = '=== 浏览器兼容性报告 ===\n\n';
  
  report += `浏览器: ${check.browser.name} ${check.browser.version}\n`;
  report += `支持状态: ${check.browser.isSupported ? '✅ 支持' : '❌ 不支持'}\n`;
  report += `屏幕分辨率: ${window.screen.width}x${window.screen.height} ${check.screen.isSupported ? '✅' : '❌'}\n`;
  report += `网络状态: ${check.network.isOnline ? '在线' : '离线'}\n`;
  
  if (check.network.connectionType) {
    report += `连接类型: ${check.network.connectionType}\n`;
  }
  
  report += '\n=== 功能支持 ===\n';
  Object.entries(check.browser.features).forEach(([feature, supported]) => {
    report += `${feature}: ${supported ? '✅' : '❌'}\n`;
  });
  
  if (check.criticalIssues.length > 0) {
    report += '\n=== 关键问题 ===\n';
    check.criticalIssues.forEach(issue => {
      report += `• ${issue}\n`;
    });
  }
  
  if (check.recommendations.length > 0) {
    report += '\n=== 建议 ===\n';
    check.recommendations.forEach(rec => {
      report += `• ${rec}\n`;
    });
  }
  
  return report;
}

/**
 * 监听兼容性相关事件
 */
export function setupCompatibilityMonitoring(callback: (event: string, data?: any) => void): () => void {
  const handlers: Array<() => void> = [];

  // 监听在线/离线状态
  const onlineHandler = () => callback('online');
  const offlineHandler = () => callback('offline');
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  handlers.push(() => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  });

  // 监听窗口大小变化
  const resizeHandler = () => {
    const screen = checkScreenResolution();
    callback('resize', screen);
  };
  
  window.addEventListener('resize', resizeHandler);
  handlers.push(() => window.removeEventListener('resize', resizeHandler));

  // 监听网络连接变化（如果支持）
  const connection = (navigator as any).connection;
  if (connection) {
    const connectionHandler = () => {
      const network = checkNetworkConnection();
      callback('connection-change', network);
    };
    
    connection.addEventListener('change', connectionHandler);
    handlers.push(() => connection.removeEventListener('change', connectionHandler));
  }

  // 返回清理函数
  return () => {
    handlers.forEach(cleanup => cleanup());
  };
} 
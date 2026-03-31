/**
 * 主应用脚本
 * 初始化所有模块并启动应用
 */

import { storageManager } from './modules/storage-manager.js';
import { todoManager } from './modules/todo-manager.js';
import { themeManager } from './modules/theme-manager.js';
import { i18nManager } from './modules/i18n-manager.js';
import { uiManager } from './modules/ui-manager.js';

/**
 * 应用主类
 */
class TodoApp {
  constructor() {
    this.modules = {
      storage: storageManager,
      todo: todoManager,
      theme: themeManager,
      i18n: i18nManager,
      ui: uiManager
    };

    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.isInitialized) {
      console.warn('应用已经初始化');
      return;
    }

    try {
      console.log('正在初始化待办事项应用...');

      // 1. 初始化基础模块
      await this.initBasicModules();

      // 2. 设置国际化文本
      this.setupI18n();

      // 3. 设置主题
      this.setupTheme();

      // 4. 设置事件监听器
      this.setupEventListeners();

      // 5. 渲染初始界面
      this.renderInitialUI();

      // 6. 检查数据完整性
      this.checkDataIntegrity();

      this.isInitialized = true;
      console.log('待办事项应用初始化完成');

      // 显示欢迎消息
      this.showWelcomeMessage();

    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化基础模块
   */
  async initBasicModules() {
    // 模块已经通过导入自动初始化
    // 这里可以添加额外的初始化逻辑

    // 检查浏览器兼容性
    this.checkBrowserCompatibility();

    // 注册Service Worker（如果支持）
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
  }

  /**
   * 设置国际化
   */
  setupI18n() {
    // 更新所有国际化文本
    i18nManager.applyLanguage();

    // 设置语言切换按钮
    this.setupLanguageToggle();
  }

  /**
   * 设置主题
   */
  setupTheme() {
    // 设置主题切换按钮
    this.setupThemeToggle();

    // 应用当前主题
    const appliedTheme = themeManager.getAppliedTheme();
    console.log(`当前主题: ${themeManager.getCurrentTheme()} (应用: ${appliedTheme})`);
  }

  /**
   * 设置语言切换按钮
   */
  setupLanguageToggle() {
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
      langToggleBtn.textContent = i18nManager.getCurrentLanguage() === 'zh' ? 'EN' : '中文';

      langToggleBtn.addEventListener('click', () => {
        i18nManager.toggleLanguage();
        langToggleBtn.textContent = i18nManager.getCurrentLanguage() === 'zh' ? 'EN' : '中文';
      });
    }
  }

  /**
   * 设置主题切换按钮
   */
  setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.textContent = themeManager.getNextThemeDisplayName();

      themeToggleBtn.addEventListener('click', () => {
        themeManager.toggleTheme();
        themeToggleBtn.textContent = themeManager.getNextThemeDisplayName();
      });
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 窗口事件
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOfflineStatus.bind(this));

    // 主题变化事件
    themeManager.onThemeChange((detail) => {
      console.log('主题变化:', detail);
      this.updateThemeUI(detail);
    });

    // 语言变化事件
    i18nManager.onLanguageChange((detail) => {
      console.log('语言变化:', detail);
      this.updateLanguageUI(detail);
    });

    // 待办事项事件
    todoManager.addListener('add', this.handleTodoAdded.bind(this));
    todoManager.addListener('update', this.handleTodoUpdated.bind(this));
    todoManager.addListener('delete', this.handleTodoDeleted.bind(this));

    // 存储事件
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  /**
   * 渲染初始界面
   */
  renderInitialUI() {
    // UI管理器已经负责渲染
    // 这里可以添加额外的初始渲染逻辑

    // 更新统计信息
    this.updateStats();

    // 显示当前日期
    this.displayCurrentDate();
  }

  /**
   * 检查数据完整性
   */
  checkDataIntegrity() {
    const todos = todoManager.todos;
    let corruptedCount = 0;

    todos.forEach((todo, index) => {
      if (!todo.id || !todo.title) {
        console.warn(`发现损坏的任务数据: 索引 ${index}`, todo);
        corruptedCount++;
      }
    });

    if (corruptedCount > 0) {
      console.warn(`发现 ${corruptedCount} 个损坏的任务数据`);
      this.showWarning(`发现 ${corruptedCount} 个损坏的任务数据，建议备份后修复`);
    }
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility() {
    const requiredFeatures = [
      'localStorage',
      'querySelector',
      'addEventListener',
      'classList',
      'Promise'
    ];

    const missingFeatures = requiredFeatures.filter(feature => !(feature in window));

    if (missingFeatures.length > 0) {
      console.warn('缺少浏览器功能:', missingFeatures);
      this.showWarning(`您的浏览器缺少一些必要功能: ${missingFeatures.join(', ')}。部分功能可能无法正常使用。`);
    }

    // 检查现代CSS特性
    if (!CSS.supports('display', 'grid')) {
      console.warn('浏览器不支持CSS Grid');
      this.showWarning('您的浏览器不支持CSS Grid布局，界面可能显示异常。');
    }
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker 注册成功:', registration);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('发现新的 Service Worker:', newWorker);

        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker 状态变化:', newWorker.state);
        });
      });

    } catch (error) {
      console.warn('Service Worker 注册失败:', error);
    }
  }

  /**
   * 更新统计信息
   */
  updateStats() {
    const stats = todoManager.getOverallStats();
    const priorityStats = todoManager.getPriorityStats();

    // 这里可以更新额外的统计显示
    console.log('应用统计:', {
      总任务数: stats.total,
      待办任务: stats.pending,
      已完成: stats.completed,
      完成率: `${stats.completionRate}%`,
      高优先级: priorityStats.high
    });
  }

  /**
   * 显示当前日期
   */
  displayCurrentDate() {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const dateString = now.toLocaleDateString(
      i18nManager.getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US',
      options
    );

    // 可以在页面上显示日期
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = dateString;
    }
  }

  /**
   * 显示欢迎消息
   */
  showWelcomeMessage() {
    const message = i18nManager.isChinese()
      ? `欢迎使用待办事项应用！您有 ${todoManager.todos.length} 个任务需要处理。`
      : `Welcome to Todo App! You have ${todoManager.todos.length} tasks to manage.`;

    console.log(message);

    // 如果是第一次使用，显示引导
    if (todoManager.todos.length === 0 && !localStorage.getItem('todo_app_first_visit')) {
      this.showFirstTimeGuide();
      localStorage.setItem('todo_app_first_visit', 'true');
    }
  }

  /**
   * 显示首次使用引导
   */
  showFirstTimeGuide() {
    const guideHTML = i18nManager.isChinese() ? `
      <div class="first-time-guide">
        <h3>👋 欢迎使用待办事项应用！</h3>
        <p>这是一个功能强大的任务管理工具，以下是快速开始指南：</p>
        <ol>
          <li>在上方表单中输入任务标题，然后点击"添加任务"</li>
          <li>点击任务前的复选框标记完成</li>
          <li>使用右侧的筛选按钮查看不同状态的任务</li>
          <li>点击右上角按钮切换主题和语言</li>
          <li>使用快捷键 Ctrl/Cmd + N 快速添加任务</li>
        </ol>
        <button id="closeGuideBtn">开始使用</button>
      </div>
    ` : `
      <div class="first-time-guide">
        <h3>👋 Welcome to Todo App!</h3>
        <p>This is a powerful task management tool. Here's a quick start guide:</p>
        <ol>
          <li>Enter a task title in the form above, then click "Add Task"</li>
          <li>Click the checkbox before a task to mark it complete</li>
          <li>Use the filter buttons on the right to view different task statuses</li>
          <li>Click the buttons in the top-right to toggle theme and language</li>
          <li>Use Ctrl/Cmd + N shortcut to quickly add tasks</li>
        </ol>
        <button id="closeGuideBtn">Get Started</button>
      </div>
    `;

    const guideElement = document.createElement('div');
    guideElement.id = 'firstTimeGuide';
    guideElement.innerHTML = guideHTML;
    guideElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--glass);
      border: 1px solid var(--line);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-lg);
      padding: 24px;
      z-index: 1000;
      max-width: 500px;
      width: 90%;
      box-shadow: var(--shadow-lg);
    `;

    document.body.appendChild(guideElement);

    const closeBtn = document.getElementById('closeGuideBtn');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(guideElement);
    });

    // 点击外部关闭
    guideElement.addEventListener('click', (e) => {
      if (e.target === guideElement) {
        document.body.removeChild(guideElement);
      }
    });
  }

  /**
   * 更新主题相关UI
   * @param {Object} detail 主题详情
   */
  updateThemeUI(detail) {
    // 更新主题选择器
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = detail.theme;
    }

    // 更新页面元标签
    this.updateThemeMetaTags(detail.isDark);

    // 添加主题变化动画
    document.body.classList.add('theme-transition');
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  }

  /**
   * 更新主题元标签
   * @param {boolean} isDark 是否是暗色模式
   */
  updateThemeMetaTags(isDark) {
    // 更新主题颜色
    const themeColor = isDark ? '#0f172a' : '#1677ff';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.content = themeColor;
  }

  /**
   * 更新语言相关UI
   * @param {Object} detail 语言详情
   */
  updateLanguageUI(detail) {
    // 更新语言选择器
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = detail.language;
    }

    // 更新HTML lang属性
    document.documentElement.lang = detail.language;

    // 更新文本方向（如果需要）
    const direction = detail.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
  }

  /**
   * 处理待办事项添加事件
   * @param {Todo} todo 添加的任务
   */
  handleTodoAdded(todo) {
    console.log('任务添加:', todo.title);
    this.showToast(i18nManager.t('taskAdded'), 'success');
  }

  /**
   * 处理待办事项更新事件
   * @param {Todo} newTodo 新任务
   * @param {Todo} oldTodo 旧任务
   */
  handleTodoUpdated(newTodo, oldTodo) {
    console.log('任务更新:', newTodo.title);
    this.showToast(i18nManager.t('taskUpdated'), 'info');
  }

  /**
   * 处理待办事项删除事件
   * @param {Todo} todo 删除的任务
   */
  handleTodoDeleted(todo) {
    console.log('任务删除:', todo.title);
    this.showToast(i18nManager.t('taskDeleted'), 'warning');
  }

  /**
   * 处理窗口关闭前事件
   * @param {Event} event 事件对象
   */
  handleBeforeUnload(event) {
    // 检查是否有未保存的更改
    const hasUnsavedChanges = false; // 这里可以实现检查逻辑

    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = i18nManager.t('unsavedChangesWarning');
      return i18nManager.t('unsavedChangesWarning');
    }
  }

  /**
   * 处理在线状态变化
   */
  handleOnlineStatus() {
    console.log('网络连接已恢复');
    this.showToast(i18nManager.t('networkRestored'), 'success');
  }

  /**
   * 处理离线状态变化
   */
  handleOfflineStatus() {
    console.log('网络连接已断开');
    this.showToast(i18nManager.t('networkLost'), 'warning');
  }

  /**
   * 处理存储事件（跨标签页同步）
   * @param {StorageEvent} event 存储事件
   */
  handleStorageEvent(event) {
    if (event.key && event.key.startsWith('todo_app_')) {
      console.log('检测到存储变化，刷新数据:', event.key);

      // 重新加载相关数据
      if (event.key === 'todo_app_todos') {
        // 这里可以重新加载待办事项
        console.log('待办事项数据已更新');
      } else if (event.key === 'todo_app_settings') {
        // 重新加载设置
        console.log('设置已更新');
      }
    }
  }

  /**
   * 显示提示
   * @param {string} message 消息内容
   * @param {string} type 提示类型：success, error, info, warning
   */
  showToast(message, type = 'info') {
    // 使用UI管理器的通知系统
    uiManager.showNotification(message, type);
  }

  /**
   * 显示警告
   * @param {string} message 警告消息
   */
  showWarning(message) {
    console.warn(message);
    this.showToast(message, 'warning');
  }

  /**
   * 显示错误
   * @param {string} message 错误消息
   */
  showError(message) {
    console.error(message);
    this.showToast(message, 'error');
  }

  /**
   * 获取应用状态
   * @returns {Object} 应用状态
   */
  getAppStatus() {
    return {
      initialized: this.isInitialized,
      todosCount: todoManager.todos.length,
      theme: themeManager.getCurrentTheme(),
      language: i18nManager.getCurrentLanguage(),
      online: navigator.onLine,
      storageUsage: storageManager.getStorageUsage(),
      version: '1.0.0'
    };
  }

  /**
   * 导出应用状态报告
   * @returns {Object} 状态报告
   */
  exportStatusReport() {
    const status = this.getAppStatus();
    const stats = todoManager.getOverallStats();
    const categoryStats = todoManager.getCategoryStats();
    const tagStats = todoManager.getTagStats();

    return {
      timestamp: new Date().toISOString(),
      status,
      statistics: {
        tasks: stats,
        categories: categoryStats,
        tags: tagStats,
        priority: todoManager.getPriorityStats()
      },
      settings: storageManager.settings,
      dataSize: storageManager.getStorageUsage()
    };
  }
}

// 创建应用实例并初始化
const app = new TodoApp();

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}

// 导出应用实例（用于调试）
window.todoApp = app;

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .theme-transition * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  .first-time-guide h3 {
    margin-top: 0;
    color: var(--primary);
  }

  .first-time-guide ol {
    padding-left: 20px;
    margin: 16px 0;
  }

  .first-time-guide li {
    margin-bottom: 8px;
  }

  #closeGuideBtn {
    margin-top: 16px;
    padding: 10px 20px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 600;
  }

  #closeGuideBtn:hover {
    background: var(--primary-press);
  }
`;

document.head.appendChild(style);

console.log('待办事项应用脚本已加载');
/**
 * 主题管理模块
 * 负责暗色/亮色模式切换，基于用户现有项目模式
 */

import { storageManager } from './storage-manager.js';

/**
 * 主题管理类
 */
export class ThemeManager {
  constructor() {
    this.settings = storageManager.loadSettings();
    this.currentTheme = this.settings.theme || 'auto';
    this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 初始化主题
    this.init();
  }

  /**
   * 初始化主题
   */
  init() {
    // 监听系统主题变化
    this.themeMediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'auto') {
        this.applySystemTheme(e.matches);
      }
    });

    // 应用初始主题
    this.applyTheme(this.currentTheme);
  }

  /**
   * 获取当前主题
   * @returns {string} 当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 获取实际应用的主题（考虑自动模式）
   * @returns {'light' | 'dark'} 实际主题
   */
  getAppliedTheme() {
    if (this.currentTheme === 'auto') {
      return this.themeMediaQuery.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * 切换主题
   * @param {string} theme 主题模式：auto, light, dark
   * @returns {boolean} 是否切换成功
   */
  toggleTheme(theme = null) {
    if (!theme) {
      // 循环切换：auto -> light -> dark -> auto
      const themes = ['auto', 'light', 'dark'];
      const currentIndex = themes.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      theme = themes[nextIndex];
    }

    return this.setTheme(theme);
  }

  /**
   * 设置主题
   * @param {string} theme 主题模式
   * @returns {boolean} 是否设置成功
   */
  setTheme(theme) {
    if (!['auto', 'light', 'dark'].includes(theme)) {
      console.error(`无效的主题: ${theme}`);
      return false;
    }

    this.currentTheme = theme;

    // 保存到设置
    storageManager.updateSetting('theme', theme);

    // 应用主题
    this.applyTheme(theme);

    // 触发主题变化事件
    this.dispatchThemeChangeEvent();

    return true;
  }

  /**
   * 应用主题
   * @param {string} theme 主题模式
   */
  applyTheme(theme) {
    let appliedTheme = theme;

    if (theme === 'auto') {
      appliedTheme = this.themeMediaQuery.matches ? 'dark' : 'light';
      this.applySystemTheme(this.themeMediaQuery.matches);
    } else {
      document.body.setAttribute('data-theme', theme);
      this.updateThemeMetaTag(theme);
    }

    // 更新CSS变量
    this.updateThemeVariables(appliedTheme);

    // 保存当前主题状态
    this.saveThemeState(appliedTheme);
  }

  /**
   * 应用系统主题
   * @param {boolean} isDark 是否是暗色模式
   */
  applySystemTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    this.updateThemeMetaTag(theme);
    this.updateThemeVariables(theme);
    this.saveThemeState(theme);
  }

  /**
   * 更新主题meta标签
   * @param {'light' | 'dark'} theme 主题
   */
  updateThemeMetaTag(theme) {
    let themeColor = '#1677ff'; // 默认主题色

    if (theme === 'dark') {
      themeColor = '#0f172a'; // 暗色模式背景色
    }

    // 更新主题颜色meta标签
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  }

  /**
   * 更新CSS变量
   * @param {'light' | 'dark'} theme 主题
   */
  updateThemeVariables(theme) {
    // 这里可以添加主题特定的CSS变量更新
    // 目前主要依赖CSS中的:root和[data-theme="dark"]选择器

    // 添加过渡效果
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // 过渡结束后移除过渡效果
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  /**
   * 保存主题状态
   * @param {'light' | 'dark'} theme 主题
   */
  saveThemeState(theme) {
    // 可以在这里保存额外的主题状态
    localStorage.setItem('todo_app_current_theme', theme);
  }

  /**
   * 获取主题显示名称
   * @param {string} theme 主题模式
   * @returns {string} 显示名称
   */
  getThemeDisplayName(theme) {
    const names = {
      auto: '跟随系统',
      light: '亮色模式',
      dark: '暗色模式'
    };
    return names[theme] || theme;
  }

  /**
   * 获取下一个主题的显示名称（用于切换按钮）
   * @returns {string} 下一个主题的显示名称
   */
  getNextThemeDisplayName() {
    const themes = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    return this.getThemeDisplayName(themes[nextIndex]);
  }

  /**
   * 获取主题图标
   * @param {string} theme 主题模式
   * @returns {string} 图标字符
   */
  getThemeIcon(theme) {
    const icons = {
      auto: '🌓',
      light: '☀️',
      dark: '🌙'
    };
    return icons[theme] || '🎨';
  }

  /**
   * 检查是否是暗色模式
   * @returns {boolean} 是否是暗色模式
   */
  isDarkMode() {
    return this.getAppliedTheme() === 'dark';
  }

  /**
   * 检查是否是亮色模式
   * @returns {boolean} 是否是亮色模式
   */
  isLightMode() {
    return this.getAppliedTheme() === 'light';
  }

  /**
   * 检查是否是自动模式
   * @returns {boolean} 是否是自动模式
   */
  isAutoMode() {
    return this.currentTheme === 'auto';
  }

  /**
   * 获取所有主题选项
   * @returns {Array} 主题选项数组
   */
  getThemeOptions() {
    return [
      { value: 'auto', label: '跟随系统', icon: '🌓', description: '自动跟随系统主题设置' },
      { value: 'light', label: '亮色模式', icon: '☀️', description: '使用亮色主题' },
      { value: 'dark', label: '暗色模式', icon: '🌙', description: '使用暗色主题' }
    ];
  }

  /**
   * 应用主题到特定元素
   * @param {HTMLElement} element 目标元素
   * @param {string} theme 主题模式
   */
  applyThemeToElement(element, theme = null) {
    const appliedTheme = theme || this.getAppliedTheme();
    element.setAttribute('data-theme', appliedTheme);

    // 更新元素特定的CSS变量
    this.updateElementThemeVariables(element, appliedTheme);
  }

  /**
   * 更新元素特定的CSS变量
   * @param {HTMLElement} element 目标元素
   * @param {'light' | 'dark'} theme 主题
   */
  updateElementThemeVariables(element, theme) {
    // 这里可以添加元素特定的CSS变量更新
    // 例如：element.style.setProperty('--element-bg', theme === 'dark' ? '#1a1a1a' : '#ffffff');
  }

  /**
   * 创建主题切换按钮
   * @param {Object} options 按钮选项
   * @returns {HTMLElement} 主题切换按钮
   */
  createThemeToggleButton(options = {}) {
    const {
      showIcon = true,
      showText = true,
      size = 'normal', // 'small', 'normal', 'large'
      variant = 'secondary' // 'primary', 'secondary', 'tertiary'
    } = options;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-${variant} ${size === 'small' ? 'btn-small' : ''}`;
    button.setAttribute('aria-label', '切换主题');

    // 添加点击事件
    button.addEventListener('click', () => {
      this.toggleTheme();
      this.updateToggleButton(button);
    });

    // 初始更新按钮内容
    this.updateToggleButton(button, showIcon, showText);

    return button;
  }

  /**
   * 更新主题切换按钮
   * @param {HTMLElement} button 按钮元素
   * @param {boolean} showIcon 是否显示图标
   * @param {boolean} showText 是否显示文本
   */
  updateToggleButton(button, showIcon = true, showText = true) {
    const nextThemeName = this.getNextThemeDisplayName();
    const currentThemeIcon = this.getThemeIcon(this.currentTheme);

    button.innerHTML = '';

    if (showIcon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'theme-icon';
      iconSpan.textContent = currentThemeIcon;
      button.appendChild(iconSpan);
    }

    if (showText) {
      const textSpan = document.createElement('span');
      textSpan.className = 'theme-text';
      textSpan.textContent = nextThemeName;
      button.appendChild(textSpan);
    }

    button.title = `当前主题: ${this.getThemeDisplayName(this.currentTheme)}`;
  }

  /**
   * 创建主题选择器
   * @returns {HTMLElement} 主题选择器元素
   */
  createThemeSelector() {
    const container = document.createElement('div');
    container.className = 'theme-selector';

    const label = document.createElement('label');
    label.textContent = '主题模式:';
    label.htmlFor = 'themeSelect';
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = 'themeSelect';
    select.className = 'select-input';

    this.getThemeOptions().forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = `${option.icon} ${option.label}`;
      optionElement.title = option.description;

      if (option.value === this.currentTheme) {
        optionElement.selected = true;
      }

      select.appendChild(optionElement);
    });

    select.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });

    container.appendChild(select);

    return container;
  }

  /**
   * 触发主题变化事件
   */
  dispatchThemeChangeEvent() {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: this.currentTheme,
        appliedTheme: this.getAppliedTheme(),
        isDark: this.isDarkMode(),
        isLight: this.isLightMode(),
        isAuto: this.isAutoMode()
      }
    });

    window.dispatchEvent(event);
  }

  /**
   * 监听主题变化
   * @param {Function} callback 回调函数
   * @returns {Function} 取消监听函数
   */
  onThemeChange(callback) {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener('themechange', handler);

    // 返回取消监听函数
    return () => {
      window.removeEventListener('themechange', handler);
    };
  }
}

// 导出单例实例
export const themeManager = new ThemeManager();
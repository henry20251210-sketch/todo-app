/**
 * 国际化管理模块
 * 负责中英文切换，基于用户现有项目模式
 */

import { storageManager } from './storage-manager.js';
import { zh as zhTranslations } from '../locales/zh.js';
import { en as enTranslations } from '../locales/en.js';

// 翻译数据
const TRANSLATIONS = {
  zh: zhTranslations,
  en: enTranslations
};

/**
 * 国际化管理类
 */
export class I18nManager {
  constructor() {
    this.settings = storageManager.loadSettings();
    this.currentLang = this.settings.language || 'zh';
    this.translations = TRANSLATIONS;

    // 初始化
    this.init();
  }

  /**
   * 初始化国际化
   */
  init() {
    // 设置HTML语言属性
    document.documentElement.lang = this.currentLang;

    // 初始应用翻译
    this.applyLanguage();
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * 获取语言显示名称
   * @param {string} lang 语言代码
   * @returns {string} 显示名称
   */
  getLanguageDisplayName(lang) {
    const names = {
      zh: '中文',
      en: 'English'
    };
    return names[lang] || lang;
  }

  /**
   * 获取语言图标
   * @param {string} lang 语言代码
   * @returns {string} 图标字符
   */
  getLanguageIcon(lang) {
    const icons = {
      zh: '🇨🇳',
      en: '🇺🇸'
    };
    return icons[lang] || '🌐';
  }

  /**
   * 切换语言
   * @param {string} lang 语言代码：zh, en
   * @returns {boolean} 是否切换成功
   */
  toggleLanguage(lang = null) {
    if (!lang) {
      // 切换中英文
      lang = this.currentLang === 'zh' ? 'en' : 'zh';
    }

    return this.setLanguage(lang);
  }

  /**
   * 设置语言
   * @param {string} lang 语言代码
   * @returns {boolean} 是否设置成功
   */
  setLanguage(lang) {
    if (!['zh', 'en'].includes(lang)) {
      console.error(`不支持的语言: ${lang}`);
      return false;
    }

    this.currentLang = lang;

    // 保存到设置
    storageManager.updateSetting('language', lang);

    // 设置HTML语言属性
    document.documentElement.lang = lang;

    // 应用翻译
    this.applyLanguage();

    // 触发语言变化事件
    this.dispatchLanguageChangeEvent();

    return true;
  }

  /**
   * 应用语言翻译
   */
  applyLanguage() {
    // 更新所有带有data-i18n属性的元素
    this.updateI18nElements();

    // 更新所有带有data-i18n-placeholder属性的输入框
    this.updateI18nPlaceholders();

    // 更新所有带有data-i18n-title属性的元素
    this.updateI18nTitles();

    // 更新所有带有data-i18n-aria-label属性的元素
    this.updateI18nAriaLabels();
  }

  /**
   * 翻译文本
   * @param {string} key 翻译键
   * @param {Object} params 替换参数
   * @returns {string} 翻译后的文本
   */
  t(key, params = {}) {
    let translation = this.translations[this.currentLang]?.[key] || key;

    // 替换参数
    Object.keys(params).forEach(paramKey => {
      const placeholder = `{${paramKey}}`;
      translation = translation.replace(placeholder, params[paramKey]);
    });

    return translation;
  }

  /**
   * 格式化日期
   * @param {Date|string} date 日期
   * @param {string} format 格式：relative, short, medium, long
   * @returns {string} 格式化后的日期
   */
  formatDate(date, format = 'relative') {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return this.t('invalidDate');
    }

    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (format === 'relative') {
      // 相对时间
      const today = new Date().toDateString();
      const dateStr = d.toDateString();

      if (dateStr === today) {
        return this.t('today');
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dateStr === yesterday.toDateString()) {
        return this.t('yesterday');
      }

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateStr === tomorrow.toDateString()) {
        return this.t('tomorrow');
      }

      if (diffDays < 7) {
        // 一周内显示星期几
        return this.formatWeekday(d);
      }

      // 显示日期
      return this.formatDate(d, 'short');
    }

    // 绝对时间
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    if (format === 'short') {
      options.month = 'numeric';
    } else if (format === 'long') {
      options.weekday = 'long';
    }

    return d.toLocaleDateString(this.currentLang === 'zh' ? 'zh-CN' : 'en-US', options);
  }

  /**
   * 格式化星期几
   * @param {Date} date 日期
   * @returns {string} 星期几
   */
  formatWeekday(date) {
    const weekdays = [
      this.t('sunday'),
      this.t('monday'),
      this.t('tuesday'),
      this.t('wednesday'),
      this.t('thursday'),
      this.t('friday'),
      this.t('saturday')
    ];

    return weekdays[date.getDay()];
  }

  /**
   * 格式化月份
   * @param {Date} date 日期
   * @returns {string} 月份
   */
  formatMonth(date) {
    const months = [
      this.t('january'),
      this.t('february'),
      this.t('march'),
      this.t('april'),
      this.t('may'),
      this.t('june'),
      this.t('july'),
      this.t('august'),
      this.t('september'),
      this.t('october'),
      this.t('november'),
      this.t('december')
    ];

    return months[date.getMonth()];
  }

  /**
   * 格式化相对时间
   * @param {Date|string} date 日期
   * @returns {string} 相对时间描述
   */
  formatRelativeTime(date) {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      return this.t('invalidDate');
    }

    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return `${diffSec} ${this.t('seconds')} ${this.t('ago')}`;
    } else if (diffMin < 60) {
      return `${diffMin} ${this.t('minutes')} ${this.t('ago')}`;
    } else if (diffHour < 24) {
      return `${diffHour} ${this.t('hours')} ${this.t('ago')}`;
    } else if (diffDay < 7) {
      return `${diffDay} ${this.t('days')} ${this.t('ago')}`;
    }

    return this.formatDate(d, 'short');
  }

  /**
   * 更新所有带有data-i18n属性的元素
   */
  updateI18nElements() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation !== key) {
        element.textContent = translation;
      }
    });
  }

  /**
   * 更新所有带有data-i18n-placeholder属性的输入框
   */
  updateI18nPlaceholders() {
    const elements = document.querySelectorAll('[data-i18n-placeholder]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);

      if (translation !== key) {
        element.placeholder = translation;
      }
    });
  }

  /**
   * 更新所有带有data-i18n-title属性的元素
   */
  updateI18nTitles() {
    const elements = document.querySelectorAll('[data-i18n-title]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);

      if (translation !== key) {
        element.title = translation;
      }
    });
  }

  /**
   * 更新所有带有data-i18n-aria-label属性的元素
   */
  updateI18nAriaLabels() {
    const elements = document.querySelectorAll('[data-i18n-aria-label]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      const translation = this.t(key);

      if (translation !== key) {
        element.setAttribute('aria-label', translation);
      }
    });
  }

  /**
   * 创建语言切换按钮
   * @param {Object} options 按钮选项
   * @returns {HTMLElement} 语言切换按钮
   */
  createLanguageToggleButton(options = {}) {
    const {
      showIcon = true,
      showText = true,
      size = 'normal', // 'small', 'normal', 'large'
      variant = 'secondary' // 'primary', 'secondary', 'tertiary'
    } = options;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-${variant} ${size === 'small' ? 'btn-small' : ''}`;
    button.setAttribute('aria-label', '切换语言');

    // 添加点击事件
    button.addEventListener('click', () => {
      this.toggleLanguage();
      this.updateToggleButton(button);
    });

    // 初始更新按钮内容
    this.updateToggleButton(button, showIcon, showText);

    return button;
  }

  /**
   * 更新语言切换按钮
   * @param {HTMLElement} button 按钮元素
   * @param {boolean} showIcon 是否显示图标
   * @param {boolean} showText 是否显示文本
   */
  updateToggleButton(button, showIcon = true, showText = true) {
    const nextLanguageCode = this.currentLang === 'zh' ? 'en' : 'zh';
    const nextLanguageName = this.getLanguageDisplayName(nextLanguageCode);
    const currentLanguageIcon = this.getLanguageIcon(this.currentLang);

    button.innerHTML = '';

    if (showIcon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'language-icon';
      iconSpan.textContent = currentLanguageIcon;
      button.appendChild(iconSpan);
    }

    if (showText) {
      const textSpan = document.createElement('span');
      textSpan.className = 'language-text';
      textSpan.textContent = nextLanguageName;
      button.appendChild(textSpan);
    }

    button.title = `当前语言: ${this.getLanguageDisplayName(this.currentLang)}`;
  }

  /**
   * 创建语言选择器
   * @returns {HTMLElement} 语言选择器元素
   */
  createLanguageSelector() {
    const container = document.createElement('div');
    container.className = 'language-selector';

    const label = document.createElement('label');
    label.textContent = this.t('interfaceLanguage') + ':';
    label.htmlFor = 'languageSelect';
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = 'languageSelect';
    select.className = 'select-input';

    const languages = [
      { value: 'zh', label: '🇨🇳 中文', description: '使用中文界面' },
      { value: 'en', label: '🇺🇸 English', description: 'Use English interface' }
    ];

    languages.forEach(lang => {
      const optionElement = document.createElement('option');
      optionElement.value = lang.value;
      optionElement.textContent = lang.label;
      optionElement.title = lang.description;

      if (lang.value === this.currentLang) {
        optionElement.selected = true;
      }

      select.appendChild(optionElement);
    });

    select.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });

    container.appendChild(select);

    return container;
  }

  /**
   * 触发语言变化事件
   */
  dispatchLanguageChangeEvent() {
    const event = new CustomEvent('languagechange', {
      detail: {
        language: this.currentLang,
        languageName: this.getLanguageDisplayName(this.currentLang)
      }
    });

    window.dispatchEvent(event);
  }

  /**
   * 监听语言变化
   * @param {Function} callback 回调函数
   * @returns {Function} 取消监听函数
   */
  onLanguageChange(callback) {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener('languagechange', handler);

    // 返回取消监听函数
    return () => {
      window.removeEventListener('languagechange', handler);
    };
  }

  /**
   * 获取所有可用语言
   * @returns {Array} 语言选项数组
   */
  getAvailableLanguages() {
    return [
      { code: 'zh', name: '中文', nativeName: '中文', icon: '🇨🇳' },
      { code: 'en', name: 'English', nativeName: 'English', icon: '🇺🇸' }
    ];
  }

  /**
   * 检查是否是中文
   * @returns {boolean} 是否是中文
   */
  isChinese() {
    return this.currentLang === 'zh';
  }

  /**
   * 检查是否是英文
   * @returns {boolean} 是否是英文
   */
  isEnglish() {
    return this.currentLang === 'en';
  }

  /**
   * 获取方向（LTR/RTL）
   * @returns {string} 文本方向
   */
  getDirection() {
    return this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }
}

// 导出单例实例
export const i18nManager = new I18nManager();
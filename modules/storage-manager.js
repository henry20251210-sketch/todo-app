/**
 * 存储管理模块
 * 负责与localStorage的交互，提供数据持久化功能
 */

// 存储键名常量
const STORAGE_KEYS = {
  TODOS: 'todo_app_todos',
  SETTINGS: 'todo_app_settings',
  CATEGORIES: 'todo_app_categories',
  TAGS: 'todo_app_tags',
  STATS: 'todo_app_stats',
  BACKUP_PREFIX: 'todo_app_backup_'
};

// 默认设置
const DEFAULT_SETTINGS = {
  theme: 'auto', // auto, light, dark
  language: 'zh', // zh, en
  tasksPerPage: 20,
  defaultPriority: 'medium', // low, medium, high
  enableNotifications: true,
  enableSound: false,
  enableDragDrop: true,
  enableAnimations: true,
  defaultView: 'list', // list, board
  autoSave: true,
  autoSaveInterval: 30, // 秒
  showCompletedTasks: true,
  sortBy: 'created', // created, due, priority, title
  sortOrder: 'desc', // asc, desc
  filterBy: 'all' // all, pending, completed, high, today
};

/**
 * 存储管理类
 */
export class StorageManager {
  constructor() {
    this.settings = this.loadSettings();
    this.autoSaveTimer = null;

    // 如果启用自动保存，启动定时器
    if (this.settings.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 加载所有待办事项
   * @returns {Array} 待办事项数组
   */
  loadTodos() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TODOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载待办事项失败:', error);
      return [];
    }
  }

  /**
   * 保存所有待办事项
   * @param {Array} todos 待办事项数组
   * @returns {boolean} 是否保存成功
   */
  saveTodos(todos) {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
      this.updateStats(todos);
      return true;
    } catch (error) {
      console.error('保存待办事项失败:', error);
      return false;
    }
  }

  /**
   * 加载应用设置
   * @returns {Object} 设置对象
   */
  loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedSettings = data ? JSON.parse(data) : {};
      return { ...DEFAULT_SETTINGS, ...savedSettings };
    } catch (error) {
      console.error('加载设置失败:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * 保存应用设置
   * @param {Object} settings 设置对象
   * @returns {boolean} 是否保存成功
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      this.settings = settings;

      // 更新自动保存定时器
      if (settings.autoSave) {
        this.startAutoSave();
      } else {
        this.stopAutoSave();
      }

      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  /**
   * 更新单个设置项
   * @param {string} key 设置键名
   * @param {any} value 设置值
   * @returns {boolean} 是否更新成功
   */
  updateSetting(key, value) {
    const newSettings = { ...this.settings, [key]: value };
    return this.saveSettings(newSettings);
  }

  /**
   * 加载分类数据
   * @returns {Array} 分类数组
   */
  loadCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载分类失败:', error);
      return [];
    }
  }

  /**
   * 保存分类数据
   * @param {Array} categories 分类数组
   * @returns {boolean} 是否保存成功
   */
  saveCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (error) {
      console.error('保存分类失败:', error);
      return false;
    }
  }

  /**
   * 加载标签数据
   * @returns {Array} 标签数组
   */
  loadTags() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TAGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载标签失败:', error);
      return [];
    }
  }

  /**
   * 保存标签数据
   * @param {Array} tags 标签数组
   * @returns {boolean} 是否保存成功
   */
  saveTags(tags) {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      return true;
    } catch (error) {
      console.error('保存标签失败:', error);
      return false;
    }
  }

  /**
   * 加载统计数据
   * @returns {Object} 统计对象
   */
  loadStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : this.createDefaultStats();
    } catch (error) {
      console.error('加载统计失败:', error);
      return this.createDefaultStats();
    }
  }

  /**
   * 创建默认统计数据
   * @returns {Object} 默认统计对象
   */
  createDefaultStats() {
    return {
      totalCreated: 0,
      totalCompleted: 0,
      totalDeleted: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      priorityDistribution: { high: 0, medium: 0, low: 0 },
      tagUsage: {}
    };
  }

  /**
   * 更新统计数据
   * @param {Array} todos 待办事项数组
   */
  updateStats(todos) {
    try {
      const stats = this.calculateStats(todos);
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('更新统计失败:', error);
      return false;
    }
  }

  /**
   * 计算统计数据
   * @param {Array} todos 待办事项数组
   * @returns {Object} 统计对象
   */
  calculateStats(todos) {
    const now = new Date();
    const completedTodos = todos.filter(todo => todo.completed);
    const pendingTodos = todos.filter(todo => !todo.completed);

    // 优先级分布
    const priorityDistribution = { high: 0, medium: 0, low: 0 };
    todos.forEach(todo => {
      priorityDistribution[todo.priority]++;
    });

    // 标签使用统计
    const tagUsage = {};
    todos.forEach(todo => {
      todo.tags?.forEach(tag => {
        tagUsage[tag] = (tagUsage[tag] || 0) + 1;
      });
    });

    // 计算完成率
    const completionRate = todos.length > 0
      ? Math.round((completedTodos.length / todos.length) * 100)
      : 0;

    // 计算平均完成时间（如果有完成时间数据）
    let totalCompletionTime = 0;
    let completedWithTime = 0;

    completedTodos.forEach(todo => {
      if (todo.completedAt && todo.createdAt) {
        const created = new Date(todo.createdAt);
        const completed = new Date(todo.completedAt);
        totalCompletionTime += completed - created;
        completedWithTime++;
      }
    });

    const averageCompletionTime = completedWithTime > 0
      ? Math.round(totalCompletionTime / completedWithTime / (1000 * 60 * 60 * 24)) // 转换为天数
      : 0;

    // 加载现有统计数据以保持连续性
    const existingStats = this.loadStats();

    return {
      totalCreated: existingStats.totalCreated + (todos.length - existingStats.totalCreated), // 简化处理
      totalCompleted: completedTodos.length,
      totalDeleted: existingStats.totalDeleted, // 需要单独跟踪删除操作
      completionRate,
      averageCompletionTime,
      currentStreak: this.calculateStreak(completedTodos, existingStats),
      longestStreak: Math.max(existingStats.longestStreak, this.calculateStreak(completedTodos, existingStats)),
      lastActivityDate: now.toISOString(),
      priorityDistribution,
      tagUsage
    };
  }

  /**
   * 计算连续完成天数
   * @param {Array} completedTodos 已完成待办事项
   * @param {Object} existingStats 现有统计数据
   * @returns {number} 连续天数
   */
  calculateStreak(completedTodos, existingStats) {
    // 简化实现：如果有今天完成的任务，则增加连续天数
    const today = new Date().toDateString();
    const todayCompleted = completedTodos.some(todo => {
      const completedDate = todo.completedAt ? new Date(todo.completedAt).toDateString() : null;
      return completedDate === today;
    });

    return todayCompleted ? existingStats.currentStreak + 1 : 0;
  }

  /**
   * 导出所有数据为JSON
   * @returns {string} JSON字符串
   */
  exportAllData() {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        todos: this.loadTodos(),
        settings: this.loadSettings(),
        categories: this.loadCategories(),
        tags: this.loadTags(),
        stats: this.loadStats()
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  /**
   * 从JSON导入数据
   * @param {string} jsonData JSON字符串
   * @returns {Object} 导入结果
   */
  importData(jsonData) {
    try {
      const importData = JSON.parse(jsonData);

      // 验证数据格式
      if (!importData.version || !importData.todos) {
        return { success: false, message: '无效的数据格式' };
      }

      // 备份当前数据
      const backupKey = `${STORAGE_KEYS.BACKUP_PREFIX}${Date.now()}`;
      const currentData = this.exportAllData();
      if (currentData) {
        localStorage.setItem(backupKey, currentData);
      }

      // 导入新数据
      if (importData.todos) this.saveTodos(importData.todos);
      if (importData.settings) this.saveSettings(importData.settings);
      if (importData.categories) this.saveCategories(importData.categories);
      if (importData.tags) this.saveTags(importData.tags);
      if (importData.stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(importData.stats));
      }

      return {
        success: true,
        message: '数据导入成功',
        backupKey
      };
    } catch (error) {
      console.error('导入数据失败:', error);
      return { success: false, message: `导入失败: ${error.message}` };
    }
  }

  /**
   * 创建数据备份
   * @param {string} name 备份名称
   * @returns {string} 备份键名
   */
  createBackup(name = '') {
    try {
      const timestamp = Date.now();
      const backupKey = `${STORAGE_KEYS.BACKUP_PREFIX}${timestamp}`;
      const backupData = {
        name: name || `backup_${new Date(timestamp).toISOString()}`,
        date: timestamp,
        data: this.exportAllData()
      };

      localStorage.setItem(backupKey, JSON.stringify(backupData));
      return backupKey;
    } catch (error) {
      console.error('创建备份失败:', error);
      return null;
    }
  }

  /**
   * 恢复备份数据
   * @param {string} backupKey 备份键名
   * @returns {Object} 恢复结果
   */
  restoreBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        return { success: false, message: '备份不存在' };
      }

      const backup = JSON.parse(backupData);
      if (!backup.data) {
        return { success: false, message: '无效的备份数据' };
      }

      return this.importData(backup.data);
    } catch (error) {
      console.error('恢复备份失败:', error);
      return { success: false, message: `恢复失败: ${error.message}` };
    }
  }

  /**
   * 获取所有备份列表
   * @returns {Array} 备份列表
   */
  listBackups() {
    const backups = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEYS.BACKUP_PREFIX)) {
        try {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            backups.push({
              key,
              name: backup.name,
              date: backup.date,
              size: backupData.length
            });
          }
        } catch (error) {
          console.warn(`解析备份失败 ${key}:`, error);
        }
      }
    }

    // 按日期倒序排序
    return backups.sort((a, b) => b.date - a.date);
  }

  /**
   * 删除备份
   * @param {string} backupKey 备份键名
   * @returns {boolean} 是否删除成功
   */
  deleteBackup(backupKey) {
    try {
      localStorage.removeItem(backupKey);
      return true;
    } catch (error) {
      console.error('删除备份失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   * @param {boolean} includeBackups 是否包含备份
   * @returns {boolean} 是否清空成功
   */
  clearAllData(includeBackups = false) {
    try {
      // 清空主要数据
      Object.values(STORAGE_KEYS).forEach(key => {
        if (!key.startsWith(STORAGE_KEYS.BACKUP_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      // 如果包含备份，清空所有备份
      if (includeBackups) {
        this.listBackups().forEach(backup => {
          localStorage.removeItem(backup.key);
        });
      }

      // 重置设置
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings(this.settings);

      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object} 存储使用情况
   */
  getStorageUsage() {
    let totalSize = 0;
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('todo_app_')) {
        const value = localStorage.getItem(key);
        totalSize += (key.length + (value ? value.length : 0)) * 2; // UTF-16字符占2字节
        itemCount++;
      }
    }

    return {
      totalSize, // 字节数
      itemCount,
      readableSize: this.formatBytes(totalSize)
    };
  }

  /**
   * 格式化字节大小
   * @param {number} bytes 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 开始自动保存
   */
  startAutoSave() {
    this.stopAutoSave(); // 先停止现有定时器

    const interval = this.settings.autoSaveInterval * 1000; // 转换为毫秒
    this.autoSaveTimer = setInterval(() => {
      // 这里需要从应用获取当前待办事项并保存
      // 实际实现中，这个函数会被应用调用
      console.log('自动保存触发');
    }, interval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 清理过期的备份
   * @param {number} maxAgeDays 最大保留天数，默认30天
   * @returns {number} 删除的备份数量
   */
  cleanupOldBackups(maxAgeDays = 30) {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const backups = this.listBackups();
    let deletedCount = 0;

    backups.forEach(backup => {
      if (now - backup.date > maxAge) {
        if (this.deleteBackup(backup.key)) {
          deletedCount++;
        }
      }
    });

    return deletedCount;
  }
}

// 导出单例实例
export const storageManager = new StorageManager();
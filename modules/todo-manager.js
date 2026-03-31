/**
 * 待办事项管理模块
 * 负责待办事项的数据模型和业务逻辑
 */

import { storageManager } from './storage-manager.js';
import { i18nManager } from './i18n-manager.js';

/**
 * 待办事项数据模型
 */
export class Todo {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.completed = data.completed || false;
    this.priority = data.priority || 'medium'; // low, medium, high
    this.dueDate = data.dueDate || null;
    this.reminder = data.reminder || null;
    this.repeat = data.repeat || null; // { type: 'daily'|'weekly'|'monthly', interval: 1 }
    this.tags = data.tags || [];
    this.category = data.category || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.order = data.order || Date.now(); // 用于拖放排序
    this.completedAt = data.completedAt || null;
    this.subtasks = data.subtasks || [];
    this.notes = data.notes || '';
    this.color = data.color || null;
    this.attachments = data.attachments || [];
    this.dependencies = data.dependencies || []; // 依赖的其他任务ID
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 更新任务
   * @param {Object} updates 更新数据
   * @returns {Todo} 更新后的任务实例
   */
  update(updates) {
    const updatedData = { ...this, ...updates, updatedAt: new Date().toISOString() };

    // 如果标记为完成，设置完成时间
    if (updates.completed === true && !this.completed) {
      updatedData.completedAt = new Date().toISOString();
    }

    // 如果从完成状态改为未完成，清除完成时间
    if (updates.completed === false && this.completed) {
      updatedData.completedAt = null;
    }

    // 创建新的Todo实例
    return new Todo(updatedData);
  }

  /**
   * 切换完成状态
   * @returns {Todo} 更新后的任务实例
   */
  toggleComplete() {
    return this.update({ completed: !this.completed });
  }

  /**
   * 检查是否已过期
   * @returns {boolean} 是否已过期
   */
  isOverdue() {
    if (!this.dueDate) return false;
    const due = new Date(this.dueDate);
    const now = new Date();
    return !this.completed && due < now;
  }

  /**
   * 检查是否今天到期
   * @returns {boolean} 是否今天到期
   */
  isDueToday() {
    if (!this.dueDate) return false;
    const due = new Date(this.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  }

  /**
   * 检查是否本周到期
   * @returns {boolean} 是否本周到期
   */
  isDueThisWeek() {
    if (!this.dueDate) return false;

    const due = new Date(this.dueDate);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return due >= startOfWeek && due <= endOfWeek;
  }

  /**
   * 获取优先级数值（用于排序）
   * @returns {number} 优先级数值
   */
  getPriorityValue() {
    const values = { high: 3, medium: 2, low: 1 };
    return values[this.priority] || 0;
  }

  /**
   * 获取状态文本
   * @returns {string} 状态文本
   */
  getStatusText() {
    if (this.completed) return i18nManager.t('taskCompleted');
    if (this.isOverdue()) return i18nManager.t('taskOverdue');
    if (this.isDueToday()) return i18nManager.t('taskDueToday');
    return i18nManager.t('taskPending');
  }

  /**
   * 获取格式化截止日期
   * @returns {string} 格式化后的日期
   */
  getFormattedDueDate() {
    if (!this.dueDate) return '';
    return i18nManager.formatDate(this.dueDate, 'relative');
  }

  /**
   * 添加子任务
   * @param {Todo} subtask 子任务
   * @returns {Todo} 更新后的任务实例
   */
  addSubtask(subtask) {
    const subtasks = [...this.subtasks, subtask];
    return this.update({ subtasks });
  }

  /**
   * 移除子任务
   * @param {string} subtaskId 子任务ID
   * @returns {Todo} 更新后的任务实例
   */
  removeSubtask(subtaskId) {
    const subtasks = this.subtasks.filter(task => task.id !== subtaskId);
    return this.update({ subtasks });
  }

  /**
   * 添加标签
   * @param {string} tag 标签
   * @returns {Todo} 更新后的任务实例
   */
  addTag(tag) {
    if (!tag.trim()) return this;
    const tags = [...new Set([...this.tags, tag.trim()])];
    return this.update({ tags });
  }

  /**
   * 移除标签
   * @param {string} tag 标签
   * @returns {Todo} 更新后的任务实例
   */
  removeTag(tag) {
    const tags = this.tags.filter(t => t !== tag);
    return this.update({ tags });
  }

  /**
   * 转换为纯对象
   * @returns {Object} 纯对象
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      priority: this.priority,
      dueDate: this.dueDate,
      reminder: this.reminder,
      repeat: this.repeat,
      tags: this.tags,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      order: this.order,
      completedAt: this.completedAt,
      subtasks: this.subtasks,
      notes: this.notes,
      color: this.color,
      attachments: this.attachments,
      dependencies: this.dependencies
    };
  }

  /**
   * 验证任务数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    if (!this.title.trim()) {
      errors.push(i18nManager.t('errorTitleRequired'));
    }

    if (this.dueDate) {
      const due = new Date(this.dueDate);
      if (isNaN(due.getTime())) {
        errors.push(i18nManager.t('errorInvalidDate'));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 待办事项管理类
 */
export class TodoManager {
  constructor() {
    this.todos = this.loadTodos();
    this.categories = this.loadCategories();
    this.tags = this.loadTags();
    this.currentFilter = storageManager.settings.filterBy || 'all';
    this.currentSort = storageManager.settings.sortBy || 'created';
    this.currentSortOrder = storageManager.settings.sortOrder || 'desc';
    this.searchQuery = '';
    this.selectedIds = new Set();
    this.listeners = new Map();
  }

  /**
   * 加载待办事项
   * @returns {Array<Todo>} 待办事项数组
   */
  loadTodos() {
    const data = storageManager.loadTodos();
    return data.map(item => new Todo(item));
  }

  /**
   * 加载分类
   * @returns {Array} 分类数组
   */
  loadCategories() {
    return storageManager.loadCategories();
  }

  /**
   * 加载标签
   * @returns {Array} 标签数组
   */
  loadTags() {
    return storageManager.loadTags();
  }

  /**
   * 保存待办事项
   * @returns {boolean} 是否保存成功
   */
  saveTodos() {
    const data = this.todos.map(todo => todo.toObject());
    return storageManager.saveTodos(data);
  }

  /**
   * 保存分类
   * @returns {boolean} 是否保存成功
   */
  saveCategories() {
    return storageManager.saveCategories(this.categories);
  }

  /**
   * 保存标签
   * @returns {boolean} 是否保存成功
   */
  saveTags() {
    return storageManager.saveTags(this.tags);
  }

  /**
   * 添加待办事项
   * @param {Object} todoData 任务数据
   * @returns {Todo} 新创建的任务
   */
  addTodo(todoData) {
    const todo = new Todo(todoData);
    const validation = todo.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    this.todos.push(todo);
    this.updateCategoriesAndTags(todo);
    this.saveTodos();
    this.saveCategories();
    this.saveTags();
    this.notifyListeners('add', todo);
    return todo;
  }

  /**
   * 更新待办事项
   * @param {string} id 任务ID
   * @param {Object} updates 更新数据
   * @returns {Todo|null} 更新后的任务，如果不存在返回null
   */
  updateTodo(id, updates) {
    const index = this.todos.findIndex(todo => todo.id === id);

    if (index === -1) {
      return null;
    }

    const oldTodo = this.todos[index];
    const updatedTodo = oldTodo.update(updates);
    const validation = updatedTodo.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    this.todos[index] = updatedTodo;
    this.updateCategoriesAndTags(updatedTodo, oldTodo);
    this.saveTodos();
    this.saveCategories();
    this.saveTags();
    this.notifyListeners('update', updatedTodo, oldTodo);
    return updatedTodo;
  }

  /**
   * 删除待办事项
   * @param {string} id 任务ID
   * @returns {boolean} 是否删除成功
   */
  deleteTodo(id) {
    const index = this.todos.findIndex(todo => todo.id === id);

    if (index === -1) {
      return false;
    }

    const deletedTodo = this.todos[index];
    this.todos.splice(index, 1);
    this.saveTodos();
    this.notifyListeners('delete', deletedTodo);
    return true;
  }

  /**
   * 批量删除待办事项
   * @param {Array<string>} ids 任务ID数组
   * @returns {number} 删除的任务数量
   */
  deleteTodos(ids) {
    let deletedCount = 0;
    const deletedTodos = [];

    ids.forEach(id => {
      const index = this.todos.findIndex(todo => todo.id === id);
      if (index !== -1) {
        deletedTodos.push(this.todos[index]);
        this.todos.splice(index, 1);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      this.saveTodos();
      this.notifyListeners('batchDelete', deletedTodos);
    }

    return deletedCount;
  }

  /**
   * 获取待办事项
   * @param {string} id 任务ID
   * @returns {Todo|null} 任务实例
   */
  getTodo(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  /**
   * 切换任务完成状态
   * @param {string} id 任务ID
   * @returns {Todo|null} 更新后的任务
   */
  toggleTodoComplete(id) {
    const todo = this.getTodo(id);
    if (!todo) return null;

    const updatedTodo = todo.toggleComplete();
    const index = this.todos.findIndex(t => t.id === id);
    this.todos[index] = updatedTodo;
    this.saveTodos();
    this.notifyListeners('toggleComplete', updatedTodo, todo);
    return updatedTodo;
  }

  /**
   * 更新分类和标签
   * @param {Todo} todo 任务实例
   * @param {Todo} [oldTodo] 旧任务实例（用于更新时）
   */
  updateCategoriesAndTags(todo, oldTodo = null) {
    // 更新分类
    if (todo.category && !this.categories.includes(todo.category)) {
      this.categories.push(todo.category);
    }

    // 如果更新了分类，从旧分类中移除（如果不再使用）
    if (oldTodo && oldTodo.category && oldTodo.category !== todo.category) {
      const stillUsed = this.todos.some(t => t.category === oldTodo.category);
      if (!stillUsed) {
        this.categories = this.categories.filter(cat => cat !== oldTodo.category);
      }
    }

    // 更新标签
    todo.tags.forEach(tag => {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
      }
    });

    // 如果更新了标签，从旧标签中移除（如果不再使用）
    if (oldTodo) {
      oldTodo.tags.forEach(tag => {
        const stillUsed = this.todos.some(t => t.tags.includes(tag));
        if (!stillUsed) {
          this.tags = this.tags.filter(t => t !== tag);
        }
      });
    }
  }

  /**
   * 设置筛选条件
   * @param {string} filter 筛选条件
   */
  setFilter(filter) {
    this.currentFilter = filter;
    storageManager.updateSetting('filterBy', filter);
    this.notifyListeners('filterChange', filter);
  }

  /**
   * 设置排序方式
   * @param {string} sortBy 排序字段
   * @param {string} sortOrder 排序顺序
   */
  setSort(sortBy, sortOrder = 'desc') {
    this.currentSort = sortBy;
    this.currentSortOrder = sortOrder;
    storageManager.updateSetting('sortBy', sortBy);
    storageManager.updateSetting('sortOrder', sortOrder);
    this.notifyListeners('sortChange', { sortBy, sortOrder });
  }

  /**
   * 设置搜索查询
   * @param {string} query 搜索查询
   */
  setSearchQuery(query) {
    this.searchQuery = query.trim().toLowerCase();
    this.notifyListeners('searchChange', this.searchQuery);
  }

  /**
   * 获取筛选后的待办事项
   * @returns {Array<Todo>} 筛选后的任务数组
   */
  getFilteredTodos() {
    let filtered = [...this.todos];

    // 应用筛选
    switch (this.currentFilter) {
      case 'pending':
        filtered = filtered.filter(todo => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.completed);
        break;
      case 'high':
        filtered = filtered.filter(todo => todo.priority === 'high');
        break;
      case 'today':
        filtered = filtered.filter(todo => todo.isDueToday());
        break;
      case 'overdue':
        filtered = filtered.filter(todo => todo.isOverdue());
        break;
      case 'week':
        filtered = filtered.filter(todo => todo.isDueThisWeek());
        break;
      // 'all' 和其他情况不筛选
    }

    // 应用搜索
    if (this.searchQuery) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(this.searchQuery) ||
        todo.description.toLowerCase().includes(this.searchQuery) ||
        todo.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)) ||
        todo.category.toLowerCase().includes(this.searchQuery)
      );
    }

    // 应用排序
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.currentSort) {
        case 'created':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'due':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'priority':
          comparison = b.getPriorityValue() - a.getPriorityValue();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'order':
          comparison = (a.order || 0) - (b.order || 0);
          break;
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }

      // 应用排序顺序
      if (this.currentSortOrder === 'asc') {
        comparison = -comparison;
      }

      return comparison;
    });

    return filtered;
  }

  /**
   * 获取分类统计
   * @returns {Object} 分类统计
   */
  getCategoryStats() {
    const stats = {};

    this.categories.forEach(category => {
      const categoryTodos = this.todos.filter(todo => todo.category === category);
      stats[category] = {
        total: categoryTodos.length,
        completed: categoryTodos.filter(todo => todo.completed).length,
        pending: categoryTodos.filter(todo => !todo.completed).length
      };
    });

    // 添加"未分类"统计
    const uncategorizedTodos = this.todos.filter(todo => !todo.category);
    stats['未分类'] = {
      total: uncategorizedTodos.length,
      completed: uncategorizedTodos.filter(todo => todo.completed).length,
      pending: uncategorizedTodos.filter(todo => !todo.completed).length
    };

    return stats;
  }

  /**
   * 获取标签统计
   * @returns {Object} 标签统计
   */
  getTagStats() {
    const stats = {};

    this.tags.forEach(tag => {
      const tagTodos = this.todos.filter(todo => todo.tags.includes(tag));
      stats[tag] = tagTodos.length;
    });

    return stats;
  }

  /**
   * 获取优先级统计
   * @returns {Object} 优先级统计
   */
  getPriorityStats() {
    return {
      high: this.todos.filter(todo => todo.priority === 'high').length,
      medium: this.todos.filter(todo => todo.priority === 'medium').length,
      low: this.todos.filter(todo => todo.priority === 'low').length
    };
  }

  /**
   * 获取总体统计
   * @returns {Object} 总体统计
   */
  getOverallStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const overdue = this.todos.filter(todo => todo.isOverdue()).length;
    const dueToday = this.todos.filter(todo => todo.isDueToday()).length;

    return {
      total,
      completed,
      pending,
      overdue,
      dueToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * 选择任务
   * @param {string} id 任务ID
   * @param {boolean} selected 是否选中
   */
  selectTodo(id, selected = true) {
    if (selected) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.notifyListeners('selectionChange', this.selectedIds);
  }

  /**
   * 全选/取消全选
   * @param {boolean} selectAll 是否全选
   */
  selectAll(selectAll = true) {
    if (selectAll) {
      this.todos.forEach(todo => {
        this.selectedIds.add(todo.id);
      });
    } else {
      this.selectedIds.clear();
    }
    this.notifyListeners('selectionChange', this.selectedIds);
  }

  /**
   * 获取选中的任务
   * @returns {Array<Todo>} 选中的任务数组
   */
  getSelectedTodos() {
    return this.todos.filter(todo => this.selectedIds.has(todo.id));
  }

  /**
   * 完成选中的任务
   * @returns {number} 完成的任务数量
   */
  completeSelectedTodos() {
    const selectedIds = Array.from(this.selectedIds);
    let completedCount = 0;

    selectedIds.forEach(id => {
      const todo = this.getTodo(id);
      if (todo && !todo.completed) {
        this.toggleTodoComplete(id);
        completedCount++;
      }
    });

    return completedCount;
  }

  /**
   * 删除选中的任务
   * @returns {number} 删除的任务数量
   */
  deleteSelectedTodos() {
    const selectedIds = Array.from(this.selectedIds);
    const deletedCount = this.deleteTodos(selectedIds);

    if (deletedCount > 0) {
      this.selectedIds.clear();
      this.notifyListeners('selectionChange', this.selectedIds);
    }

    return deletedCount;
  }

  /**
   * 清除所有已完成的任务
   * @returns {number} 删除的任务数量
   */
  clearCompletedTodos() {
    const completedIds = this.todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    return this.deleteTodos(completedIds);
  }

  /**
   * 添加监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * 移除监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * 通知监听器
   * @param {string} event 事件名称
   * @param {...any} args 事件参数
   */
  notifyListeners(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`监听器错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 导入数据
   * @param {Array} todoData 任务数据数组
   * @param {boolean} replace 是否替换现有数据
   * @returns {Object} 导入结果
   */
  importData(todoData, replace = false) {
    try {
      const importedTodos = todoData.map(item => new Todo(item));

      if (replace) {
        this.todos = importedTodos;
      } else {
        // 合并数据，避免ID冲突
        const existingIds = new Set(this.todos.map(todo => todo.id));
        const newTodos = importedTodos.filter(todo => !existingIds.has(todo.id));
        this.todos.push(...newTodos);
      }

      // 更新分类和标签
      this.categories = [];
      this.tags = [];
      this.todos.forEach(todo => {
        this.updateCategoriesAndTags(todo);
      });

      this.saveTodos();
      this.saveCategories();
      this.saveTags();
      this.notifyListeners('dataImported', this.todos);

      return {
        success: true,
        importedCount: importedTodos.length,
        addedCount: replace ? importedTodos.length : importedTodos.filter(todo => !this.todos.includes(todo)).length
      };
    } catch (error) {
      console.error('导入数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导出数据
   * @returns {Array} 任务数据数组
   */
  exportData() {
    return this.todos.map(todo => todo.toObject());
  }

  /**
   * 重置数据
   */
  reset() {
    this.todos = [];
    this.categories = [];
    this.tags = [];
    this.selectedIds.clear();
    this.currentFilter = 'all';
    this.currentSort = 'created';
    this.currentSortOrder = 'desc';
    this.searchQuery = '';

    this.saveTodos();
    this.saveCategories();
    this.saveTags();
    this.notifyListeners('reset');
  }
}

// 导出单例实例
export const todoManager = new TodoManager();
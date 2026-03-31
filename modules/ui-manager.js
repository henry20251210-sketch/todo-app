/**
 * 界面管理模块
 * 负责UI渲染和用户交互
 */

import { todoManager } from './todo-manager.js';
import { themeManager } from './theme-manager.js';
import { i18nManager } from './i18n-manager.js';
import { VirtualScrollManager } from './virtual-scroll-manager.js';

/**
 * 界面管理类
 */
export class UIManager {
  constructor() {
    // DOM元素引用
    this.elements = {
      // 表单元素
      taskTitleInput: null,
      taskDescInput: null,
      prioritySelect: null,
      dueDateInput: null,
      tagsInput: null,
      addTaskBtn: null,
      clearFormBtn: null,

      // 筛选和排序
      filterButtons: null,
      sortButtons: null,
      searchInput: null,
      clearSearchBtn: null,

      // 任务列表
      taskList: null,
      selectAllBtn: null,
      completeSelectedBtn: null,
      deleteSelectedBtn: null,

      // 统计信息
      totalTasksCount: null,
      pendingTasksCount: null,
      completedTasksCount: null,
      highPriorityCount: null,

      // 侧边栏
      quickAddBtn: null,
      viewTodayBtn: null,
      viewWeekBtn: null,
      categoryList: null,
      tagCloud: null,

      // 设置
      themeSelect: null,
      languageSelect: null,
      tasksPerPageInput: null,
      defaultPrioritySelect: null,
      enableNotificationsCheckbox: null,
      enableSoundCheckbox: null,
      backupBtn: null,
      restoreBtn: null,
      clearDataBtn: null,

      // 其他
      exportBtn: null,
      importBtn: null,
      batchDeleteBtn: null
    };

    // 状态
    this.state = {
      currentPage: 1,
      tasksPerPage: 20,
      editingTodoId: null,
      dragSourceId: null,
      dragOverId: null,
      enableVirtualScroll: false, // 是否启用虚拟滚动
      virtualScrollThreshold: 100 // 启用虚拟滚动的任务数量阈值
    };

    // 虚拟滚动管理器实例
    this.virtualScrollManager = null;

    // 初始化
    this.init();
  }

  /**
   * 防抖函数
   * @param {Function} func 要防抖的函数
   * @param {number} wait 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  _debounce(func, wait = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 初始化UI管理器
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.render();
    this.setupEventListeners();
  }

  /**
   * 缓存DOM元素引用
   */
  cacheElements() {
    // 表单元素
    this.elements.taskTitleInput = document.getElementById('taskTitleInput');
    this.elements.taskDescInput = document.getElementById('taskDescInput');
    this.elements.prioritySelect = document.getElementById('prioritySelect');
    this.elements.dueDateInput = document.getElementById('dueDateInput');
    this.elements.tagsInput = document.getElementById('tagsInput');
    this.elements.addTaskBtn = document.getElementById('addTaskBtn');
    this.elements.clearFormBtn = document.getElementById('clearFormBtn');

    // 筛选和排序
    this.elements.filterButtons = document.querySelectorAll('.btn-filter');
    this.elements.sortButtons = document.querySelectorAll('[data-sort]');
    this.elements.searchInput = document.getElementById('searchInput');
    this.elements.clearSearchBtn = document.getElementById('clearSearchBtn');

    // 任务列表
    this.elements.taskList = document.getElementById('taskList');
    this.elements.selectAllBtn = document.getElementById('selectAllBtn');
    this.elements.completeSelectedBtn = document.getElementById('completeSelectedBtn');
    this.elements.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    // 统计信息
    this.elements.totalTasksCount = document.getElementById('totalTasksCount');
    this.elements.pendingTasksCount = document.getElementById('pendingTasksCount');
    this.elements.completedTasksCount = document.getElementById('completedTasksCount');
    this.elements.highPriorityCount = document.getElementById('highPriorityCount');

    // 侧边栏
    this.elements.quickAddBtn = document.getElementById('quickAddBtn');
    this.elements.viewTodayBtn = document.getElementById('viewTodayBtn');
    this.elements.viewWeekBtn = document.getElementById('viewWeekBtn');
    this.elements.categoryList = document.getElementById('categoryList');
    this.elements.tagCloud = document.getElementById('tagCloud');

    // 设置
    this.elements.themeSelect = document.getElementById('themeSelect');
    this.elements.languageSelect = document.getElementById('languageSelect');
    this.elements.tasksPerPageInput = document.getElementById('tasksPerPageInput');
    this.elements.defaultPrioritySelect = document.getElementById('defaultPrioritySelect');
    this.elements.enableNotificationsCheckbox = document.getElementById('enableNotifications');
    this.elements.enableSoundCheckbox = document.getElementById('enableSound');
    this.elements.enableVirtualScrollCheckbox = document.getElementById('enableVirtualScroll');
    this.elements.backupBtn = document.getElementById('backupBtn');
    this.elements.restoreBtn = document.getElementById('restoreBtn');
    this.elements.clearDataBtn = document.getElementById('clearDataBtn');

    // 其他
    this.elements.exportBtn = document.getElementById('exportBtn');
    this.elements.importBtn = document.getElementById('importBtn');
    this.elements.batchDeleteBtn = document.getElementById('batchDeleteBtn');
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 监听待办事项管理器事件
    todoManager.addListener('add', this.onTodoAdded.bind(this));
    todoManager.addListener('update', this.onTodoUpdated.bind(this));
    todoManager.addListener('delete', this.onTodoDeleted.bind(this));
    todoManager.addListener('batchDelete', this.onTodosDeleted.bind(this));
    todoManager.addListener('toggleComplete', this.onTodoToggled.bind(this));
    todoManager.addListener('filterChange', this.onFilterChanged.bind(this));
    todoManager.addListener('sortChange', this.onSortChanged.bind(this));
    todoManager.addListener('searchChange', this.onSearchChanged.bind(this));
    todoManager.addListener('selectionChange', this.onSelectionChanged.bind(this));
    todoManager.addListener('dataImported', this.onDataImported.bind(this));
    todoManager.addListener('reset', this.onDataReset.bind(this));

    // 监听主题变化
    themeManager.onThemeChange(this.onThemeChanged.bind(this));

    // 监听语言变化
    i18nManager.onLanguageChange(this.onLanguageChanged.bind(this));
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 表单提交
    this.elements.addTaskBtn.addEventListener('click', this.handleAddTask.bind(this));
    this.elements.clearFormBtn.addEventListener('click', this.handleClearForm.bind(this));

    // 表单输入框键盘事件
    this.elements.taskTitleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleAddTask();
      }
    });

    // 筛选按钮
    this.elements.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const filter = e.target.getAttribute('data-filter');
        this.handleFilterChange(filter);
      });
    });

    // 排序按钮
    this.elements.sortButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const sortBy = e.target.getAttribute('data-sort');
        this.handleSortChange(sortBy);
      });
    });

    // 搜索（使用防抖）
    const debouncedSearch = this._debounce((value) => {
      this.handleSearchChange(value);
    }, 300);

    this.elements.searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    this.elements.clearSearchBtn.addEventListener('click', () => {
      this.handleSearchChange('');
      this.elements.searchInput.value = '';
    });

    // 批量操作
    this.elements.selectAllBtn.addEventListener('click', () => {
      this.handleSelectAll();
    });

    this.elements.completeSelectedBtn.addEventListener('click', () => {
      this.handleCompleteSelected();
    });

    this.elements.deleteSelectedBtn.addEventListener('click', () => {
      this.handleDeleteSelected();
    });

    // 侧边栏按钮
    if (this.elements.quickAddBtn) {
      this.elements.quickAddBtn.addEventListener('click', this.handleQuickAdd.bind(this));
    }

    if (this.elements.viewTodayBtn) {
      this.elements.viewTodayBtn.addEventListener('click', () => {
        this.handleFilterChange('today');
      });
    }

    if (this.elements.viewWeekBtn) {
      this.elements.viewWeekBtn.addEventListener('click', () => {
        this.handleFilterChange('week');
      });
    }

    // 设置
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e) => {
        themeManager.setTheme(e.target.value);
      });
    }

    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('change', (e) => {
        i18nManager.setLanguage(e.target.value);
      });
    }

    if (this.elements.tasksPerPageInput) {
      this.elements.tasksPerPageInput.addEventListener('change', (e) => {
        this.handleTasksPerPageChange(e.target.value);
      });
    }

    // 虚拟滚动设置
    if (this.elements.enableVirtualScrollCheckbox) {
      this.elements.enableVirtualScrollCheckbox.addEventListener('change', (e) => {
        this.toggleVirtualScroll(e.target.checked);
      });
    }

    // 数据管理
    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', this.handleExportData.bind(this));
    }

    if (this.elements.importBtn) {
      this.elements.importBtn.addEventListener('click', this.handleImportData.bind(this));
    }

    if (this.elements.batchDeleteBtn) {
      this.elements.batchDeleteBtn.addEventListener('click', this.handleBatchDelete.bind(this));
    }

    // 键盘快捷键
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

    // 拖放事件
    this.setupDragAndDrop();
  }

  /**
   * 检查是否应该使用虚拟滚动
   * @returns {boolean} 是否应该使用虚拟滚动
   */
  _shouldUseVirtualScroll() {
    const todos = todoManager.getFilteredTodos();
    return this.state.enableVirtualScroll && todos.length >= this.state.virtualScrollThreshold;
  }

  /**
   * 初始化虚拟滚动管理器
   */
  _initVirtualScrollManager() {
    if (this.virtualScrollManager) {
      return;
    }

    try {
      this.virtualScrollManager = new VirtualScrollManager(
        this.elements.taskList,
        this,
        {
          itemHeight: 85,
          bufferSize: 8,
          enableDragDrop: true
        }
      );

      console.log('虚拟滚动管理器初始化成功');
    } catch (error) {
      console.error('虚拟滚动管理器初始化失败:', error);
      this.virtualScrollManager = null;
      this.state.enableVirtualScroll = false;
    }
  }

  /**
   * 清理虚拟滚动管理器
   */
  _cleanupVirtualScrollManager() {
    if (this.virtualScrollManager) {
      this.virtualScrollManager.cleanup();
      this.virtualScrollManager = null;
    }
  }

  /**
   * 使用虚拟滚动渲染任务列表
   * @param {Array} todos - 任务数组
   */
  _renderWithVirtualScroll(todos) {
    // 确保虚拟滚动管理器已初始化
    if (!this.virtualScrollManager) {
      this._initVirtualScrollManager();
    }

    if (this.virtualScrollManager) {
      this.virtualScrollManager.updateItems(todos);

      // 隐藏分页控件
      const paginationElement = document.getElementById('pagination');
      if (paginationElement) {
        paginationElement.style.display = 'none';
      }
    } else {
      // 如果虚拟滚动管理器初始化失败，回退到分页模式
      this._renderWithPagination(todos);
    }
  }

  /**
   * 使用分页渲染任务列表
   * @param {Array} todos - 任务数组
   */
  _renderWithPagination(todos) {
    const startIndex = (this.state.currentPage - 1) * this.state.tasksPerPage;
    const endIndex = startIndex + this.state.tasksPerPage;
    const pageTodos = todos.slice(startIndex, endIndex);

    this.elements.taskList.innerHTML = '';

    if (pageTodos.length === 0) {
      this.renderEmptyState();
      return;
    }

    pageTodos.forEach(todo => {
      const taskElement = this.createTaskElement(todo);
      this.elements.taskList.appendChild(taskElement);
    });

    this.renderPagination(todos.length);

    // 显示分页控件
    const paginationElement = document.getElementById('pagination');
    if (paginationElement) {
      paginationElement.style.display = 'flex';
    }
  }

  /**
   * 渲染界面
   */
  render() {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
    this.renderSettings();
    this.updateUIState();
  }

  /**
   * 渲染任务列表
   */
  renderTaskList() {
    const todos = todoManager.getFilteredTodos();

    if (this._shouldUseVirtualScroll()) {
      this._renderWithVirtualScroll(todos);
    } else {
      this._renderWithPagination(todos);
    }
  }

  /**
   * 创建任务元素
   * @param {Todo} todo 任务实例
   * @returns {HTMLElement} 任务元素
   */
  createTaskElement(todo) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card priority-${todo.priority}`;
    taskElement.setAttribute('data-id', todo.id);
    taskElement.setAttribute('draggable', 'true');

    if (todo.completed) {
      taskElement.classList.add('completed');
    }

    // 任务头部
    const header = document.createElement('div');
    header.className = 'task-card-header';

    // 复选框和标题
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'task-title-wrapper';

    const checkbox = document.createElement('div');
    checkbox.className = `task-checkbox ${todo.completed ? 'checked' : ''}`;
    checkbox.addEventListener('click', () => {
      this.handleToggleComplete(todo.id);
    });

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = todo.title;

    titleWrapper.appendChild(checkbox);
    titleWrapper.appendChild(title);

    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-icon btn-small';
    editBtn.innerHTML = '✏️';
    editBtn.title = i18nManager.t('editTask');
    editBtn.setAttribute('data-action', 'edit');
    editBtn.addEventListener('click', () => {
      this.handleEditTask(todo.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon btn-small';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = i18nManager.t('deleteTask');
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.addEventListener('click', () => {
      this.handleDeleteTask(todo.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(titleWrapper);
    header.appendChild(actions);

    // 任务主体
    const body = document.createElement('div');
    body.className = 'task-card-body';

    if (todo.description) {
      const description = document.createElement('p');
      description.textContent = todo.description;
      body.appendChild(description);
    }

    // 任务底部
    const footer = document.createElement('div');
    footer.className = 'task-card-footer';

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    // 优先级标签
    const priority = document.createElement('span');
    priority.className = 'task-priority';
    priority.textContent = i18nManager.t(`priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`);

    // 标签
    if (todo.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'task-tags';

      todo.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'task-tag';
        tagElement.textContent = tag;
        tags.appendChild(tagElement);
      });

      meta.appendChild(tags);
    }

    meta.appendChild(priority);

    // 截止日期
    if (todo.dueDate) {
      const dueDate = document.createElement('span');
      dueDate.className = `task-due-date ${todo.isOverdue() ? 'overdue' : todo.isDueToday() ? 'today' : ''}`;
      dueDate.innerHTML = `📅 ${todo.getFormattedDueDate()}`;
      meta.appendChild(dueDate);
    }

    footer.appendChild(meta);

    // 组装任务元素
    taskElement.appendChild(header);
    taskElement.appendChild(body);
    taskElement.appendChild(footer);

    return taskElement;
  }

  /**
   * 渲染空状态
   */
  renderEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = '📝';

    const title = document.createElement('h3');
    title.id = 'emptyTitle';
    title.textContent = i18nManager.t('noTasks');

    const description = document.createElement('p');
    description.id = 'emptyDesc';
    description.textContent = i18nManager.t('noTasksDescription');

    emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(description);

    this.elements.taskList.appendChild(emptyState);
  }

  /**
   * 渲染分页
   * @param {number} totalTasks 总任务数
   */
  renderPagination(totalTasks) {
    const totalPages = Math.ceil(totalTasks / this.state.tasksPerPage);
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';
    pageInfo.textContent = i18nManager.t('pageInfo', {
      current: this.state.currentPage,
      total: totalPages
    });

    prevBtn.disabled = this.state.currentPage <= 1;
    nextBtn.disabled = this.state.currentPage >= totalPages;

    prevBtn.onclick = () => {
      if (this.state.currentPage > 1) {
        this.state.currentPage--;
        this.renderTaskList();
      }
    };

    nextBtn.onclick = () => {
      if (this.state.currentPage < totalPages) {
        this.state.currentPage++;
        this.renderTaskList();
      }
    };
  }

  /**
   * 渲染统计信息
   */
  renderStats() {
    const stats = todoManager.getOverallStats();

    this.elements.totalTasksCount.textContent = stats.total;
    this.elements.pendingTasksCount.textContent = stats.pending;
    this.elements.completedTasksCount.textContent = stats.completed;

    const priorityStats = todoManager.getPriorityStats();
    this.elements.highPriorityCount.textContent = priorityStats.high;
  }

  /**
   * 渲染侧边栏
   */
  renderSidebar() {
    this.renderCategoryList();
    this.renderTagCloud();
    this.renderProductivityStats();
  }

  /**
   * 渲染分类列表
   */
  renderCategoryList() {
    if (!this.elements.categoryList) return;

    const categories = todoManager.categories;
    const categoryStats = todoManager.getCategoryStats();

    this.elements.categoryList.innerHTML = '';

    // 添加"全部任务"项
    const allTasksItem = document.createElement('div');
    allTasksItem.className = 'category-item active';
    allTasksItem.innerHTML = `
      <span class="category-name">${i18nManager.t('allTasks')}</span>
      <span class="category-count">${categoryStats['未分类']?.total || 0}</span>
    `;
    allTasksItem.addEventListener('click', () => {
      this.handleFilterChange('all');
    });
    this.elements.categoryList.appendChild(allTasksItem);

    // 添加各个分类
    categories.forEach(category => {
      const stats = categoryStats[category];
      if (!stats) return;

      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span class="category-name">${category}</span>
        <span class="category-count">${stats.total}</span>
      `;
      categoryItem.addEventListener('click', () => {
        // 这里可以添加按分类筛选的功能
        console.log(`筛选分类: ${category}`);
      });
      this.elements.categoryList.appendChild(categoryItem);
    });
  }

  /**
   * 渲染标签云
   */
  renderTagCloud() {
    if (!this.elements.tagCloud) return;

    const tagStats = todoManager.getTagStats();
    const tags = Object.keys(tagStats);

    if (tags.length === 0) {
      this.elements.tagCloud.innerHTML = '<span class="no-tags">暂无标签</span>';
      return;
    }

    // 计算标签大小
    const maxCount = Math.max(...Object.values(tagStats));
    const minCount = Math.min(...Object.values(tagStats));
    const sizeRange = 4; // 1-4

    this.elements.tagCloud.innerHTML = '';

    tags.forEach(tag => {
      const count = tagStats[tag];
      let sizeClass = 'size-1';

      if (maxCount > minCount) {
        const normalized = (count - minCount) / (maxCount - minCount);
        const size = Math.floor(normalized * (sizeRange - 1)) + 1;
        sizeClass = `size-${size}`;
      }

      const tagElement = document.createElement('span');
      tagElement.className = `tag-item ${sizeClass}`;
      tagElement.textContent = tag;
      tagElement.title = `${tag} (${count} 个任务)`;
      tagElement.addEventListener('click', () => {
        this.handleSearchChange(tag);
      });

      this.elements.tagCloud.appendChild(tagElement);
    });
  }

  /**
   * 渲染生产力统计
   */
  renderProductivityStats() {
    const stats = todoManager.getOverallStats();
    const completionRate = stats.completionRate;

    // 更新完成率
    const completionRateElement = document.getElementById('completionRate');
    const completionLabel = document.getElementById('completionLabel');
    const avgCompletionTime = document.getElementById('avgCompletionTime');
    const streakCount = document.getElementById('streakCount');

    if (completionRateElement) {
      completionRateElement.textContent = `${completionRate}%`;
    }

    if (completionLabel) {
      completionLabel.textContent = i18nManager.t('completionRate');
    }

    if (avgCompletionTime) {
      // 这里可以从存储中获取平均完成时间
      avgCompletionTime.textContent = '-';
    }

    if (streakCount) {
      // 这里可以从存储中获取连续天数
      streakCount.textContent = '0';
    }

    // 更新进度环
    const progressRing = document.querySelector('.progress-ring-foreground');
    if (progressRing) {
      const radius = 35;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (completionRate / 100) * circumference;

      progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
      progressRing.style.strokeDashoffset = offset;
    }
  }

  /**
   * 渲染设置
   */
  renderSettings() {
    // 主题选择器
    if (this.elements.themeSelect) {
      const currentTheme = themeManager.getCurrentTheme();
      this.elements.themeSelect.value = currentTheme;
    }

    // 语言选择器
    if (this.elements.languageSelect) {
      const currentLanguage = i18nManager.getCurrentLanguage();
      this.elements.languageSelect.value = currentLanguage;
    }

    // 每页任务数
    if (this.elements.tasksPerPageInput) {
      this.elements.tasksPerPageInput.value = this.state.tasksPerPage;
    }

    // 虚拟滚动设置
    if (this.elements.enableVirtualScrollCheckbox) {
      this.elements.enableVirtualScrollCheckbox.checked = this.state.enableVirtualScroll;
    }

    // 默认优先级
    if (this.elements.defaultPrioritySelect) {
      // 这里可以从设置中获取默认优先级
      this.elements.defaultPrioritySelect.value = 'medium';
    }
  }

  /**
   * 更新UI状态
   */
  updateUIState() {
    const selectedCount = todoManager.selectedIds.size;
    const hasSelectedTasks = selectedCount > 0;

    // 更新批量操作按钮状态
    if (this.elements.completeSelectedBtn) {
      this.elements.completeSelectedBtn.disabled = !hasSelectedTasks;
    }

    if (this.elements.deleteSelectedBtn) {
      this.elements.deleteSelectedBtn.disabled = !hasSelectedTasks;
    }

    if (this.elements.batchDeleteBtn) {
      this.elements.batchDeleteBtn.disabled = !hasSelectedTasks;
    }

    // 更新全选按钮文本
    if (this.elements.selectAllBtn) {
      const totalFiltered = todoManager.getFilteredTodos().length;
      const allSelected = selectedCount === totalFiltered && totalFiltered > 0;

      if (allSelected) {
        this.elements.selectAllBtn.textContent = i18nManager.t('deselectAll');
      } else {
        this.elements.selectAllBtn.textContent = i18nManager.t('selectAll');
      }
    }
  }

  /**
   * 设置拖放功能
   */
  setupDragAndDrop() {
    // 使用事件委托处理拖放
    this.elements.taskList.addEventListener('dragstart', this._handleDragStart.bind(this));
    this.elements.taskList.addEventListener('dragover', this._handleDragOver.bind(this));
    this.elements.taskList.addEventListener('drop', this._handleDrop.bind(this));
    this.elements.taskList.addEventListener('dragend', this._handleDragEnd.bind(this));
  }

  /**
   * 处理拖拽开始
   * @param {DragEvent} event 拖拽事件
   * @private
   */
  _handleDragStart(event) {
    const taskElement = event.target.closest('.task-card');
    if (!taskElement) return;

    // 设置拖拽数据
    event.dataTransfer.setData('text/plain', taskElement.dataset.id);
    event.dataTransfer.effectAllowed = 'move';

    // 添加拖拽样式
    taskElement.classList.add('dragging');

    // 保存拖拽源ID
    this.state.dragSourceId = taskElement.dataset.id;
  }

  /**
   * 处理拖拽经过
   * @param {DragEvent} event 拖拽事件
   * @private
   */
  _handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const taskElement = event.target.closest('.task-card');
    if (!taskElement) return;

    // 高亮显示放置目标
    const draggingElement = this.elements.taskList.querySelector('.dragging');
    if (draggingElement && taskElement !== draggingElement) {
      // 计算放置位置
      const rect = taskElement.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const isBefore = event.clientY < midpoint;

      // 移除之前的占位符
      const existingPlaceholder = this.elements.taskList.querySelector('.drag-placeholder');
      if (existingPlaceholder) {
        existingPlaceholder.remove();
      }

      // 创建占位符
      const placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = `${draggingElement.offsetHeight}px`;

      // 插入占位符
      if (isBefore) {
        taskElement.parentNode.insertBefore(placeholder, taskElement);
      } else {
        taskElement.parentNode.insertBefore(placeholder, taskElement.nextSibling);
      }

      // 保存拖拽经过的ID
      this.state.dragOverId = taskElement.dataset.id;
      this.state.insertBefore = isBefore;
    }
  }

  /**
   * 处理放置
   * @param {DragEvent} event 拖拽事件
   * @private
   */
  _handleDrop(event) {
    event.preventDefault();

    const sourceId = event.dataTransfer.getData('text/plain');
    if (!sourceId) return;

    // 获取所有任务卡片
    const taskCards = Array.from(this.elements.taskList.querySelectorAll('.task-card'));
    const sourceIndex = taskCards.findIndex(card => card.dataset.id === sourceId);

    let targetIndex = taskCards.findIndex(card => card.dataset.id === this.state.dragOverId);
    if (targetIndex === -1) {
      // 如果没有明确的放置目标，放到最后
      targetIndex = taskCards.length - 1;
    }

    // 调整目标索引（根据放置位置）
    if (this.state.insertBefore === false && targetIndex < taskCards.length - 1) {
      targetIndex++;
    }

    // 确保源索引和目标索引有效
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      this._cleanupDrag();
      return;
    }

    // 重新排序任务
    this._reorderTodos(sourceId, sourceIndex, targetIndex);

    // 清理拖拽状态
    this._cleanupDrag();
  }

  /**
   * 处理拖拽结束
   * @param {DragEvent} event 拖拽事件
   * @private
   */
  _handleDragEnd(event) {
    this._cleanupDrag();
  }

  /**
   * 清理拖拽状态
   * @private
   */
  _cleanupDrag() {
    // 移除拖拽样式
    const draggingElement = this.elements.taskList.querySelector('.dragging');
    if (draggingElement) {
      draggingElement.classList.remove('dragging');
    }

    // 移除占位符
    const placeholder = this.elements.taskList.querySelector('.drag-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // 重置状态
    this.state.dragSourceId = null;
    this.state.dragOverId = null;
    this.state.insertBefore = null;
  }

  /**
   * 重新排序待办事项
   * @param {string} sourceId 源任务ID
   * @param {number} sourceIndex 源索引
   * @param {number} targetIndex 目标索引
   * @private
   */
  _reorderTodos(sourceId, sourceIndex, targetIndex) {
    // 获取所有任务（已筛选的）
    const filteredTodos = todoManager.getFilteredTodos();

    // 找到源任务在完整列表中的索引
    const allTodos = todoManager.todos;
    const sourceTodo = allTodos.find(todo => todo.id === sourceId);
    if (!sourceTodo) return;

    // 更新order字段：基于目标位置重新计算所有任务的order
    // 简单方法：交换order值，或者重新分配顺序值

    // 方法1：交换order值
    const targetTodo = filteredTodos[targetIndex];
    if (targetTodo) {
      // 交换order值
      const tempOrder = sourceTodo.order;
      sourceTodo.order = targetTodo.order;
      targetTodo.order = tempOrder;

      // 保存更新
      todoManager.saveTodos();

      // 重新渲染列表
      this.renderTaskList();

      // 显示成功消息
      this.showNotification('任务顺序已更新', 'success');
    }
  }

  // 事件处理函数
  handleAddTask() {
    const title = this.elements.taskTitleInput.value.trim();
    const description = this.elements.taskDescInput.value.trim();
    const priority = this.elements.prioritySelect.value;
    const dueDate = this.elements.dueDateInput.value || null;
    const tags = this.elements.tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!title) {
      alert(i18nManager.t('errorTitleRequired'));
      this.elements.taskTitleInput.focus();
      return;
    }

    try {
      const todo = todoManager.addTodo({
        title,
        description,
        priority,
        dueDate,
        tags
      });

      // 清空表单
      this.handleClearForm();

      // 显示成功消息
      this.showNotification(i18nManager.t('taskAdded'), 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  handleClearForm() {
    this.elements.taskTitleInput.value = '';
    this.elements.taskDescInput.value = '';
    this.elements.prioritySelect.value = 'medium';
    this.elements.dueDateInput.value = '';
    this.elements.tagsInput.value = '';
    this.elements.taskTitleInput.focus();
  }

  handleEditTask(todoId) {
    const todo = todoManager.getTodo(todoId);
    if (!todo) return;

    // 填充表单
    this.elements.taskTitleInput.value = todo.title;
    this.elements.taskDescInput.value = todo.description || '';
    this.elements.prioritySelect.value = todo.priority;
    this.elements.dueDateInput.value = todo.dueDate || '';
    this.elements.tagsInput.value = todo.tags.join(', ');

    // 更改按钮文本
    this.elements.addTaskBtn.textContent = i18nManager.t('save');
    this.state.editingTodoId = todoId;

    // 滚动到表单
    this.elements.taskTitleInput.focus();
  }

  handleDeleteTask(todoId) {
    if (!confirm(i18nManager.t('confirmDelete'))) {
      return;
    }

    const success = todoManager.deleteTodo(todoId);
    if (success) {
      this.showNotification(i18nManager.t('taskDeleted'), 'success');
    }
  }

  handleToggleComplete(todoId) {
    todoManager.toggleTodoComplete(todoId);
  }

  handleFilterChange(filter) {
    todoManager.setFilter(filter);
  }

  handleSortChange(sortBy) {
    // 切换排序顺序
    const currentSort = todoManager.currentSort;
    const currentOrder = todoManager.currentSortOrder;

    let newOrder = 'desc';
    if (currentSort === sortBy) {
      newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    }

    todoManager.setSort(sortBy, newOrder);
  }

  handleSearchChange(query) {
    todoManager.setSearchQuery(query);
  }

  handleSelectAll() {
    const totalFiltered = todoManager.getFilteredTodos().length;
    const selectedCount = todoManager.selectedIds.size;
    const selectAll = selectedCount !== totalFiltered;

    todoManager.selectAll(selectAll);
  }

  handleCompleteSelected() {
    const completedCount = todoManager.completeSelectedTodos();
    if (completedCount > 0) {
      this.showNotification(i18nManager.t('tasksCompleted', { count: completedCount }), 'success');
    }
  }

  handleDeleteSelected() {
    if (!confirm(i18nManager.t('confirmBatchDelete'))) {
      return;
    }

    const deletedCount = todoManager.deleteSelectedTodos();
    if (deletedCount > 0) {
      this.showNotification(i18nManager.t('tasksDeleted', { count: deletedCount }), 'success');
    }
  }

  handleQuickAdd() {
    this.elements.taskTitleInput.focus();
  }

  handleTasksPerPageChange(value) {
    const tasksPerPage = parseInt(value, 10);
    if (tasksPerPage >= 5 && tasksPerPage <= 100) {
      this.state.tasksPerPage = tasksPerPage;
      this.state.currentPage = 1;

      // 如果每页显示任务数超过50，自动启用虚拟滚动
      if (tasksPerPage >= 50) {
        this.state.enableVirtualScroll = true;
      } else if (tasksPerPage <= 20) {
        // 如果每页显示任务数较少，禁用虚拟滚动
        this.state.enableVirtualScroll = false;
      }

      this.renderTaskList();
    }
  }

  /**
   * 切换虚拟滚动模式
   * @param {boolean} enable - 是否启用虚拟滚动
   */
  toggleVirtualScroll(enable = null) {
    if (enable === null) {
      // 切换模式
      this.state.enableVirtualScroll = !this.state.enableVirtualScroll;
    } else {
      this.state.enableVirtualScroll = enable;
    }

    if (this.state.enableVirtualScroll) {
      console.log('启用虚拟滚动模式');
    } else {
      console.log('禁用虚拟滚动模式');
      // 清理虚拟滚动管理器
      this._cleanupVirtualScrollManager();
    }

    // 重新渲染
    this.renderTaskList();
  }

  handleExportData() {
    // 这里实现导出数据功能
    console.log('导出数据');
  }

  handleImportData() {
    // 这里实现导入数据功能
    console.log('导入数据');
  }

  handleBatchDelete() {
    this.handleDeleteSelected();
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: 快速添加任务
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.elements.taskTitleInput.focus();
    }

    // Ctrl/Cmd + F: 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      this.elements.searchInput.focus();
    }

    // Escape: 取消编辑
    if (e.key === 'Escape' && this.state.editingTodoId) {
      this.handleClearForm();
      this.elements.addTaskBtn.textContent = i18nManager.t('addTask');
      this.state.editingTodoId = null;
    }
  }

  // 事件回调函数
  onTodoAdded(todo) {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
  }

  onTodoUpdated(newTodo, oldTodo) {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
  }

  onTodoDeleted(todo) {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
  }

  onTodosDeleted(todos) {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
  }

  onTodoToggled(newTodo, oldTodo) {
    this.renderTaskList();
    this.renderStats();
    this.renderSidebar();
  }

  onFilterChanged(filter) {
    this.state.currentPage = 1;
    this.renderTaskList();

    // 更新筛选按钮状态
    this.elements.filterButtons.forEach(button => {
      const buttonFilter = button.getAttribute('data-filter');
      if (buttonFilter === filter) {
        button.classList.add('btn-filter-active');
      } else {
        button.classList.remove('btn-filter-active');
      }
    });
  }

  onSortChanged({ sortBy, sortOrder }) {
    this.renderTaskList();

    // 更新排序按钮状态
    this.elements.sortButtons.forEach(button => {
      const buttonSort = button.getAttribute('data-sort');
      if (buttonSort === sortBy) {
        button.classList.add('btn-filter-active');
        // 显示排序顺序
        button.textContent = i18nManager.t(`sort${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`) +
          (sortOrder === 'asc' ? ' ↑' : ' ↓');
      } else {
        button.classList.remove('btn-filter-active');
        button.textContent = i18nManager.t(`sort${buttonSort.charAt(0).toUpperCase() + buttonSort.slice(1)}`);
      }
    });
  }

  onSearchChanged(query) {
    this.state.currentPage = 1;
    this.renderTaskList();

    // 显示/隐藏清空搜索按钮
    if (this.elements.clearSearchBtn) {
      this.elements.clearSearchBtn.style.display = query ? 'block' : 'none';
    }
  }

  onSelectionChanged(selectedIds) {
    this.updateUIState();
  }

  onDataImported(todos) {
    this.render();
    this.showNotification(i18nManager.t('dataImported'), 'success');
  }

  onDataReset() {
    this.render();
    this.showNotification(i18nManager.t('dataCleared'), 'success');
  }

  onThemeChanged(detail) {
    // 更新主题相关UI
    console.log('主题已切换:', detail);
  }

  onLanguageChanged(detail) {
    // 重新渲染界面以更新文本
    this.render();
    this.showNotification(`语言已切换为 ${detail.languageName}`, 'info');
  }

  /**
   * 显示通知
   * @param {string} message 消息内容
   * @param {string} type 通知类型：success, error, info, warning
   */
  showNotification(message, type = 'info') {
    this._createToast(message, type);
  }

  /**
   * 创建并显示Toast通知
   * @param {string} message 消息内容
   * @param {string} type 通知类型
   * @private
   */
  _createToast(message, type = 'info') {
    // 创建Toast容器（如果不存在）
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      `;
      document.body.appendChild(toastContainer);
    }

    // 创建Toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // 图标映射
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const icon = icons[type] || icons.info;

    // 设置Toast内容
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${this._escapeHtml(message)}</span>
      </div>
      <button class="toast-close" aria-label="关闭">×</button>
    `;

    // 添加CSS样式（如果尚未添加）
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--line);
          animation: toastSlideIn 0.3s ease;
          max-width: 100%;
          overflow: hidden;
        }

        .toast-success {
          background: rgba(18, 183, 106, 0.9);
          color: white;
        }

        .toast-error {
          background: rgba(240, 68, 56, 0.9);
          color: white;
        }

        .toast-warning {
          background: rgba(247, 144, 9, 0.9);
          color: white;
        }

        .toast-info {
          background: rgba(46, 144, 250, 0.9);
          color: white;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .toast-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .toast-message {
          font-size: 14px;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 12px;
          flex-shrink: 0;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .toast-close:hover {
          opacity: 1;
        }

        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toastSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 添加到容器
    toastContainer.appendChild(toast);

    // 关闭按钮事件
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this._removeToast(toast);
    });

    // 自动消失（除了错误类型）
    if (type !== 'error') {
      setTimeout(() => {
        this._removeToast(toast);
      }, 5000);
    }
  }

  /**
   * 移除Toast
   * @param {HTMLElement} toast Toast元素
   * @private
   */
  _removeToast(toast) {
    toast.style.animation = 'toastSlideOut 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * HTML转义
   * @param {string} text 原始文本
   * @returns {string} 转义后的文本
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 显示确认对话框
   * @param {string} message 消息内容
   * @param {string} title 对话框标题
   * @returns {Promise<boolean>} 用户是否确认
   */
  showConfirmDialog(message, title = '确认') {
    return Promise.resolve(confirm(message));
  }

  /**
   * 显示提示对话框
   * @param {string} message 消息内容
   * @param {string} title 对话框标题
   * @returns {Promise<void>}
   */
  showAlertDialog(message, title = '提示') {
    return Promise.resolve(alert(message));
  }
}

// 导出单例实例
export const uiManager = new UIManager();
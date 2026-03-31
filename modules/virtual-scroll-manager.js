/**
 * 虚拟滚动管理器模块
 * 负责处理大量任务的虚拟滚动渲染
 */

import { todoManager } from './todo-manager.js';
import { i18nManager } from './i18n-manager.js';

/**
 * 虚拟滚动管理器类
 */
export class VirtualScrollManager {
  /**
   * 构造函数
   * @param {HTMLElement} container - 任务列表容器
   * @param {Object} uiManager - UI管理器实例
   * @param {Object} config - 配置选项
   */
  constructor(container, uiManager, config = {}) {
    this.container = container;
    this.uiManager = uiManager;
    this.config = {
      itemHeight: 85,        // 默认任务卡片高度
      bufferSize: 8,         // 缓冲区大小（可见区域上下额外的项目数）
      debounceWait: 16,      // 滚动事件防抖等待时间（~60fps）
      enableResizeObserver: true, // 启用ResizeObserver
      enableDragDrop: true,  // 启用拖放支持
      ...config
    };

    // 状态管理
    this.state = {
      isInitialized: false,
      isLoading: false,
      totalItems: 0,
      startIndex: 0,
      endIndex: 0,
      scrollTop: 0,
      viewportHeight: 0,
      totalHeight: 0,
      items: [],             // 当前显示的任务数据
      itemHeights: new Map(), // 缓存任务高度
    };

    // DOM元素池
    this.itemPool = [];      // 可复用的DOM元素池
    this.usedItems = new Map(); // 正在使用的DOM元素 {index: element}

    // 绑定事件处理函数
    this.handleScroll = this._debounce(this._handleScroll.bind(this), this.config.debounceWait);
    this.handleResize = this._debounce(this._handleResize.bind(this), 100);

    // 初始化
    this.init();
  }

  /**
   * 初始化虚拟滚动管理器
   */
  init() {
    if (this.state.isInitialized) {
      console.warn('虚拟滚动管理器已经初始化');
      return;
    }

    try {
      console.log('正在初始化虚拟滚动管理器...');

      // 1. 创建DOM结构
      this._createDOMStructure();

      // 2. 设置事件监听器
      this._setupEventListeners();

      // 3. 设置ResizeObserver（如果支持）
      if (this.config.enableResizeObserver && window.ResizeObserver) {
        this._setupResizeObserver();
      }

      // 4. 设置事件委托
      this._setupEventDelegation();

      // 5. 监听todoManager事件
      this._setupTodoManagerListeners();

      // 6. 初始测量
      this._measureViewport();
      this._calculateTotalHeight();

      this.state.isInitialized = true;
      console.log('虚拟滚动管理器初始化完成');

    } catch (error) {
      console.error('虚拟滚动管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建虚拟滚动DOM结构
   * @private
   */
  _createDOMStructure() {
    // 创建虚拟滚动容器
    this.virtualScrollContainer = document.createElement('div');
    this.virtualScrollContainer.className = 'virtual-scroll-container';
    this.virtualScrollContainer.setAttribute('role', 'list');

    // 创建内容占位符（用于撑开滚动区域）
    this.contentPlaceholder = document.createElement('div');
    this.contentPlaceholder.className = 'virtual-scroll-content';

    // 创建视口容器（实际渲染任务的位置）
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-scroll-viewport';
    this.viewport.setAttribute('role', 'listitem');

    // 组装DOM结构
    this.virtualScrollContainer.appendChild(this.contentPlaceholder);
    this.virtualScrollContainer.appendChild(this.viewport);

    // 清空原始容器并添加虚拟滚动容器
    this.container.innerHTML = '';
    this.container.appendChild(this.virtualScrollContainer);

    // 添加拖放占位符（如果需要）
    if (this.config.enableDragDrop) {
      this._createDragDropPlaceholder();
    }
  }

  /**
   * 创建拖放占位符
   * @private
   */
  _createDragDropPlaceholder() {
    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.className = 'drag-placeholder';
    this.dragPlaceholder.style.display = 'none';
    this.virtualScrollContainer.appendChild(this.dragPlaceholder);
  }

  /**
   * 设置事件监听器
   * @private
   */
  _setupEventListeners() {
    // 滚动事件
    this.virtualScrollContainer.addEventListener('scroll', this.handleScroll);

    // 窗口大小变化
    window.addEventListener('resize', this.handleResize);

    // 语言变化事件
    window.addEventListener('languagechange', () => {
      this._handleLanguageChange();
    });

    // 主题变化事件
    window.addEventListener('themechange', () => {
      this._handleThemeChange();
    });
  }

  /**
   * 设置ResizeObserver
   * @private
   */
  _setupResizeObserver() {
    try {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.virtualScrollContainer) {
            this._handleResize();
          }
        }
      });

      this.resizeObserver.observe(this.virtualScrollContainer);
    } catch (error) {
      console.warn('ResizeObserver初始化失败，将使用回退方案:', error);
      this.config.enableResizeObserver = false;
    }
  }

  /**
   * 设置事件委托
   * @private
   */
  _setupEventDelegation() {
    // 点击事件委托
    this.virtualScrollContainer.addEventListener('click', (e) => {
      this._handleClick(e);
    });

    // 拖放事件委托
    if (this.config.enableDragDrop) {
      this._setupDragDropDelegation();
    }
  }

  /**
   * 设置拖放事件委托
   * @private
   */
  _setupDragDropDelegation() {
    this.virtualScrollContainer.addEventListener('dragstart', (e) => {
      this._handleDragStart(e);
    });

    this.virtualScrollContainer.addEventListener('dragover', (e) => {
      this._handleDragOver(e);
    });

    this.virtualScrollContainer.addEventListener('dragleave', (e) => {
      this._handleDragLeave(e);
    });

    this.virtualScrollContainer.addEventListener('drop', (e) => {
      this._handleDrop(e);
    });

    this.virtualScrollContainer.addEventListener('dragend', (e) => {
      this._handleDragEnd(e);
    });
  }

  /**
   * 设置todoManager事件监听器
   * @private
   */
  _setupTodoManagerListeners() {
    // 筛选变化
    todoManager.addListener('filterChange', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 排序变化
    todoManager.addListener('sortChange', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 搜索变化
    todoManager.addListener('searchChange', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 任务添加
    todoManager.addListener('add', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 任务更新
    todoManager.addListener('update', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 任务删除
    todoManager.addListener('delete', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 批量删除
    todoManager.addListener('batchDelete', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });

    // 完成状态切换
    todoManager.addListener('toggleComplete', () => {
      this.updateItems(todoManager.getFilteredTodos());
    });
  }

  /**
   * 更新任务数据
   * @param {Array} items - 任务数组
   */
  updateItems(items) {
    this.state.items = items;
    this.state.totalItems = items.length;

    // 重新计算总高度
    this._calculateTotalHeight();

    // 更新可见项目
    this._updateVisibleItems();
  }

  /**
   * 测量视口尺寸
   * @private
   */
  _measureViewport() {
    this.state.viewportHeight = this.virtualScrollContainer.clientHeight;
    this.state.scrollTop = this.virtualScrollContainer.scrollTop;
  }

  /**
   * 计算总高度
   * @private
   */
  _calculateTotalHeight() {
    // 使用缓存的平均高度或默认高度
    let totalHeight = 0;
    for (let i = 0; i < this.state.totalItems; i++) {
      const height = this.state.itemHeights.get(i) || this.config.itemHeight;
      totalHeight += height;
    }

    this.state.totalHeight = totalHeight;
    this.contentPlaceholder.style.height = `${totalHeight}px`;
  }

  /**
   * 计算可见区域
   * @private
   * @returns {Object} 可见区域的起始和结束索引
   */
  _calculateVisibleRange() {
    const { scrollTop, viewportHeight } = this.state;
    const { itemHeight, bufferSize } = this.config;

    // 计算基础可见范围
    let startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    let endIndex = Math.min(
      this.state.totalItems - 1,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize
    );

    // 确保至少渲染一些项目
    if (this.state.totalItems > 0 && startIndex >= this.state.totalItems) {
      startIndex = Math.max(0, this.state.totalItems - 1);
    }

    if (endIndex < startIndex) {
      endIndex = startIndex;
    }

    return { startIndex, endIndex };
  }

  /**
   * 更新可见项目
   * @private
   */
  _updateVisibleItems() {
    if (this.state.isLoading || this.state.totalItems === 0) {
      return;
    }

    // 计算新的可见范围
    const { startIndex, endIndex } = this._calculateVisibleRange();

    // 检查是否需要更新
    if (startIndex === this.state.startIndex && endIndex === this.state.endIndex) {
      return;
    }

    this.state.startIndex = startIndex;
    this.state.endIndex = endIndex;

    // 使用requestAnimationFrame优化渲染
    requestAnimationFrame(() => {
      this._renderVisibleItems();
    });
  }

  /**
   * 渲染可见项目
   * @private
   */
  _renderVisibleItems() {
    // 回收不再可见的元素
    this._recycleInvisibleItems();

    // 渲染新的可见元素
    for (let i = this.state.startIndex; i <= this.state.endIndex; i++) {
      if (!this.usedItems.has(i) && i < this.state.items.length) {
        this._renderItem(i);
      }
    }
  }

  /**
   * 渲染单个项目
   * @param {number} index - 项目索引
   * @private
   */
  _renderItem(index) {
    const todo = this.state.items[index];
    if (!todo) return;

    // 获取或创建DOM元素
    const element = this._getItemElement();

    // 更新元素内容
    this._updateItemContent(element, todo, index);

    // 设置元素位置
    this._positionItem(element, index);

    // 添加到视口
    this.viewport.appendChild(element);

    // 记录使用中的元素
    this.usedItems.set(index, element);

    // 测量并缓存高度（如果是第一次渲染）
    if (!this.state.itemHeights.has(index)) {
      this._measureAndCacheHeight(element, index);
    }
  }

  /**
   * 获取DOM元素（从池中获取或创建新的）
   * @private
   * @returns {HTMLElement} DOM元素
   */
  _getItemElement() {
    if (this.itemPool.length > 0) {
      return this.itemPool.pop();
    }

    // 创建新的任务元素
    return this.uiManager.createTaskElement({});
  }

  /**
   * 更新元素内容
   * @param {HTMLElement} element - DOM元素
   * @param {Object} todo - 任务数据
   * @param {number} index - 项目索引
   * @private
   */
  _updateItemContent(element, todo, index) {
    // 使用UI管理器的createTaskElement创建完整内容
    const newElement = this.uiManager.createTaskElement(todo);

    // 复制属性和类
    element.className = newElement.className;
    element.setAttribute('data-id', todo.id);
    element.setAttribute('data-index', index);
    element.setAttribute('draggable', 'true');
    element.style.transform = ''; // 清除之前的transform

    // 更新内容
    element.innerHTML = newElement.innerHTML;

    // 重新绑定事件（事件委托已经处理，这里只需要确保data-id正确）
  }

  /**
   * 定位元素
   * @param {HTMLElement} element - DOM元素
   * @param {number} index - 项目索引
   * @private
   */
  _positionItem(element, index) {
    // 计算顶部位置
    let top = 0;
    for (let i = 0; i < index; i++) {
      top += this.state.itemHeights.get(i) || this.config.itemHeight;
    }

    // 设置位置
    element.style.position = 'absolute';
    element.style.top = `${top}px`;
    element.style.left = '0';
    element.style.width = '100%';
    element.style.zIndex = '1';
  }

  /**
   * 测量并缓存高度
   * @param {HTMLElement} element - DOM元素
   * @param {number} index - 项目索引
   * @private
   */
  _measureAndCacheHeight(element, index) {
    const height = element.offsetHeight;

    // 如果高度与默认值不同，更新缓存并重新计算总高度
    if (Math.abs(height - this.config.itemHeight) > 5) {
      this.state.itemHeights.set(index, height);

      // 重新计算总高度
      requestAnimationFrame(() => {
        this._calculateTotalHeight();
        this._updateVisibleItems(); // 重新定位所有元素
      });
    }
  }

  /**
   * 回收不再可见的元素
   * @private
   */
  _recycleInvisibleItems() {
    const { startIndex, endIndex } = this.state;

    this.usedItems.forEach((element, index) => {
      if (index < startIndex || index > endIndex) {
        // 从视口中移除
        if (element.parentNode === this.viewport) {
          this.viewport.removeChild(element);
        }

        // 重置样式
        element.style.transform = 'translateY(-9999px)';
        element.style.opacity = '0';

        // 添加到元素池
        this.itemPool.push(element);

        // 从使用中移除
        this.usedItems.delete(index);
      }
    });
  }

  /**
   * 处理滚动事件
   * @private
   */
  _handleScroll() {
    this._measureViewport();
    this._updateVisibleItems();
  }

  /**
   * 处理窗口大小变化
   * @private
   */
  _handleResize() {
    this._measureViewport();
    this._updateVisibleItems();
  }

  /**
   * 处理语言变化
   * @private
   */
  _handleLanguageChange() {
    // 重新渲染所有可见项目以更新文本
    this.usedItems.forEach((element, index) => {
      const todo = this.state.items[index];
      if (todo) {
        this._updateItemContent(element, todo, index);
      }
    });
  }

  /**
   * 处理主题变化
   * @private
   */
  _handleThemeChange() {
    // 主题变化不需要重新渲染内容，只需确保样式正确应用
  }

  /**
   * 处理点击事件
   * @param {Event} e - 点击事件
   * @private
   */
  _handleClick(e) {
    const taskCard = e.target.closest('.task-card');
    if (!taskCard) return;

    const taskId = taskCard.dataset.id;
    const target = e.target;

    // 处理复选框点击
    if (target.closest('.task-checkbox')) {
      this.uiManager.handleToggleComplete(taskId);
      return;
    }

    // 处理按钮点击
    const button = target.closest('.btn-icon');
    if (button) {
      const action = button.getAttribute('data-action');
      if (action === 'edit') {
        this.uiManager.handleEditTask(taskId);
        return;
      } else if (action === 'delete') {
        this.uiManager.handleDeleteTask(taskId);
        return;
      }
    }
  }

  /**
   * 处理拖放开始事件
   * @param {Event} e - 拖放事件
   * @private
   */
  _handleDragStart(e) {
    const taskCard = e.target.closest('.task-card');
    if (!taskCard) return;

    const taskId = taskCard.dataset.id;

    // 调用UI管理器的拖放处理
    if (this.uiManager._handleDragStart) {
      this.uiManager._handleDragStart(e);
    }
  }

  /**
   * 处理拖放悬停事件
   * @param {Event} e - 拖放事件
   * @private
   */
  _handleDragOver(e) {
    e.preventDefault();

    // 调用UI管理器的拖放处理
    if (this.uiManager._handleDragOver) {
      this.uiManager._handleDragOver(e);
    }
  }

  /**
   * 处理拖放离开事件
   * @param {Event} e - 拖放事件
   * @private
   */
  _handleDragLeave(e) {
    // 调用UI管理器的拖放处理
    if (this.uiManager._handleDragLeave) {
      this.uiManager._handleDragLeave(e);
    }
  }

  /**
   * 处理拖放放置事件
   * @param {Event} e - 拖放事件
   * @private
   */
  _handleDrop(e) {
    e.preventDefault();

    // 调用UI管理器的拖放处理
    if (this.uiManager._handleDrop) {
      this.uiManager._handleDrop(e);
    }
  }

  /**
   * 处理拖放结束事件
   * @param {Event} e - 拖放事件
   * @private
   */
  _handleDragEnd(e) {
    // 调用UI管理器的拖放处理
    if (this.uiManager._handleDragEnd) {
      this.uiManager._handleDragEnd(e);
    }
  }

  /**
   * 滚动到指定项目
   * @param {number} index - 项目索引
   * @param {Object} options - 滚动选项
   */
  scrollToIndex(index, options = {}) {
    if (index < 0 || index >= this.state.totalItems) {
      console.warn(`滚动索引超出范围: ${index}`);
      return;
    }

    const { behavior = 'smooth', block = 'center' } = options;

    // 计算目标位置
    let top = 0;
    for (let i = 0; i < index; i++) {
      top += this.state.itemHeights.get(i) || this.config.itemHeight;
    }

    // 执行滚动
    this.virtualScrollContainer.scrollTo({
      top,
      behavior
    });
  }

  /**
   * 滚动到指定任务
   * @param {string} taskId - 任务ID
   * @param {Object} options - 滚动选项
   */
  scrollToTask(taskId, options = {}) {
    const index = this.state.items.findIndex(todo => todo.id === taskId);
    if (index !== -1) {
      this.scrollToIndex(index, options);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 移除事件监听器
    if (this.virtualScrollContainer) {
      this.virtualScrollContainer.removeEventListener('scroll', this.handleScroll);
    }

    window.removeEventListener('resize', this.handleResize);

    // 断开ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // 清理DOM元素
    this.itemPool.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    this.itemPool = [];
    this.usedItems.clear();

    // 清理状态
    this.state.isInitialized = false;
    this.state.itemHeights.clear();

    console.log('虚拟滚动管理器资源已清理');
  }

  /**
   * 防抖函数
   * @private
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 节流函数
   * @private
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  _throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
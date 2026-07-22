/**
 * 今晚吃什么 ❤️ - 情侣点餐应用 v2.1
 * 启动页 + 角色命名 + 三大分页 + 日历历史
 */

// ============================
// 启动页关闭（全局函数，供 HTML onclick 调用）
// ============================
let splashDismissed = false;
function dismissSplash() {
    if (splashDismissed) return;
    splashDismissed = true;

    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    splash.classList.add('hide');

    setTimeout(() => {
        splash.style.display = 'none';

        const members = Storage.getMembers();
        const familyCode = Storage.getFamilyCode();
        const storeUrl = Storage.getStoreUrl();

        if (members.length > 0 && familyCode) {
            // 已有成员和家庭码 → 初始化同步
            Sync.init(familyCode, storeUrl);
            Sync.onChange(remoteData => {
                Storage.pullFromCloud(remoteData);
                App.data = Storage.getAll();
                UI.renderTodayTab();
                UI.renderDishList();
            });

            App.currentMemberId = members[0].id;
            App.data = Storage.getAll();
            const mainApp = document.getElementById('main-app');
            if (mainApp) mainApp.classList.add('active');
            const m = members[0];
            const avatar = document.getElementById('member-avatar');
            const name = document.getElementById('member-name');
            if (avatar) avatar.src = m.gender === 'male' ? 'picture/Man.webp' : 'picture/Women.webp';
            if (name) name.textContent = m.name;
            const badge = document.getElementById('family-code-badge');
            if (badge) badge.textContent = '🏠 家庭码: ' + familyCode;
            UI.initCalendar();
            UI.renderDishList();
            UI.renderTodayTab();
            UI.renderCalendar();
        } else {
            const setup = document.getElementById('setup-screen');
            if (setup) setup.classList.add('active');
            UI.initSetup();
        }

        initCommon();
    }, 500);
}

// ============================
// 菜品数据库 - 饭店菜单风格
// ============================
const DISHES_DB = [
    { category: '🔥 热菜', emoji: '🥩', items: [
        { name: '可乐鸡翅', img: 'picture/热菜/可乐鸡翅.webp' },
        { name: '宫保鸡丁', img: 'picture/热菜/宫保鸡丁.webp' },
        { name: '手撕鸡', img: 'picture/热菜/手撕鸡.webp' },
        { name: '水煮牛肉', img: 'picture/热菜/水煮牛肉.webp' },
        { name: '水煮鱼', img: 'picture/热菜/水煮鱼.webp' },
        { name: '清炒时蔬', img: 'picture/热菜/清炒时蔬.webp' },
        { name: '清蒸鱼', img: 'picture/热菜/清蒸鱼.webp' },
        { name: '火锅', img: 'picture/热菜/火锅.webp' },
        { name: '烧烤', img: 'picture/热菜/烧烤.webp' },
        { name: '烧鸭', img: 'picture/热菜/烧鸭.webp' },
        { name: '番茄炒蛋', img: 'picture/热菜/番茄炒蛋.webp' },
        { name: '糖醋排骨', img: 'picture/热菜/糖醋排骨.webp' },
        { name: '辣椒炒肉', img: 'picture/热菜/辣椒炒肉.webp' },
        { name: '青椒肉丝', img: 'picture/热菜/青椒肉丝.webp' },
        { name: '麻婆豆腐', img: 'picture/热菜/麻婆豆腐.webp' }
    ]},
    { category: '🍲 汤类', emoji: '🍲', items: [
        { name: '冬瓜汤', img: 'picture/汤类/冬瓜汤.webp' },
        { name: '玉米排骨汤', img: 'picture/汤类/玉米排骨汤.webp' },
        { name: '番茄蛋花汤', img: 'picture/汤类/番茄蛋花汤.webp' },
        { name: '紫菜蛋花汤', img: 'picture/汤类/紫菜蛋花汤.webp' },
        { name: '辣牛肉豆腐汤', img: 'picture/汤类/辣牛肉豆腐汤.webp' },
        { name: '香菇鸡汤', img: 'picture/汤类/香菇鸡汤.webp' }
    ]},
    { category: '🍚 主食', emoji: '🍚', items: [
        { name: '减脂餐', img: 'picture/主食/减脂餐.webp' },
        { name: '汉堡', img: 'picture/主食/汉堡.webp' },
        { name: '炒面', img: 'picture/主食/炒面.webp' },
        { name: '炒饭', img: 'picture/主食/炒饭.webp' },
        { name: '米饭', img: 'picture/主食/米饭.webp' },
        { name: '面条', img: 'picture/主食/面条.webp' },
        { name: '饺子', img: 'picture/主食/饺子.webp' }
    ]},
    { category: '🥤 饮品', emoji: '🥤', items: [
        { name: '七喜', img: 'picture/饮品/七喜.webp' },
        { name: '可乐', img: 'picture/饮品/可乐.webp' },
        { name: '咖啡', img: 'picture/饮品/咖啡.webp' },
        { name: '奶茶', img: 'picture/饮品/奶茶.webp' },
        { name: '果汁', img: 'picture/饮品/果汁.webp' },
        { name: '柠檬茶', img: 'picture/饮品/柠檬茶.webp' },
        { name: '雪碧', img: 'picture/饮品/雪碧.webp' }
    ]}
];

// ============================
// 数据管理
// ============================
const Storage = {
    KEY: 'couple_dinner_v2',

    getAll() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : this.getDefault();
        } catch {
            return this.getDefault();
        }
    },

    getDefault() {
        return {
            familyCode: '',
            storeUrl: '',
            members: [],
            todayOrders: [],    // 今日订单 [{id, dishName, img, category, memberId, orderedAt}]
            historyDates: {}    // { '2026/7/10': [orders], '2026/7/9': [orders] }
        };
    },

    save(data) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.error('保存失败:', e);
        }
    },

    // === 家庭码 ===
    saveFamilyInfo(code, url) {
        const d = this.getAll();
        d.familyCode = code;
        d.storeUrl = url;
        this.save(d);
    },
    getFamilyCode() { return this.getAll().familyCode; },
    getStoreUrl() { return this.getAll().storeUrl; },

    // === 云端同步 ===
    syncToCloud() {
        Sync.save(this.getAll());
    },
    pullFromCloud(remoteData) {
        if (!remoteData || Object.keys(remoteData).length === 0) return;
        const local = this.getAll();
        if (remoteData.members) local.members = remoteData.members;
        if (remoteData.todayOrders) local.todayOrders = remoteData.todayOrders;
        if (remoteData.historyDates) local.historyDates = remoteData.historyDates;
        this.save(local);
    },

    // === 成员 ===
    getMembers() { return this.getAll().members; },
    getMember(id) { return this.getMembers().find(m => m.id === id) || null; },
    addMember(gender, name) {
        const d = this.getAll();
        const member = {
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            gender,
            name: name.trim()
        };
        d.members.push(member);
        this.save(d);
        this.syncToCloud();
        return member;
    },

    // === 今日订单 ===
    getTodayOrders() { return this.getAll().todayOrders; },
    addOrder(dishName, img, category, memberId) {
        const d = this.getAll();
        const order = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            dishName: dishName.trim(),
            img,
            category,
            memberId,
            orderedAt: Date.now()
        };
        d.todayOrders.push(order);
        this.save(d);
        this.syncToCloud();
        return order;
    },
    removeOrder(orderId) {
        const d = this.getAll();
        d.todayOrders = d.todayOrders.filter(o => o.id !== orderId);
        this.save(d);
        this.syncToCloud();
    },
    clearTodayOrders() {
        const d = this.getAll();
        d.todayOrders = [];
        this.save(d);
        this.syncToCloud();
    },

    // === 历史 ===
    getHistory() { return this.getAll().historyDates; },
    // 将今日订单存入历史（每天0:00自动调用）
    archiveTodayToHistory() {
        const d = this.getAll();
        const today = new Date().toLocaleDateString('zh-CN');
        if (d.todayOrders.length > 0) {
            d.historyDates[today] = [...d.todayOrders];
            this.save(d);
        }
    },
    getHistoryByDate(dateStr) {
        const h = this.getHistory();
        return h[dateStr] || [];
    },
    getDatesWithOrders() {
        return Object.keys(this.getHistory());
    }
};

// ============================
// 应用状态
// ============================
const App = {
    data: null,
    currentMemberId: null,
    currentCategory: 0,
    calendarYear: 0,
    calendarMonth: 0,
    selectedDate: null,

    init() {
        this.data = Storage.getAll();
        // 自动检测日期变更，将昨天的订单归档
        this.checkDateChange();
    },

    checkDateChange() {
        const lastDate = localStorage.getItem('couple_last_date');
        const today = new Date().toLocaleDateString('zh-CN');
        if (lastDate && lastDate !== today) {
            // 日期变了，归档
            Storage.archiveTodayToHistory();
            Storage.clearTodayOrders();
        }
        localStorage.setItem('couple_last_date', today);
    },

    getCurrentMember() {
        return this.data.members.find(m => m.id === this.currentMemberId) || null;
    },

    isDishOrdered(dishName) {
        return this.data.todayOrders.some(o => o.dishName === dishName && o.memberId === this.currentMemberId);
    },

    getCategoryOrdersCount(category) {
        return this.data.todayOrders.filter(o => o.category === category).length;
    }
};

// ============================
// UI 控制器
// ============================
const UI = {
    els: {},

    cacheElements() {
        this.els = {
            // 启动页
            splashScreen: document.getElementById('splash-screen'),

            // 设置界面
            setupScreen: document.getElementById('setup-screen'),
            familySetup: document.getElementById('family-setup'),
            roleSetup: document.getElementById('role-setup'),
            generatedCode: document.getElementById('generated-code'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            familyCodeInput: document.getElementById('family-code-input'),
            joinFamilyBtn: document.getElementById('join-family-btn'),
            createFamilyBtn: document.getElementById('create-family-btn'),
            genderOptions: document.querySelectorAll('.gender-option'),
            memberNameInput: document.getElementById('member-name-input'),
            confirmRoleBtn: document.getElementById('confirm-role-btn'),

            // 主应用
            mainApp: document.getElementById('main-app'),
            memberAvatar: document.getElementById('member-avatar'),
            memberName: document.getElementById('member-name'),
            switchMemberBtn: document.getElementById('switch-member-btn'),
            leaveFamilyBtn: document.getElementById('leave-family-btn'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabOrder: document.getElementById('tab-order'),
            tabToday: document.getElementById('tab-today'),
            tabHistory: document.getElementById('tab-history'),

            // Tab1 - 点菜
            orderSearch: document.getElementById('order-search'),
            categoryTabs: document.getElementById('category-tabs'),
            dishScrollList: document.getElementById('dish-scroll-list'),

            // Tab2 - 今日总览
            todaySummary: document.getElementById('today-summary'),
            todayDishes: document.getElementById('today-dishes'),
            shareTodayBtn: document.getElementById('share-today-btn'),
            clearTodayBtn: document.getElementById('clear-today-btn'),

            // Tab3 - 历史
            calendarPrev: document.getElementById('calendar-prev'),
            calendarNext: document.getElementById('calendar-next'),
            calendarMonthLabel: document.getElementById('calendar-month-label'),
            calendarGrid: document.getElementById('calendar-grid'),
            historyDetail: document.getElementById('history-detail'),

            // 模态框
            memberModal: document.getElementById('member-modal'),
            memberListModal: document.getElementById('member-list-modal'),
            memberModalClose: document.getElementById('member-modal-close'),
            confirmModal: document.getElementById('confirm-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalText: document.getElementById('modal-text'),
            modalConfirm: document.getElementById('modal-confirm'),
            modalCancel: document.getElementById('modal-cancel'),
            toastContainer: document.getElementById('toast-container')
        };
    },

    // ============================
    // 设置流程
    // ============================
    initSetup() {
        // 防止重复绑定事件监听器
        if (this._setupBound) return;
        this._setupBound = true;

        // 初始隐藏家庭码展示区，创建家庭后才显示
        const codeSection = document.querySelector('.setup-code-section');
        if (codeSection) codeSection.style.display = 'none';

        // 复制邀请码
        this.els.copyCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(Sync.getCode()).then(() => {
                this.showToast('📋 家庭码已复制！发给对象吧');
            }).catch(() => {
                this.showToast('📋 家庭码: ' + Sync.getCode());
            });
        });

        // 加入已有家庭
        this.els.joinFamilyBtn.addEventListener('click', async () => {
            const inputCode = this.els.familyCodeInput.value.trim().toUpperCase();
            if (inputCode.length < 6) {
                this.showToast('📝 请输入完整家庭码');
                return;
            }
            this.showToast('🔍 正在查找家庭...');
            const ok = await Sync.joinFamily(inputCode);
            if (!ok) {
                this.showToast('❌ 未找到该家庭码，请确认');
                return;
            }
            this.els.familySetup.classList.remove('active');
            this.els.roleSetup.classList.add('active');
        });

        // 创建新家庭
        this.els.createFamilyBtn.addEventListener('click', async () => {
            this.showToast('⏳ 正在创建家庭...');
            const newCode = await Sync.createFamily();
            if (newCode) {
                this.els.generatedCode.textContent = newCode;
                // 显示家庭码展示区
                const codeSection = document.querySelector('.setup-code-section');
                if (codeSection) codeSection.style.display = '';
                this.showToast('✅ 家庭创建成功！家庭码: ' + newCode);
            }
            this.els.familySetup.classList.remove('active');
            this.els.roleSetup.classList.add('active');
        });

        // 性别选择
        this.els.genderOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                this.els.genderOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.checkRoleReady();
            });
        });

        // 昵称输入
        this.els.memberNameInput.addEventListener('input', () => this.checkRoleReady());
        this.els.memberNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.els.confirmRoleBtn.disabled) {
                this.handleConfirmRole();
            }
        });

        // 确认角色
        this.els.confirmRoleBtn.addEventListener('click', () => this.handleConfirmRole());
    },

    checkRoleReady() {
        const hasGender = document.querySelector('.gender-option.selected') !== null;
        const hasName = this.els.memberNameInput.value.trim().length > 0;
        this.els.confirmRoleBtn.disabled = !(hasGender && hasName);
    },

    handleConfirmRole() {
        const selected = document.querySelector('.gender-option.selected');
        const gender = selected.dataset.gender;
        const name = this.els.memberNameInput.value.trim();
        if (!name) {
            this.showToast('📝 请输入你的昵称');
            return;
        }
        const member = Storage.addMember(gender, name);
        App.currentMemberId = member.id;
        // 保存家庭码和云端URL到本地
        Storage.saveFamilyInfo(Sync.getCode(), Sync.getStoreUrl());
        // 同步到云端
        Storage.syncToCloud();
        App.data = Storage.getAll();
        this.enterMainApp(member);
    },

    enterMainApp(member) {
        this.els.setupScreen.classList.remove('active');
        this.els.mainApp.classList.add('active');
        // 更新显示
        this.els.memberAvatar.src = member.gender === 'male' ? 'picture/Man.webp' : 'picture/Women.webp';
        this.els.memberName.textContent = member.name;
        // 显示家庭码
        const badge = document.getElementById('family-code-badge');
        if (badge) badge.textContent = '🏠 家庭码: ' + Sync.getCode();
        // 渲染主界面
        this.initCalendar();
        this.renderDishList();
        this.renderTodayTab();
        this.renderCalendar();
    },

    generateCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    },

    // ============================
    // 成员切换
    // ============================
    setupMemberSwitch() {
        this.els.switchMemberBtn.addEventListener('click', () => this.showMemberModal());
        this.els.memberModalClose.addEventListener('click', () => {
            this.els.memberModal.classList.add('hidden');
        });
        this.els.memberModal.addEventListener('click', (e) => {
            if (e.target === this.els.memberModal) {
                this.els.memberModal.classList.add('hidden');
            }
        });
    },

    setupLeaveFamily() {
        this.els.leaveFamilyBtn.addEventListener('click', () => this.handleLeaveFamily());
    },

    async handleLeaveFamily() {
        const confirmed = await this.showConfirm(
            '🚪 退出家庭',
            '退出后将清除所有本地数据，你可以重新创建或加入新的家庭。\n\n确定要退出吗？'
        );
        if (!confirmed) return;

        // 停止同步轮询
        Sync.stopPolling();

        // 清除所有本地存储数据
        localStorage.removeItem(Storage.KEY);
        localStorage.removeItem('couple_last_date');

        // 重置应用状态
        App.data = Storage.getAll();
        App.currentMemberId = null;
        App.currentCategory = 0;

        // 切换到设置界面
        this.els.mainApp.classList.remove('active');
        this.els.setupScreen.classList.add('active');

        // 重置设置步骤
        this.els.familySetup.classList.add('active');
        this.els.roleSetup.classList.remove('active');
        this.els.familyCodeInput.value = '';
        this.els.genderOptions.forEach(o => o.classList.remove('selected'));
        this.els.memberNameInput.value = '';
        this.els.confirmRoleBtn.disabled = true;

        // 隐藏家庭码展示区
        const codeSection = document.querySelector('.setup-code-section');
        if (codeSection) codeSection.style.display = 'none';

        // 重置绑定标记，允许重新初始化
        this._setupBound = false;
        this.initSetup();

        this.showToast('👋 已退出家庭，可以重新创建了');
    },

    showMemberModal() {
        const members = App.data.members;
        this.els.memberListModal.innerHTML = members.map(m => {
            const avatarSrc = m.gender === 'male' ? 'picture/Man.webp' : 'picture/Women.webp';
            const isActive = m.id === App.currentMemberId;
            return `
                <div class="member-list-item ${isActive ? 'active' : ''}" data-member-id="${m.id}">
                    <img class="mli-avatar" src="${avatarSrc}" alt="头像">
                    <span class="mli-name">${this.escapeHtml(m.name)}</span>
                    ${isActive ? '<span class="mli-check">✅</span>' : '<span class="mli-check" style="color:#ccc;">○</span>'}
                </div>
            `;
        }).join('');
        this.els.memberListModal.querySelectorAll('.member-list-item').forEach(el => {
            el.addEventListener('click', () => {
                const mid = el.dataset.memberId;
                App.currentMemberId = mid;
                const member = App.getCurrentMember();
                this.els.memberAvatar.src = member.gender === 'male' ? 'picture/Man.webp' : 'picture/Women.webp';
                this.els.memberName.textContent = member.name;
                this.els.memberModal.classList.add('hidden');
                this.renderDishList();
                this.renderTodayTab();
                this.showToast(`👤 已切换到 ${member.name}`);
            });
        });
    },

    // ============================
    // Tab 切换
    // ============================
    setupTabSwitch() {
        this.els.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.els.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                document.getElementById('tab-' + tab).classList.add('active');
                // 切换时刷新
                if (tab === 'today') this.renderTodayTab();
                if (tab === 'history') this.renderCalendar();
                if (tab === 'order') this.renderDishList();
            });
        });
    },

    // ============================
    // Tab 1: 点菜界面
    // ============================
    renderDishList(searchTerm) {
        // 渲染分类标签
        this.renderCategoryTabs();
        // 渲染菜品
        this.renderDishCards(searchTerm);
        // 搜索
        this.els.orderSearch.addEventListener('input', () => {
            this.renderDishCards(this.els.orderSearch.value);
        });
    },

    renderCategoryTabs() {
        this.els.categoryTabs.innerHTML = DISHES_DB.map((cat, idx) => `
            <button class="category-tab ${idx === App.currentCategory ? 'active' : ''}" data-cat-idx="${idx}">
                ${cat.emoji} ${cat.category}
            </button>
        `).join('');
        this.els.categoryTabs.querySelectorAll('.category-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                App.currentCategory = parseInt(btn.dataset.catIdx);
                this.els.categoryTabs.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderDishCards(this.els.orderSearch.value);
            });
        });
    },

    renderDishCards(searchTerm) {
        const container = this.els.dishScrollList;
        const member = App.getCurrentMember();
        if (!member) return;

        let allDishes = [];
        if (searchTerm && searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            DISHES_DB.forEach(cat => {
                cat.items.forEach(item => {
                    if (item.name.toLowerCase().includes(q)) {
                        allDishes.push({ ...item, category: cat.category, catEmoji: cat.emoji });
                    }
                });
            });
        } else {
            const cat = DISHES_DB[App.currentCategory];
            allDishes = cat.items.map(item => ({ ...item, category: cat.category, catEmoji: cat.emoji }));
        }

        if (allDishes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p class="empty-text">没有找到这道菜～<br>试试搜索其他菜品吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allDishes.map(dish => {
            const ordered = App.isDishOrdered(dish.name);
            return `
                <div class="dish-card" data-dish="${this.escapeHtml(dish.name)}">
                    <img class="dish-card-img" src="${dish.img}" alt="${dish.name}">
                    <div class="dish-card-info">
                        <div class="dish-card-name">${dish.name}</div>
                        <div class="dish-card-category">${dish.category}</div>
                        ${ordered ? '<div class="dish-card-ordered">✅ 已点过</div>' : ''}
                    </div>
                    <button class="dish-card-action ${ordered ? 'ordered' : ''}" data-dish-name="${this.escapeHtml(dish.name)}" data-img="${dish.img}" data-category="${dish.category}">
                        ${ordered ? '✅ 已点' : '🤤 我想吃'}
                    </button>
                </div>
            `;
        }).join('');

        // 绑定点菜事件
        container.querySelectorAll('.dish-card-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const dishName = btn.dataset.dishName;
                const img = btn.dataset.img;
                const category = btn.dataset.category;
                this.handleOrderDish(dishName, img, category, btn);
            });
        });
    },

    handleOrderDish(dishName, img, category, btn) {
        const member = App.getCurrentMember();
        if (!member) return;

        if (App.isDishOrdered(dishName)) {
            // 取消点菜
            const order = App.data.todayOrders.find(o => o.dishName === dishName && o.memberId === App.currentMemberId);
            if (order) {
                Storage.removeOrder(order.id);
                App.data = Storage.getAll();
                btn.classList.remove('ordered');
                btn.innerHTML = '🤤 我想吃';
                const orderedHint = btn.closest('.dish-card').querySelector('.dish-card-ordered');
                if (orderedHint) orderedHint.remove();
                this.showToast(`↩️ 已取消「${dishName}」`);
            }
        } else {
            // 点菜
            Storage.addOrder(dishName, img, category, App.currentMemberId);
            App.data = Storage.getAll();
            btn.classList.add('ordered');
            btn.innerHTML = '✅ 已点';
            const info = btn.closest('.dish-card').querySelector('.dish-card-info');
            const existing = info.querySelector('.dish-card-ordered');
            if (!existing) {
                const hint = document.createElement('div');
                hint.className = 'dish-card-ordered';
                hint.textContent = '✅ 已点过';
                info.appendChild(hint);
            }
            this.showToast(`🍽️ 「${dishName}」已加入今日菜单！`);
        }
    },

    // ============================
    // Tab 2: 今日总览
    // ============================
    renderTodayTab() {
        this.renderTodaySummary();
        this.renderTodayDishes();
    },

    renderTodaySummary() {
        const orders = App.data.todayOrders;
        const memberCount = new Set(orders.map(o => o.memberId)).size;
        const dishCount = orders.length;
        const uniqueDishes = new Set(orders.map(o => o.dishName)).size;

        this.els.todaySummary.innerHTML = `
            <div class="today-summary-card">
                <div class="num">${dishCount}</div>
                <div class="label">总点菜次数</div>
            </div>
            <div class="today-summary-card">
                <div class="num">${uniqueDishes}</div>
                <div class="label">不同菜品</div>
            </div>
            <div class="today-summary-card">
                <div class="num">${memberCount}</div>
                <div class="label">点餐人数</div>
            </div>
        `;
    },

    renderTodayDishes() {
        const container = this.els.todayDishes;
        const orders = App.data.todayOrders;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍜</div>
                    <p class="empty-text">今天还没点菜呢～<br>去点菜页面选几道吧！</p>
                </div>
            `;
            return;
        }

        // 按菜品分组
        const grouped = new Map();
        orders.forEach(o => {
            const key = o.dishName;
            if (!grouped.has(key)) {
                grouped.set(key, { name: o.dishName, img: o.img, orders: [] });
            }
            grouped.get(key).orders.push(o);
        });

        container.innerHTML = Array.from(grouped.values()).map(group => {
            const orderNames = group.orders.map(o => {
                const m = App.data.members.find(mm => mm.id === o.memberId);
                return m ? m.name : '未知';
            });
            const timeStr = this.formatTime(group.orders[0].orderedAt);
            return `
                <div class="today-dish-item">
                    <img class="today-dish-img" src="${group.img}" alt="${group.name}">
                    <div class="today-dish-info">
                        <div class="today-dish-name">${group.name}</div>
                        <div class="today-dish-orders">👥 ${orderNames.join('、')} 想吃</div>
                    </div>
                    <div class="today-dish-time">${timeStr}</div>
                </div>
            `;
        }).join('');
    },

    // ============================
    // Tab 3: 日历历史
    // ============================
    initCalendar() {
        const now = new Date();
        App.calendarYear = now.getFullYear();
        App.calendarMonth = now.getMonth();

        this.els.calendarPrev.addEventListener('click', () => {
            App.calendarMonth--;
            if (App.calendarMonth < 0) {
                App.calendarMonth = 11;
                App.calendarYear--;
            }
            this.renderCalendar();
        });
        this.els.calendarNext.addEventListener('click', () => {
            App.calendarMonth++;
            if (App.calendarMonth > 11) {
                App.calendarMonth = 0;
                App.calendarYear++;
            }
            this.renderCalendar();
        });
    },

    renderCalendar() {
        const year = App.calendarYear;
        const month = App.calendarMonth;
        this.els.calendarMonthLabel.textContent = `${year}年 ${month + 1}月`;

        const today = new Date();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const datesWithOrders = Storage.getDatesWithOrders();

        let html = '';
        // weekday headers
        weekdays.forEach(w => {
            html += `<div class="cal-weekday">${w}</div>`;
        });

        // 上月填充
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="cal-day other-month"><span>${daysInPrevMonth - i}</span></div>`;
        }

        // 本月
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = dateObj.toLocaleDateString('zh-CN');
            const isToday = dateObj.toDateString() === today.toDateString();
            const hasOrder = datesWithOrders.includes(dateStr);
            const isSelected = App.selectedDate === dateStr;

            html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasOrder ? 'has-order' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                <span>${d}</span>
                ${hasOrder ? '<div class="cal-dot"></div>' : ''}
            </div>`;
        }

        // 下月填充
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="cal-day other-month"><span>${i}</span></div>`;
        }

        this.els.calendarGrid.innerHTML = html;

        // 绑定点击事件
        this.els.calendarGrid.querySelectorAll('.cal-day:not(.other-month)').forEach(el => {
            el.addEventListener('click', () => {
                const dateStr = el.dataset.date;
                App.selectedDate = dateStr;
                this.renderCalendar(); // 重新渲染高亮
                this.showHistoryDetail(dateStr);
            });
        });

        // 如果今天有订单，默认选中今天
        const todayStr = today.toLocaleDateString('zh-CN');
        if (datesWithOrders.includes(todayStr)) {
            App.selectedDate = todayStr;
            this.showHistoryDetail(todayStr);
        } else {
            this.els.historyDetail.innerHTML = `
                <div class="empty-state small">
                    <p class="empty-text">点击日历中的日期查看历史点菜记录</p>
                </div>
            `;
        }
    },

    showHistoryDetail(dateStr) {
        const orders = Storage.getHistoryByDate(dateStr);
        const container = this.els.historyDetail;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <div class="empty-icon">📭</div>
                    <p class="empty-text">${dateStr}<br>这天没有点菜记录～</p>
                </div>
            `;
            return;
        }

        // 按菜品分组
        const grouped = new Map();
        orders.forEach(o => {
            if (!grouped.has(o.dishName)) {
                grouped.set(o.dishName, { name: o.dishName, img: o.img, members: [] });
            }
            const m = App.data.members.find(mm => mm.id === o.memberId);
            grouped.get(o.dishName).members.push(m ? m.name : '未知');
        });

        container.innerHTML = `
            <div class="history-detail-title">📅 ${dateStr} 的点菜记录</div>
            ${Array.from(grouped.values()).map(g => `
                <div class="history-dish-item">
                    <img class="history-dish-img" src="${g.img}" alt="${g.name}">
                    <span style="flex:1;font-weight:600;">${g.name}</span>
                    <span style="font-size:12px;color:var(--text-secondary)">${g.members.join('、')}</span>
                </div>
            `).join('')}
        `;
    },

    // ============================
    // 今日操作
    // ============================
    setupTodayActions() {
        // 分享
        this.els.shareTodayBtn.addEventListener('click', () => this.handleShareToday());
        // 重置
        this.els.clearTodayBtn.addEventListener('click', () => this.handleClearToday());
    },

    async handleShareToday() {
        const orders = App.data.todayOrders;
        if (orders.length === 0) {
            this.showToast('📝 今天还没点菜呢～');
            return;
        }

        const grouped = new Map();
        orders.forEach(o => {
            if (!grouped.has(o.dishName)) {
                grouped.set(o.dishName, { name: o.dishName, orders: [] });
            }
            grouped.get(o.dishName).orders.push(o);
        });

        const memberNames = {};
        App.data.members.forEach(m => { memberNames[m.id] = m.name; });

        let text = `🍽️ ${new Date().toLocaleDateString('zh-CN')} 晚餐计划 ❤️\n`;
        text += `━━━━━━━━━━━━━━\n`;

        Array.from(grouped.values()).forEach(g => {
            const names = g.orders.map(o => memberNames[o.memberId] || '未知').join('、');
            text += `🍴 ${g.name}（${names}想吃）\n`;
        });

        text += `━━━━━━━━━━━━━━\n❤️ 一起好好吃饭吧～`;

        if (navigator.share) {
            try {
                await navigator.share({ text });
                this.showToast('📤 分享成功！');
                return;
            } catch (e) {
                if (e.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('📋 菜单已复制到剪贴板！');
        } catch {
            prompt('复制以下内容分享：', text);
        }
    },

    async handleClearToday() {
        const confirmed = await this.showConfirm('🔄 重置今日菜单？', '这将清空今天所有的点菜记录，确定要重置吗？');
        if (confirmed) {
            Storage.clearTodayOrders();
            App.data = Storage.getAll();
            this.renderTodayTab();
            this.renderDishList();
            this.showToast('🔄 已重置今日菜单～');
        }
    },

    // ============================
    // 辅助方法
    // ============================
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.els.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('out');
            setTimeout(() => toast.remove(), 300);
        }, 1800);
    },

    showConfirm(title, text) {
        return new Promise((resolve) => {
            this.els.modalTitle.textContent = title;
            this.els.modalText.textContent = text;
            this.els.confirmModal.classList.remove('hidden');
            const handleConfirm = () => {
                this.els.confirmModal.classList.add('hidden');
                this.els.modalConfirm.removeEventListener('click', handleConfirm);
                this.els.modalCancel.removeEventListener('click', handleCancel);
                resolve(true);
            };
            const handleCancel = () => {
                this.els.confirmModal.classList.add('hidden');
                this.els.modalConfirm.removeEventListener('click', handleConfirm);
                this.els.modalCancel.removeEventListener('click', handleCancel);
                resolve(false);
            };
            this.els.modalConfirm.addEventListener('click', handleConfirm);
            this.els.modalCancel.addEventListener('click', handleCancel);
        });
    }
};

// ============================
// 应用启动
// ============================
function init() {
    UI.cacheElements();
    App.init();

    // 启动页点击（js 备份，主要靠 HTML onclick="dismissSplash()"）
    UI.els.splashScreen.addEventListener('click', dismissSplash);
}

function initCommon() {
    // 切换成员
    UI.setupMemberSwitch();

    // 退出家庭
    UI.setupLeaveFamily();

    // Tab 切换
    UI.setupTabSwitch();

    // 搜索菜品（重新绑定）
    UI.els.orderSearch.addEventListener('input', () => {
        UI.renderDishCards(UI.els.orderSearch.value);
    });

    // 今日操作
    UI.setupTodayActions();

    // 模态框外部关闭
    UI.els.confirmModal.addEventListener('click', (e) => {
        if (e.target === UI.els.confirmModal) {
            UI.els.confirmModal.classList.add('hidden');
        }
    });

    console.log('🍽️ 今晚吃什么 v2.1 ❤️ 已启动！');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

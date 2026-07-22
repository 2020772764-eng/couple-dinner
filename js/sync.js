/**
 * 跨设备同步模块（零配置版）
 * 免费 JSON 云存储，家庭码 = 共享钥匙
 */

// 全局目录：存所有家庭码 → 数据 URL 的映射
const DIRECTORY_URL = 'https://jsonblob.com/api/jsonBlob/019f8a12-a5e0-7503-898f-769281c58914';

const Sync = {
    familyCode: null,
    storeUrl: null,
    listeners: [],
    pollTimer: null,
    lastHash: '',

    // 从目录中查找家庭码对应的数据 URL
    async _lookup(code) {
        try {
            const resp = await fetch(DIRECTORY_URL);
            const dir = await resp.json();
            return dir[code] || null;
        } catch { return null; }
    },

    // 写入目录映射
    async _register(code, url) {
        try {
            const resp = await fetch(DIRECTORY_URL);
            const dir = await resp.json();
            dir[code] = url;
            await fetch(DIRECTORY_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dir)
            });
            return true;
        } catch (e) {
            console.warn('注册失败:', e.message);
            return false;
        }
    },

    // 创建新家庭
    async createFamily() {
        try {
            // 1. 创建数据 blob
            const resp = await fetch('https://jsonblob.com/api/jsonBlob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: [], todayOrders: [], historyDates: {} })
            });
            const loc = resp.headers.get('Location');
            this.storeUrl = loc.startsWith('http') ? loc : 'https://jsonblob.com' + loc;

            // 2. 生成随机6位家庭码（不用UUID前几位，避免所有码雷同）
            this.familyCode = Sync.generateCode();

            // 确保目录中不存在重复码
            let exists = await this._lookup(this.familyCode);
            while (exists) {
                this.familyCode = Sync.generateCode();
                exists = await this._lookup(this.familyCode);
            }

            // 3. 注册到目录
            await this._register(this.familyCode, this.storeUrl);

            // 4. 开始轮询
            this.startPolling();

            console.log('✅ 家庭创建成功:', this.familyCode);
            return this.familyCode;
        } catch (e) {
            console.warn('创建失败，离线模式:', e.message);
            this.familyCode = Sync.generateCode();
            return this.familyCode;
        }
    },

    // 加入已有家庭
    async joinFamily(code) {
        this.familyCode = code;
        this.storeUrl = await this._lookup(code);

        if (this.storeUrl) {
            // 立即拉取一次
            const data = await this.fetchData();
            if (data) {
                this.listeners.forEach(fn => fn(data));
            }
            this.startPolling();
            console.log('✅ 加入家庭:', code);
            return true;
        } else {
            console.warn('⚠️ 未找到该家庭码，请确认输入正确');
            return false;
        }
    },

    // 恢复已有会话
    async init(code, url) {
        this.familyCode = code;
        this.storeUrl = url || await this._lookup(code);
        if (this.storeUrl) {
            this.startPolling();
            console.log('✅ 同步已恢复:', code);
        }
    },

    async fetchData() {
        if (!this.storeUrl) return null;
        try {
            const resp = await fetch(this.storeUrl);
            return await resp.json();
        } catch { return null; }
    },

    // 推送到云端
    async save(data) {
        if (!this.storeUrl) return;
        try {
            const hash = JSON.stringify(data).slice(0, 50);
            if (hash === this.lastHash) return;
            this.lastHash = hash;

            await fetch(this.storeUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) { /* 静默失败 */ }
    },

    startPolling() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = setInterval(async () => {
            const data = await this.fetchData();
            if (data) {
                const hash = JSON.stringify(data).slice(0, 50);
                if (hash !== this.lastHash) {
                    this.lastHash = hash;
                    this.listeners.forEach(fn => fn(data));
                }
            }
        }, 5000);
    },

    stopPolling() {
        if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    },

    reset() {
        this.stopPolling();
        this.familyCode = null;
        this.storeUrl = null;
        this.lastHash = '';
        this.listeners = [];
    },

    onChange(fn) { this.listeners.push(fn); },
    getCode() { return this.familyCode; },
    getStoreUrl() { return this.storeUrl; },
    generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
};

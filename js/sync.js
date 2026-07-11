/**
 * Firebase 跨设备同步模块
 * 使用家庭码作为共享房间，两人数据实时同步
 */

// 🔥 你的 Firebase 配置（创建 Firebase 项目后替换这里）
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD-PLACEHOLDER-REPLACE-WITH-YOUR-KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxx"
};

// ============================
// 同步引擎
// ============================
const Sync = {
    db: null,
    familyCode: null,
    familyRef: null,
    initialized: false,
    listeners: [],  // 数据变化时的回调函数

    // 初始化 Firebase + 家庭码
    init(familyCode) {
        if (this.initialized) return;
        this.familyCode = familyCode;

        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK 未加载，使用本地存储模式');
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            this.db = firebase.database();
            this.familyRef = this.db.ref('families/' + familyCode);
            this.initialized = true;

            // 监听远程数据变化
            this.familyRef.on('value', snapshot => {
                const remoteData = snapshot.val() || {};
                this.listeners.forEach(fn => fn(remoteData));
            });

            console.log('✅ 同步已连接，家庭码:', familyCode);
        } catch (e) {
            console.warn('Firebase 初始化失败，使用本地存储模式:', e.message);
        }
    },

    // 监听数据变化（注册回调）
    onChange(fn) {
        this.listeners.push(fn);
    },

    // 保存数据到云端
    save(data) {
        if (this.familyRef) {
            this.familyRef.set(data).catch(e => {
                console.warn('同步保存失败:', e.message);
            });
        }
    },

    // 更新部分数据
    update(partialData) {
        if (this.familyRef) {
            this.familyRef.update(partialData).catch(e => {
                console.warn('同步更新失败:', e.message);
            });
        }
    },

    // 获取家庭码
    getCode() {
        return this.familyCode;
    },

    // 生成6位随机家庭码
    generateCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
};

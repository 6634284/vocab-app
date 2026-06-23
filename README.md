# 考研词达人

一款基于 React Native + Expo 的考研英语词汇学习应用，采用 FSRS 间隔重复算法，帮助用户高效记忆单词。

## 功能特性

### 核心功能

- **智能学习队列** - 根据 FSRS 算法自动安排新词学习和旧词复习
- **翻卡片学习** - 点击显示释义，支持发音播放
- **三级评分** - 不认识 / 不确定 / 认识，自动计算下次复习时间
- **单词发音** - 使用系统 TTS 播放单词发音（美式英语）

### 数据管理

- **完整词库** - 包含 5047 个考研核心词汇（红宝书考研英语词汇）
- **本地存储** - 使用 SQLite 本地数据库，离线可用
- **词书管理** - 支持多词书切换

### 学习统计

- **打卡系统** - 连续打卡天数统计
- **学习记录** - 每日新词、复习数量统计
- **进度可视化** - 7 日学习量图表、词汇掌握度分布

### 个性化设置

- **每日新词数** - 可自定义每日学习新词数量（10-200）
- **深色模式** - 支持深色/浅色主题切换

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Expo SDK 56 + React Native 0.85 |
| 路由 | expo-router (文件系统路由) |
| 数据库 | expo-sqlite (本地 SQLite) |
| 状态管理 | Zustand + AsyncStorage |
| 算法 | ts-fsrs (FSRS v4 间隔重复算法) |
| UI | Material Icons |
| 语音 | expo-speech (系统 TTS) |

## 项目结构

```
vocab-app/
├── app/                          # 页面 (expo-router)
│   ├── _layout.tsx              # 根布局，初始化 SQLite
│   ├── study.tsx                # 学习页面（翻卡片 + 评分）
│   ├── (tabs)/                  # Tab 页面
│   │   ├── index.tsx            # 首页（打卡、学习队列）
│   │   ├── stats.tsx            # 统计页面
│   │   └── settings.tsx         # 设置页面
│   └── book/                    # 词书管理
├── src/
│   ├── components/              # UI 组件
│   ├── db/                      # 数据库层
│   │   ├── database.ts          # 表结构定义
│   │   ├── queries.ts           # CRUD 查询
│   │   └── seedData.ts          # 词汇数据
│   ├── services/                # 业务逻辑
│   │   ├── studyService.ts      # 学习队列、打卡
│   │   └── fsrsService.ts       # FSRS 算法封装
│   ├── stores/                  # 状态管理
│   │   ├── useStudyStore.ts     # 学习状态
│   │   └── useSettingsStore.ts  # 设置状态
│   └── types/                   # TypeScript 类型
├── eas.json                     # EAS Build 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Expo Go 应用（用于开发调试）

### 安装

```bash
# 克隆项目
git clone https://github.com/6634284/vocab-app.git
cd vocab-app

# 安装依赖
npm install
```

### 开发调试

```bash
# 启动开发服务器
npm start

# 使用 Expo Go 扫描二维码运行
```

### 构建 APK

#### 方式一：EAS Build（推荐）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 构建 APK
eas build --platform android --profile preview
```

#### 方式二：本地构建

```bash
# 生成原生项目
npx expo prebuild --platform android

# 进入 Android 目录
cd android

# 构建 APK
./gradlew assembleRelease

# APK 位置：android/app/build/outputs/apk/release/app-release.apk
```

## 数据库结构

### books 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 词书 ID |
| name | TEXT | 词书名称 |
| word_count | INTEGER | 单词数量 |
| description | TEXT | 词书描述 |

### words 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 单词 ID |
| word | TEXT | 单词 |
| phonetic | TEXT | 音标 |
| meaning | TEXT | 释义 |
| example | TEXT | 例句 |
| book_id | TEXT | 所属词书 |
| word_index | INTEGER | 单词索引 |

### cards 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 卡片 ID |
| word_id | INTEGER | 单词 ID |
| due | INTEGER | 下次复习时间戳 |
| stability | REAL | 记忆稳定性 |
| difficulty | REAL | 难度系数 |
| elapsed_days | INTEGER | 已过天数 |
| scheduled_days | INTEGER | 计划间隔天数 |
| reps | INTEGER | 复习次数 |
| lapses | INTEGER | 遗忘次数 |
| state | INTEGER | 状态（0:新词, 1:学习中, 2:已掌握, 3:重新学习） |

## FSRS 算法说明

FSRS（Free Spaced Repetition Scheduler）是一种先进的间隔重复算法，根据以下因素动态计算复习间隔：

- **记忆稳定性 (stability)** - 单词的记忆强度，越高间隔越长
- **难度 (difficulty)** - 单词本身的难度系数
- **复习次数 (reps)** - 已复习次数越多，间隔越长
- **遗忘次数 (lapses)** - 遗忘次数越多，间隔越短

## 构建产物

| 平台 | 文件 | 说明 |
|------|------|------|
| Android | APK | 可直接安装的安装包 |
| Android | AAB | Google Play 上架格式 |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

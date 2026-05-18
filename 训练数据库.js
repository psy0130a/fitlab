/* ============================================================
 * 训练数据库.js — 单一数据源（Single Source of Truth）
 * ------------------------------------------------------------
 * 被「健身动作手册.html」和「分析.html」共同引用。
 * 任何关于"肌肉名称 / 动作涉及哪些肌肉 / 每块肌肉参与程度"的数据
 * 都只在这里定义一次，两个页面共用，保证完全一致。
 *
 * 内容：
 *   1. MUSCLE_CATEGORIES  — 10 个解剖大类
 *   2. MUSCLE_TARGETS     — 34 块肌肉：所属大类 / 父肌肉 / MEV-MAV-MRV / 解剖图键
 *   3. EXERCISE_DB        — 动作库：每个动作 → 完整对象（动作模式 / 器材 / 难度 /
 *                           负荷类型 / 水平阈值 / 疲劳成本 / 适用目标 / 肌肉贡献系数 /
 *                           技术要点 / 推荐理由 / 退阶-进阶链 / 姿态图）
 *   4. classifyExercise() — 给任意动作名返回贡献系数映射（先查库，再关键词兜底）
 *   5. GOAL_PROFILE       — 训练目标（增肌/力量/耐力/健康）的参数
 *   6. estimate1RM / estimateRIR — 通用计算
 * ============================================================ */
(function(global){
'use strict';

// ============================================================
// 1. 肌肉大类（10 个平行解剖区域）
// ============================================================
const MUSCLE_CATEGORIES = [
  { key:'chest',       name:'胸',   icon:'🔴', group:'上身',
    muscles:['胸大肌-上部','胸大肌-中下部','胸小肌','前锯肌'] },
  { key:'back',        name:'背',   icon:'🟢', group:'上身',
    muscles:['背阔肌','菱形肌','斜方肌-上部','斜方肌-中下部','竖脊肌','大圆肌'] },
  { key:'shoulder',    name:'肩',   icon:'🟡', group:'上身',
    muscles:['三角肌前束','三角肌中束','三角肌后束','肩袖肌群'] },
  { key:'arm',         name:'手臂', icon:'🟠', group:'上身',
    muscles:['肱二头肌','肱肌','肱桡肌','肱三头肌-长头','肱三头肌-外侧+内侧头','前臂'] },
  { key:'core',        name:'腰腹', icon:'🔵', group:'核心',
    muscles:['腹直肌','腹斜肌','腹横肌','髂腰肌（髋屈肌）','腰方肌'] },
  { key:'thigh_front', name:'大腿前',icon:'🦵', group:'下身',
    muscles:['股四头肌-外侧+中间头','股直肌','股内侧肌-VMO'] },
  { key:'thigh_back',  name:'大腿后',icon:'🟤', group:'下身',
    muscles:['腘绳肌-股二头长头','腘绳肌-半腱+半膜'] },
  { key:'glute',       name:'臀',   icon:'🍑', group:'下身',
    muscles:['臀大肌-上部','臀大肌-下部','臀中肌'] },
  { key:'hip',         name:'髋',   icon:'⭕', group:'下身',
    muscles:['内收肌群','髋外展肌-TFL','髋深层旋转肌'] },
  { key:'calf',        name:'小腿', icon:'🦶', group:'下身',
    muscles:['腓肠肌','比目鱼肌','胫骨前肌','腓骨长短肌','胫骨后肌'] },
  { key:'neck',        name:'颈',   icon:'🦒', group:'上身',
    muscles:['颈部肌群'] }
];

// ============================================================
// 2. 肌肉表（34 块）
//    parent  = 父肌肉（手册用粗名时映射到这里的子部位）
//    libKey  = body-highlighter 解剖图库的键（多对一允许）
//    mev/mav/mrv = Israetel RP Hypertrophy 每周组数阈值（增肌基准）
// ============================================================
const MUSCLE_TARGETS = {
  // —— 胸 ——
  '胸大肌-上部':          { cat:'chest', parent:'胸大肌', lib:'chest',          mev:6,  mav:10, mrv:14 },
  '胸大肌-中下部':        { cat:'chest', parent:'胸大肌', lib:'chest',          mev:6,  mav:10, mrv:14 },
  // —— 背 ——
  '背阔肌':               { cat:'back',  parent:'背阔肌', lib:'upper-back',     mev:10, mav:18, mrv:25 },
  '菱形肌':               { cat:'back',  parent:'中背',   lib:'upper-back',     mev:6,  mav:12, mrv:18 },
  '斜方肌-上部':          { cat:'back',  parent:'斜方肌', lib:'trapezius',      mev:4,  mav:10, mrv:18 },
  '斜方肌-中下部':        { cat:'back',  parent:'斜方肌', lib:'trapezius',      mev:6,  mav:12, mrv:18 },
  '竖脊肌':               { cat:'back',  parent:'竖脊肌', lib:'lower-back',     mev:6,  mav:12, mrv:18 },
  // —— 肩 ——
  '三角肌前束':           { cat:'shoulder', parent:'三角肌', lib:'front-deltoids', mev:6, mav:12, mrv:20 },
  '三角肌中束':           { cat:'shoulder', parent:'三角肌', lib:'back-deltoids',  mev:8, mav:16, mrv:26 },
  '三角肌后束':           { cat:'shoulder', parent:'三角肌', lib:'back-deltoids',  mev:8, mav:16, mrv:26 },
  '肩袖肌群':             { cat:'shoulder', parent:'肩袖',   lib:'back-deltoids',  mev:4, mav:8,  mrv:14 },
  // —— 手臂 ——
  '肱二头肌':             { cat:'arm', parent:'肱二头肌', lib:'biceps',  mev:8, mav:14, mrv:22 },
  '肱三头肌-长头':        { cat:'arm', parent:'肱三头肌', lib:'triceps', mev:4, mav:8,  mrv:14 },
  '肱三头肌-外侧+内侧头': { cat:'arm', parent:'肱三头肌', lib:'triceps', mev:6, mav:12, mrv:18 },
  '前臂':                 { cat:'arm', parent:'前臂',     lib:'forearm', mev:6, mav:12, mrv:20 },
  // —— 腰腹 ——
  '腹直肌':               { cat:'core', parent:'腹直肌', lib:'abs',      mev:6, mav:14, mrv:25 },
  '腹斜肌':               { cat:'core', parent:'腹斜肌', lib:'obliques', mev:6, mav:14, mrv:25 },
  '腹横肌':               { cat:'core', parent:'腹横肌', lib:'abs',      mev:4, mav:8,  mrv:12 },
  '髂腰肌（髋屈肌）':     { cat:'core', parent:'髋屈肌', lib:'quadriceps', mev:4, mav:8, mrv:14 },
  // —— 大腿前 ——
  '股四头肌-外侧+中间头': { cat:'thigh_front', parent:'股四头肌', lib:'quadriceps', mev:6, mav:12, mrv:18 },
  '股直肌':               { cat:'thigh_front', parent:'股四头肌', lib:'quadriceps', mev:4, mav:8,  mrv:14 },
  '股内侧肌-VMO':         { cat:'thigh_front', parent:'股四头肌', lib:'quadriceps', mev:4, mav:8,  mrv:14 },
  // —— 大腿后 ——
  '腘绳肌-股二头长头':    { cat:'thigh_back', parent:'腘绳肌', lib:'hamstring', mev:4, mav:8, mrv:14 },
  '腘绳肌-半腱+半膜':     { cat:'thigh_back', parent:'腘绳肌', lib:'hamstring', mev:4, mav:8, mrv:14 },
  // —— 臀 ——
  '臀大肌-上部':          { cat:'glute', parent:'臀大肌', lib:'gluteal', mev:4, mav:8,  mrv:14 },
  '臀大肌-下部':          { cat:'glute', parent:'臀大肌', lib:'gluteal', mev:4, mav:8,  mrv:14 },
  '臀中肌':               { cat:'glute', parent:'臀中肌', lib:'gluteal', mev:4, mav:8,  mrv:14 },
  // —— 髋 ——
  '内收肌群':             { cat:'hip', parent:'内收肌', lib:'adductor',  mev:6, mav:10, mrv:16 },
  '髋外展肌-TFL':         { cat:'hip', parent:'髋外展肌', lib:'abductors', mev:4, mav:8, mrv:14 },
  '髋深层旋转肌':         { cat:'hip', parent:'髋深层旋转肌', lib:'gluteal', mev:4, mav:8, mrv:12 },
  // —— 小腿 ——
  '腓肠肌':               { cat:'calf', parent:'小腿', lib:'calves', mev:6, mav:10, mrv:16 },
  '比目鱼肌':             { cat:'calf', parent:'小腿', lib:'calves', mev:6, mav:10, mrv:16 },
  '胫骨前肌':             { cat:'calf', parent:'胫骨前肌', lib:'calves', mev:4, mav:8, mrv:12 },
  '腓骨长短肌':           { cat:'calf', parent:'腓骨肌', lib:'calves', mev:4, mav:8, mrv:12 },
  // —— 颈（新增 v3）——
  '颈部肌群':             { cat:'neck', parent:'颈部肌群', lib:null, mev:4, mav:6, mrv:12 },
  // —— 胸（细分新增）——
  '胸小肌':               { cat:'chest', parent:'胸小肌', lib:'chest', mev:2, mav:4, mrv:8 },
  '前锯肌':               { cat:'chest', parent:'前锯肌', lib:'upper-back', mev:4, mav:8, mrv:12 },
  // —— 背（细分新增）——
  '大圆肌':               { cat:'back', parent:'大圆肌', lib:'upper-back', mev:6, mav:10, mrv:16 },
  // —— 手臂（细分新增）——
  '肱肌':                 { cat:'arm', parent:'肱肌', lib:'biceps', mev:6, mav:10, mrv:16 },
  '肱桡肌':               { cat:'arm', parent:'肱桡肌', lib:'forearm', mev:4, mav:8, mrv:14 },
  // —— 腰腹（细分新增）——
  '腰方肌':               { cat:'core', parent:'腰方肌', lib:'lower-back', mev:4, mav:8, mrv:12 },
  // —— 小腿（细分新增）——
  '胫骨后肌':             { cat:'calf', parent:'胫骨后肌', lib:'calves', mev:4, mav:6, mrv:10 }
};
const MUSCLE_GROUPS = Object.keys(MUSCLE_TARGETS);

// 父肌肉 → 子部位列表（手册用粗名"胸大肌"时，自动展开为子部位）
const PARENT_TO_SUBS = {};
MUSCLE_GROUPS.forEach(m => {
  const p = MUSCLE_TARGETS[m].parent;
  (PARENT_TO_SUBS[p] = PARENT_TO_SUBS[p] || []).push(m);
});

// ============================================================
// 3. 动作库 EXERCISE_DB —— 完整科学数据结构
// ------------------------------------------------------------
// 每个动作是一个完整对象，字段定义：
//   id          英文短标识（与动作手册 MOVES.id 一致）
//   cn / en     中 / 英文名（cn 同时作为本对象的 key）
//   family      动作模式族：squat/hinge/lunge/horizontal-press/vertical-press/
//               horizontal-pull/vertical-pull/elbow-flexion/elbow-extension/
//               trunk-flexion/anti-extension/anti-rotation/loaded-carry/
//               smr/mobility/stretch
//   variant     该族内的具体变式
//   category    训练分类（对应动作手册的 11 个分组）
//   equipment   器材：杠铃/哑铃/壶铃/绳索/器械/自重/泡沫轴/筋膜球
//   difficulty  动作难度 L1(入门)–L4(高阶)
//   loadType    负荷类型：load(外部负重) / load-bw(自重+负重) / reps(次数) /
//               time(秒) —— 决定「历史最大记录」用什么单位衡量
//   bwLevels    5 档水平阈值（含义随 loadType：load=负重/体重倍数，
//               reps=单组次数，time=秒数）
//   bwNote      bwLevels 的口径说明（可选）
//   repRange    建议工作区间（load/load-bw/reps→次；time→秒；carry→米/步）
//   fatigueCost 系统性疲劳成本（中等复合动作≈1.0，孤立≈0.5，恢复类≈0.1）
//               —— 用于「下一次训练计划」里控制单日总疲劳
//   suitableFor 适合的训练目标：hypertrophy / strength / endurance / health
//   contrib     肌肉贡献系数 { 肌肉:0–1.0 }
//               1.0=主肌；0.5–0.8=重要协同；0.2–0.4=次要协同
//               依据：EMG 研究 + 解剖学杠杆 + 业界共识（RP / Stronger By Science）
//   cues        技术要点
//   why         推荐理由
//   regressFrom 退阶来源（更简单的前置动作，null=已是入门）
//   progressTo  进阶方向（更难的下一步，null=已是顶阶）
//   pic         动作姿态图
//
// 动作 cn 名作为 key；变式动作名（如不同握法的深蹲）由 classifyExercise 关键词兜底。
// ============================================================
const EXERCISE_DB = {
  // ============ 力量动作（动作手册的 23 个）============
  '杠铃后蹲': {
    id:'back-squat', cn:'杠铃后蹲', en:'Back Squat',
    family:'squat', variant:'back', category:'下肢推',
    equipment:'杠铃', difficulty:'L3',
    loadType:'load', bwLevels:[0.5,1.0,1.5,2.0,2.5], repRange:[5,12],
    fatigueCost:1.4, suitableFor:['hypertrophy','strength'],
    contrib:{ '股四头肌-外侧+中间头':1.0,'股内侧肌-VMO':0.6,'股直肌':0.25,'臀大肌-下部':0.75,'臀大肌-上部':0.35,'腘绳肌-股二头长头':0.3,'内收肌群':0.4,'竖脊肌':0.5,'腹横肌':0.3 },
    cues:['站距与肩同宽或略宽，脚尖外展 10–30°','杠铃置于斜方肌中下部','吸气憋住，胸口顶起，髋膝同步下蹲','蹲到大腿至少与地面平行，膝盖与脚尖同向','起身时整体上升，骨盆与肩膀同步'],
    why:'下肢之王。一个动作给到股四头、臀大、竖脊肌强刺激；力线自然、可终身渐进。',
    regressFrom:'高脚杯深蹲', progressTo:'暂停杠铃后蹲',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/images/0.jpg'
  },
  '杠铃前蹲': {
    id:'front-squat', cn:'杠铃前蹲', en:'Front Squat',
    family:'squat', variant:'front', category:'下肢推',
    equipment:'杠铃', difficulty:'L3',
    loadType:'load', bwLevels:[0.4,0.8,1.2,1.6,2.0], repRange:[5,10],
    fatigueCost:1.2, suitableFor:['hypertrophy','strength'],
    contrib:{ '股四头肌-外侧+中间头':1.0,'股直肌':0.5,'股内侧肌-VMO':0.55,'臀大肌-下部':0.55,'竖脊肌':0.5,'腹横肌':0.4,'斜方肌-上部':0.2,'前锯肌':0.25},
    cues:['前架位（双手托杠/交叉抱杠），手肘高抬','保持躯干极度直立，避免上身前倾','蹲深至全幅度，下肢更平均分担','起立时核心紧绷防止躯干折叠'],
    why:'比后蹲更孤立股四头，强迫直立躯干，对核心和上背是免费奖励。膝关节相对友好。',
    regressFrom:'杠铃后蹲', progressTo:'暂停杠铃前蹲',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Front_Squat/images/0.jpg'
  },
  '保加利亚分腿蹲': {
    id:'bss', cn:'保加利亚分腿蹲', en:'Bulgarian Split Squat',
    family:'lunge', variant:'split-squat', category:'下肢推',
    equipment:'哑铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.15,0.3,0.5,0.7,0.9], bwNote:'单手哑铃重量 / 体重', repRange:[8,15],
    fatigueCost:1.0, suitableFor:['hypertrophy'],
    contrib:{ '股四头肌-外侧+中间头':1.0,'股内侧肌-VMO':0.55,'臀大肌-下部':0.7,'臀中肌':0.5,'髋深层旋转肌':0.4,'髋外展肌-TFL':0.3,'内收肌群':0.3 },
    cues:['后脚搭凳，前脚距凳约 60–80cm','躯干略前倾偏向前腿','前腿主导下蹲，膝盖跟随脚尖','推地起立，避免后腿借力'],
    why:'单侧训练之王。强制纠正左右失衡，对核心稳定也是绝佳刺激，腰友好。',
    regressFrom:'原地分腿蹲', progressTo:'后脚抬高+前脚垫高分腿蹲',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bulgarian_Split_Squat/images/0.jpg'
  },
  '行进弓步': {
    id:'walking-lunge', cn:'行进弓步', en:'Walking Lunge',
    family:'lunge', variant:'walking', category:'下肢推',
    equipment:'哑铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.1,0.25,0.4,0.6,0.8], bwNote:'单手哑铃重量 / 体重', repRange:[8,16],
    fatigueCost:1.0, suitableFor:['hypertrophy','endurance'],
    contrib:{ '股四头肌-外侧+中间头':0.9,'股内侧肌-VMO':0.5,'臀大肌-下部':0.8,'臀中肌':0.45,'腘绳肌-股二头长头':0.3,'髋深层旋转肌':0.35,'内收肌群':0.3 },
    cues:['迈出一步后下蹲，后膝轻触地或接近','前膝与前脚尖同向，不内扣','推前脚跟起身，紧接着迈出另一腿','上身保持中立，眼看正前方'],
    why:'同时训练下肢力量 + 单侧稳定 + 心肺，适合训练日末段做训练量收尾。',
    regressFrom:'原地箭步蹲', progressTo:'过顶负重行进弓步',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Walking_Lunges/images/0.jpg'
  },
  '罗马尼亚硬拉': {
    id:'rdl', cn:'罗马尼亚硬拉', en:'Romanian Deadlift',
    family:'hinge', variant:'rdl', category:'下肢拉',
    equipment:'杠铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.5,1.0,1.4,1.8,2.2], repRange:[6,12],
    fatigueCost:1.2, suitableFor:['hypertrophy','strength'],
    contrib:{ '腘绳肌-股二头长头':1.0,'腘绳肌-半腱+半膜':0.6,'臀大肌-下部':0.7,'臀大肌-上部':0.45,'竖脊肌':0.6,'前臂':0.4 },
    cues:['直腿不锁死，膝微屈','杠铃贴腿下行，髋部主动后推','感觉腘绳被拉到末端再起身','起身用髋伸而非腰伸'],
    why:'腘绳与臀大肌的"拉伸位增肌"首选；练好后传统硬拉、跑跳能力都提升。',
    regressFrom:'杠铃臀推', progressTo:'单腿罗马尼亚硬拉',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/images/0.jpg'
  },
  '杠铃臀推': {
    id:'hip-thrust', cn:'杠铃臀推', en:'Hip Thrust',
    family:'hinge', variant:'hip-thrust', category:'下肢拉',
    equipment:'杠铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.7,1.4,2.1,2.8,3.5], repRange:[6,15],
    fatigueCost:0.9, suitableFor:['hypertrophy'],
    contrib:{ '臀大肌-上部':1.0,'臀大肌-下部':0.9,'腘绳肌-股二头长头':0.5,'腹直肌':0.2 },
    cues:['肩胛上沿靠凳，脚后跟距臀部约一脚','推起到髋完全打开，骨盆稍后倾','顶端 1 秒臀部强收缩','下放控制，不让杠铃砸髋'],
    why:'臀大肌顶端收缩刺激最强的动作；对腰椎压力低，可加非常大的重量。',
    regressFrom:'臀桥', progressTo:'单腿杠铃臀推',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Glute_Bridge/images/0.jpg'
  },
  '传统硬拉': {
    id:'conv-deadlift', cn:'传统硬拉', en:'Conventional Deadlift',
    family:'hinge', variant:'conventional', category:'全身',
    equipment:'杠铃', difficulty:'L4',
    loadType:'load', bwLevels:[0.6,1.2,1.8,2.5,3.0], repRange:[3,8],
    fatigueCost:1.8, suitableFor:['strength'],
    // 背阔肌 0.4：EMG 显示硬拉中背阔高度激活，但属"等长贴杠/防杠前飘"，不过 ROM，故低于划船类
    contrib:{ '臀大肌-下部':0.85,'臀大肌-上部':0.4,'腘绳肌-股二头长头':0.8,'腘绳肌-半腱+半膜':0.4,'竖脊肌':0.85,'背阔肌':0.4,'斜方肌-上部':0.6,'斜方肌-中下部':0.5,'前臂':0.7,'股四头肌-外侧+中间头':0.4 },
    cues:['脚尖位于杠铃正下方，杠铃贴小腿','挺胸收腹，肩略前于杠铃','腿先发力把杠拉离地，过膝后髋打开','锁定时不过度后仰，杠铃可控放回起点'],
    why:'地表最强的"一个动作练到全身后链"。神经募集最高，张力管理终极考验。',
    regressFrom:'罗马尼亚硬拉', progressTo:'赤字硬拉',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/images/0.jpg'
  },
  '杠铃卧推': {
    id:'bench-press', cn:'杠铃卧推', en:'Barbell Bench Press',
    family:'horizontal-press', variant:'barbell', category:'上肢推',
    equipment:'杠铃', difficulty:'L3',
    loadType:'load', bwLevels:[0.4,0.8,1.2,1.6,2.0], repRange:[5,12],
    fatigueCost:1.0, suitableFor:['hypertrophy','strength'],
    contrib:{ '胸大肌-中下部':1.0,'胸大肌-上部':0.4,'三角肌前束':0.5,'肱三头肌-外侧+内侧头':0.6,'肱三头肌-长头':0.25,'胸小肌':0.25,'前锯肌':0.3},
    cues:['肩胛后收+下沉，胸口顶起','握距比肩稍宽，手腕中立','杠铃落到乳头上方，肘约 45–75°','推起时杠走轻微弧线回到肩正上方'],
    why:'胸大肌+三头+前束的金标准复合动作，可负重高、增量空间大。',
    regressFrom:'标准俯卧撑', progressTo:'暂停杠铃卧推',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/images/0.jpg'
  },
  '上斜哑铃卧推': {
    id:'incline-db', cn:'上斜哑铃卧推', en:'Incline Dumbbell Press',
    family:'horizontal-press', variant:'incline-db', category:'上肢推',
    equipment:'哑铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.15,0.3,0.45,0.6,0.75], bwNote:'单手哑铃重量 / 体重', repRange:[6,12],
    fatigueCost:0.8, suitableFor:['hypertrophy'],
    contrib:{ '胸大肌-上部':1.0,'胸大肌-中下部':0.5,'三角肌前束':0.7,'肱三头肌-外侧+内侧头':0.45,'胸小肌':0.25,'前锯肌':0.35},
    cues:['凳面 30°（更高会让前束抢过多）','哑铃下放到胸口外侧','推起时双哑铃略向中线靠拢','顶端不锁死，保持张力'],
    why:'弥补卧推对上胸刺激不足；哑铃 ROM 更大，对肩友好。',
    regressFrom:'上斜俯卧撑', progressTo:'上斜杠铃卧推',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/images/0.jpg'
  },
  '站姿杠铃推举': {
    id:'ohp', cn:'站姿杠铃推举', en:'Overhead Press',
    family:'vertical-press', variant:'barbell', category:'上肢推',
    equipment:'杠铃', difficulty:'L3',
    loadType:'load', bwLevels:[0.25,0.5,0.75,1.0,1.25], repRange:[5,10],
    fatigueCost:1.0, suitableFor:['hypertrophy','strength'],
    contrib:{ '三角肌前束':1.0,'三角肌中束':0.4,'肱三头肌-外侧+内侧头':0.6,'肱三头肌-长头':0.4,'斜方肌-上部':0.4,'腹直肌':0.3,'腹横肌':0.3,'前锯肌':0.45},
    cues:['杠铃位于锁骨上方，前臂垂直','臀部夹紧、核心收紧，避免腰部代偿','推起后头部前移，杠在肩正上方','下放控制至锁骨位'],
    why:'肩部必练。站姿强制全身张力，是核心稳定 + 上肢推力的双重检验。',
    regressFrom:'坐姿哑铃推举', progressTo:'借力推 / Push Press',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/images/0.jpg'
  },
  '双杠臂屈伸': {
    id:'dip', cn:'双杠臂屈伸', en:'Parallel Bar Dip',
    family:'vertical-press', variant:'dip', category:'上肢推',
    equipment:'自重', difficulty:'L2',
    loadType:'load-bw', bwLevels:[1.0,1.1,1.25,1.5,1.75], bwNote:'(自重+负重) / 体重', repRange:[6,15],
    fatigueCost:0.8, suitableFor:['hypertrophy'],
    contrib:{ '胸大肌-中下部':1.0,'肱三头肌-长头':0.7,'肱三头肌-外侧+内侧头':0.6,'三角肌前束':0.4,'前锯肌':0.4,'胸小肌':0.3},
    cues:['握距与肩同宽，肩胛下沉防耸肩','身体微前倾（练胸）或直立（练三头）','肘部弯到约 90° 或感觉胸下部拉伸','推起时不锁肘，保持张力'],
    why:'自重时代的"上半身硬拉"，胸下沿和三头的拉伸位刺激极强。',
    regressFrom:'凳上反屈伸', progressTo:'负重双杠臂屈伸',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/images/0.jpg'
  },
  '标准俯卧撑': {
    id:'pushup', cn:'标准俯卧撑', en:'Push-up',
    family:'horizontal-press', variant:'pushup', category:'上肢推',
    equipment:'自重', difficulty:'L1',
    loadType:'reps', bwLevels:[10,20,30,50,70], bwNote:'单组连续标准次数', repRange:[10,30],
    fatigueCost:0.5, suitableFor:['hypertrophy','endurance','health'],
    contrib:{ '胸大肌-中下部':0.9,'胸大肌-上部':0.35,'肱三头肌-外侧+内侧头':0.6,'三角肌前束':0.5,'腹直肌':0.3,'腹横肌':0.35,'前锯肌':0.55,'胸小肌':0.25},
    cues:['手位略宽于肩，手指张开','从头到脚一条线，腹臀同步收紧','胸下沉至距地 5cm 或贴地','推起时不耸肩'],
    why:'最便携的胸推动作，自带核心抗伸展训练。',
    regressFrom:'上斜俯卧撑', progressTo:'双杠臂屈伸',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/images/0.jpg'
  },
  '引体向上': {
    id:'pullup', cn:'引体向上', en:'Pull-up / Chin-up',
    family:'vertical-pull', variant:'pullup', category:'上肢拉',
    equipment:'自重', difficulty:'L3',
    loadType:'load-bw', bwLevels:[1.0,1.05,1.25,1.5,1.75], bwNote:'(自重+负重) / 体重', repRange:[4,12],
    fatigueCost:1.0, suitableFor:['hypertrophy','strength'],
    contrib:{ '背阔肌':1.0,'肱二头肌':0.7,'菱形肌':0.5,'斜方肌-中下部':0.4,'前臂':0.45,'大圆肌':0.65,'肱肌':0.55,'肱桡肌':0.4},
    cues:['正握（练背阔）或反握（二头参与更多）','起始悬挂，肩胛先下沉再启动','把胸往杠上拉，下颌过杠','下放控制，全幅度回到悬挂'],
    why:'上肢拉之王。背阔 + 二头同时刺激；自重起步、可加负重，渐进性极佳。',
    regressFrom:'高位下拉', progressTo:'负重引体向上',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/images/0.jpg'
  },
  '杠铃俯身划船': {
    id:'bb-row', cn:'杠铃俯身划船', en:'Barbell Row',
    family:'horizontal-pull', variant:'barbell', category:'上肢拉',
    equipment:'杠铃', difficulty:'L3',
    loadType:'load', bwLevels:[0.5,0.8,1.1,1.5,1.85], repRange:[6,12],
    fatigueCost:1.0, suitableFor:['hypertrophy','strength'],
    contrib:{ '背阔肌':1.0,'菱形肌':0.75,'斜方肌-中下部':0.6,'肱二头肌':0.55,'三角肌后束':0.45,'竖脊肌':0.4,'前臂':0.4,'大圆肌':0.55,'肱肌':0.5,'肱桡肌':0.4},
    cues:['髋铰链俯身至躯干接近 45°，背平','杠铃从膝下拉向下腹/肚脐','主动夹背，肘部沿身侧后拉','离心受控放下，不靠惯性'],
    why:'练厚背的核心动作，对中背与背阔覆盖完整。',
    regressFrom:'单臂哑铃划船', progressTo:'Pendlay 划船',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/images/0.jpg'
  },
  '单臂哑铃划船': {
    id:'db-row', cn:'单臂哑铃划船', en:'One-Arm Dumbbell Row',
    family:'horizontal-pull', variant:'db', category:'上肢拉',
    equipment:'哑铃', difficulty:'L1',
    loadType:'load', bwLevels:[0.2,0.35,0.5,0.7,0.9], bwNote:'单手哑铃重量 / 体重', repRange:[8,15],
    fatigueCost:0.7, suitableFor:['hypertrophy'],
    contrib:{ '背阔肌':1.0,'菱形肌':0.6,'斜方肌-中下部':0.5,'肱二头肌':0.55,'三角肌后束':0.4,'前臂':0.4,'大圆肌':0.55,'肱肌':0.5,'肱桡肌':0.4,'腰方肌':0.45},
    cues:['单膝单手撑凳，背部水平','哑铃从地面位拉到髋部外侧','顶端肩胛主动后缩，体感"背先动"','下放到完全拉伸再下一次'],
    why:'单侧训练 + 拉伸幅度更大，对左右失衡是最好的针对工具。',
    regressFrom:'坐姿绳索划船', progressTo:'杠铃俯身划船',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/images/0.jpg'
  },
  '高位下拉': {
    id:'lat-pulldown', cn:'高位下拉', en:'Lat Pulldown',
    family:'vertical-pull', variant:'pulldown', category:'上肢拉',
    equipment:'器械', difficulty:'L1',
    loadType:'load', bwLevels:[0.4,0.7,1.0,1.3,1.6], repRange:[8,15],
    fatigueCost:0.6, suitableFor:['hypertrophy'],
    // 斜方肌-中下部 0.25：下拉中下斜方参与肩胛下回旋/下沉，属次要协同（研究称激活"modest"）
    contrib:{ '背阔肌':1.0,'肱二头肌':0.5,'菱形肌':0.45,'斜方肌-中下部':0.25,'三角肌后束':0.3,'大圆肌':0.6,'肱肌':0.5,'肱桡肌':0.35},
    cues:['正握略宽于肩，胸口顶起略后仰','想象"把肘往腰拉"，杆下到锁骨上沿','顶端肩胛上沉伸展背阔','不靠后仰借力'],
    why:'引体的退阶/补充，便于做高质量增肌组数。',
    regressFrom:'直臂下拉', progressTo:'引体向上',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/images/0.jpg'
  },
  '面拉': {
    id:'face-pull', cn:'面拉', en:'Face Pull',
    family:'horizontal-pull', variant:'face-pull', category:'上肢拉',
    equipment:'绳索', difficulty:'L1',
    loadType:'load', bwLevels:[0.15,0.25,0.4,0.55,0.7], repRange:[12,20],
    fatigueCost:0.4, suitableFor:['hypertrophy','health'],
    contrib:{ '三角肌后束':1.0,'菱形肌':0.7,'肩袖肌群':0.6,'斜方肌-中下部':0.5 },
    cues:['高位绳索，双手反握或正握','绳索拉向额头/鼻梁高度','末端外旋肩，手心向后上','强收 1 秒再退回'],
    why:'对肩健康的保险动作。强化后束与外旋，降低卧推/推举的肩伤风险。',
    regressFrom:'弹力带面拉', progressTo:'顶峰外旋面拉',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/images/0.jpg'
  },
  '杠铃弯举': {
    id:'bb-curl', cn:'杠铃弯举', en:'Barbell Curl',
    family:'elbow-flexion', variant:'barbell', category:'手臂',
    equipment:'杠铃', difficulty:'L1',
    loadType:'load', bwLevels:[0.25,0.45,0.6,0.8,1.0], repRange:[8,15],
    fatigueCost:0.5, suitableFor:['hypertrophy'],
    contrib:{ '肱二头肌':1.0,'前臂':0.5,'肱肌':0.75,'肱桡肌':0.45},
    cues:['直立、肘贴体侧、手腕中立','肩不要前送，靠二头收缩起杆','顶端收紧 1 秒，下放控制','避免靠腰摆动借力'],
    why:'二头肌孤立首选。引体已练到二头，若想做形态化优化，需加它。',
    regressFrom:'哑铃弯举', progressTo:'21 响弯举',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/images/0.jpg'
  },
  '窄距卧推': {
    id:'cg-bench', cn:'窄距卧推', en:'Close-grip Bench Press',
    family:'elbow-extension', variant:'cg-bench', category:'手臂',
    equipment:'杠铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.35,0.7,1.05,1.4,1.7], repRange:[6,12],
    fatigueCost:0.8, suitableFor:['hypertrophy','strength'],
    contrib:{ '肱三头肌-外侧+内侧头':1.0,'肱三头肌-长头':0.5,'胸大肌-中下部':0.6,'三角肌前束':0.4,'前锯肌':0.25},
    cues:['握距比肩略窄，约一拳到一拳半','肘部贴近躯干（夹角约 30°）','杠铃落到胸骨下沿/上腹位置','推起时三头主导发力'],
    why:'用复合动作的方式刺激三头，比单关节能上更大重量。',
    regressFrom:'凳上臂屈伸', progressTo:'暂停窄距卧推',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/images/0.jpg'
  },
  '悬垂举腿': {
    id:'hanging-leg', cn:'悬垂举腿', en:'Hanging Leg Raise',
    family:'trunk-flexion', variant:'hanging', category:'核心',
    equipment:'自重', difficulty:'L2',
    loadType:'reps', bwLevels:[3,8,15,20,25], bwNote:'单组连续直腿次数', repRange:[8,20],
    fatigueCost:0.6, suitableFor:['hypertrophy'],
    contrib:{ '腹直肌':1.0,'髂腰肌（髋屈肌）':0.8,'腹斜肌':0.4,'前臂':0.4,'大圆肌':0.3},
    cues:['悬挂时肩胛主动下沉，避免肩部受力','骨盆后倾启动，膝/腿向胸口上抬','到顶端骨盆翻折感强','下放控制，不晃身体借力'],
    why:'腹直肌"骨盆后倾"模式训练，比卷腹更接近功能性，且顺带练抓握。',
    regressFrom:'屈膝悬垂举腿', progressTo:'悬垂举腿触杠',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/images/0.jpg'
  },
  '平板支撑': {
    id:'plank', cn:'平板支撑', en:'Plank',
    family:'anti-extension', variant:'plank', category:'核心',
    equipment:'自重', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单次保持秒数', repRange:[30,120],
    fatigueCost:0.3, suitableFor:['health'],
    // 三角肌前束 0.2：平板中前束确有 ~40% MVIC 激活，但作为核心专项，取次要协同下限
    contrib:{ '腹直肌':1.0,'腹横肌':0.9,'三角肌前束':0.2,'臀大肌-下部':0.2,'前锯肌':0.35,'腰方肌':0.3},
    cues:['前臂与肩同宽，肘在肩正下','骨盆中立、臀肌轻收','从头到脚一条线，避免塌腰塌肩','主动呼吸不憋气'],
    why:'抗伸展核心训练的基础。学会"用核心保护腰椎"是大重量动作的前置条件。',
    regressFrom:'跪姿平板支撑', progressTo:'负重平板支撑',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/images/0.jpg'
  },
  '帕罗夫推': {
    id:'pallof', cn:'帕罗夫推', en:'Pallof Press',
    family:'anti-rotation', variant:'pallof', category:'核心',
    equipment:'绳索', difficulty:'L1',
    loadType:'load', bwLevels:[0.1,0.2,0.3,0.4,0.5], repRange:[8,15],
    fatigueCost:0.3, suitableFor:['health'],
    contrib:{ '腹斜肌':1.0,'腹横肌':0.75,'腹直肌':0.4,'腰方肌':0.5},
    cues:['侧对绳索/弹力带，双手把把手推出胸前','推到伸直保持 2–3 秒不被拉转','回收控制，全程髋稳不动','左右各做'],
    why:'抗旋转训练代表。增强真正"功能性核心"，对所有单侧/不对称动作都加分。',
    regressFrom:'弹力带帕罗夫推', progressTo:'半跪姿帕罗夫推',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pallof_Press_With_Bands/images/0.jpg'
  },
  '农夫行走': {
    id:'farmer-walk', cn:'农夫行走', en:"Farmer's Walk",
    family:'loaded-carry', variant:'farmer', category:'核心',
    equipment:'哑铃', difficulty:'L1',
    loadType:'load', bwLevels:[0.3,0.6,0.9,1.2,1.5], bwNote:'单手重量 / 体重', repRange:[20,40],
    fatigueCost:0.7, suitableFor:['hypertrophy','health'],
    // 臀中肌 0.4：EMG 研究指农夫行走是臀中肌最佳刺激动作之一（控制骨盆侧倾）；
    // 股四 0.2：屈膝幅度小，腿部激活低于臀；腹斜肌 0.4：抗侧屈等长稳定
    contrib:{ '前臂':1.0,'斜方肌-上部':0.7,'腹横肌':0.6,'腹斜肌':0.4,'腹直肌':0.4,'臀中肌':0.4,'竖脊肌':0.4,'臀大肌-下部':0.3,'股四头肌-外侧+中间头':0.2,'腰方肌':0.4,'前锯肌':0.3},
    cues:['双手提同等重量哑铃/壶铃，肩沉胸挺','小步快走，保持躯干稳定不左右摇晃','握紧但保持自然呼吸','走指定距离或时间后放下'],
    why:'同时练握力、核心、上背、心肺。对老年期功能性力量保留极有价值。',
    regressFrom:'箱式提握', progressTo:'单侧农夫行走',
    pic:'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk_With_Dumbbells/images/0.jpg'
  },

  // ============ 活动度 / 恢复动作（动作手册的 12 个，contrib 偏低=非肌肥大刺激）============
  '泡沫轴股四头肌松解': {
    id:'foam-roll-quads', cn:'泡沫轴股四头肌松解', en:'Foam Roll Quads',
    family:'smr', variant:'foam-roll', category:'热身激活',
    equipment:'泡沫轴', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单侧停留秒数', repRange:[30,90],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '股四头肌-外侧+中间头':0.25,'股直肌':0.15,'股内侧肌-VMO':0.15 },
    cues:['俯身将泡沫轴置于大腿前侧','上身用前臂支撑，下肢压在泡沫轴上','慢速滚动 2-4cm/秒','在痛点停留 30-60 秒，配合深呼吸','每侧 60-90 秒'],
    why:'训练前用泡沫轴做主动松解，比静态拉伸更优。研究显示训练前静态拉伸会降低力量输出 15-30%（Simic 2013），泡沫轴+动态激活是更好的替代。',
    regressFrom:null, progressTo:'泡沫轴单腿加压股四头',
    pic:'images/foam-roll-quads.jpg'
  },
  '动态髋部画圈': {
    id:'dyn-hip-circles', cn:'动态髋部画圈', en:'Dynamic Hip Circles',
    family:'mobility', variant:'dynamic', category:'热身激活',
    equipment:'自重', difficulty:'L1',
    loadType:'reps', bwLevels:[10,20,30,50,80], bwNote:'单侧总次数', repRange:[10,20],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '臀中肌':0.4,'髋深层旋转肌':0.5,'髋外展肌-TFL':0.3,'内收肌群':0.3 },
    cues:['站姿，单腿离地','髋部带动膝盖画大圆','顺时针 10 次 + 逆时针 10 次','保持躯干稳定，幅度由小到大','左右各做'],
    why:'快速激活髋关节囊和周边稳定肌，比静态拉伸更适合训练前。"探索性"动作让神经系统准备好正式训练。',
    regressFrom:null, progressTo:'负重动态髋画圈',
    pic:'images/dyn-hip-circles.jpg'
  },
  '深蹲停留激活': {
    id:'squat-hold', cn:'深蹲停留激活', en:'Deep Squat Hold',
    family:'mobility', variant:'static-hold', category:'热身激活',
    equipment:'自重', difficulty:'L1',
    loadType:'time', bwLevels:[15,30,60,90,120], bwNote:'单次保持秒数', repRange:[30,60],
    fatigueCost:0.2, suitableFor:['health'],
    contrib:{ '股四头肌-外侧+中间头':0.4,'臀大肌-下部':0.4,'内收肌群':0.3,'腓肠肌':0.2 },
    cues:['脚掌完全着地（如脚跟踮起说明踝活动度不足）','髋关节降到最低位','双手胸前合十，肘部内顶膝盖','保持 30-60 秒，左右轻微摇摆','感受髋、踝、膝同步打开'],
    why:'同时检验和打开下肢三大关节的活动度。能在底部舒服停留 1 分钟，下肢活动度基本过关。',
    regressFrom:'扶撑深蹲停留', progressTo:'哥萨克深蹲',
    pic:'images/squat-hold.jpg'
  },
  '90/90 髋部旋转': {
    id:'hip-90-90', cn:'90/90 髋部旋转', en:'90/90 Hip Rotation',
    family:'mobility', variant:'hip-rotation', category:'髋部活动度',
    equipment:'自重', difficulty:'L1',
    loadType:'reps', bwLevels:[5,10,15,20,30], bwNote:'单侧切换次数', repRange:[8,12],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '髋深层旋转肌':0.6,'臀中肌':0.4,'内收肌群':0.3 },
    cues:['坐地，前腿弯 90° 外旋、后腿弯 90° 内旋','双手撑地或合掌前推','保持躯干端正，不歪斜','向另一侧翻转切换','每侧 10 次交替'],
    why:'同时训练髋外旋+内旋，是恢复"功能性髋活动度"的金标动作。久坐人群的髋关节几乎都缺这个能力。',
    regressFrom:null, progressTo:'90/90 抬髋离地',
    pic:'images/hip-90-90.jpg'
  },
  '沙发拉伸': {
    id:'couch-stretch', cn:'沙发拉伸', en:'Couch Stretch',
    family:'stretch', variant:'static', category:'髋部活动度',
    equipment:'自重', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单侧停留秒数', repRange:[60,120],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '髂腰肌（髋屈肌）':0.5,'股直肌':0.4 },
    cues:['后脚靠墙/沙发，膝盖触墙','前腿屈膝呈 90°','保持躯干直立（不要瘫坐前倾）','收紧臀部，感受髋前侧拉伸','每侧 2 分钟'],
    why:'专治"骨盆前倾 + 下背痛"。Kelly Starrett 推荐的最有效髋屈肌拉伸之一。久坐越严重，越要做。',
    regressFrom:'半跪姿髋屈肌拉伸', progressTo:null,
    pic:'images/couch-stretch.jpg'
  },
  '半跪姿髋屈肌拉伸': {
    id:'half-kneel-hip', cn:'半跪姿髋屈肌拉伸', en:'Half-Kneeling Hip Stretch',
    family:'stretch', variant:'static', category:'髋部活动度',
    equipment:'自重', difficulty:'L1',
    loadType:'time', bwLevels:[20,30,60,90,120], bwNote:'单侧单组秒数', repRange:[30,60],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '髂腰肌（髋屈肌）':0.5,'股直肌':0.3 },
    cues:['一腿屈膝跪地，另一腿前屈呈弓步','收腹收臀，骨盆后倾','重心缓慢前移，感受后腿髋前拉伸','保持躯干直立，不要塌腰','每侧 30 秒 × 3 组'],
    why:'沙发拉伸的退阶版本，无器材随地能做。是恢复髋伸展活动度的最基础动作。',
    regressFrom:null, progressTo:'沙发拉伸',
    pic:'images/half-kneel-hip.jpg'
  },
  '泡沫轴髂胫束松解': {
    id:'foam-roll-itband', cn:'泡沫轴髂胫束松解', en:'Foam Roll IT Band',
    family:'smr', variant:'foam-roll', category:'筋膜放松',
    equipment:'泡沫轴', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单侧停留秒数', repRange:[60,90],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '髋外展肌-TFL':0.3,'股四头肌-外侧+中间头':0.2 },
    cues:['侧卧，泡沫轴置于大腿外侧','下手支撑，控制压在轴上的体重','从髋部滚到膝盖上方','痛点停留呼吸 30 秒','每侧 60-90 秒'],
    why:'髂胫束（IT Band）紧张是跑步膝、髌骨疼痛的主因。慢速滚动+痛点呼吸比快速来回滚动有效得多（Cheatham 2015）。',
    regressFrom:null, progressTo:null,
    pic:'images/foam-roll-itband.jpg'
  },
  '泡沫轴胸椎放松': {
    id:'foam-roll-thoracic', cn:'泡沫轴胸椎放松', en:'Foam Roll Thoracic Spine',
    family:'smr', variant:'foam-roll', category:'筋膜放松',
    equipment:'泡沫轴', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单次总秒数', repRange:[60,90],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '菱形肌':0.3,'斜方肌-中下部':0.25,'胸小肌':0.25},
    cues:['仰卧，泡沫轴横置于上背（肩胛下方）','双手抱头，肘部并拢','慢速上下滚动，覆盖整段胸椎','在僵硬点停留呼吸，可加微小后仰','60-90 秒'],
    why:'久坐导致的"驼背 + 含胸"主因是胸椎僵硬。打开胸椎能直接改善卧推、推举、引体的力线。',
    regressFrom:null, progressTo:'泡沫轴胸椎 + 伸展',
    pic:'images/foam-roll-thoracic.jpg'
  },
  '筋膜球足底放松': {
    id:'ball-plantar', cn:'筋膜球足底放松', en:'Plantar Fascia Ball Release',
    family:'smr', variant:'ball', category:'筋膜放松',
    equipment:'筋膜球', difficulty:'L1',
    loadType:'time', bwLevels:[30,60,90,120,180], bwNote:'单侧停留秒数', repRange:[60,120],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '腓肠肌':0.2,'比目鱼肌':0.2,'胫骨前肌':0.15 },
    cues:['坐姿或站姿，脚踩筋膜球','前后滚动足底，多方向探索','痛点停留 10-15 秒','足弓和后跟前缘是重点区域','每侧 2 分钟'],
    why:'足底筋膜是全身张力网络的"起点"，松开它能间接改善腘绳肌紧张和下背痛（Schleip 2012）。',
    regressFrom:null, progressTo:null,
    pic:'images/ball-plantar.jpg'
  },
  '墙天使': {
    id:'wall-angels', cn:'墙天使', en:'Wall Angels',
    family:'mobility', variant:'wall', category:'日常维持',
    equipment:'自重', difficulty:'L1',
    loadType:'reps', bwLevels:[5,10,15,20,30], bwNote:'单组次数', repRange:[10,15],
    fatigueCost:0.2, suitableFor:['health'],
    contrib:{ '三角肌后束':0.45,'菱形肌':0.5,'斜方肌-中下部':0.45,'肩袖肌群':0.4,'前锯肌':0.35},
    cues:['背靠墙站立，后脑、上背、腰、臀同时贴墙','双臂呈 W 形（手肘弯曲贴墙）','缓慢向上滑动至 Y 形（手臂伸直）','手背全程不离墙','每组 10 次 × 3 组'],
    why:'对久坐人群的"圆肩驼背"是最直接的对抗动作。每天 1 组就能维持肩胛活动度和后链激活。',
    regressFrom:null, progressTo:'离墙天使',
    pic:'images/wall-angels.jpg'
  },
  '地面坐姿练习': {
    id:'floor-sitting', cn:'地面坐姿练习', en:'Floor Sitting Practice',
    family:'mobility', variant:'passive', category:'日常维持',
    equipment:'自重', difficulty:'L1',
    loadType:'time', bwLevels:[60,180,300,600,1200], bwNote:'单次保持秒数', repRange:[300,600],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '髋深层旋转肌':0.4,'内收肌群':0.3 },
    cues:['盘腿、单腿盘、跨坐、跪坐随机切换','每个姿势保持 5-10 分钟','感到不适就换一个姿势','把它替代你的久坐沙发时间','随时练习'],
    why:'人类原本应该花大量时间在地面坐姿——这本身就是对髋、踝活动度的最自然维持。Kelly Starrett 称之为"被动活动度"。',
    regressFrom:null, progressTo:null,
    pic:'images/floor-sitting.jpg'
  },
  '肩部绕环': {
    id:'shoulder-circles', cn:'肩部绕环', en:'Shoulder Circles',
    family:'mobility', variant:'dynamic', category:'日常维持',
    equipment:'自重', difficulty:'L1',
    loadType:'reps', bwLevels:[5,10,15,20,30], bwNote:'单组次数', repRange:[10,15],
    fatigueCost:0.1, suitableFor:['health'],
    contrib:{ '三角肌前束':0.3,'三角肌后束':0.3,'三角肌中束':0.3,'肩袖肌群':0.4 },
    cues:['双手宽握橡皮筋/PVC 棍/扫把','起始位双手在身前','缓慢向上举过头顶、绕到身后','再缓慢绕回身前','每组 10 次 × 3 组'],
    why:'肩关节囊全幅度激活的最简练习。每天做能显著降低肩袖损伤和"五十肩"风险。',
    regressFrom:'小幅度肩绕环', progressTo:'窄握肩绕环',
    pic:'images/shoulder-circles.jpg'
  },

  // ============ 平衡 / 移动类训练（私教课常见，不在动作手册）============
  '壶铃高低6步至平衡': {
    id:'kb-low-high-6', cn:'壶铃高低6步至平衡', en:'Kettlebell Low-High 6-Step to Balance',
    family:'loaded-carry', variant:'balance', category:'全身',
    equipment:'壶铃', difficulty:'L2',
    loadType:'load', bwLevels:[0.05,0.1,0.15,0.2,0.3], bwNote:'单只壶铃重量 / 体重', repRange:[4,8],
    fatigueCost:0.6, suitableFor:['health'],
    contrib:{ '臀中肌':0.4,'髋深层旋转肌':0.5,'股四头肌-外侧+中间头':0.3,'腹横肌':0.3 },
    cues:['单手持壶铃，重心在高位与低位之间交替过渡','每一步把重量稳住再迈下一步','走满 6 步后单腿/收势保持平衡 2–3 秒','全程核心收紧，骨盆不晃'],
    why:'负重移动 + 重心高低转换 + 末端平衡，综合训练髋稳定肌、深层核心与本体感觉，是功能性训练的整合动作。',
    regressFrom:'壶铃箱式提握', progressTo:'壶铃单腿平衡传递',
    pic:null
  },
  // ============ 补全孤立动作（id 用 supp- 前缀；动作手册不收录，仅用于计划与分析）============
  '提踵(站姿)': {
    id:'supp-calf-standing', cn:'提踵(站姿)', en:'Standing Calf Raise',
    family:'plantar-flex', variant:'standing', category:'下肢推',
    equipment:'哑铃 / 器械', difficulty:'L1',
    loadType:'load', bwLevels:[0,0.3,0.5,0.8,1.2], bwNote:'额外负重 / 体重', repRange:[12,20],
    fatigueCost:0.4, suitableFor:['hypertrophy','health'],
    contrib:{ '腓肠肌':1.0,'比目鱼肌':0.5,'胫骨后肌':0.3,'腓骨长短肌':0.3 },
    cues:['双脚与肩同宽 / 脚掌前 1/3 踩台阶','膝盖伸直但不锁死','尽量踮高，顶峰停 1 秒强收缩','缓慢下放至跟腱拉伸感'],
    why:'腓肠肌孤立训练。直立膝伸状态下腓肠肌主导（坐姿提踵更偏比目鱼）。计划里补全小腿训练缺口的最直接动作。',
    regressFrom:'坐姿提踵', progressTo:'单腿提踵', pic:null
  },
  '哑铃侧平举': {
    id:'supp-db-lateral-raise', cn:'哑铃侧平举', en:'Dumbbell Lateral Raise',
    family:'lateral-raise', variant:'standing', category:'上肢推',
    equipment:'哑铃', difficulty:'L1',
    loadType:'load', bwLevels:[0.05,0.1,0.15,0.2,0.3], bwNote:'单手哑铃 / 体重', repRange:[10,15],
    fatigueCost:0.4, suitableFor:['hypertrophy'],
    contrib:{ '三角肌中束':1.0,'斜方肌-上部':0.4,'三角肌后束':0.25 },
    cues:['哑铃自然垂于身侧，肘略屈不锁死','肘领先抬起，手腕略低于肘','抬到肩高（不必更高，防斜方代偿）','下放控制 2 秒'],
    why:'三角肌中束孤立训练 —— 站姿杠铃推举主要打前束，中束需要侧平举专门刺激，是肩"宽"的关键。',
    regressFrom:null, progressTo:'坐姿侧平举', pic:null
  },
  '蚌式': {
    id:'supp-clamshell', cn:'蚌式', en:'Clamshell',
    family:'hip-abduction', variant:'side-lying', category:'下肢拉',
    equipment:'弹力带 / 自重', difficulty:'L1',
    loadType:'reps', bwLevels:[10,15,20,25,30], bwNote:'单侧次数', repRange:[15,25],
    fatigueCost:0.2, suitableFor:['hypertrophy','health'],
    contrib:{ '臀中肌':1.0,'髋外展肌-TFL':0.7,'髋深层旋转肌':0.5,'臀大肌-上部':0.35 },
    cues:['侧卧，膝屈 ~45°，脚后跟并拢','髋部不旋转，保持骨盆中立','膝盖像蚌壳打开，臀外侧主动发力','顶峰夹紧 1 秒，缓慢回落'],
    why:'臀中肌孤立训练 —— 单腿稳定、骨盆控制、跑步膝预防都靠它。计划里补全髋外展缺口。',
    regressFrom:null, progressTo:'弹力带蚌式 / 侧抬腿', pic:null
  },
  '俯卧腿弯举': {
    id:'supp-leg-curl', cn:'俯卧腿弯举', en:'Lying Leg Curl',
    family:'knee-flex', variant:'prone', category:'下肢拉',
    equipment:'器械', difficulty:'L1',
    loadType:'load', bwLevels:[5,10,15,20,30], bwNote:'器械重量', repRange:[10,15],
    fatigueCost:0.4, suitableFor:['hypertrophy','health'],
    contrib:{ '腘绳肌-半腱+半膜':1.0, '腘绳肌-股二头长头':0.7, '腓肠肌':0.3 },
    cues:['俯卧器械，膝盖紧贴垫边外缘','脚踝勾住滚轴','膝主导收缩（不靠腰发力）','离心 2-3s 缓慢下放，避免膝过伸'],
    why:'腘绳肌的"屈膝"主导动作 —— RDL 主练长头（伸髋），半腱+半膜要靠俯卧腿弯举专门激活。计划里 W5+ 加入，修 Q/H 失衡。',
    regressFrom:null, progressTo:'北欧腘绳 / 单腿俯卧腿弯举', pic:null
  },
  '坐姿提踵': {
    id:'supp-calf-seated', cn:'坐姿提踵', en:'Seated Calf Raise',
    family:'plantar-flex', variant:'seated', category:'下肢推',
    equipment:'器械 / 杠铃压腿', difficulty:'L1',
    loadType:'load', bwLevels:[10,15,20,25,35], bwNote:'器械重量', repRange:[12,20],
    fatigueCost:0.3, suitableFor:['hypertrophy','health'],
    contrib:{ '比目鱼肌':1.0, '腓肠肌':0.4, '胫骨后肌':0.3 },
    cues:['坐姿，膝屈 90°（这是关键）','脚掌前 1/3 踩台阶','缓慢踮起到顶峰，停 1 秒','下放至跟腱有拉伸感'],
    why:'比目鱼肌孤立训练 —— 膝屈 90° 体位让腓肠肌处于被动短缩位、无法发力，比目鱼必须主导。站姿提踵练腓肠，坐姿练比目鱼，二者搭配补全小腿。计划里 W6+ 加入。',
    regressFrom:'站姿提踵', progressTo:'单腿坐姿提踵', pic:null
  }
};

// ============================================================
// 4. classifyExercise(name) — 动作 → 贡献系数映射
//    优先级：① EXERCISE_DB 精确匹配  ② 关键词规则兜底  ③ 返回空
//    返回 { contrib:{肌肉:系数}, primary:[], secondary:[] }
// ============================================================
function classifyExercise(name){
  // ① 精确匹配动作库（条目是完整对象，取其 contrib 字段）
  if (EXERCISE_DB[name] && EXERCISE_DB[name].contrib) {
    return finalize(Object.assign({}, EXERCISE_DB[name].contrib));
  }
  // ② 关键词规则（处理无穷多的变式动作名）
  const n = name, has = s => n.indexOf(s) >= 0;
  const isUni = /单|交替|侧弓步|分腿|后弓步|前弓步|侧弓/.test(n);
  const isStab = /平衡|稳定球|瑞士球|半球|软垫|抗旋|TRX/.test(n);
  const c = {};
  const add = map => { for (const m in map) c[m] = Math.min(1.0, (c[m]||0) + map[m]); };

  if (has('深蹲') || has('前蹲') || has('蹲跳') || has('宽距蹲') || (has('蹲') && !has('弓步') && !has('分腿') && !has('硬拉'))) {
    add({ '股四头肌-外侧+中间头':0.95,'股内侧肌-VMO':0.55,'股直肌':0.25,'臀大肌-下部':0.75,'臀大肌-上部':0.35,'腘绳肌-股二头长头':0.3,'内收肌群':0.4,'竖脊肌':0.5,'腹横肌':0.3 });
    if (has('前蹲')||has('前架')) add({ '股直肌':0.25 });
    if (has('宽距')) add({ '内收肌群':0.2 });
    if (isUni || has('保加利亚') || has('分腿')) add({ '臀中肌':0.4,'髋深层旋转肌':0.3,'髋外展肌-TFL':0.2 });
    if (isStab) add({ '髋深层旋转肌':0.3 });
    if (has('蹲跳')||has('跳')) add({ '腓肠肌':0.4 });
  }
  else if (has('弓步')||has('分腿蹲')||has('台阶')||has('上步')||has('交叉')) {
    add({ '股四头肌-外侧+中间头':0.9,'股内侧肌-VMO':0.5,'臀大肌-下部':0.8,'腘绳肌-股二头长头':0.3,'内收肌群':0.3,'腹直肌':0.2 });
    if (isUni) add({ '臀中肌':0.45,'髋深层旋转肌':0.35,'髋外展肌-TFL':0.25 });
    if (has('侧弓')) add({ '内收肌群':0.3 });
  }
  else if (has('罗马尼亚')||has('直腿硬拉')) {
    add({ '腘绳肌-股二头长头':1.0,'腘绳肌-半腱+半膜':0.6,'臀大肌-下部':0.7,'臀大肌-上部':0.45,'竖脊肌':0.6,'前臂':0.4 });
    if (isUni) add({ '臀中肌':0.4,'髋深层旋转肌':0.3,'腹横肌':0.3 });
  }
  else if (has('硬拉')) {
    add({ '臀大肌-下部':0.85,'臀大肌-上部':0.4,'腘绳肌-股二头长头':0.8,'腘绳肌-半腱+半膜':0.4,'竖脊肌':0.85,'背阔肌':0.4,'斜方肌-上部':0.6,'斜方肌-中下部':0.5,'前臂':0.7,'股四头肌-外侧+中间头':0.4 });
  }
  else if (has('臀推')||has('臀桥')) {
    add({ '臀大肌-上部':1.0,'臀大肌-下部':0.9,'腘绳肌-股二头长头':0.5,'腹直肌':0.2 });
    if (isUni) add({ '臀中肌':0.4,'髋深层旋转肌':0.3 });
  }
  else if (has('腿弯举')) add({ '腘绳肌-半腱+半膜':1.0,'腘绳肌-股二头长头':0.7 });
  else if (has('腿外展')||has('外展')) add({ '臀中肌':1.0,'髋外展肌-TFL':0.7,'臀大肌-上部':0.4 });
  else if (has('腿内收')||has('内收')) add({ '内收肌群':1.0 });
  else if (has('提踵')) { has('坐姿') ? add({ '比目鱼肌':1.0,'腓肠肌':0.3 }) : add({ '腓肠肌':1.0,'比目鱼肌':0.5 }); }
  else if (has('髋屈')||has('沙发拉伸')||has('半跪姿髋')) add({ '髂腰肌（髋屈肌）':0.5,'股直肌':0.3 });
  else if (has('侧卧')&&(has('抬高')||has('直腿')||has('蚌'))) add({ '臀中肌':1.0,'髋外展肌-TFL':0.7,'髋深层旋转肌':0.5 });
  // 胸
  else if (has('卧推')) {
    if (has('窄距')) add({ '肱三头肌-外侧+内侧头':1.0,'肱三头肌-长头':0.5,'胸大肌-中下部':0.6,'三角肌前束':0.4 });
    else if (has('上斜')) add({ '胸大肌-上部':1.0,'胸大肌-中下部':0.5,'三角肌前束':0.7,'肱三头肌-外侧+内侧头':0.5 });
    else if (has('下斜')) add({ '胸大肌-中下部':1.0,'三角肌前束':0.4,'肱三头肌-外侧+内侧头':0.5 });
    else add({ '胸大肌-中下部':1.0,'胸大肌-上部':0.4,'三角肌前束':0.5,'肱三头肌-外侧+内侧头':0.55 });
  }
  else if (has('推胸') || has('胸推')) {
    if (has('向上')||has('上斜')) add({ '胸大肌-上部':1.0,'三角肌前束':0.5,'肱三头肌-外侧+内侧头':0.4 });
    else if (has('向下')||has('下斜')) add({ '胸大肌-中下部':1.0,'三角肌前束':0.35,'肱三头肌-外侧+内侧头':0.4 });
    else add({ '胸大肌-中下部':1.0,'胸大肌-上部':0.45,'三角肌前束':0.4,'肱三头肌-外侧+内侧头':0.4 });
  }
  else if (has('夹胸')||has('飞鸟')) {
    if (has('上斜')) add({ '胸大肌-上部':1.0,'三角肌前束':0.3 });
    else if (has('下斜')) add({ '胸大肌-中下部':1.0,'三角肌前束':0.3 });
    else add({ '胸大肌-中下部':1.0,'胸大肌-上部':0.45,'三角肌前束':0.3 });
  }
  else if (has('俯卧撑')) add({ '胸大肌-中下部':0.9,'胸大肌-上部':0.35,'肱三头肌-外侧+内侧头':0.6,'三角肌前束':0.5,'腹直肌':0.3,'腹横肌':0.35,'前锯肌':0.55,'胸小肌':0.25 });
  else if (has('臂屈伸')&&has('双杠')) add({ '胸大肌-中下部':1.0,'肱三头肌-长头':0.7,'肱三头肌-外侧+内侧头':0.6,'三角肌前束':0.4 });
  // 肩
  else if (has('推举')) add({ '三角肌前束':1.0,'三角肌中束':0.35,'肱三头肌-外侧+内侧头':0.6,'肱三头肌-长头':0.4,'斜方肌-上部':0.4,'腹直肌':0.25,'前锯肌':0.45 });
  else if (has('前平举')||has('过顶前')) add({ '三角肌前束':1.0 });
  else if (has('侧平举')||has('侧举')) add({ '三角肌中束':1.0,'斜方肌-上部':0.4 });
  else if (has('直立划船')) add({ '三角肌中束':1.0,'斜方肌-上部':0.7,'肱二头肌':0.4 });
  else if (has('W字举')||has('Y字举')) add({ '三角肌后束':1.0,'斜方肌-中下部':0.6,'菱形肌':0.5 });
  else if (has('肩袖')||has('外旋')||has('内旋')) add({ '肩袖肌群':1.0,'三角肌后束':0.4 });
  else if (has('X拉')) add({ '三角肌后束':0.9,'腹斜肌':0.6,'菱形肌':0.4 });
  else if (has('风车')) add({ '腹斜肌':1.0,'三角肌中束':0.5 });
  else if (has('绕环')) add({ '三角肌前束':0.4,'三角肌后束':0.4,'三角肌中束':0.4,'肩袖肌群':0.4 });
  // 背
  else if (has('引体')) add({ '背阔肌':1.0,'肱二头肌':0.7,'菱形肌':0.5,'前臂':0.45,'斜方肌-中下部':0.4,'大圆肌':0.65,'肱肌':0.55,'肱桡肌':0.4 });
  else if (has('高位下拉')||has('下拉')) add({ '背阔肌':1.0,'肱二头肌':0.5,'菱形肌':0.45,'斜方肌-中下部':0.25,'三角肌后束':0.3,'大圆肌':0.6,'肱肌':0.5,'肱桡肌':0.35 });
  else if (has('划船')||has('反向划船')) { add({ '背阔肌':1.0,'菱形肌':0.7,'斜方肌-中下部':0.6,'肱二头肌':0.55,'三角肌后束':0.45,'前臂':0.4,'竖脊肌':0.3,'大圆肌':0.55,'肱肌':0.5,'肱桡肌':0.4 }); if (/单|单侧|单臂/.test(n)) add({ '腰方肌':0.45 }); }
  else if (has('上拉')) add({ '背阔肌':1.0,'肱二头肌':0.4 });
  else if (has('耸肩')) add({ '斜方肌-上部':1.0,'前臂':0.4 });
  // 手臂
  else if (has('弯举')) { add({ '肱二头肌':1.0,'前臂':0.5,'肱肌':0.75,'肱桡肌':0.45 }); if (has('锤式')||has('对握')) add({ '肱桡肌':0.35 }); }
  else if (has('过顶')&&(has('三头')||has('伸展')||has('屈伸'))) add({ '肱三头肌-长头':1.0,'肱三头肌-外侧+内侧头':0.5 });
  else if (has('直臂下压')||has('下压')) add({ '肱三头肌-外侧+内侧头':1.0,'肱三头肌-长头':0.3 });
  // 核心
  else if (has('平板')||has('支撑')) add({ '腹直肌':1.0,'腹横肌':0.9,'三角肌前束':0.2,'臀大肌-下部':0.2,'前锯肌':0.35,'腰方肌':0.3 });
  else if (has('卷腹')||has('举腿')||has('抬腿')) {
    add({ '腹直肌':1.0,'腹斜肌':0.4 });
    if (has('举腿')||has('抬腿')) add({ '髂腰肌（髋屈肌）':0.6 });
  }
  else if (has('扭转')||has('体侧屈')) add({ '腹斜肌':1.0,'腹横肌':0.4 });
  else if (has('抗旋')||has('抗伸')) add({ '腹斜肌':1.0,'腹横肌':0.7,'腹直肌':0.4,'腰方肌':0.5 });
  else if (has('鸟狗')) add({ '背阔肌':0.7,'腹横肌':0.8,'臀大肌-下部':0.5,'三角肌后束':0.3 });
  // 跨类
  else if (has('农夫')||has('行走')) add({ '前臂':1.0,'斜方肌-上部':0.7,'腹横肌':0.6,'腹斜肌':0.4,'腹直肌':0.4,'臀中肌':0.4,'竖脊肌':0.4,'臀大肌-下部':0.3,'股四头肌-外侧+中间头':0.2,'腰方肌':0.4,'前锯肌':0.3 });
  // SMR / 拉伸 / 松解 — 默认低系数恢复类
  else if (has('SMR')||has('泡沫轴')||has('筋膜')||has('拉伸')||has('松解')) {
    // 尽量从名字里抓肌肉关键词
    if (has('股四')||has('大腿前')) add({ '股四头肌-外侧+中间头':0.25 });
    if (has('腘绳')||has('股后')) add({ '腘绳肌-股二头长头':0.25 });
    if (has('髂胫')) add({ '髋外展肌-TFL':0.25 });
    if (has('胸椎')||has('背')) add({ '菱形肌':0.25,'斜方肌-中下部':0.2 });
    if (has('髋')) add({ '髋深层旋转肌':0.3,'髂腰肌（髋屈肌）':0.25 });
  }

  return finalize(c);
}

// 把贡献系数映射补全 primary/secondary 衍生字段
function finalize(contrib){
  const primary = [], secondary = [];
  for (const m in contrib){
    if (contrib[m] >= 0.7) primary.push(m);
    else if (contrib[m] >= 0.2) secondary.push(m);
  }
  return { contrib, primary, secondary };
}

// ============================================================
// 5. 训练目标参数
// ============================================================
const GOAL_PROFILE = {
  hypertrophy: { mult:1.0, reps:[6,12],  pct:[65,85],  rir:[1,3], desc:'增肌 · 6–12 次 / 65–85% 1RM · RIR 1–3 · 周组数 12–20/肌群（Schoenfeld 2017）' },
  strength:    { mult:0.6, reps:[1,5],   pct:[85,100], rir:[1,3], desc:'力量 · 1–5 次 / 85–100% 1RM · RIR 1–3 · 周组数 8–12/肌群（Helms 2018）' },
  endurance:   { mult:1.2, reps:[15,30], pct:[30,60],  rir:[1,3], desc:'耐力 · 15–30 次 / 30–60% 1RM · 周组数略多于增肌（Schoenfeld 2017）' },
  health:      { mult:0.5, reps:[8,15],  pct:[50,70],  rir:[3,5], desc:'健康维持 · 8–15 次 / 50–70% 1RM · RIR 3–5 · 周组数 5–10/肌群（ACSM 指南）' }
};
function targetsFor(goal){
  const m = (GOAL_PROFILE[goal] || GOAL_PROFILE.hypertrophy).mult;
  const adj = {};
  for (const k in MUSCLE_TARGETS){
    const t = MUSCLE_TARGETS[k];
    adj[k] = { mev:Math.round(t.mev*m), mav:Math.round(t.mav*m), mrv:Math.round(t.mrv*m) };
  }
  return adj;
}

// ============================================================
// 6. 通用计算
// ============================================================
function estimate1RM(w, r){ return (!w||!r||w<=0||r<=0) ? 0 : w * (1 + 0.0333 * r); }
// RIR 系数（有效组权重）
function rirFactor(rir){
  if (rir == null) return 0.85;
  if (rir <= 2) return 1.00;
  if (rir <= 3) return 0.90;
  if (rir <= 4) return 0.70;
  if (rir <= 5) return 0.50;
  return 0.30;
}

// ============================================================
// 导出（同时支持 <script src> 全局 和 模块化引用）
// ============================================================
const TrainingDB = {
  MUSCLE_CATEGORIES, MUSCLE_TARGETS, MUSCLE_GROUPS, PARENT_TO_SUBS,
  EXERCISE_DB, classifyExercise, finalize,
  GOAL_PROFILE, targetsFor,
  estimate1RM, rirFactor
};
global.TrainingDB = TrainingDB;
// 同时把核心函数/常量挂到全局，方便现有代码直接用
global.MUSCLE_CATEGORIES = MUSCLE_CATEGORIES;
global.MUSCLE_TARGETS = MUSCLE_TARGETS;
global.MUSCLE_GROUPS = MUSCLE_GROUPS;
global.EXERCISE_DB = EXERCISE_DB;
global.classifyExercise = classifyExercise;
global.GOAL_PROFILE = GOAL_PROFILE;
global.targetsFor = targetsFor;
global.estimate1RM = estimate1RM;
global.rirFactor = rirFactor;
if (typeof module !== 'undefined' && module.exports) module.exports = TrainingDB;

})(typeof window !== 'undefined' ? window : globalThis);

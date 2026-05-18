/* ============================================================
 * FitLab 产品知识库
 *  - EXERCISES        动作池（22 个核心动作）
 *  - SPLITS           课型模板（4 种分化结构）
 *  - MESOCYCLES       周期阶段处方矩阵
 *  - STARTING_LOADS   起步重量参考（粗范围 + RIR 校准）
 *
 * 全部数据基于公开训练学文献：
 *   Schoenfeld B. (2016) - 频率元分析
 *   Israetel M. - Scientific Principles of Hypertrophy Training
 *   Helms E. - Muscle and Strength Pyramid
 *   StrengthLevel.com / Stronger By Science - 1RM 统计数据
 * ============================================================ */

/* ---------- 动作池 ---------- */
const EXERCISES = {
  /* === SQUAT（蹲）=== */
  'barbell-back-squat': {
    name: '杠铃后蹲',
    pattern: 'squat',
    primary: ['quadriceps', 'glutes'],
    synergist: ['hamstrings', 'erector', 'adductors'],
    equipment: ['barbell', 'rack'],
    difficulty: 3,
    is_compound: true,
    avoid_if: ['knee-acute', 'lower-back-acute'],
    substitutes: ['dumbbell-goblet-squat', 'leg-press'],
  },
  'dumbbell-goblet-squat': {
    name: '哑铃高脚杯深蹲',
    pattern: 'squat',
    primary: ['quadriceps', 'glutes'],
    synergist: ['core', 'upper-back'],
    equipment: ['dumbbell'],
    difficulty: 2,
    is_compound: true,
    avoid_if: ['knee-acute'],
    substitutes: ['leg-press', 'bodyweight-squat'],
  },
  'leg-press': {
    name: '腿举（机器）',
    pattern: 'squat',
    primary: ['quadriceps', 'glutes'],
    synergist: ['hamstrings'],
    equipment: ['machine'],
    difficulty: 1,
    is_compound: true,
    avoid_if: [],
    substitutes: ['dumbbell-goblet-squat'],
  },
  'dumbbell-lunge': {
    name: '哑铃行进弓步',
    pattern: 'lunge',
    primary: ['quadriceps', 'glutes'],
    synergist: ['hamstrings', 'core', 'glute-med'],
    equipment: ['dumbbell'],
    difficulty: 2,
    is_compound: true,
    avoid_if: ['knee-acute'],
    substitutes: ['bulgarian-split-squat', 'reverse-lunge'],
  },

  /* === HINGE（铰链）=== */
  'barbell-rdl': {
    name: '罗马尼亚硬拉（杠铃）',
    pattern: 'hinge',
    primary: ['hamstrings', 'glutes'],
    synergist: ['erector', 'upper-back'],
    equipment: ['barbell'],
    difficulty: 3,
    is_compound: true,
    avoid_if: ['lower-back-acute'],
    substitutes: ['dumbbell-rdl', 'cable-pull-through'],
  },
  'barbell-hip-thrust': {
    name: '杠铃臀推',
    pattern: 'hinge',
    primary: ['glutes'],
    synergist: ['hamstrings'],
    equipment: ['barbell', 'bench'],
    difficulty: 2,
    is_compound: true,
    avoid_if: [],
    substitutes: ['glute-bridge', 'single-leg-hip-thrust'],
  },
  'lying-leg-curl': {
    name: '俯卧腿弯举（机器）',
    pattern: 'isolation',
    primary: ['hamstrings'],
    synergist: [],
    equipment: ['machine'],
    difficulty: 1,
    is_compound: false,
    avoid_if: [],
    substitutes: ['nordic-curl', 'stability-ball-hamstring-curl'],
  },

  /* === HORIZONTAL PUSH（水平推）=== */
  'barbell-bench-press': {
    name: '杠铃卧推',
    pattern: 'h-push',
    primary: ['chest', 'delt-front'],
    synergist: ['triceps'],
    equipment: ['barbell', 'bench', 'rack'],
    difficulty: 3,
    is_compound: true,
    avoid_if: ['shoulder-acute', 'elbow-acute'],
    substitutes: ['dumbbell-bench-press', 'push-up'],
  },
  'incline-dumbbell-press': {
    name: '上斜哑铃推',
    pattern: 'h-push',
    primary: ['chest-upper', 'delt-front'],
    synergist: ['triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 2,
    is_compound: true,
    avoid_if: ['shoulder-acute'],
    substitutes: ['incline-barbell-press', 'incline-push-up'],
  },
  'push-up': {
    name: '俯卧撑',
    pattern: 'h-push',
    primary: ['chest', 'delt-front'],
    synergist: ['triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 1,
    is_compound: true,
    avoid_if: ['wrist-acute', 'shoulder-acute'],
    substitutes: ['knee-push-up', 'incline-push-up'],
  },

  /* === VERTICAL PUSH（垂直推）=== */
  'barbell-overhead-press': {
    name: '杠铃站姿推举',
    pattern: 'v-push',
    primary: ['delt-front', 'delt-mid'],
    synergist: ['triceps', 'upper-chest', 'core'],
    equipment: ['barbell'],
    difficulty: 3,
    is_compound: true,
    avoid_if: ['shoulder-acute', 'lower-back-acute'],
    substitutes: ['dumbbell-shoulder-press'],
  },
  'dumbbell-shoulder-press': {
    name: '坐姿哑铃推举',
    pattern: 'v-push',
    primary: ['delt-front', 'delt-mid'],
    synergist: ['triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 2,
    is_compound: true,
    avoid_if: ['shoulder-acute'],
    substitutes: ['machine-shoulder-press'],
  },

  /* === HORIZONTAL PULL（水平拉）=== */
  'barbell-row': {
    name: '杠铃俯身划船',
    pattern: 'h-pull',
    primary: ['back-lat', 'back-rhomboid'],
    synergist: ['biceps', 'delt-rear', 'erector'],
    equipment: ['barbell'],
    difficulty: 3,
    is_compound: true,
    avoid_if: ['lower-back-acute'],
    substitutes: ['dumbbell-row', 'seated-cable-row'],
  },
  'dumbbell-row': {
    name: '单臂哑铃划船',
    pattern: 'h-pull',
    primary: ['back-lat', 'back-rhomboid'],
    synergist: ['biceps', 'delt-rear'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 2,
    is_compound: true,
    avoid_if: [],
    substitutes: ['seated-cable-row'],
  },
  'seated-cable-row': {
    name: '坐姿绳索划船',
    pattern: 'h-pull',
    primary: ['back-lat', 'back-rhomboid'],
    synergist: ['biceps', 'delt-rear'],
    equipment: ['cable', 'machine'],
    difficulty: 1,
    is_compound: true,
    avoid_if: [],
    substitutes: ['dumbbell-row'],
  },

  /* === VERTICAL PULL（垂直拉）=== */
  'pull-up': {
    name: '引体向上',
    pattern: 'v-pull',
    primary: ['back-lat'],
    synergist: ['biceps', 'back-rhomboid', 'core'],
    equipment: ['pull-up-bar'],
    difficulty: 4,
    is_compound: true,
    avoid_if: ['shoulder-acute', 'elbow-acute'],
    substitutes: ['assisted-pull-up', 'lat-pulldown'],
  },
  'lat-pulldown': {
    name: '高位下拉',
    pattern: 'v-pull',
    primary: ['back-lat'],
    synergist: ['biceps', 'back-rhomboid'],
    equipment: ['cable', 'machine'],
    difficulty: 1,
    is_compound: true,
    avoid_if: [],
    substitutes: ['pull-up'],
  },

  /* === ISOLATION（孤立动作）=== */
  'dumbbell-bicep-curl': {
    name: '哑铃弯举',
    pattern: 'isolation',
    primary: ['biceps'],
    synergist: ['forearms'],
    equipment: ['dumbbell'],
    difficulty: 1,
    is_compound: false,
    avoid_if: ['elbow-acute'],
    substitutes: ['ez-bar-curl', 'cable-curl'],
  },
  'tricep-pushdown': {
    name: '绳索三头下压',
    pattern: 'isolation',
    primary: ['triceps'],
    synergist: [],
    equipment: ['cable'],
    difficulty: 1,
    is_compound: false,
    avoid_if: ['elbow-acute'],
    substitutes: ['dumbbell-tricep-extension'],
  },
  'face-pull': {
    name: '面拉（绳索）',
    pattern: 'isolation',
    primary: ['delt-rear', 'back-rhomboid'],
    synergist: ['rotator-cuff'],
    equipment: ['cable'],
    difficulty: 1,
    is_compound: false,
    avoid_if: [],
    substitutes: ['reverse-fly'],
  },
  'standing-calf-raise': {
    name: '站姿提踵',
    pattern: 'isolation',
    primary: ['calves'],
    synergist: [],
    equipment: ['dumbbell', 'machine'],
    difficulty: 1,
    is_compound: false,
    avoid_if: [],
    substitutes: ['seated-calf-raise'],
  },

  /* === CORE（核心）=== */
  'plank': {
    name: '平板支撑',
    pattern: 'core',
    primary: ['abs', 'obliques'],
    synergist: ['glutes', 'erector'],
    equipment: ['bodyweight'],
    difficulty: 1,
    is_compound: false,
    avoid_if: ['shoulder-acute'],
    substitutes: ['dead-bug'],
  },
  'hanging-knee-raise': {
    name: '悬垂举腿',
    pattern: 'core',
    primary: ['abs'],
    synergist: ['hip-flexors', 'forearms'],
    equipment: ['pull-up-bar'],
    difficulty: 3,
    is_compound: false,
    avoid_if: ['shoulder-acute', 'wrist-acute'],
    substitutes: ['lying-leg-raise'],
  },
  'pallof-press': {
    name: '帕罗夫推（抗旋转）',
    pattern: 'core',
    primary: ['obliques', 'abs'],
    synergist: [],
    equipment: ['cable'],
    difficulty: 2,
    is_compound: false,
    avoid_if: [],
    substitutes: ['dead-bug'],
  },
};

/* ---------- 课型分化模板 ----------
 * 每种分化定义：每周几次、有几个 session、每个 session 的肌群覆盖目标
 * 引擎根据这个模板从动作池里挑动作填进去
 */
const SPLITS = {
  'full-body-2day': {
    name: '全身训练 · 2 次/周',
    sessions_per_week: 2,
    rationale: '低频次的最佳选择。每次覆盖全身主要动作模式，每肌群每周被刺激 2 次（达到 Schoenfeld 2016 的频率下限）。',
    sessions: [
      {
        id: 'A', name: '全身 A',
        focus: '蹲 + 推 + 拉',
        slots: [
          { role: 'main-lower', patterns: ['squat'], min: 1 },
          { role: 'main-h-push', patterns: ['h-push'], min: 1 },
          { role: 'main-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'accessory-hinge', patterns: ['hinge'], min: 1 },
          { role: 'accessory-isolation', patterns: ['isolation'], min: 1, muscle_hint: ['arms', 'shoulders'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
      {
        id: 'B', name: '全身 B',
        focus: '铰链 + 推 + 拉',
        slots: [
          { role: 'main-hinge', patterns: ['hinge'], min: 1 },
          { role: 'main-v-push', patterns: ['v-push'], min: 1 },
          { role: 'main-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'accessory-squat', patterns: ['squat', 'lunge'], min: 1 },
          { role: 'accessory-isolation', patterns: ['isolation'], min: 1, muscle_hint: ['arms', 'shoulders'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
    ],
  },

  'abc-3day': {
    name: 'ABC 三课型轮换 · 3 次/周',
    sessions_per_week: 3,
    rationale: '中级增肌的经典分化。每周三天分别侧重下肢+拉、上肢推拉、全身均衡 — 每块主要肌群每周被有效刺激 ≥2 次，符合 Schoenfeld 2016 元分析。',
    sessions: [
      {
        id: 'A', name: '下肢 + 拉 + 核心',
        focus: '股四头肌 · 臀大肌 · 腘绳肌 · 背阔肌 · 核心',
        slots: [
          { role: 'main-squat', patterns: ['squat'], min: 1 },
          { role: 'main-hinge', patterns: ['hinge'], min: 1 },
          { role: 'main-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'accessory-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'isolation-arms', patterns: ['isolation'], min: 1, muscle_hint: ['biceps'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
      {
        id: 'B', name: '上肢（推 + 拉）',
        focus: '胸大肌 · 背阔肌 · 三角肌 · 手臂',
        slots: [
          { role: 'main-h-push', patterns: ['h-push'], min: 1 },
          { role: 'main-v-push', patterns: ['v-push'], min: 1 },
          { role: 'accessory-h-push', patterns: ['h-push'], min: 1 },
          { role: 'accessory-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'isolation-arms', patterns: ['isolation'], min: 1, muscle_hint: ['triceps'] },
          { role: 'isolation-arms', patterns: ['isolation'], min: 1, muscle_hint: ['biceps'] },
        ],
      },
      {
        id: 'C', name: '全身均衡（补缺口）',
        focus: '臀中 · 三角肌后束 · 小腿 · 单侧稳定 · 核心',
        slots: [
          { role: 'main-lunge', patterns: ['lunge', 'squat'], min: 1 },
          { role: 'accessory-hinge', patterns: ['hinge'], min: 1 },
          { role: 'accessory-v-push', patterns: ['v-push'], min: 1 },
          { role: 'isolation-rear-delt', patterns: ['isolation'], min: 1, muscle_hint: ['delt-rear'] },
          { role: 'isolation-calves', patterns: ['isolation'], min: 1, muscle_hint: ['calves'] },
          { role: 'core-anti-rotation', patterns: ['core'], min: 1 },
        ],
      },
    ],
  },

  'upper-lower-4day': {
    name: '上下分化 · 4 次/周',
    sessions_per_week: 4,
    rationale: '中级到高级增肌的高量选择。Upper × 2 + Lower × 2，每肌群每周被刺激 2 次，单次训练量更高。Helms 推荐中级 12-20 组/肌群/周可以达成。',
    sessions: [
      {
        id: 'U1', name: '上肢 1（推主导）',
        focus: '胸 · 三角肌前/中 · 三头肌',
        slots: [
          { role: 'main-h-push', patterns: ['h-push'], min: 1 },
          { role: 'main-v-push', patterns: ['v-push'], min: 1 },
          { role: 'accessory-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'accessory-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'isolation-arms', patterns: ['isolation'], min: 1, muscle_hint: ['triceps'] },
          { role: 'isolation-rear-delt', patterns: ['isolation'], min: 1, muscle_hint: ['delt-rear'] },
        ],
      },
      {
        id: 'L1', name: '下肢 1（蹲主导）',
        focus: '股四头肌 · 臀大肌',
        slots: [
          { role: 'main-squat', patterns: ['squat'], min: 1 },
          { role: 'accessory-hinge', patterns: ['hinge'], min: 1 },
          { role: 'accessory-lunge', patterns: ['lunge'], min: 1 },
          { role: 'isolation-hamstrings', patterns: ['isolation'], min: 1, muscle_hint: ['hamstrings'] },
          { role: 'isolation-calves', patterns: ['isolation'], min: 1, muscle_hint: ['calves'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
      {
        id: 'U2', name: '上肢 2（拉主导）',
        focus: '背阔肌 · 三角肌后束 · 二头肌',
        slots: [
          { role: 'main-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'main-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'accessory-h-push', patterns: ['h-push'], min: 1 },
          { role: 'accessory-v-push', patterns: ['v-push'], min: 1 },
          { role: 'isolation-arms', patterns: ['isolation'], min: 1, muscle_hint: ['biceps'] },
          { role: 'isolation-rear-delt', patterns: ['isolation'], min: 1, muscle_hint: ['delt-rear'] },
        ],
      },
      {
        id: 'L2', name: '下肢 2（铰链主导）',
        focus: '腘绳肌 · 臀大肌',
        slots: [
          { role: 'main-hinge', patterns: ['hinge'], min: 1 },
          { role: 'accessory-squat', patterns: ['squat'], min: 1 },
          { role: 'accessory-lunge', patterns: ['lunge'], min: 1 },
          { role: 'isolation-glutes', patterns: ['hinge'], min: 1, muscle_hint: ['glutes'] },
          { role: 'isolation-calves', patterns: ['isolation'], min: 1, muscle_hint: ['calves'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
    ],
  },

  'ppl-5day': {
    name: '推拉腿 · 5-6 次/周',
    sessions_per_week: 5,
    rationale: '高级增肌的高频选择。每肌群每周被刺激 2 次（Push × 2 + Pull × 2 + Legs × 1-2），单次训练量适中但累积总量高。RP 模型下高级阶段 MAV 需要 16-25 组/肌群/周。',
    sessions: [
      {
        id: 'P1', name: '推 1',
        slots: [
          { role: 'main-h-push', patterns: ['h-push'], min: 1 },
          { role: 'main-v-push', patterns: ['v-push'], min: 1 },
          { role: 'accessory-h-push', patterns: ['h-push'], min: 1 },
          { role: 'isolation-tri', patterns: ['isolation'], min: 1, muscle_hint: ['triceps'] },
          { role: 'isolation-lat-raise', patterns: ['isolation'], min: 1, muscle_hint: ['delt-mid'] },
        ],
      },
      {
        id: 'Pu1', name: '拉 1',
        slots: [
          { role: 'main-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'main-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'accessory-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'isolation-bicep', patterns: ['isolation'], min: 1, muscle_hint: ['biceps'] },
          { role: 'isolation-rear-delt', patterns: ['isolation'], min: 1, muscle_hint: ['delt-rear'] },
        ],
      },
      {
        id: 'L1', name: '腿 1（蹲主导）',
        slots: [
          { role: 'main-squat', patterns: ['squat'], min: 1 },
          { role: 'accessory-hinge', patterns: ['hinge'], min: 1 },
          { role: 'accessory-lunge', patterns: ['lunge'], min: 1 },
          { role: 'isolation-hamstrings', patterns: ['isolation'], min: 1, muscle_hint: ['hamstrings'] },
          { role: 'isolation-calves', patterns: ['isolation'], min: 1, muscle_hint: ['calves'] },
        ],
      },
      {
        id: 'P2', name: '推 2',
        slots: [
          { role: 'main-h-push', patterns: ['h-push'], min: 1 },
          { role: 'main-v-push', patterns: ['v-push'], min: 1 },
          { role: 'isolation-tri', patterns: ['isolation'], min: 1, muscle_hint: ['triceps'] },
          { role: 'isolation-chest', patterns: ['h-push'], min: 1 },
          { role: 'isolation-lat-raise', patterns: ['isolation'], min: 1, muscle_hint: ['delt-mid'] },
        ],
      },
      {
        id: 'Pu2', name: '拉 2',
        slots: [
          { role: 'main-v-pull', patterns: ['v-pull'], min: 1 },
          { role: 'main-h-pull', patterns: ['h-pull'], min: 1 },
          { role: 'isolation-bicep', patterns: ['isolation'], min: 1, muscle_hint: ['biceps'] },
          { role: 'isolation-rear-delt', patterns: ['isolation'], min: 1, muscle_hint: ['delt-rear'] },
          { role: 'core', patterns: ['core'], min: 1 },
        ],
      },
    ],
  },
};

/* ---------- 周期阶段处方矩阵 ----------
 * 每个组合（experience × goal）有一套完整的 mesocycle 配置
 * 包括：总周数、阶段切分、每阶段处方（组数/次数/RIR/进阶规则）
 */
const MESOCYCLES = {
  /* === 增肌 × 经验 === */
  'novice.hypertrophy': {
    name: '新手 · 增肌',
    total_weeks: 6,
    rationale: '新手神经适应快、易过度兴奋。6 周后 deload，重启进入下一个 mesocycle。Israetel：新手 MEV 低，过量训练反而降低响应。',
    phases: [
      {
        name: '基础适应',
        weeks: [1, 2],
        focus: '建立动作模式 + 找到 RIR 3-4 的体感',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 2,
          reps_main: '8-12',
          reps_isolation: '10-15',
          rir: '3-4',
          rest_main_sec: 90,
          rest_isolation_sec: 60,
          progression: '不加重，先把动作做稳',
        },
      },
      {
        name: '稳定增肌',
        weeks: [3, 4, 5],
        focus: '渐进超负荷',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 2,
          reps_main: '6-12',
          reps_isolation: '10-15',
          rir: '2-3',
          rest_main_sec: 120,
          rest_isolation_sec: 60,
          progression: '能干净做完上限次数，下次 +2.5kg',
        },
      },
      {
        name: '减载',
        weeks: [6],
        focus: '降低训练量，让身体恢复',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 1,
          reps_main: '8-10',
          reps_isolation: '10-12',
          rir: '3-4',
          rest_main_sec: 90,
          load_pct_of_previous: '60-70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'intermediate.hypertrophy': {
    name: '中级 · 增肌',
    total_weeks: 10,
    rationale: '中级 hypertrophy mesocycle 标准窗口 8-12 周（Schoenfeld 综述）。10 周 = 3 周适应 + 4 周主训 + 2 周强化 + 1 周减载。',
    phases: [
      {
        name: '适应阶段',
        weeks: [1, 2, 3],
        focus: '动作质量 + 找到当前真实基线',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 2,
          reps_main: '8-12',
          reps_isolation: '10-15',
          rir: '3-4',
          rest_main_sec: 120,
          rest_isolation_sec: 75,
          progression: '不加重，按 RIR 3-4 校准实测重量',
        },
      },
      {
        name: '增肌主训',
        weeks: [4, 5, 6, 7],
        focus: '渐进超负荷，每周 +2.5kg 或 +1-2 次',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 3,
          reps_main: '6-12',
          reps_isolation: '10-15',
          rir: '1-3',
          rest_main_sec: 150,
          rest_isolation_sec: 75,
          progression: '每周给主复合动作 +2.5kg 或 +1-2 次；加不动就保持次数把组做满',
        },
      },
      {
        name: '强化',
        weeks: [8, 9],
        focus: '冲击新的历史最佳',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 3,
          reps_main: '6-10',
          reps_isolation: '8-12',
          rir: '0-2',
          rest_main_sec: 180,
          rest_isolation_sec: 90,
          progression: '尽量推到接近力竭，记录新的 PR',
        },
      },
      {
        name: '减载',
        weeks: [10],
        focus: '主动减载恢复',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 1,
          reps_main: '8-10',
          reps_isolation: '10-12',
          rir: '3-4',
          rest_main_sec: 120,
          load_pct_of_previous: '60-70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'advanced.hypertrophy': {
    name: '高级 · 增肌',
    total_weeks: 8,
    rationale: '高强度训练 CNS 疲劳累积快，8 周到顶就要减载。Israetel：高级 MRV 达到上限后必须重启。',
    phases: [
      {
        name: '增量阶段',
        weeks: [1, 2, 3],
        focus: '从 MEV 起步，逐周加组',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 3,
          reps_main: '6-10',
          reps_isolation: '8-12',
          rir: '2-3',
          rest_main_sec: 180,
          rest_isolation_sec: 90,
          progression: '每周加 1 组 / 主动作 +2.5kg',
        },
      },
      {
        name: '高量主训',
        weeks: [4, 5, 6],
        focus: '逼近 MAV，最大训练量',
        prescription: {
          sets_per_main: 4,
          sets_per_isolation: 4,
          reps_main: '6-10',
          reps_isolation: '8-12',
          rir: '1-2',
          rest_main_sec: 180,
          rest_isolation_sec: 90,
          progression: '+2.5kg 或保持重量推次数',
        },
      },
      {
        name: '冲击 + 减载',
        weeks: [7, 8],
        focus: 'W7 冲击 PR，W8 完全减载',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 2,
          reps_main: '6-8',
          reps_isolation: '10-12',
          rir: '3-4',
          rest_main_sec: 120,
          load_pct_of_previous: '60-70%',
          progression: '不进阶',
        },
      },
    ],
  },

  /* === 力量 × 经验 === */
  'novice.strength': {
    name: '新手 · 力量',
    total_weeks: 6,
    rationale: 'Starting Strength / StrongLifts 经典节奏：新手线性进步 6 周。',
    phases: [
      {
        name: '线性进步',
        weeks: [1, 2, 3, 4, 5],
        focus: '每次训练加重，神经适应主导',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 0,
          reps_main: '5',
          rir: '1-2',
          rest_main_sec: 180,
          progression: '每次 +2.5kg；加不动重做',
        },
      },
      {
        name: '减载',
        weeks: [6],
        focus: '降量恢复',
        prescription: {
          sets_per_main: 2,
          reps_main: '5',
          rir: '3-4',
          rest_main_sec: 180,
          load_pct_of_previous: '70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'intermediate.strength': {
    name: '中级 · 力量',
    total_weeks: 6,
    rationale: 'Texas Method / 5/3/1 经典 6 周块，神经疲劳积累快需短周期。',
    phases: [
      {
        name: '体积日 + 强度日',
        weeks: [1, 2, 3, 4, 5],
        focus: '体积日累积刺激，强度日冲新',
        prescription: {
          sets_per_main: 5,
          reps_main: '3-5',
          rir: '1-2',
          rest_main_sec: 240,
          progression: '每周 +2.5kg 主复合动作',
        },
      },
      {
        name: '减载',
        weeks: [6],
        prescription: {
          sets_per_main: 3, reps_main: '3', rir: '3-4',
          rest_main_sec: 180,
          load_pct_of_previous: '70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'advanced.strength': {
    name: '高级 · 力量',
    total_weeks: 4,
    rationale: '高级力量 CNS 极易疲劳，4 周一个块是 powerlifting 标准（Sheiko / Smolov 节奏）。',
    phases: [
      {
        name: '高强度块',
        weeks: [1, 2, 3],
        prescription: {
          sets_per_main: 4,
          reps_main: '2-4',
          rir: '0-1',
          rest_main_sec: 300,
          progression: '基于上次 1RM 调整',
        },
      },
      {
        name: '减载',
        weeks: [4],
        prescription: {
          sets_per_main: 2, reps_main: '3', rir: '3-4',
          rest_main_sec: 180,
          load_pct_of_previous: '60%',
          progression: '不进阶',
        },
      },
    ],
  },

  /* === 减脂塑形 × 经验 === */
  'novice.cutting': {
    name: '新手 · 减脂塑形',
    total_weeks: 12,
    rationale: '减脂期 12-16 周配合饮食 deficit。新手取下限 12 周观察身材变化。',
    phases: [
      {
        name: '建立训练习惯 + 热量赤字',
        weeks: [1, 2, 3, 4],
        focus: '动作质量 + 提高 NEAT',
        prescription: {
          sets_per_main: 2,
          sets_per_isolation: 2,
          reps_main: '10-12',
          reps_isolation: '12-15',
          rir: '3-4',
          rest_main_sec: 90,
          progression: '保持重量，先把次数填满',
        },
      },
      {
        name: '维持训练量 + 持续赤字',
        weeks: [5, 6, 7, 8, 9, 10, 11],
        focus: '保肌肉 + 持续减脂',
        prescription: {
          sets_per_main: 3,
          sets_per_isolation: 2,
          reps_main: '8-12',
          reps_isolation: '10-15',
          rir: '2-3',
          rest_main_sec: 90,
          progression: '保持重量为主，不强求加重',
        },
      },
      {
        name: '减载',
        weeks: [12],
        prescription: {
          sets_per_main: 2, sets_per_isolation: 1,
          reps_main: '8-10', reps_isolation: '10-12',
          rir: '3-4', rest_main_sec: 90,
          load_pct_of_previous: '70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'intermediate.cutting': {
    name: '中级 · 减脂塑形',
    total_weeks: 12,
    rationale: '减脂期 12 周配合 0.5-1% 体重/周 的赤字速度，中级取标准 12 周。',
    phases: [
      {
        name: '建立赤字',
        weeks: [1, 2, 3],
        prescription: {
          sets_per_main: 3, sets_per_isolation: 2,
          reps_main: '8-12', reps_isolation: '10-15',
          rir: '2-3', rest_main_sec: 90,
          progression: '保持上一个增肌期的重量',
        },
      },
      {
        name: '维持高训练量保肌',
        weeks: [4, 5, 6, 7, 8, 9, 10, 11],
        focus: '保肌核心 — 维持训练强度，可掉训练量',
        prescription: {
          sets_per_main: 3, sets_per_isolation: 2,
          reps_main: '6-12', reps_isolation: '10-15',
          rir: '1-3', rest_main_sec: 120,
          progression: '掉次数前先掉组数；强度不掉',
        },
      },
      {
        name: '减载',
        weeks: [12],
        prescription: {
          sets_per_main: 2, sets_per_isolation: 1,
          reps_main: '8-10', reps_isolation: '10-12',
          rir: '3-4', rest_main_sec: 90,
          load_pct_of_previous: '70%',
          progression: '不进阶',
        },
      },
    ],
  },

  'advanced.cutting': {
    name: '高级 · 减脂塑形',
    total_weeks: 14,
    rationale: '高级减脂期可拉到 14 周，赤字幅度小（0.5% 体重/周），最大化保肌。',
    phases: [
      {
        name: '小幅赤字 + 高量保肌',
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        prescription: {
          sets_per_main: 4, sets_per_isolation: 3,
          reps_main: '6-12', reps_isolation: '10-15',
          rir: '1-2', rest_main_sec: 120,
          progression: '强度优先，能掉训练量不掉强度',
        },
      },
      {
        name: '减载',
        weeks: [14],
        prescription: {
          sets_per_main: 2, sets_per_isolation: 1,
          reps_main: '8-10', reps_isolation: '10-12',
          rir: '3-4', rest_main_sec: 90,
          load_pct_of_previous: '70%',
          progression: '不进阶',
        },
      },
    ],
  },

  /* === 维持 × 经验 === */
  'novice.maintenance': {
    name: '新手 · 维持',
    total_weeks: 0, // 维持没有 mesocycle 概念，无限循环
    is_indefinite: true,
    rationale: '维持只需要 30% 训练量。McMaster 研究：每肌群每周 4-8 组就够维持。',
    phases: [
      {
        name: '低量维持',
        weeks: 'indefinite',
        prescription: {
          sets_per_main: 2, sets_per_isolation: 1,
          reps_main: '8-12', reps_isolation: '10-15',
          rir: '2-3', rest_main_sec: 90,
          progression: '保持当前重量',
        },
      },
    ],
  },
  'intermediate.maintenance': {
    name: '中级 · 维持',
    total_weeks: 0, is_indefinite: true,
    rationale: '维持只需要 30% 训练量。McMaster 研究。',
    phases: [{
      name: '低量维持', weeks: 'indefinite',
      prescription: {
        sets_per_main: 2, sets_per_isolation: 1,
        reps_main: '6-12', reps_isolation: '10-15',
        rir: '2-3', rest_main_sec: 120,
        progression: '保持当前重量',
      },
    }],
  },
  'advanced.maintenance': {
    name: '高级 · 维持',
    total_weeks: 0, is_indefinite: true,
    rationale: '维持只需要 30% 训练量。McMaster 研究。',
    phases: [{
      name: '低量维持', weeks: 'indefinite',
      prescription: {
        sets_per_main: 3, sets_per_isolation: 1,
        reps_main: '6-12', reps_isolation: '10-15',
        rir: '2-3', rest_main_sec: 120,
        progression: '保持当前重量',
      },
    }],
  },
};

/* ---------- 起步重量参考 ----------
 * 数据来源：StrengthLevel.com 公开统计（基于数百万用户上报的 1RM）
 * 转换规则：起步重量 = 估算 1RM × 60-65% （阶段一适应期负荷）
 * ratio = 占体重的倍数；absolute = 绝对重量 kg
 * 用户最终重量按 RIR 3-4 自己校准（参考只是起点）
 *
 * 经验等级映射：
 *   novice        = StrengthLevel "Novice"        (后 25% 人群)
 *   intermediate  = StrengthLevel "Intermediate"  (25-50% 人群)
 *   advanced      = StrengthLevel "Advanced"      (50-75% 人群)
 */
const STARTING_LOADS = {
  // === 大复合动作（按体重比例） ===
  'barbell-back-squat': {
    male:   { novice: { type: 'ratio', range: [0.35, 0.50] }, intermediate: { type: 'ratio', range: [0.60, 0.80] }, advanced: { type: 'ratio', range: [0.90, 1.10] } },
    female: { novice: { type: 'ratio', range: [0.25, 0.40] }, intermediate: { type: 'ratio', range: [0.45, 0.65] }, advanced: { type: 'ratio', range: [0.70, 0.90] } },
  },
  'dumbbell-goblet-squat': {
    male:   { novice: { type: 'absolute', range: [8, 12] }, intermediate: { type: 'absolute', range: [14, 22] }, advanced: { type: 'absolute', range: [24, 32] } },
    female: { novice: { type: 'absolute', range: [4, 8] }, intermediate: { type: 'absolute', range: [10, 16] }, advanced: { type: 'absolute', range: [18, 26] } },
  },
  'leg-press': {
    male:   { novice: { type: 'ratio', range: [1.0, 1.4] }, intermediate: { type: 'ratio', range: [1.6, 2.2] }, advanced: { type: 'ratio', range: [2.4, 3.0] } },
    female: { novice: { type: 'ratio', range: [0.8, 1.2] }, intermediate: { type: 'ratio', range: [1.4, 1.8] }, advanced: { type: 'ratio', range: [2.0, 2.6] } },
  },
  'dumbbell-lunge': {
    male:   { novice: { type: 'absolute', range: [5, 8], per: 'hand' }, intermediate: { type: 'absolute', range: [10, 15], per: 'hand' }, advanced: { type: 'absolute', range: [16, 22], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [3, 5], per: 'hand' }, intermediate: { type: 'absolute', range: [6, 10], per: 'hand' }, advanced: { type: 'absolute', range: [12, 18], per: 'hand' } },
  },
  'barbell-rdl': {
    male:   { novice: { type: 'ratio', range: [0.40, 0.60] }, intermediate: { type: 'ratio', range: [0.70, 0.95] }, advanced: { type: 'ratio', range: [1.05, 1.30] } },
    female: { novice: { type: 'ratio', range: [0.30, 0.45] }, intermediate: { type: 'ratio', range: [0.50, 0.70] }, advanced: { type: 'ratio', range: [0.80, 1.00] } },
  },
  'barbell-hip-thrust': {
    male:   { novice: { type: 'ratio', range: [0.70, 1.00] }, intermediate: { type: 'ratio', range: [1.10, 1.50] }, advanced: { type: 'ratio', range: [1.60, 2.00] } },
    female: { novice: { type: 'ratio', range: [0.50, 0.80] }, intermediate: { type: 'ratio', range: [0.90, 1.30] }, advanced: { type: 'ratio', range: [1.40, 1.80] } },
  },
  'lying-leg-curl': {
    male:   { novice: { type: 'absolute', range: [15, 22] }, intermediate: { type: 'absolute', range: [24, 35] }, advanced: { type: 'absolute', range: [38, 50] } },
    female: { novice: { type: 'absolute', range: [8, 14] }, intermediate: { type: 'absolute', range: [16, 24] }, advanced: { type: 'absolute', range: [26, 38] } },
  },
  'barbell-bench-press': {
    male:   { novice: { type: 'ratio', range: [0.35, 0.50] }, intermediate: { type: 'ratio', range: [0.60, 0.80] }, advanced: { type: 'ratio', range: [0.90, 1.10] } },
    female: { novice: { type: 'ratio', range: [0.20, 0.30] }, intermediate: { type: 'ratio', range: [0.35, 0.50] }, advanced: { type: 'ratio', range: [0.55, 0.75] } },
  },
  'incline-dumbbell-press': {
    male:   { novice: { type: 'absolute', range: [8, 12], per: 'hand' }, intermediate: { type: 'absolute', range: [14, 20], per: 'hand' }, advanced: { type: 'absolute', range: [22, 30], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [4, 6], per: 'hand' }, intermediate: { type: 'absolute', range: [7, 12], per: 'hand' }, advanced: { type: 'absolute', range: [14, 20], per: 'hand' } },
  },
  'push-up': {
    male:   { novice: { type: 'reps', range: [5, 10], note: '不够 5 次先做跪姿/斜板' }, intermediate: { type: 'reps', range: [12, 18] }, advanced: { type: 'reps', range: [20, 30] } },
    female: { novice: { type: 'reps', range: [3, 6], note: '不够 3 次先做跪姿/斜板' }, intermediate: { type: 'reps', range: [8, 12] }, advanced: { type: 'reps', range: [15, 22] } },
  },
  'barbell-overhead-press': {
    male:   { novice: { type: 'ratio', range: [0.20, 0.30] }, intermediate: { type: 'ratio', range: [0.35, 0.50] }, advanced: { type: 'ratio', range: [0.55, 0.70] } },
    female: { novice: { type: 'ratio', range: [0.12, 0.18] }, intermediate: { type: 'ratio', range: [0.22, 0.32] }, advanced: { type: 'ratio', range: [0.35, 0.45] } },
  },
  'dumbbell-shoulder-press': {
    male:   { novice: { type: 'absolute', range: [5, 8], per: 'hand' }, intermediate: { type: 'absolute', range: [10, 15], per: 'hand' }, advanced: { type: 'absolute', range: [17, 24], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [3, 5], per: 'hand' }, intermediate: { type: 'absolute', range: [6, 10], per: 'hand' }, advanced: { type: 'absolute', range: [12, 17], per: 'hand' } },
  },
  'barbell-row': {
    male:   { novice: { type: 'ratio', range: [0.35, 0.50] }, intermediate: { type: 'ratio', range: [0.60, 0.80] }, advanced: { type: 'ratio', range: [0.85, 1.05] } },
    female: { novice: { type: 'ratio', range: [0.25, 0.35] }, intermediate: { type: 'ratio', range: [0.40, 0.55] }, advanced: { type: 'ratio', range: [0.60, 0.80] } },
  },
  'dumbbell-row': {
    male:   { novice: { type: 'absolute', range: [8, 12], per: 'hand' }, intermediate: { type: 'absolute', range: [14, 22], per: 'hand' }, advanced: { type: 'absolute', range: [24, 34], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [4, 7], per: 'hand' }, intermediate: { type: 'absolute', range: [8, 14], per: 'hand' }, advanced: { type: 'absolute', range: [16, 24], per: 'hand' } },
  },
  'seated-cable-row': {
    male:   { novice: { type: 'absolute', range: [20, 30] }, intermediate: { type: 'absolute', range: [32, 48] }, advanced: { type: 'absolute', range: [50, 70] } },
    female: { novice: { type: 'absolute', range: [12, 18] }, intermediate: { type: 'absolute', range: [20, 32] }, advanced: { type: 'absolute', range: [34, 50] } },
  },
  'pull-up': {
    male:   { novice: { type: 'reps', range: [0, 3], note: '不够先做辅助/离心' }, intermediate: { type: 'reps', range: [4, 8] }, advanced: { type: 'reps', range: [10, 15] } },
    female: { novice: { type: 'reps', range: [0, 1], note: '不够先做辅助/离心/绳索下拉' }, intermediate: { type: 'reps', range: [2, 5] }, advanced: { type: 'reps', range: [6, 10] } },
  },
  'lat-pulldown': {
    male:   { novice: { type: 'absolute', range: [25, 35] }, intermediate: { type: 'absolute', range: [40, 55] }, advanced: { type: 'absolute', range: [60, 80] } },
    female: { novice: { type: 'absolute', range: [14, 22] }, intermediate: { type: 'absolute', range: [25, 38] }, advanced: { type: 'absolute', range: [40, 55] } },
  },
  'dumbbell-bicep-curl': {
    male:   { novice: { type: 'absolute', range: [5, 8], per: 'hand' }, intermediate: { type: 'absolute', range: [9, 14], per: 'hand' }, advanced: { type: 'absolute', range: [15, 22], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [3, 5], per: 'hand' }, intermediate: { type: 'absolute', range: [6, 9], per: 'hand' }, advanced: { type: 'absolute', range: [10, 15], per: 'hand' } },
  },
  'tricep-pushdown': {
    male:   { novice: { type: 'absolute', range: [12, 18] }, intermediate: { type: 'absolute', range: [20, 32] }, advanced: { type: 'absolute', range: [35, 50] } },
    female: { novice: { type: 'absolute', range: [7, 12] }, intermediate: { type: 'absolute', range: [14, 22] }, advanced: { type: 'absolute', range: [24, 36] } },
  },
  'face-pull': {
    male:   { novice: { type: 'absolute', range: [10, 14] }, intermediate: { type: 'absolute', range: [16, 24] }, advanced: { type: 'absolute', range: [26, 40] } },
    female: { novice: { type: 'absolute', range: [6, 10] }, intermediate: { type: 'absolute', range: [12, 18] }, advanced: { type: 'absolute', range: [20, 30] } },
  },
  'standing-calf-raise': {
    male:   { novice: { type: 'absolute', range: [8, 12], per: 'hand', note: '哑铃单手或机器对应负重' }, intermediate: { type: 'absolute', range: [14, 20], per: 'hand' }, advanced: { type: 'absolute', range: [22, 32], per: 'hand' } },
    female: { novice: { type: 'absolute', range: [5, 8], per: 'hand' }, intermediate: { type: 'absolute', range: [10, 14], per: 'hand' }, advanced: { type: 'absolute', range: [16, 24], per: 'hand' } },
  },
  'plank': {
    male:   { novice: { type: 'duration', range: [20, 30], unit: 'sec' }, intermediate: { type: 'duration', range: [45, 75], unit: 'sec' }, advanced: { type: 'duration', range: [90, 150], unit: 'sec' } },
    female: { novice: { type: 'duration', range: [20, 30], unit: 'sec' }, intermediate: { type: 'duration', range: [45, 75], unit: 'sec' }, advanced: { type: 'duration', range: [90, 150], unit: 'sec' } },
  },
  'hanging-knee-raise': {
    male:   { novice: { type: 'reps', range: [5, 8], note: '不够先做躺姿屈膝' }, intermediate: { type: 'reps', range: [10, 15] }, advanced: { type: 'reps', range: [16, 25] } },
    female: { novice: { type: 'reps', range: [3, 6] }, intermediate: { type: 'reps', range: [8, 12] }, advanced: { type: 'reps', range: [14, 20] } },
  },
  'pallof-press': {
    male:   { novice: { type: 'absolute', range: [8, 12], note: '抗旋转，重量不大但要慢控' }, intermediate: { type: 'absolute', range: [14, 20] }, advanced: { type: 'absolute', range: [22, 30] } },
    female: { novice: { type: 'absolute', range: [5, 8] }, intermediate: { type: 'absolute', range: [10, 15] }, advanced: { type: 'absolute', range: [16, 22] } },
  },
};

/* ---------- 工具函数：计算具体起步重量 ---------- */
function computeStartLoad(exerciseId, gender, expLevel, bodyWeightKg) {
  const entry = STARTING_LOADS[exerciseId];
  if (!entry || !entry[gender] || !entry[gender][expLevel]) {
    return { display: '按 RIR 3-4 自己摸索', type: 'unknown' };
  }
  const cfg = entry[gender][expLevel];
  if (cfg.type === 'ratio') {
    const lo = Math.round(bodyWeightKg * cfg.range[0]);
    const hi = Math.round(bodyWeightKg * cfg.range[1]);
    return { display: `${lo}–${hi} kg`, type: 'weight', lo, hi };
  }
  if (cfg.type === 'absolute') {
    const suffix = cfg.per === 'hand' ? ' kg/手' : ' kg';
    return { display: `${cfg.range[0]}–${cfg.range[1]}${suffix}`, type: 'weight', lo: cfg.range[0], hi: cfg.range[1] };
  }
  if (cfg.type === 'reps') {
    const note = cfg.note ? `（${cfg.note}）` : '';
    return { display: `自重 ${cfg.range[0]}–${cfg.range[1]} 次${note}`, type: 'reps' };
  }
  if (cfg.type === 'duration') {
    return { display: `${cfg.range[0]}–${cfg.range[1]} ${cfg.unit === 'sec' ? '秒' : ''}`, type: 'duration' };
  }
  return { display: '按 RIR 3-4 自己摸索', type: 'unknown' };
}

// 浏览器全局 + Node.js module export 兼容
if (typeof window !== 'undefined') {
  window.FITLAB_DATA = { EXERCISES, SPLITS, MESOCYCLES, STARTING_LOADS, computeStartLoad };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EXERCISES, SPLITS, MESOCYCLES, STARTING_LOADS, computeStartLoad };
}

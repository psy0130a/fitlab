/* ============================================================
 * FitLab 推荐 + 计划生成引擎
 *
 * 输入：onboarding answers
 * 输出：
 *   1) recommendation - 推荐参数 + 每条推荐的"为什么"
 *   2) plan          - 完整训练计划数据（mesocycle + 每节课的动作/组数/次数/重量）
 *
 * 依赖：fitlab-data.js 提供的 EXERCISES / SPLITS / MESOCYCLES / STARTING_LOADS
 * ============================================================ */

(function () {
  const DATA = (typeof window !== 'undefined' && window.FITLAB_DATA)
            || (typeof module !== 'undefined' && module.exports)
            || {};
  const { EXERCISES, SPLITS, MESOCYCLES, computeStartLoad } = DATA;

  /* ---------- 一、评估经验等级 ----------
   * 输入：4 道经验题答案
   *   q1_known_exercises: string[] - 选了哪些动作（id 数组）
   *   q2_rir_perception: 'high' | 'mid' | 'low' | 'unknown'
   *   q3_recent_freq: 0 | 1.5 | 3 | 4.5 | 6  (映射自 0 / 1-2 / 3 / 4-5 / 6+)
   *   q4_returning: 'never' | 'paused-3m+' | 'still-training'
   */
  function assessExperience(answers) {
    // 过滤掉 'none' 这个对立选项，只算实际动作数量
    const knownExercises = (answers.q1_known_exercises || []).filter(x => x !== 'none');
    const knownCount = knownExercises.length;
    const hasNoneTag = (answers.q1_known_exercises || []).includes('none');
    const rir = answers.q2_rir_perception;
    const freq = answers.q3_recent_freq || 0;
    const returning = answers.q4_returning;

    // 完全新手 / 不教动作边界：选了"一个都不太熟"，或没选任何动作
    if (hasNoneTag || knownCount === 0) {
      return {
        level: 'needs-coaching',
        confidence: 'high',
        reason: '你目前一个力量动作都不熟。FitLab 不教动作，建议先在线下专业场馆上 5-10 节私教把基础动作模式打下来，回来再用 FitLab 规划训练。',
      };
    }

    // 中断回归
    if (returning === 'paused-3m+' && knownCount >= 3) {
      return {
        level: 'return-from-break',
        confidence: 'high',
        reason: '你以前有过持续训练但已停训 3 个月以上。动作记忆还在，但力量肌肉已退。前 4 周用"中级动作 + 新手起步重量"快速回血，第 5 周开始按动作熟悉度匹配处方。',
      };
    }

    // 矩阵判定（题 1 × 题 3）
    let level;
    let confidence = 'high';
    if (knownCount >= 5 && freq >= 4) {
      // 是否升级到高级，需要题 2 + 题 4 配合
      if (rir === 'high' && returning === 'still-training') {
        level = 'advanced';
      } else {
        level = 'intermediate';
      }
    } else if (knownCount >= 5 && freq >= 3) {
      level = 'intermediate';
    } else if (knownCount >= 3 && freq >= 3) {
      level = 'intermediate';
    } else if (knownCount >= 3 && freq >= 1) {
      level = 'intermediate';
      confidence = 'mid';
    } else if (knownCount <= 2 && freq >= 3) {
      level = 'novice';
      confidence = 'mid';
    } else if (freq === 0 && knownCount >= 3) {
      level = 'return-from-break';
      confidence = 'mid';
    } else {
      level = 'novice';
    }

    // 翻译成中文判定理由
    const knownDesc = knownCount >= 5 ? '熟练（≥5 个主动作）' : (knownCount >= 3 ? '半熟（3-5 个动作）' : '生疏（≤2 个动作）');
    const freqDesc = freq === 0 ? '近 3 月没练' : (freq <= 2 ? `近 3 月 1-2 次/周` : (freq <= 3 ? `近 3 月 3 次/周` : `近 3 月 ${freq}+ 次/周`));
    const rirDesc = rir === 'high' ? 'RIR 感知准确' : (rir === 'mid' ? 'RIR 大致能判断' : 'RIR 感知尚未建立');

    return {
      level,
      confidence,
      reason: `根据你的回答：动作熟悉度 ${knownDesc}、训练频率 ${freqDesc}、${rirDesc}。综合判定 = ${levelName(level)}。`,
      details: { knownCount, freq, rir, returning },
    };
  }

  function levelName(level) {
    return ({
      'novice': '新手',
      'intermediate': '中级',
      'advanced': '高级',
      'return-from-break': '中断回归',
      'needs-coaching': '完全新手（建议先学动作）',
    })[level] || level;
  }

  /* ---------- 二、推荐频率 ----------
   * 输入：目标、经验等级、用户能投入的上限
   * 输出：建议每周训练次数 + 原理
   */
  function recommendFrequency(goal, expLevel, maxFreqUserCanDo, sessionDurationMin) {
    // 经验降级：中断回归按"低一级"处理
    const effectiveLevel = expLevel === 'return-from-break' ? 'novice' : expLevel;

    // 不同目标 × 经验的科学最优频率
    const optimal = {
      'hypertrophy': {
        'novice': { min: 2, ideal: 3, max: 3 },
        'intermediate': { min: 3, ideal: 3, max: 4 },
        'advanced': { min: 4, ideal: 4, max: 5 },
      },
      'strength': {
        'novice': { min: 3, ideal: 3, max: 3 },
        'intermediate': { min: 3, ideal: 4, max: 4 },
        'advanced': { min: 4, ideal: 4, max: 5 },
      },
      'cutting': {
        'novice': { min: 3, ideal: 4, max: 4 },
        'intermediate': { min: 4, ideal: 4, max: 5 },
        'advanced': { min: 4, ideal: 5, max: 5 },
      },
      'maintenance': {
        'novice': { min: 2, ideal: 2, max: 2 },
        'intermediate': { min: 2, ideal: 2, max: 3 },
        'advanced': { min: 2, ideal: 3, max: 3 },
      },
    };

    const target = optimal[goal]?.[effectiveLevel] || { min: 3, ideal: 3, max: 3 };

    // 时长 < 45 分钟 → 频率 +1（单次量不够，靠分散补）
    if (sessionDurationMin < 45 && target.max < 5) {
      target.ideal = Math.min(target.max + 1, 5);
    }

    // 协调：用户上限不能给的
    let recommended, conflictNote = null;
    if (maxFreqUserCanDo >= target.ideal) {
      recommended = target.ideal;
    } else if (maxFreqUserCanDo >= target.min) {
      recommended = maxFreqUserCanDo;
      conflictNote = `你的可投入上限是 ${maxFreqUserCanDo} 次/周，刚好达到 ${goalName(goal)}${levelName(expLevel)}的下限（${target.min} 次/周）。逻辑上跑得起来，但进展会比理想节奏慢。`;
    } else if (maxFreqUserCanDo > 0) {
      recommended = maxFreqUserCanDo;
      conflictNote = `⚠️ 你的可投入上限 ${maxFreqUserCanDo} 次/周低于${goalName(goal)}科学下限 ${target.min} 次/周。计划会被改成"全身训练"分化、单次覆盖所有主肌群、mesocycle 拉长来补训练量。但进展会比理想节奏慢 30-40%。`;
    } else {
      recommended = 0;
      conflictNote = `🚫 0 次/周无法训练。如果只是当前状态不允许，建议先以"维持"目标启动（最低 2 次/周）。`;
    }

    // 推荐原因
    const reason = buildFrequencyReason(goal, effectiveLevel, target, recommended);

    return {
      times_per_week: recommended,
      optimal_range: `${target.min}-${target.max} 次/周（${goalName(goal)}${levelName(effectiveLevel)}标准）`,
      reason,
      conflict_note: conflictNote,
    };
  }

  function buildFrequencyReason(goal, level, target, recommended) {
    const base = {
      'hypertrophy': '增肌的科学底线是每个目标肌群每周被有效刺激 ≥ 2 次（Schoenfeld 2016 元分析）。',
      'strength': '力量训练需要每个主动作每周刺激 ≥ 2 次以维持神经驱动（Helms《Muscle and Strength Pyramid》）。',
      'cutting': '减脂期更高频率有助于保肌 + 增加日常热量消耗（NEAT），4-5 次/周比 3 次/周减脂效率更高。',
      'maintenance': '维持只需要 30% 训练量。McMaster 研究：每肌群每周 4-8 组就够维持。频率拉低没问题。',
    }[goal] || '';

    const levelLogic = {
      'novice': '新手 MEV 低（最小有效训练量），更高频反而过度疲劳降低响应（Israetel）。',
      'intermediate': '中级阶段每肌群 10-20 组/周（Helms），3-4 次/周分化合适。',
      'advanced': '高级 MAV 需要 16-25 组/肌群/周，单日装不下，必须高频细分。',
    }[level] || '';

    return `${base}${levelLogic}本档位标准 ${target.min}-${target.max} 次/周，建议你取 ${recommended} 次。`;
  }

  function goalName(goal) {
    return ({
      'hypertrophy': '增肌',
      'strength': '力量',
      'cutting': '减脂塑形',
      'maintenance': '维持',
    })[goal] || goal;
  }

  /* ---------- 三、推荐 mesocycle ----------
   * 输入：目标、经验等级、生活压力（可选）
   */
  function recommendMesocycle(goal, expLevel, stressLevel) {
    const key = (expLevel === 'return-from-break' ? 'novice' : expLevel) + '.' + goal;
    const config = MESOCYCLES[key];
    if (!config) {
      return null;
    }

    let totalWeeks = config.total_weeks;

    // 微调：高生活压力 -2 周
    if (stressLevel === 'high' && totalWeeks > 6) {
      totalWeeks = Math.max(4, totalWeeks - 2);
    }

    return {
      key,
      name: config.name,
      total_weeks: totalWeeks,
      is_indefinite: !!config.is_indefinite,
      rationale: config.rationale,
      phases: config.phases,
    };
  }

  /* ---------- 四、推荐课型分化 ----------
   * 根据频率 + 单次时长决定用哪种分化
   */
  function recommendSplit(frequency, sessionDurationMin) {
    if (frequency <= 2) return SPLITS['full-body-2day'];
    if (frequency === 3) return SPLITS['abc-3day'];
    if (frequency === 4) return SPLITS['upper-lower-4day'];
    return SPLITS['ppl-5day'];
  }

  /* ---------- 五、计算完整推荐 ---------- */
  function computeRecommendation(answers) {
    // 1. 经验评估
    const expAssessment = assessExperience(answers);

    // 边界：完全新手返回边界提示
    if (expAssessment.level === 'needs-coaching') {
      return {
        is_boundary: true,
        experience: expAssessment,
      };
    }

    const goal = answers.goal;
    const stress = answers.stress_level || 'mid';

    // 2. 频率推荐
    const frequency = recommendFrequency(goal, expAssessment.level, answers.max_freq_per_week, answers.session_duration_min);

    // 3. mesocycle 推荐
    const mesocycle = recommendMesocycle(goal, expAssessment.level, stress);

    // 4. 课型分化
    const split = recommendSplit(frequency.times_per_week, answers.session_duration_min);

    return {
      is_boundary: false,
      experience: expAssessment,
      goal: { id: goal, name: goalName(goal) },
      frequency,
      mesocycle,
      split,
      profile: {
        gender: answers.gender,
        body_weight_kg: answers.body_weight_kg,
        injuries: answers.injuries || [],
        max_freq: answers.max_freq_per_week,
        session_duration: answers.session_duration_min,
      },
    };
  }

  /* ---------- 六、根据 slot 规则从动作池选动作 ----------
   * 输入：split 配置、伤病列表、可用器械
   * 输出：每个 session 填充好的动作列表
   */
  function selectExercisesForSession(session, allInjuries, usedAcrossWeek) {
    const usedThisSession = new Set();
    const filled = [];
    usedAcrossWeek = usedAcrossWeek || new Set();

    for (const slot of session.slots) {
      const candidates = Object.entries(EXERCISES)
        // pattern 匹配
        .filter(([_id, ex]) => slot.patterns.includes(ex.pattern))
        // 伤病过滤
        .filter(([_id, ex]) => !ex.avoid_if.some(avoid => allInjuries.some(inj => avoid.startsWith(inj))))
        // 没被本课用过
        .filter(([id]) => !usedThisSession.has(id))
        // muscle_hint 匹配（如果有）
        .filter(([_id, ex]) => {
          if (!slot.muscle_hint) return true;
          return slot.muscle_hint.some(m => ex.primary.includes(m) || ex.synergist.includes(m));
        });

      // 选择策略：
      // 1) compound vs isolation 偏好（main/accessory 优先复合）
      // 2) 跨 session soft penalty: 本周已用的排到后面（保持多样性，但仍可用作 fallback）
      const prefersCompound = slot.role.startsWith('main') || slot.role.startsWith('accessory');
      const sorted = candidates.sort((a, b) => {
        const aC = a[1].is_compound ? 1 : 0;
        const bC = b[1].is_compound ? 1 : 0;
        const aUsedPenalty = usedAcrossWeek.has(a[0]) ? 1 : 0;
        const bUsedPenalty = usedAcrossWeek.has(b[0]) ? 1 : 0;
        // 先按 across-week penalty (没用过的优先)
        if (aUsedPenalty !== bUsedPenalty) return aUsedPenalty - bUsedPenalty;
        // 再按 compound 偏好
        return prefersCompound ? (bC - aC) : (aC - bC);
      });

      if (sorted.length === 0) {
        filled.push({ slot, exercise: null, exercise_id: null, note: '⚠️ 你的伤病/器械限制下无可用动作' });
        continue;
      }

      const [exId, ex] = sorted[0];
      usedThisSession.add(exId);
      usedAcrossWeek.add(exId);
      filled.push({
        slot,
        exercise: ex,
        exercise_id: exId,
      });
    }

    return filled;
  }

  /* ---------- 七、生成完整训练计划 ----------
   * 输入：recommendation（来自 computeRecommendation）
   * 输出：完整 plan 数据
   *   {
   *     summary: { 总周数, 总课次, 三阶段切分 },
   *     sessions: [
   *       { id: 'A', name: '...', exercises: [{ name, sets, reps, rir, start_load }] }
   *     ],
   *     phases: [ { name, weeks, prescription } ],
   *     progression_rules: '...'
   *   }
   */
  function generatePlan(recommendation) {
    if (recommendation.is_boundary) return null;

    const { experience, goal, frequency, mesocycle, split, profile } = recommendation;
    const expLevel = experience.level === 'return-from-break' ? 'intermediate' : experience.level;

    // 每个 session 填充动作（跨 session 共享 used set，避免主动作重复）
    const usedAcrossWeek = new Set();
    const sessions = split.sessions.map(s => ({
      id: s.id,
      name: s.name,
      focus: s.focus,
      slots: selectExercisesForSession(s, profile.injuries, usedAcrossWeek),
    }));

    // 给每个填好的动作加上起步重量参考 + 主/孤立分类
    sessions.forEach(s => {
      s.slots.forEach(slot => {
        if (!slot.exercise) return;
        slot.is_compound = slot.exercise.is_compound;
        slot.start_load = computeStartLoad(slot.exercise_id, profile.gender, expLevel, profile.body_weight_kg);
      });
    });

    // 总课次（适应阶段 + 主训 + 强化 + 减载，每周 × 频率）
    const totalSessions = mesocycle.is_indefinite
      ? `${frequency.times_per_week} 次/周（无限循环）`
      : `${mesocycle.total_weeks * frequency.times_per_week} 节（${mesocycle.total_weeks} 周 × ${frequency.times_per_week} 次/周）`;

    return {
      summary: {
        goal_name: goal.name,
        experience_name: levelName(experience.level),
        total_weeks: mesocycle.total_weeks,
        total_sessions: totalSessions,
        weekly_schedule: `${frequency.times_per_week} 次/周 · ${split.name}`,
        mesocycle_name: mesocycle.name,
        phases_count: mesocycle.phases.length,
      },
      mesocycle,
      split,
      sessions,
      profile,
      experience,
      frequency,
    };
  }

  /* ---------- 八、导出 ---------- */
  const ENGINE = {
    assessExperience,
    recommendFrequency,
    recommendMesocycle,
    recommendSplit,
    computeRecommendation,
    selectExercisesForSession,
    generatePlan,
    levelName,
    goalName,
  };

  if (typeof window !== 'undefined') {
    window.FITLAB_ENGINE = ENGINE;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENGINE;
  }
})();

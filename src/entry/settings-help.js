import { CONNECTION_HELP_ENTRIES } from './settings-help-data.js';

const HELP_EVENT_NS = '.summaryceptionSettingsHelp';
const HELP_TOOLTIP_ID = 'sc_help_tooltip';
const HELP_TARGET_SELECTOR = '.sc-help-target';
const HELP_ICON_SELECTOR = '.sc-help-icon';
const HELP_FOCUS_SELECTOR = [
    '.sc-help-target',
    '.sc-help-target input',
    '.sc-help-target select',
    '.sc-help-target textarea',
    '[data-sc-help-control]',
].join(', ');
const HELP_TOOLTIP_DELAY_MS = 500;

const selectorFor = (id) => `label[for="${id}"]`;
const controlFor = (id) => `#${id}`;

let helpTooltipTimer = null;

const sliderHelp = ({ selector, title, short, meaning, higher, lower, defaultText, controls }) => ({
    selector,
    title,
    short,
    detail: `${meaning} 调高：${higher} 调低：${lower} 默认：${defaultText}`,
    controls,
});

const basicHelp = ({ selector, title, short, controls, controlsText, when, risk }) => ({
    selector,
    title,
    short,
    detail: `${controlsText} ${when} ${risk}`,
    controls,
});

const MEMORY_MODE_HELP = Object.freeze({
    standard: {
        title: '标准',
        short: '持续摘要溢出内容，使主提示词更小更稳定。',
        controlsText: '切换滚动逐字窗口以及持续摘要的开关。',
        when: '当你想要在更小的总上下文中获得更稳定的上下文大小和更高的召回，或提供商没有真正的提示词缓存时开启。',
        risk: '每一回合都要为变化的提示词支付完整的输入价格。',
    },
    cache: {
        title: '缓存友好',
        short: '为缓存输入有折扣的提供商使用更大的 32k 实时窗口。',
        controlsText: '锁定稳定的记忆前缀，并在实时缓存窗口填满前暂不冲刷。',
        when: '提供商支持提示词缓存且对缓存 token 大幅折扣计费时使用。',
        risk: '总上下文会更大（记忆 + 32k），手动摘要还可能抹掉你的缓存节省。',
    },
});

const memoryModeHelp = ({ selector, controls, mode }) =>
    basicHelp({
        selector,
        controls,
        ...MEMORY_MODE_HELP[mode],
    });

const HELP_ENTRIES = [
    [
        'enabled',
        basicHelp({
            selector: selectorFor('sc_mode_easy'),
            title: 'Summaryception 模式',
            short: '选择关闭、简易或高级运行方式。',
            controls: [
                controlFor('sc_mode_off'),
                controlFor('sc_mode_easy'),
                controlFor('sc_mode_advanced'),
            ],
            controlsText: '让你关闭 Summaryception、以安全的简易默认值运行，或打开所有高级设置。',
            when: '当你希望该对话保持分层记忆时使用。',
            risk: '关闭会停止记忆注入与后台摘要，直到选择另一种模式。',
        }),
    ],
    [
        'apply_regex_scripts',
        basicHelp({
            selector: selectorFor('sc_apply_regex_scripts'),
            title: '应用正则脚本',
            short: '让摘要看到经过你的 ST 正则清理后的文本。',
            controls: [controlFor('sc_apply_regex_scripts')],
            controlsText: '决定 SillyTavern 正则脚本是否在文本到达摘要器之前对其运行。',
            when: '如果你的主模型也看到正则清理后的文本，则开启。',
            risk: '关闭后，摘要可能记住你的角色扮演模型从未真正看到过的文本。',
        }),
    ],
    [
        'strip_chinese_ideographs',
        basicHelp({
            selector: selectorFor('sc_strip_chinese_ideographs'),
            title: '去除汉字',
            short: '从摘要器回复中去除汉字。',
            controls: [controlFor('sc_strip_chinese_ideographs')],
            controlsText: '决定摘要是否去除汉字，并丢弃受严重污染的回复。',
            when: '当你的摘要器偶尔把中文文本混入记忆时使用。',
            risk: '合法的中文名称和文本也会从已提交的记忆中被剥离。',
        }),
    ],
    [
        'mask_user_role_as_assistant',
        basicHelp({
            selector: selectorFor('sc_mask_user_role_as_assistant'),
            title: '掩码用户角色',
            short: '把你的回合作为 AI 自己的话发送，让模型不再给你的角色套上主角光环。',
            controls: [
                controlFor('sc_mask_user_role_as_assistant'),
                controlFor('sc_mask_user_role_mode'),
            ],
            controlsText:
                '在请求发出前把你的对话回合重新标记为 AI 自己的话，让模型不再给你的角色套上主角光环。聊天补全模型经过 RLHF 训练，会把用户角色中的内容当作需要讨好和保护的真实的人，这就是你的角色永远不会真正处于危险的原因。把你的回合翻转到助手角色后，整个日志读起来就像一位叙述者在讲故事，你也就变成另一个可能受伤、被惊吓或遭到拒绝的角色。它只影响发出的请求；你保存的对话保持原样。当以第三人称角色扮演、并编辑预设让它从不出现 "user" 或 "you" 时效果最佳。各模式：先标记 会在顶部添加一条临时用户行，供要求用户消息的 API 使用；无标记 把每个回合都变成 AI（仅请求，零用户消息）；后标记 把那条临时用户行放在末尾；保留最后一条用户消息 让你的最后一条消息保持为用户角色，当另一个扩展（如 Rabbit-Response-Team）在那里注入指令时很方便。',
            when: '当你希望模型不再庇护你的角色，而是正经演好场景时使用。',
            risk: '提供商可能规范化或拒绝不寻常的角色布局或合成的标记消息，零用户消息的无标记请求还可能被直接拒绝——这正是标记模式存在的意义。',
        }),
    ],
    [
        'verbatim_token_budget',
        sliderHelp({
            selector: selectorFor('sc_verbatim_token_budget'),
            title: '逐字 token 预算',
            short: '摘要开始前按原样保留的近期对话。',
            controls: [
                controlFor('sc_verbatim_token_budget'),
                controlFor('sc_verbatim_token_budget_val'),
            ],
            meaning: '在较旧回合被摘要成 Layer 0 之前，保留多少近期对话为逐字原文。',
            higher: '保留更多精确的近期对话，但占用更多上下文。',
            lower: '更早开始摘要，为记忆腾出空间。',
            defaultText: '22k；缓存友好会提升到 32k，在缓存提供商上每回合可节省约 70%。',
        }),
    ],
    [
        'memory_token_budget',
        sliderHelp({
            selector: selectorFor('sc_memory_token_budget'),
            title: '注入记忆预算',
            short: '发送给模型的最大记忆块大小。',
            controls: [
                controlFor('sc_memory_token_budget'),
                controlFor('sc_memory_token_budget_val'),
            ],
            meaning:
                '通过直接注入或宏发送的已提交 Summaryception 记忆的硬上限；经过压缩与提升周期后，实际用量可能低于它。',
            higher: '在提升压力积累前保留更详细的记忆。',
            lower: '更早提升与压缩记忆，4k 是合并转为激进的硬上限。',
            defaultText: '10k。',
        }),
    ],
    [
        'advanced_model_context',
        sliderHelp({
            selector: selectorFor('sc_advanced_model_context'),
            title: '模型上下文',
            short: '摘要器容量；自动调整批次大小。',
            controls: [
                controlFor('sc_advanced_model_context'),
                controlFor('sc_advanced_model_context_val'),
            ],
            meaning: '设置 Layer 0 摘要器调用的来源上限与批次触发点。',
            higher: '在大上下文模型上允许更大的批次。',
            lower: '让每次摘要请求更小。',
            defaultText: '48k；覆盖项位于专家调优下。',
        }),
    ],
    [
        'layer0_summary_token_target',
        sliderHelp({
            selector: selectorFor('sc_layer0_summary_token_target'),
            title: '叙事目标大小',
            short: '每条 Layer 0 叙事段的目标大小。',
            controls: [
                controlFor('sc_layer0_summary_token_target'),
                controlFor('sc_layer0_summary_token_target_val'),
            ],
            meaning:
                '单条 Layer 0 摘要 [NARRATIVE] 段的目标大小。由模型上下文自动推导；可在此覆盖。[STATE] 保持自己固定的 200 token 软目标和 300 token 硬上限。',
            higher: '在每条 Layer 0 叙事中保留更多时间线细节。',
            lower: '更用力压缩每条叙事，在记忆预算中留出更多空间。',
            defaultText: '200；由模型上下文自动推导。',
        }),
    ],
    [
        'max_l0_source_tokens',
        sliderHelp({
            selector: selectorFor('sc_max_l0_source_tokens'),
            title: '每次调用最大来源',
            short: '单次 Layer 0 请求发送的原始对话硬上限。',
            controls: [
                controlFor('sc_max_l0_source_tokens'),
                controlFor('sc_max_l0_source_tokens_val'),
            ],
            meaning:
                '单次 Layer 0 摘要器调用发送的最大原始对话来源大小。由模型上下文自动推导；可在此覆盖。',
            higher: '为上下文更多的模型允许更大批次。',
            lower: '让每次摘要请求更小更安全。',
            defaultText: '24k，在 8k-64k 范围内；由模型上下文自动推导。',
        }),
    ],
    [
        'min_summary_budget',
        sliderHelp({
            selector: selectorFor('sc_min_summary_budget'),
            title: '批次触发大小',
            short: '短批次运行前需收集多少溢出文本。',
            controls: [
                controlFor('sc_min_summary_budget'),
                controlFor('sc_min_summary_budget_val'),
            ],
            meaning:
                '正常 Layer 0 批次值得摘要前的最小溢出量；不能超过每次调用最大来源。由模型上下文自动推导；可在此覆盖。',
            higher: '等待更大的块，减少摘要器调用次数。',
            lower: '更早摘要更小的块。',
            defaultText: '16k，控制范围固定 4k-32k；由模型上下文自动推导。',
        }),
    ],
    [
        'min_summary_turns',
        sliderHelp({
            selector: selectorFor('sc_min_summary_turns'),
            title: '最少摘要回合',
            short: '批次运行前所需的最少助手回合数。',
            controls: [controlFor('sc_min_summary_turns'), controlFor('sc_min_summary_turns_val')],
            meaning: '预算就绪的 Layer 0 批次运行前的最少助手回合数。',
            higher: '摘要前等待更多对话。',
            lower: '让更短的批次也能被摘要。',
            defaultText: '3。',
        }),
    ],
    [
        'max_summary_turns',
        sliderHelp({
            selector: selectorFor('sc_max_summary_turns'),
            title: '最多摘要回合',
            short: '单个 Layer 0 批次中放入的最多助手回合数。',
            controls: [controlFor('sc_max_summary_turns'), controlFor('sc_max_summary_turns_val')],
            meaning: '单次 Layer 0 摘要请求中的最多助手回合数。',
            higher: '把更多对话装进每次摘要调用。',
            lower: '让每次摘要请求更小更容易。',
            defaultText: '8。',
        }),
    ],
    [
        'snippets_per_layer',
        sliderHelp({
            selector: selectorFor('sc_snippets_per_layer'),
            title: '每层最多记忆',
            short: '层被推向更深之前的数量上限。',
            controls: [
                controlFor('sc_snippets_per_layer'),
                controlFor('sc_snippets_per_layer_val'),
            ],
            meaning: '提升压力启动前，一层最多容纳的摘要片段数。',
            higher: '每层保留更多独立记忆。',
            lower: '更早把记忆向下合并进更深层。',
            defaultText: '24。',
        }),
    ],
    [
        'snippets_per_promotion',
        sliderHelp({
            selector: selectorFor('sc_snippets_per_promotion'),
            title: '每次合并记忆数',
            short: '一次合并多少条旧记忆。',
            controls: [
                controlFor('sc_snippets_per_promotion'),
                controlFor('sc_snippets_per_promotion_val'),
            ],
            meaning: '当一层把记忆提升到更深时，有多少条最旧的摘要片段被打包到一起。',
            higher: '产生更少但更大的提升合并，在 2000+ 条消息的对话中有帮助。',
            lower: '更频繁地做更小的提升合并，更适合短对话。',
            defaultText: '3。',
        }),
    ],
    [
        'memory_mode_standard',
        memoryModeHelp({
            selector: selectorFor('sc_memory_mode_standard'),
            controls: [controlFor('sc_memory_mode_standard')],
            mode: 'standard',
        }),
    ],
    [
        'memory_mode_cache',
        memoryModeHelp({
            selector: selectorFor('sc_memory_mode_cache'),
            controls: [controlFor('sc_memory_mode_cache')],
            mode: 'cache',
        }),
    ],
    [
        'custom_memory_position',
        basicHelp({
            selector: selectorFor('sc_custom_memory_position'),
            title: '记忆位置',
            short: 'Summaryception 记忆在 ST 提示词中的位置。',
            controls: [controlFor('sc_custom_memory_position')],
            controlsText:
                '选择合并后的记忆块是直接注入，还是以 {{summaryception_memory}} 宏的形式出现。',
            when: '当你的提示词布局需要记忆位于特定位置时使用。',
            risk: '记忆放得太晚、太早，或只在未使用的宏中，都可能被模型忽略。',
        }),
    ],
    [
        'custom_memory_role',
        basicHelp({
            selector: selectorFor('sc_custom_memory_role'),
            title: '记忆角色',
            short: '记忆作为对话注入时使用的消息角色。',
            controls: [controlFor('sc_custom_memory_role')],
            controlsText: '设置自定义记忆作为对话发送时的消息角色。',
            when: '如果提供商对系统、用户、助手消息区别对待，则开启。',
            risk: '错误的角色会让记忆读起来像指令，或者像对话。',
        }),
    ],
    [
        'custom_memory_depth',
        basicHelp({
            selector: selectorFor('sc_custom_memory_depth'),
            title: '对话深度',
            short: '使用"对话内"时记忆插入到多深。',
            controls: [controlFor('sc_custom_memory_depth')],
            controlsText: '设置自定义"对话内"记忆距离最新回合多远出现。',
            when: '仅当记忆位置设为"对话内"时使用。',
            risk: '糟糕的深度会让记忆离最新回合太近或太远。',
        }),
    ],
    [
        'inject_current_state',
        basicHelp({
            selector: selectorFor('sc_inject_current_state'),
            title: '包含 [STATE]',
            short: '把活跃事实快照前置到注入的记忆前。',
            controls: [controlFor('sc_inject_current_state')],
            controlsText:
                '决定 [CURRENT STATE] 活跃事实块是否位于 Summaryception 注入的记忆块开头。关闭则只发送 [CHRONOLOGY] 历史并缩小提示词。',
            when: '当 state 事实与你的预设或上下文重复，或你想要更小的记忆块时使用。',
            risk: '关闭后，模型会失去当前事实的紧凑滚动快照，只能从叙事时间线重新推导，可能丢失模型本应保留的时间、地点与计数器。',
        }),
    ],
    [
        'state_cat_bonds',
        basicHelp({
            selector: selectorFor('sc_state_cat_bonds'),
            title: '羁绊（关系型 RPG）',
            short: '持久关系引擎：每对角色之间的 BOND/火花/怨恨。',
            controls: [controlFor('sc_state_cat_bonds')],
            controlsText:
                '切换追踪每对角色 BOND、火花与怨恨的持久关系引擎。开启时请在你的预设中禁用对应的 FF5 <internal_bondtracker> 块。',
            when: '替代 FF5 的 <internal_bondtracker>。开启时请在预设中禁用该块。',
            risk: '在预设中禁用：羁绊数值、门槛与漂移规则移到这里；把 BOND→DnD DC 修正逻辑保留在预设 CoT 中。',
        }),
    ],
    [
        'state_cat_chekhov',
        basicHelp({
            selector: selectorFor('sc_state_cat_chekhov'),
            title: '契诃夫（叙事之枪）',
            short: '会随概率触发的"叙事欠账"累积子弹。',
            controls: [controlFor('sc_state_cat_chekhov')],
            controlsText:
                '切换会随概率老化并触发的"叙事欠账"子弹寄存器。FIRE 判定 d20 逻辑保留在预设 CoT 中；这里只放寄存器。',
            when: '替代 FF5 的 <internal_chekhovguntracker> 存储。开启时请在预设中禁用该块。',
            risk: '把 FIRE 判定 d20 逻辑保留在预设 CoT 中——这里只放子弹寄存器。',
        }),
    ],
    [
        'state_cat_gm_notes',
        basicHelp({
            selector: selectorFor('sc_state_cat_gm_notes'),
            title: 'GM 笔记',
            short: '持久 GM 草稿板，条目带 [R]/[T]/[D] 前缀。',
            controls: [controlFor('sc_state_cat_gm_notes')],
            controlsText:
                '切换保存 [R]/[T]/[D] 前缀条目的持久 GM 草稿板。避免重复羁绊、契诃夫或物品中已追踪的内容。',
            when: '替代 FF5 的 <internal_gmnotebook>。开启时请在预设中禁用该块。',
            risk: '不要重复羁绊/契诃夫/物品中已存在的内容。',
        }),
    ],
    [
        'state_cat_inventory',
        basicHelp({
            selector: selectorFor('sc_state_cat_inventory'),
            title: '物品与称号',
            short: '仅用户物品、称号/技能与状态条件。',
            controls: [controlFor('sc_state_cat_inventory')],
            controlsText:
                '切换仅用户的物品追踪以及称号、技能与状态条件。消耗品在这里；影响未来的单次道具归契诃夫管。',
            when: '替代 FF5 的 <internal_inv>。开启时请在预设中禁用该块。',
            risk: '只追踪用户，不追踪 NPC。消耗品放这里；影响未来的单次道具放契诃夫。',
        }),
    ],
    [
        'state_cat_location',
        basicHelp({
            selector: selectorFor('sc_state_cat_location'),
            title: '地点',
            short: '当前场景地点。',
            controls: [controlFor('sc_state_cat_location')],
            controlsText:
                '切换当前场景地点的追踪。可选——仅当你的预设依赖基于接近度的修正（如契诃夫地点匹配）时才需要。',
            when: '可选。如果你的预设使用基于接近度的修正（如契诃夫地点匹配）则需要。',
            risk: '低风险——若你的预设不依赖场景地点则可省略。',
        }),
    ],
    ...CONNECTION_HELP_ENTRIES,
    [
        'easy_memory_mode_standard',
        memoryModeHelp({
            selector: selectorFor('sc_easy_memory_mode_standard'),
            controls: [controlFor('sc_easy_memory_mode_standard')],
            mode: 'standard',
        }),
    ],
    [
        'easy_memory_mode_cache',
        memoryModeHelp({
            selector: selectorFor('sc_easy_memory_mode_cache'),
            controls: [controlFor('sc_easy_memory_mode_cache')],
            mode: 'cache',
        }),
    ],
    [
        'layer0_system_prompt_preset',
        basicHelp({
            selector: selectorFor('sc_summarizer_system_prompt_preset'),
            title: 'Layer 0 系统预设',
            short: '选择 Layer 0 系统提示词来源。',
            controls: [controlFor('sc_summarizer_system_prompt_preset')],
            controlsText: '在默认 Layer 0 系统提示词与你自己的自定义文本之间选择。',
            when: '当你想要更改 Layer 0 摘要的角色指令时使用。',
            risk: '更换系统指令会改变摘要的构成方式。',
        }),
    ],
    [
        'layer0_system_prompt',
        basicHelp({
            selector: selectorFor('sc_summarizer_system_prompt'),
            title: 'Layer 0 系统提示词',
            short: '原始对话摘要的指令风格。',
            controls: [controlFor('sc_summarizer_system_prompt')],
            controlsText: '设置随原始对话摘要请求发出的系统指令。',
            when: '如果摘要器需要不同的角色或更严格的输出风格，则开启。',
            risk: '指令过多会让摘要冗长或不一致。',
        }),
    ],
    [
        'prompt_preset',
        basicHelp({
            selector: selectorFor('sc_prompt_preset'),
            title: 'Layer 0 用户预设',
            short: '选择 Layer 0 用户提示词模板。',
            controls: [controlFor('sc_prompt_preset')],
            controlsText: '在默认 Layer 0 用户提示词与你自己的自定义版本之间选择。',
            when: '在默认叙事记忆与你自己的自定义提示词之间切换时使用。',
            risk: '更换预设会改变未来摘要最终保留的内容。',
        }),
    ],
    [
        'layer0_user_prompt',
        basicHelp({
            selector: selectorFor('sc_summarizer_user_prompt'),
            title: 'Layer 0 用户提示词',
            short: '把原始对话变成 Layer 0 记忆的模板。',
            controls: [controlFor('sc_summarizer_user_prompt')],
            controlsText:
                '设置原始对话摘要的用户提示词；可使用 {{player_name}}、{{context_str}} 和 {{story_txt}} 变量。',
            when: '当当前预设一直遗漏你关心的事实时使用。',
            risk: '缺少变量或要求过长输出会破坏紧凑记忆。',
        }),
    ],
    [
        'layer0_repair_prompt_preset',
        basicHelp({
            selector: selectorFor('sc_summarizer_repair_prompt_preset'),
            title: 'Layer 0 修复预设',
            short: '选择 Layer 0 修复提示词来源。',
            controls: [controlFor('sc_summarizer_repair_prompt_preset')],
            controlsText: '在默认与自定义修复提示词之间选择，用于 Layer 0 校验重试。',
            when: '如果无效的 Layer 0 输出需要更严格的重试指令，则开启。',
            risk: '薄弱的修复提示词会一直让输出校验失败。',
        }),
    ],
    [
        'layer0_repair_prompt',
        basicHelp({
            selector: selectorFor('sc_summarizer_repair_prompt'),
            title: 'Layer 0 修复提示词',
            short: '无效 Layer 0 输出后使用的模板。',
            controls: [controlFor('sc_summarizer_repair_prompt')],
            controlsText:
                '设置 Layer 0 校验修复重试的用户提示词；可使用 {{player_name}}、{{context_str}} 和 {{story_txt}} 变量。',
            when: '如果默认修复提示词对你的摘要器不够严格，则使用。',
            risk: '缺少分节指令会让修复重试无法成功。',
        }),
    ],
    [
        'injection_template',
        basicHelp({
            selector: selectorFor('sc_injection_template'),
            title: '注入包装模板',
            short: '包裹合并记忆块的包装文本。',
            controls: [controlFor('sc_injection_template')],
            controlsText: '设置包裹 Summaryception 记忆的包装，且必须包含 {{summary}} 变量。',
            when: '当你的模型更适应不同的记忆标签或框架时使用。你也可以写两次 {{summary}}，让记忆块在提示词末尾附近重复——模型注意力最强的地方；字段下方的"召回-重复示例"按钮会放入现成示例，"恢复默认"则放回出厂包装。',
            risk: '去掉 {{summary}} 变量，就不会注入任何记忆文本。重复块会让记忆块条形图把每份副本都计入，可能显示超预算；那只是显示层面的事，因为摘要触发点对每层只计一次。',
        }),
    ],
    [
        'promotion_system_prompt_preset',
        basicHelp({
            selector: selectorFor('sc_promotion_system_prompt_preset'),
            title: '提升系统预设',
            short: '选择 Layer 1+ 系统提示词来源。',
            controls: [controlFor('sc_promotion_system_prompt_preset')],
            controlsText: '在默认 Layer 1+ 系统提示词与你自己的自定义文本之间选择。',
            when: '当你想要更改更深记忆合并的角色指令时使用。',
            risk: '更换系统指令会影响提升压缩。',
        }),
    ],
    [
        'promotion_system_prompt',
        basicHelp({
            selector: selectorFor('sc_promotion_system_prompt'),
            title: '提升系统提示词',
            short: '更深记忆合并的指令风格。',
            controls: [controlFor('sc_promotion_system_prompt')],
            controlsText: '设置 Layer 1+ 记忆合并时使用的系统指令。',
            when: '如果提升后的记忆需要不同的压缩风格，则开启。',
            risk: '糟糕的合并指令会抹掉持久事实。',
        }),
    ],
    [
        'promotion_prompt_preset',
        basicHelp({
            selector: selectorFor('sc_promotion_prompt_preset'),
            title: 'Layer 1+ 用户预设',
            short: '选择 Layer 1+ 合并用户提示词模板。',
            controls: [controlFor('sc_promotion_prompt_preset')],
            controlsText: '在默认 Layer 1+ 用户提示词与你自己的自定义版本之间选择。',
            when: '在默认提升记忆与你自己的自定义提示词之间切换时使用。',
            risk: '更换预设会改变更深摘要保存持久事实的方式。',
        }),
    ],
    [
        'promotion_user_prompt',
        basicHelp({
            selector: selectorFor('sc_promotion_user_prompt'),
            title: '提升用户提示词',
            short: '把低层记忆合并成更深记忆的模板。',
            controls: [controlFor('sc_promotion_user_prompt')],
            controlsText:
                '设置 Layer 1+ 提升的用户提示词；可使用 {{player_name}}、{{context_str}} 和 {{story_txt}} 变量。',
            when: '当更深记忆保留太多细节或丢失关键状态时使用。',
            risk: '薄弱的指令会制造臃肿或有损的元摘要。',
        }),
    ],
    [
        'promotion_repair_prompt_preset',
        basicHelp({
            selector: selectorFor('sc_promotion_repair_prompt_preset'),
            title: 'Layer 1+ 修复预设',
            short: '选择 Layer 1+ 修复提示词来源。',
            controls: [controlFor('sc_promotion_repair_prompt_preset')],
            controlsText: '在默认与自定义修复提示词之间选择，用于失败的 Layer 1+ 压缩。',
            when: '如果提升修复需要不同的压缩风格，则使用。',
            risk: '薄弱的修复提示词会让提升后的记忆一直过大。',
        }),
    ],
    [
        'promotion_repair_prompt',
        basicHelp({
            selector: selectorFor('sc_promotion_repair_prompt'),
            title: 'Layer 1+ 修复提示词',
            short: '用于失败提升压缩修复的模板。',
            controls: [controlFor('sc_promotion_repair_prompt')],
            controlsText:
                '设置 Layer 1+ 提升修复的用户提示词；可使用 {{player_name}}、{{context_str}}、{{story_txt}} 和 {{source_state}} 变量。',
            when: '如果修复后的提升仍保留太多细节，则开启。',
            risk: '糟糕的修复指令会抹掉持久连续性。',
        }),
    ],
    [
        'strip_patterns',
        basicHelp({
            selector: selectorFor('sc_strip_patterns'),
            title: '去除模式',
            short: '从摘要器响应中移除的文本模式。',
            controls: [controlFor('sc_strip_patterns')],
            controlsText: '设置从生成的摘要文本中剥离的模式，每行一个。',
            when: '当摘要器不断添加不需要的标签或思考标记时使用。',
            risk: '过于宽泛的模式可能挖掉有用的记忆文本。',
        }),
    ],
    [
        'debug_mode',
        basicHelp({
            selector: selectorFor('sc_debug_mode'),
            title: '调试模式',
            short: '显示额外的 Summaryception 控制台日志。',
            controls: [controlFor('sc_debug_mode')],
            controlsText: '开关 Summaryception 详细的诊断日志。',
            when: '排查行为时使用。',
            risk: '日志会变得嘈杂，并可能提及源自对话的状态。',
        }),
    ],
    [
        'trace_mode',
        basicHelp({
            selector: selectorFor('sc_trace_mode'),
            title: '跟踪模式',
            short: '调试模式开启时显示详细流程日志。',
            controls: [controlFor('sc_trace_mode')],
            controlsText: '开启最详细的 Summaryception 流程日志。',
            when: '仅在调试模式开启且需要逐步行为时使用。',
            risk: '跟踪日志非常嘈杂。',
        }),
    ],
    [
        'prompt_input_log_mode',
        basicHelp({
            selector: selectorFor('sc_prompt_input_log_mode'),
            title: '记录 LLM 输入',
            short: '把完整最终摘要器输入打印到控制台。',
            controls: [controlFor('sc_prompt_input_log_mode')],
            controlsText: '决定是否记录发送给摘要器的完整最终系统与用户提示词内容。',
            when: '仅在诊断提示词质量时开启。',
            risk: '浏览器控制台可能包含私密对话文本。',
        }),
    ],
    [
        'prompt_output_log_mode',
        basicHelp({
            selector: selectorFor('sc_prompt_output_log_mode'),
            title: '记录 LLM 输出',
            short: '把清理后的摘要器回复打印到控制台。',
            controls: [controlFor('sc_prompt_output_log_mode')],
            controlsText: '决定是否记录清理后的摘要器回复与错误。',
            when: '仅在诊断提供商输出或清理行为时使用。',
            risk: '浏览器控制台可能包含私密对话文本。',
        }),
    ],
];

/**
 * Metadata for settings help annotations and tooltips.
 * @type {Record<string, {selector: string, title: string, short: string, detail: string, controls?: string[]}>}
 */
export const SETTINGS_HELP = defineHelpMap(HELP_ENTRIES);

/**
 * Annotate the rendered settings DOM and bind the shared help tooltip.
 * @returns {void}
 */
export function initSettingsHelp() {
    const $settings = $('.sc-settings').last();
    if (!$settings.length) {
        return;
    }

    for (const [key, entry] of Object.entries(SETTINGS_HELP)) {
        annotateHelpEntry($settings, key, entry);
    }

    const $tooltip = getHelpTooltip($settings);
    bindHelpTooltip($settings, $tooltip);
}

/**
 * Calculate viewport coordinates for the shared settings help tooltip.
 * @param {object} p
 * @param {{left: number, right: number, top: number, bottom: number}} p.anchorRect
 * @param {{left: number, right: number}} p.settingsRect
 * @param {number} p.tooltipWidth
 * @param {number} p.tooltipHeight
 * @param {number} p.viewportWidth
 * @param {number} p.viewportHeight
 * @returns {{left: number, top: number}}
 */
export function calculateHelpTooltipPosition({
    anchorRect,
    settingsRect,
    tooltipWidth,
    tooltipHeight,
    viewportWidth,
    viewportHeight,
}) {
    const minLeft = Math.max(8, settingsRect.left + 6);
    const maxLeft = Math.max(
        minLeft,
        Math.min(viewportWidth - tooltipWidth - 8, settingsRect.right - tooltipWidth - 6),
    );
    let top = anchorRect.bottom + 6;

    if (top + tooltipHeight > viewportHeight - 8) {
        top = anchorRect.top - tooltipHeight - 6;
    }

    return {
        left: clamp(anchorRect.left, minLeft, maxLeft),
        top: clamp(top, 8, Math.max(8, viewportHeight - tooltipHeight - 8)),
    };
}

function defineHelpMap(entries) {
    const result = {};
    const seen = new Set();
    for (const [key, entry] of entries) {
        if (seen.has(key)) {
            throw new Error(`Duplicate Summaryception settings help key: ${key}`);
        }
        seen.add(key);
        result[key] = entry;
    }
    return Object.freeze(result);
}

function annotateHelpEntry($settings, key, entry) {
    const $selected = $settings.find(entry.selector).first();
    if (!$selected.length) {
        return;
    }

    const $target = resolveHelpTarget($selected);
    $target.addClass('sc-help-target').attr('data-sc-help-key', key);
    updateShortHint($settings, $target, $selected, entry);
    addHelpIcon($target, $selected);
    addHiddenDescription($settings, key, entry);
    annotateControls({ $settings, $target, $selected, key, entry });
}

function resolveHelpTarget($selected) {
    const rowSelector = ['.sc-row', '.sc-setting-row', '.sc-toggle-row', '.sc-mode-card'].join(
        ', ',
    );

    if ($selected.is(rowSelector)) {
        return $selected;
    }

    const $row = $selected.closest(rowSelector);
    return $row.length ? $row : $selected;
}

function updateShortHint($settings, $target, $selected, entry) {
    const $hintHost = getHintHost($target, $selected);
    if ($hintHost.length) {
        const $hint = getOrCreateHint($hintHost);
        $hint.text(entry.short);
        $hintHost.children('.sc-hint').not($hint).remove();
        return;
    }

    const $rowHint = getOrCreateRowHint($settings, $target);
    $rowHint.text(entry.short);
}

function getHintHost($target, $selected) {
    const $copy = $target.find('.sc-toggle-copy').first();
    if ($copy.length) {
        return $copy;
    }
    if ($selected.is('label')) {
        return $selected;
    }
    const $label = $target.find('label').first();
    return $label.length ? $label : $();
}

function getOrCreateHint($hintHost) {
    const $existing = $hintHost.children('.sc-hint, small').first();
    if ($existing.length) {
        return $existing.addClass('sc-hint');
    }
    return $('<small class="sc-hint"></small>').appendTo($hintHost);
}

function getOrCreateRowHint($settings, $target) {
    const key = String($target.attr('data-sc-help-key') || '');
    const selector = `.sc-hint.sc-help-row-hint[data-sc-help-key="${key}"]`;
    const $existing = $settings.find(selector).first();
    if ($existing.length) {
        return $existing;
    }
    return $('<small class="sc-hint sc-help-row-hint"></small>')
        .attr('data-sc-help-key', key)
        .insertAfter($target);
}

function addHelpIcon($target, $selected) {
    if ($target.find('.sc-help-icon').length) {
        return;
    }

    const $title = getTitleTarget($target, $selected);
    const $icon = $('<span class="sc-help-icon fa-solid fa-circle-question"></span>').attr(
        'aria-hidden',
        'true',
    );

    if ($title.length) {
        $icon.insertAfter($title);
        return;
    }
    $icon.insertAfter($selected);
}

function getTitleTarget($target, $selected) {
    const $title = $target.find('.sc-toggle-title').first();
    if ($title.length) {
        return $title;
    }
    if ($selected.is('label')) {
        return $selected.children('span').first();
    }
    const $labelTitle = $target.find('label > span').first();
    return $labelTitle.length ? $labelTitle : $();
}

function addHiddenDescription($settings, key, entry) {
    const id = getDescriptionId(key);
    const $existing = $settings.find(`#${id}`).first();
    const text = `${entry.title}. ${entry.detail}`;
    if ($existing.length) {
        $existing.text(text);
        return;
    }
    $('<span class="sc-sr-only"></span>').attr('id', id).text(text).appendTo($settings);
}

function annotateControls({ $settings, $target, $selected, key, entry }) {
    const controls = getControlSelectors($target, $selected, entry);
    const descId = getDescriptionId(key);

    for (const selector of controls) {
        $settings.find(selector).each(function () {
            const $control = $(this);
            addDescribedBy($control, descId);
            $control.attr('data-sc-help-control', key);
        });
    }
}

function getControlSelectors($target, $selected, entry) {
    if (entry.controls?.length) {
        return entry.controls;
    }
    if ($selected.is('label[for]')) {
        return [controlFor($selected.attr('for'))];
    }

    const $label = $target.find('label[for]').first();
    if ($label.length) {
        return [controlFor($label.attr('for'))];
    }
    return [];
}

function addDescribedBy($control, descId) {
    const existing = String($control.attr('aria-describedby') || '')
        .split(/\s+/)
        .filter(Boolean);
    if (!existing.includes(descId)) {
        existing.push(descId);
    }
    $control.attr('aria-describedby', existing.join(' '));
}

function getDescriptionId(key) {
    return `sc_help_desc_${String(key).replaceAll(/[^a-z0-9_-]/gi, '_')}`;
}

function getHelpTooltip($settings) {
    $settings.children('.sc-help-tooltip').remove();

    let $tooltip = $(`#${HELP_TOOLTIP_ID}`).first();
    if ($tooltip.length) {
        return $tooltip.empty();
    }

    $tooltip = $('<div class="sc-help-tooltip" role="tooltip"></div>').attr('aria-hidden', 'true');
    $tooltip.attr('id', HELP_TOOLTIP_ID).appendTo('body');
    return $tooltip;
}

function bindHelpTooltip($settings, $tooltip) {
    $settings.off(HELP_EVENT_NS);
    $(document).off(HELP_EVENT_NS);
    $(window).off(HELP_EVENT_NS);
    clearTooltipTimer();

    const hide = () => {
        clearTooltipTimer();
        hideTooltip($tooltip);
    };

    $settings.on(`mouseenter${HELP_EVENT_NS}`, HELP_ICON_SELECTOR, function () {
        clearTooltipTimer();
        const icon = this;
        helpTooltipTimer = setTimeout(() => {
            helpTooltipTimer = null;
            const $target = getHelpTarget($(icon));
            showTooltip($settings, $tooltip, $target, icon);
        }, HELP_TOOLTIP_DELAY_MS);
    });
    $settings.on(`mouseleave${HELP_EVENT_NS}`, HELP_ICON_SELECTOR, hide);
    $settings.on(`focusout${HELP_EVENT_NS}`, HELP_FOCUS_SELECTOR, hide);
    $settings.on(`click${HELP_EVENT_NS}`, '.sc-tab-button, .sc-prompt-segment-button', hide);
    $settings.on(`scroll${HELP_EVENT_NS}`, hide);
    $(window).on(`scroll${HELP_EVENT_NS} resize${HELP_EVENT_NS}`, hide);
    $(document).on(`keydown${HELP_EVENT_NS}`, (event) => {
        if (event.key === 'Escape') {
            hide();
        }
    });
}

function clearTooltipTimer() {
    if (helpTooltipTimer !== null) {
        clearTimeout(helpTooltipTimer);
        helpTooltipTimer = null;
    }
}

function getHelpTarget($element) {
    if ($element.is(HELP_TARGET_SELECTOR)) {
        return $element;
    }
    const $target = $element.closest(HELP_TARGET_SELECTOR);
    return $target.length ? $target : $element;
}

function showTooltip($settings, $tooltip, $target, anchor) {
    const key = String(
        $target.attr('data-sc-help-key') || $target.attr('data-sc-help-control') || '',
    );
    const entry = SETTINGS_HELP[key];
    if (!entry) {
        return;
    }

    $tooltip
        .empty()
        .append($('<div class="sc-help-tooltip-title"></div>').text(entry.title))
        .append($('<div class="sc-help-tooltip-body"></div>').text(entry.detail))
        .attr('aria-hidden', 'false')
        .css({ display: 'block', visibility: 'hidden' });

    positionTooltip($settings, $tooltip, anchor);
    $tooltip.css('visibility', 'visible');
}

function hideTooltip($tooltip) {
    $tooltip.attr('aria-hidden', 'true').hide();
}

function positionTooltip($settings, $tooltip, anchor) {
    const anchorRect = anchor.getBoundingClientRect();
    const settingsRect = $settings[0].getBoundingClientRect();
    const tooltipWidth = $tooltip.outerWidth() || 280;
    const tooltipHeight = $tooltip.outerHeight() || 80;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 320;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 480;
    const position = calculateHelpTooltipPosition({
        anchorRect,
        settingsRect,
        tooltipWidth,
        tooltipHeight,
        viewportWidth,
        viewportHeight,
    });

    $tooltip.css({
        left: `${position.left}px`,
        top: `${position.top}px`,
    });
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

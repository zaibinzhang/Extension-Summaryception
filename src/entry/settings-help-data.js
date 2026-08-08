const selectorFor = (id) => `label[for="${id}"]`;
const controlFor = (id) => `#${id}`;

const basicHelp = ({ selector, title, short, controls, controlsText, when, risk }) => ({
    selector,
    title,
    short,
    detail: `${controlsText} ${when} ${risk}`,
    controls,
});

const CONNECTION_GROUPS = [
    {
        key: 'layer0',
        label: 'Layer 0',
        route: '用于生成新 Layer 0 记忆和 Layer 0 重新生成的主原始对话摘要路由。',
        sourceId: 'summaryception_connection_source',
        responseLengthId: 'sc_summarizer_response_length',
        requestTimeoutId: 'sc_request_timeout',
        profileId: 'summaryception_connection_profile',
        sourceRisk: '一个薄弱或配置错误的路由会让每条新摘要变得更差。',
        responseDefault: '0 表示使用所选提供商的默认值。',
    },
    {
        key: 'merge',
        label: '合并',
        route: '在低层记忆合并进更深记忆时使用的可选 Layer 1+ 提升路由。',
        sourceId: 'summaryception_merge_connection_source',
        responseLengthId: 'sc_merge_summarizer_response_length',
        requestTimeoutId: 'sc_merge_request_timeout',
        profileId: 'summaryception_merge_connection_profile',
        sourceRisk: '不匹配的合并路由会用不同风格重写稳定记忆。',
        responseDefault: '0 表示使用所选提供商的默认值。',
    },
    {
        key: 'fallback',
        label: '回退',
        route: '仅在可重试的主路由失败后使用的备用摘要路由。',
        sourceId: 'summaryception_fallback_connection_source',
        responseLengthId: 'sc_fallback_summarizer_response_length',
        requestTimeoutId: 'sc_fallback_request_timeout',
        profileId: 'summaryception_fallback_connection_profile',
        sourceRisk: '若与主路由相同则会被忽略。',
        responseDefault: '0 表示使用所选提供商的默认值。',
    },
];

const CONNECTION_ENTRY_BUILDERS = [
    connectionSourceHelp,
    responseLengthHelp,
    requestTimeoutHelp,
    profileHelp,
];

export const CONNECTION_HELP_ENTRIES = CONNECTION_GROUPS.flatMap((group) =>
    CONNECTION_ENTRY_BUILDERS.map((build) => build(group)).filter(Boolean),
);

function connectionSourceHelp(group) {
    return [
        `${group.key}_source`,
        basicHelp({
            selector: selectorFor(group.sourceId),
            title: `${group.label} 来源`,
            short: getConnectionSourceShort(group),
            controls: [controlFor(group.sourceId)],
            controlsText: `控制${group.route}`,
            when: getConnectionSourceWhen(group),
            risk: group.sourceRisk,
        }),
    ];
}

function responseLengthHelp(group) {
    return [
        `${group.key}_response_length`,
        basicHelp({
            selector: selectorFor(group.responseLengthId),
            title: `${group.label} 回复长度`,
            short: '默认/档案路由的最大回复长度。',
            controls: [controlFor(group.responseLengthId)],
            controlsText: `控制${group.route}的回复长度上限`,
            when: '当提供商拒绝较大的非流式上限，或你需要更短的摘要时使用。',
            risk: `设置过低会截断摘要。${group.responseDefault}`,
        }),
    ];
}

function requestTimeoutHelp(group) {
    return [
        `${group.key}_request_timeout`,
        basicHelp({
            selector: selectorFor(group.requestTimeoutId),
            title: `${group.label} 请求超时`,
            short: '请求中止并重试前，每次尝试的超时秒数。',
            controls: [controlFor(group.requestTimeoutId)],
            controlsText: `控制单个${group.label}摘要尝试在放弃前等待的时间。`,
            when: '本地模型较慢、确实会超过默认值时调高。要更快故障转移就调低。',
            risk: '太低会中止正常的慢响应；太高会在后端卡死时拖住对话。',
        }),
    ];
}

function profileHelp(group) {
    return [
        `${group.key}_profile`,
        basicHelp({
            selector: selectorFor(group.profileId),
            title: `${group.label} 档案`,
            short: '该路由使用的已保存 SillyTavern 连接档案。',
            controls: [controlFor(group.profileId)],
            controlsText: `控制使用哪个已保存的 SillyTavern 连接档案来驱动${group.route}`,
            when: '当你选择"连接档案"作为来源时使用。',
            risk: '档案格式与模型选择可能改变摘要质量。',
        }),
    ];
}

function getConnectionSourceShort(group) {
    if (group.key === 'fallback') {
        return '主路由可重试失败后的备用路由。';
    }
    if (group.key === 'merge') {
        return '用于更深记忆合并的可选路由。';
    }
    return '用于将原始对话生成为 Layer 0 摘要的路由。';
}

function getConnectionSourceWhen(group) {
    if (group.key === 'fallback') {
        return '仅在你有第二个可用路由时使用，否则保持禁用。';
    }
    if (group.key === 'merge') {
        return '当更深记忆的合并需要不同或更强的模型时使用。';
    }
    return '当默认路由不是最佳摘要器时使用。';
}
